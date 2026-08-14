"""
Resume Schemas
Pydantic models for resume-related API requests/responses
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class ResumeStatusEnum(str, Enum):
    """Resume processing status"""
    UPLOADED = "uploaded"
    EXTRACTING = "extracting"
    EXTRACTED = "extracted"
    ANALYZING = "analyzing"
    ANALYZED = "analyzed"
    QUESTIONS_GENERATED = "questions_generated"
    OPTIMIZING = "optimizing"
    OPTIMIZED = "optimized"
    FAILED = "failed"


class ResumeUploadResponse(BaseModel):
    """Response after uploading a resume"""
    id: int
    original_filename: str
    file_type: str
    file_size: int
    status: ResumeStatusEnum
    created_at: datetime
    message: str = "Resume uploaded successfully"

    class Config:
        from_attributes = True


class ResumeStatusResponse(BaseModel):
    """Response for resume status check"""
    id: int
    status: ResumeStatusEnum
    original_filename: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    error_message: Optional[str] = None

    # Progress indicators
    extracted_text_length: Optional[int] = None
    analysis_complete: bool = False
    questions_available: bool = False
    answers_submitted: bool = False
    optimization_complete: bool = False

    class Config:
        from_attributes = True


class ResumeListResponse(BaseModel):
    """Response for listing resumes"""
    resumes: list[ResumeStatusResponse]
    total: int
    page: int = 1
    page_size: int = 10
