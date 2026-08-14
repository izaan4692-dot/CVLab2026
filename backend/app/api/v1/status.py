"""
Status API Endpoint
Check resume processing status
"""
import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.resume import Resume
from app.models.analysis import Analysis
from app.models.question import Question
from app.models.answer import Answer
from app.models.optimized_resume import OptimizedResume
from app.schemas.resume import ResumeStatusResponse
from app.auth.middleware import get_current_user, AuthUser

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/status/{resume_id}", response_model=ResumeStatusResponse)
async def get_resume_status(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Get resume processing status

    Returns current status and progress indicators:
    - Extraction complete
    - Analysis complete
    - Questions available
    - Answers submitted
    - Optimization complete

    Args:
        resume_id: Resume ID
        db: Database session
        current_user: Authenticated user

    Returns:
        ResumeStatusResponse with status details
    """
    try:
        # Get resume
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")

        # Verify ownership
        if resume.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Check for related records
        analysis = db.query(Analysis).filter(
            Analysis.resume_id == resume_id
        ).first()

        question = db.query(Question).filter(
            Question.resume_id == resume_id
        ).first()

        answer = db.query(Answer).filter(
            Answer.resume_id == resume_id
        ).first()

        optimized = db.query(OptimizedResume).filter(
            OptimizedResume.resume_id == resume_id
        ).first()

        # Build response
        return ResumeStatusResponse(
            id=resume.id,
            status=resume.status,
            original_filename=resume.original_filename,
            created_at=resume.created_at,
            updated_at=resume.updated_at,
            error_message=resume.error_message,
            extracted_text_length=len(resume.extracted_text) if resume.extracted_text else None,
            analysis_complete=analysis is not None,
            questions_available=question is not None,
            answers_submitted=answer is not None,
            optimization_complete=optimized is not None
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
