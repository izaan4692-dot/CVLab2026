"""
Answers API Endpoint
Submit user answers to questions
"""
import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.resume import Resume, ResumeStatus
from app.models.question import Question
from app.models.answer import Answer
from app.schemas.answer import AnswerSubmitRequest, AnswerResponse
from app.tasks.optimization_task import optimize_resume_task
from app.auth.middleware import get_current_user, AuthUser

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/answers", response_model=AnswerResponse)
async def submit_answers(
    request: AnswerSubmitRequest,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Submit user answers to questions

    - Accepts answers for generated questions
    - Calculates completion percentage
    - Saves to database
    - Triggers optimization task

    Args:
        request: Answer submission request
        db: Database session
        current_user: Authenticated user

    Returns:
        AnswerResponse with submission details
    """
    try:
        resume_id = request.resume_id

        # Get resume
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")

        # Verify ownership
        if resume.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Check status
        if resume.status != ResumeStatus.QUESTIONS_GENERATED:
            raise HTTPException(
                status_code=400,
                detail=f"Resume not ready for answers. Current status: {resume.status}"
            )

        # Get questions
        question = db.query(Question).filter(
            Question.resume_id == resume_id
        ).first()

        if not question:
            raise HTTPException(status_code=404, detail="Questions not found")

        # Process answers
        total_questions = question.total_questions
        total_answered = 0
        total_skipped = 0

        for answer_item in request.answers:
            if answer_item.status in ["complete", "partial", "minimal"]:
                if answer_item.answer and len(answer_item.answer.strip()) > 0:
                    total_answered += 1
                else:
                    total_skipped += 1
            else:
                total_skipped += 1

        # Calculate completion percentage
        completion_percentage = int((total_answered / total_questions) * 100) if total_questions > 0 else 0

        # Prepare answers JSON
        answers_json = {
            "answers": [
                {
                    "question_id": a.question_id,
                    "answer": a.answer,
                    "status": a.status,
                    "word_count": len(a.answer.split()) if a.answer else 0
                }
                for a in request.answers
            ],
            "metadata": {
                "total_answered": total_answered,
                "total_skipped": total_skipped,
                "completion_percentage": completion_percentage
            }
        }

        # Check if answers already exist (update scenario)
        existing_answer = db.query(Answer).filter(
            Answer.resume_id == resume_id
        ).first()

        if existing_answer:
            # Update existing
            existing_answer.answers_json = answers_json
            existing_answer.total_answered = total_answered
            existing_answer.total_skipped = total_skipped
            existing_answer.completion_percentage = completion_percentage
            answer = existing_answer
        else:
            # Create new
            answer = Answer(
                resume_id=resume_id,
                question_id=question.id,
                answers_json=answers_json,
                total_answered=total_answered,
                total_skipped=total_skipped,
                completion_percentage=completion_percentage
            )
            db.add(answer)

        db.commit()
        db.refresh(answer)

        logger.info(
            f"Answers submitted for resume_id={resume_id}: "
            f"{total_answered}/{total_questions} answered"
        )

        # Trigger optimization task
        logger.info(f"Triggering optimization task for resume_id={resume_id}")
        optimize_resume_task.delay(resume_id)

        return AnswerResponse(
            id=answer.id,
            resume_id=resume_id,
            question_id=question.id,
            total_answered=total_answered,
            total_skipped=total_skipped,
            completion_percentage=completion_percentage,
            answers_json=answers_json,
            created_at=answer.created_at,
            message="Answers submitted successfully. Optimization started in background."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting answers: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
