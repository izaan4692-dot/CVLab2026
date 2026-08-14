"""
Optimization Celery Task
Handles background processing for Prompt 3 (The Craftsman)
"""
import logging
import uuid
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.tasks.celery_app import celery_app
from app.db.database import SessionLocal
from app.models.resume import Resume, ResumeStatus
from app.models.analysis import Analysis
from app.models.question import Question
from app.models.answer import Answer
from app.models.optimized_resume import OptimizedResume
from app.agents.prompt3_craftsman import craftsman_agent
from app.services.file_service import file_service
from app.services.s3_service import upload_content_to_s3
from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="tasks.optimize_resume")
def optimize_resume_task(self, resume_id: int) -> Dict[str, Any]:
    """
    Background task to optimize resume

    Steps:
    1. Load analysis, questions, and answers
    2. Run Prompt 3 (The Craftsman) - Optimize CV
    3. Save optimized resume

    Args:
        resume_id: Resume ID to optimize

    Returns:
        Dict with task results
    """
    db: Session = SessionLocal()

    try:
        logger.info(f"Starting optimization task for resume_id={resume_id}")

        # Get resume
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise Exception(f"Resume not found: {resume_id}")

        # Check status
        if resume.status != ResumeStatus.QUESTIONS_GENERATED:
            raise Exception(
                f"Resume not ready for optimization. Current status: {resume.status}"
            )

        # Get analysis
        analysis = db.query(Analysis).filter(
            Analysis.resume_id == resume_id
        ).first()
        if not analysis:
            raise Exception(f"Analysis not found for resume_id={resume_id}")

        # Get questions
        question = db.query(Question).filter(
            Question.resume_id == resume_id
        ).first()
        if not question:
            raise Exception(f"Questions not found for resume_id={resume_id}")

        # Get answers
        answer = db.query(Answer).filter(
            Answer.resume_id == resume_id
        ).first()
        if not answer:
            raise Exception(f"Answers not found for resume_id={resume_id}")

        # Update status
        resume.status = ResumeStatus.OPTIMIZING
        db.commit()

        # Run Prompt 3 (The Craftsman)
        logger.info("Running Prompt 3 (The Craftsman)")

        try:
            optimization_result = craftsman_agent.optimize_cv(
                cv_text=resume.extracted_text,
                analysis_report=analysis.report_json,
                questions=question.questions_json.get("questions", []),
                user_answers=answer.answers_json.get("answers", [])
            )

            # Extract optimized CV text
            optimized_text = optimization_result.get("optimized_cv", "")

            # Save optimized resume to file (local)
            file_path = file_service.save_optimized_resume(
                content=optimized_text,
                original_filename=resume.original_filename,
                format="txt"
            )

            # Upload optimized resume to S3
            s3_key = None
            s3_url = None
            try:
                original_name = resume.original_filename.rsplit('.', 1)[0]
                s3_key = f"optimized/{uuid.uuid4()}_{original_name}_optimized.txt"
                s3_url = upload_content_to_s3(
                    content=optimized_text.encode('utf-8'),
                    s3_key=s3_key,
                    content_type='text/plain'
                )
                if s3_url:
                    logger.info(f"Uploaded optimized resume to S3: {s3_url}")
                else:
                    logger.warning("Failed to upload optimized resume to S3, continuing with local file")
                    s3_key = None
            except Exception as s3_error:
                logger.warning(f"S3 upload failed, continuing with local file: {s3_error}")
                s3_key = None
                s3_url = None

            # Save to database
            optimized_resume = OptimizedResume(
                resume_id=resume_id,
                analysis_id=analysis.id,
                answer_id=answer.id,
                optimized_text=optimized_text,
                optimized_json=optimization_result,
                file_path=file_path,
                file_format="txt",
                s3_key=s3_key,
                s3_url=s3_url,
                changes_summary=optimization_result.get("changes_summary"),
                optimization_duration=optimization_result.get("duration")
            )
            db.add(optimized_resume)

            # Update resume status
            resume.status = ResumeStatus.OPTIMIZED
            db.commit()

            # Create notification for admin
            try:
                notification_service.create_resume_optimized_notification(
                    db=db,
                    resume_id=resume_id,
                    resume_filename=resume.original_filename
                )
            except Exception as e:
                logger.warning(f"Failed to create notification for resume {resume_id}: {e}")

            logger.info(f"Optimization complete for resume_id={resume_id}")

            return {
                "status": "success",
                "resume_id": resume_id,
                "optimized_resume_id": optimized_resume.id,
                "file_path": file_path,
                "s3_url": s3_url,
                "word_count_original": optimization_result.get("changes_summary", {}).get("word_count_original"),
                "word_count_optimized": optimization_result.get("changes_summary", {}).get("word_count_optimized")
            }

        except Exception as e:
            logger.error(f"Optimization failed: {e}")
            resume.status = ResumeStatus.FAILED
            resume.error_message = f"Optimization failed: {str(e)}"
            db.commit()
            raise

    except Exception as e:
        logger.error(f"Optimization task failed: {e}", exc_info=True)
        return {
            "status": "failed",
            "resume_id": resume_id,
            "error": str(e)
        }

    finally:
        db.close()
