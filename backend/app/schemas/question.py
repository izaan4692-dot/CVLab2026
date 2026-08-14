"""
Question Schemas
Pydantic models for Prompt 2 (The Gatherer) questions
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class QuestionItem(BaseModel):
    """Individual question"""
    id: int
    question: str
    category: str  # achievement_metrics, team_scope, vague_statements, etc.
    related_issue_id: Optional[int] = None
    priority: str = "medium"  # high, medium, low
    example: Optional[str] = None


class QuestionResponse(BaseModel):
    """Response containing generated questions"""
    id: int
    resume_id: int
    analysis_id: int
    total_questions: int
    questions: List[QuestionItem]
    generation_duration: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionListResponse(BaseModel):
    """Simplified question list for user interface"""
    resume_id: int
    total_questions: int
    questions: List[QuestionItem]
    instructions: str = Field(
        default="Please answer the questions below. All questions are optional. Skip any you don't have information for.",
        description="Instructions for the user"
    )
