"""
Questions API Endpoint
Get generated questions for a resume
"""
import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.resume import Resume, ResumeStatus
from app.models.question import Question
from app.schemas.question import QuestionListResponse, QuestionItem
from app.auth.middleware import get_current_user, AuthUser

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/questions/{resume_id}", response_model=QuestionListResponse)
async def get_questions(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Get generated questions for a resume

    The resume must have completed analysis and question generation.
    Returns 10-25 short conversational questions for the user to answer.

    Args:
        resume_id: Resume ID
        db: Database session
        current_user: Authenticated user

    Returns:
        QuestionListResponse with questions
    """
    try:
        # Get resume
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")

        # Verify ownership
        if resume.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Check if questions are ready
        if resume.status not in [
            ResumeStatus.QUESTIONS_GENERATED,
            ResumeStatus.OPTIMIZING,
            ResumeStatus.OPTIMIZED
        ]:
            raise HTTPException(
                status_code=400,
                detail=f"Questions not ready. Current status: {resume.status}"
            )

        # Get questions
        question = db.query(Question).filter(
            Question.resume_id == resume_id
        ).first()

        if not question:
            raise HTTPException(status_code=404, detail="Questions not found")

        # Extract questions from JSON
        questions_data = question.questions_json.get("questions", [])

        # Convert to QuestionItem format
        question_items = [
            QuestionItem(
                id=q.get("id", idx),
                question=q.get("question", ""),
                category=q.get("category", "general"),
                related_issue_id=q.get("related_issue_id"),
                priority=q.get("priority", "medium"),
                example=q.get("example")
            )
            for idx, q in enumerate(questions_data, 1)
        ]

        return QuestionListResponse(
            resume_id=resume_id,
            total_questions=len(question_items),
            questions=question_items,
            instructions="Please answer the questions below. All questions are optional. Skip any you don't have information for."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting questions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
