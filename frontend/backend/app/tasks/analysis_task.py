"""
Analysis Celery Task
Handles background processing for Prompt 1 (Analysis) + Prompt 2 (Questions)
"""
import logging
import os
import tempfile
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.tasks.celery_app import celery_app
from app.db.database import SessionLocal
from app.models.resume import Resume, ResumeStatus
from app.models.analysis import Analysis
from app.models.question import Question
from app.services.ocr_service import ocr_service
from app.services.s3_service import download_file_from_s3
from app.agents.prompt1_analyst import analyst_agent
from app.agents.prompt2_gatherer import gatherer_agent

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="tasks.analyze_resume")
def analyze_resume_task(self, resume_id: int) -> Dict[str, Any]:
    """
    Background task to analyze resume

    Steps:
    1. Extract text from uploaded file (OCR)
    2. Run Prompt 1 (The Analyst) - CV analysis
    3. Run Prompt 2 (The Gatherer) - Generate questions

    Args:
        resume_id: Resume ID to analyze

    Returns:
        Dict with task results
    """
    db: Session = SessionLocal()

    try:
        logger.info(f"Starting analysis task for resume_id={resume_id}")

        # Get resume
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise Exception(f"Resume not found: {resume_id}")

        # Step 1: Extract text (OCR)
        logger.info(f"Step 1: Extracting text from {resume.file_type} file")
        resume.status = ResumeStatus.EXTRACTING
        db.commit()

        try:
            # Determine file path - download from S3 if needed
            file_path = resume.file_path
            temp_file = None

            if resume.s3_key and (not os.path.exists(file_path)):
                # File is in S3 and doesn't exist locally - download it
                logger.info(f"Downloading file from S3: {resume.s3_key}")
                temp_dir = tempfile.mkdtemp()
                file_ext = os.path.splitext(resume.original_filename)[1]
                temp_file = os.path.join(temp_dir, f"resume{file_ext}")

                success = download_file_from_s3(resume.s3_key, temp_file)
                if not success:
                    raise Exception(f"Failed to download file from S3: {resume.s3_key}")

                file_path = temp_file
                logger.info(f"Downloaded S3 file to: {file_path}")

            extracted_text = ocr_service.extract_text(
                file_path,
                resume.file_type
            )

            # Save extracted text
            resume.extracted_text = extracted_text
            resume.status = ResumeStatus.EXTRACTED
            db.commit()

            logger.info(f"Text extraction complete: {len(extracted_text)} characters")

        except Exception as e:
            logger.error(f"OCR failed: {e}")
            resume.status = ResumeStatus.FAILED
            resume.error_message = f"Text extraction failed: {str(e)}"
            db.commit()
            raise

        # Step 2: Run Prompt 1 (The Analyst)
        logger.info("Step 2: Running Prompt 1 (The Analyst)")
        resume.status = ResumeStatus.ANALYZING
        db.commit()

        try:
            analysis_result = analyst_agent.analyze_cv(extracted_text)

            # Save analysis to database
            analysis = Analysis(
                resume_id=resume_id,
                report_json=analysis_result,
                total_issues=analysis_result.get("total_issues", 0),
                confidence_level=analysis_result.get("metadata", {}).get("confidence_level", "MEDIUM"),
                analysis_duration=analysis_result.get("duration")
            )
            db.add(analysis)
            resume.status = ResumeStatus.ANALYZED
            db.commit()

            logger.info(f"Analysis complete: {analysis.total_issues} issues identified")

        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            resume.status = ResumeStatus.FAILED
            resume.error_message = f"Analysis failed: {str(e)}"
            db.commit()
            raise

        # Step 3: Run Prompt 2 (The Gatherer)
        logger.info("Step 3: Running Prompt 2 (The Gatherer)")

        try:
            questions_result = gatherer_agent.generate_questions(
                extracted_text,
                analysis_result
            )

            # Save questions to database
            question = Question(
                resume_id=resume_id,
                analysis_id=analysis.id,
                questions_json=questions_result,
                total_questions=questions_result.get("total_questions", 0),
                generation_duration=questions_result.get("duration")
            )
            db.add(question)
            resume.status = ResumeStatus.QUESTIONS_GENERATED
            db.commit()

            logger.info(f"Questions generated: {question.total_questions} questions")

        except Exception as e:
            logger.error(f"Question generation failed: {e}")
            resume.status = ResumeStatus.FAILED
            resume.error_message = f"Question generation failed: {str(e)}"
            db.commit()
            raise

        # Success!
        logger.info(f"Analysis task complete for resume_id={resume_id}")

        return {
            "status": "success",
            "resume_id": resume_id,
            "analysis_id": analysis.id,
            "question_id": question.id,
            "total_issues": analysis.total_issues,
            "total_questions": question.total_questions
        }

    except Exception as e:
        logger.error(f"Analysis task failed: {e}", exc_info=True)
        return {
            "status": "failed",
            "resume_id": resume_id,
            "error": str(e)
        }

    finally:
        db.close()
