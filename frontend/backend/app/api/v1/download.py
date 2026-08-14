"""
Download API Endpoint
Download optimized resume (supports both local and S3 storage)
"""
import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from pathlib import Path

from app.db.database import get_db
from app.models.resume import Resume, ResumeStatus
from app.models.optimized_resume import OptimizedResume
from app.services.s3_service import get_presigned_url
from app.auth.middleware import get_current_user, AuthUser

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/download/{resume_id}")
async def download_optimized_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Download optimized resume

    Returns the optimized resume file for download.
    The resume must have completed optimization.

    Args:
        resume_id: Resume ID
        db: Database session
        current_user: Authenticated user

    Returns:
        FileResponse with optimized resume file
    """
    try:
        # Get resume
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")

        # Verify ownership
        if resume.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Check status
        if resume.status != ResumeStatus.OPTIMIZED:
            raise HTTPException(
                status_code=400,
                detail=f"Resume not optimized yet. Current status: {resume.status}"
            )

        # Get optimized resume
        optimized = db.query(OptimizedResume).filter(
            OptimizedResume.resume_id == resume_id
        ).first()

        if not optimized:
            raise HTTPException(status_code=404, detail="Optimized resume not found")

        # Generate download filename
        original_name = Path(resume.original_filename).stem
        download_filename = f"{original_name}_optimized.{optimized.file_format}"

        logger.info(f"Downloading optimized resume: resume_id={resume_id}")

        # If S3 key exists, redirect to presigned URL
        if optimized.s3_key:
            presigned_url = get_presigned_url(optimized.s3_key, expiration=3600)
            if presigned_url:
                logger.info(f"Redirecting to S3 presigned URL for resume_id={resume_id}")
                return RedirectResponse(url=presigned_url)
            else:
                logger.warning(f"Failed to generate presigned URL, falling back to local file")

        # Fallback to local file
        file_path = Path(optimized.file_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Optimized resume file not found")

        return FileResponse(
            path=str(file_path),
            filename=download_filename,
            media_type="text/plain"  # TODO: Update based on file_format
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading resume: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/preview/{resume_id}")
async def preview_optimized_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Preview optimized resume (returns text content)

    Returns the optimized resume content as JSON for preview.

    Args:
        resume_id: Resume ID
        db: Database session
        current_user: Authenticated user

    Returns:
        Dict with optimized resume content
    """
    try:
        # Get resume
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")

        # Verify ownership
        if resume.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Check status
        if resume.status != ResumeStatus.OPTIMIZED:
            raise HTTPException(
                status_code=400,
                detail=f"Resume not optimized yet. Current status: {resume.status}"
            )

        # Get optimized resume
        optimized = db.query(OptimizedResume).filter(
            OptimizedResume.resume_id == resume_id
        ).first()

        if not optimized:
            raise HTTPException(status_code=404, detail="Optimized resume not found")

        # Generate S3 presigned URL if available
        s3_download_url = None
        if optimized.s3_key:
            s3_download_url = get_presigned_url(optimized.s3_key, expiration=3600)

        return {
            "resume_id": resume_id,
            "original_filename": resume.original_filename,
            "optimized_text": optimized.optimized_text,
            "changes_summary": optimized.changes_summary,
            "file_format": optimized.file_format,
            "s3_url": optimized.s3_url,
            "s3_download_url": s3_download_url
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error previewing resume: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
