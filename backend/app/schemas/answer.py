"""
Answer Schemas
Pydantic models for user answers to questions
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class AnswerItem(BaseModel):
    """Individual answer to a question"""
    question_id: int
    answer: str = ""
    status: str = "skipped"  # complete, partial, minimal, skipped


class AnswerSubmitRequest(BaseModel):
    """Request to submit user answers"""
    resume_id: int
    answers: List[AnswerItem]


class AnswerResponse(BaseModel):
    """Response after submitting answers"""
    id: int
    resume_id: int
    question_id: int
    total_answered: int
    total_skipped: int
    completion_percentage: int
    answers_json: Dict[str, Any]
    created_at: datetime
    message: str = "Answers submitted successfully"

    class Config:
        from_attributes = True


class AnswerStatusResponse(BaseModel):
    """Status of user answers"""
    resume_id: int
    has_answers: bool
    total_questions: int
    total_answered: int
    total_skipped: int
    completion_percentage: int
