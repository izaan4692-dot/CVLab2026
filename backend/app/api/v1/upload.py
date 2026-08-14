"""
Upload API Endpoint
Handles resume file uploads (both local and S3)
"""
import logging
import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.models.resume import Resume, ResumeStatus
from app.schemas.resume import ResumeUploadResponse
from app.services.file_service import file_service
from app.services.s3_service import download_file_from_s3, get_file_content_from_s3
from app.tasks.analysis_task import analyze_resume_task
from app.auth.middleware import get_current_user, AuthUser

logger = logging.getLogger(__name__)

router = APIRouter()


class S3UploadRequest(BaseModel):
    """Request body for S3 upload registration"""
    s3_key: str
    s3_url: str
    original_filename: str
    file_size: int
    file_type: str


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Upload a resume file

    - Accepts PDF, DOC, DOCX files (max 10MB)
    - Saves file to local storage
    - Creates database record
    - Triggers background analysis task
    - Returns resume ID for tracking

    Args:
        file: Uploaded file
        db: Database session
        current_user: Authenticated user

    Returns:
        ResumeUploadResponse with resume details
    """
    try:
        logger.info(f"Uploading resume: {file.filename} for user: {current_user.id}")

        # Save file to storage
        file_path, file_type, file_size = await file_service.save_upload(file)

        # Create database record
        resume = Resume(
            original_filename=file.filename,
            file_path=file_path,
            file_type=file_type,
            file_size=file_size,
            status=ResumeStatus.UPLOADED,
            user_id=current_user.id  # Use authenticated user ID
        )

        db.add(resume)
        db.commit()
        db.refresh(resume)

        logger.info(f"Resume uploaded successfully: resume_id={resume.id}")

        # Trigger background analysis task
        logger.info(f"Triggering analysis task for resume_id={resume.id}")
        analyze_resume_task.delay(resume.id)

        # Return response
        return ResumeUploadResponse(
            id=resume.id,
            original_filename=resume.original_filename,
            file_type=resume.file_type,
            file_size=resume.file_size,
            status=resume.status,
            created_at=resume.created_at,
            message="Resume uploaded successfully. Analysis started in background."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/upload-s3", response_model=ResumeUploadResponse)
async def upload_resume_from_s3(
    request: S3UploadRequest,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Register a resume that was uploaded to S3

    - File is already in S3 (uploaded via Next.js API)
    - Downloads file from S3 for processing
    - Creates database record with S3 reference
    - Triggers background analysis task

    Args:
        request: S3 upload details
        db: Database session
        current_user: Authenticated user

    Returns:
        ResumeUploadResponse with resume details
    """
    try:
        logger.info(f"Registering S3 resume: {request.original_filename}, key={request.s3_key} for user: {current_user.id}")

        # Download file from S3 to temp location for processing
        temp_dir = tempfile.mkdtemp()
        file_extension = os.path.splitext(request.original_filename)[1]
        temp_file_path = os.path.join(temp_dir, f"resume{file_extension}")

        # Download from S3
        success = download_file_from_s3(request.s3_key, temp_file_path)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to download file from S3")

        # Determine file type from extension
        file_type = "pdf" if file_extension.lower() == ".pdf" else "docx"

        # Create database record with S3 reference
        resume = Resume(
            original_filename=request.original_filename,
            file_path=temp_file_path,  # Local temp path for processing
            file_type=file_type,
            file_size=request.file_size,
            status=ResumeStatus.UPLOADED,
            user_id=current_user.id,  # Use authenticated user ID
            s3_key=request.s3_key,  # Store S3 key
            s3_url=request.s3_url   # Store S3 URL
        )

        db.add(resume)
        db.commit()
        db.refresh(resume)

        logger.info(f"S3 Resume registered successfully: resume_id={resume.id}")

        # Trigger background analysis task
        logger.info(f"Triggering analysis task for resume_id={resume.id}")
        analyze_resume_task.delay(resume.id)

        return ResumeUploadResponse(
            id=resume.id,
            original_filename=resume.original_filename,
            file_type=resume.file_type,
            file_size=resume.file_size,
            status=resume.status,
            created_at=resume.created_at,
            message="Resume uploaded via S3 successfully. Analysis started in background."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"S3 Upload registration failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"S3 upload registration failed: {str(e)}")
