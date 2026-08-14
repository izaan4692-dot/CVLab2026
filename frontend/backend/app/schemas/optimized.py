"""
Optimized Resume Schemas
Pydantic models for Prompt 3 (The Craftsman) optimized resumes
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class OptimizeTriggerRequest(BaseModel):
    """Request to trigger resume optimization"""
    resume_id: int


class ChangesSummary(BaseModel):
    """Summary of changes made during optimization"""
    total_changes: int
    ceiling_applied: int  # Changes using user-provided info
    floor_applied: int  # Improvements without user info
    sections_enhanced: list[str]
    word_count_original: int
    word_count_optimized: int


class OptimizedResumeResponse(BaseModel):
    """Response containing optimized resume"""
    id: int
    resume_id: int
    analysis_id: int
    answer_id: int

    # Optimized content
    optimized_text: str
    optimized_json: Optional[Dict[str, Any]] = None

    # File information
    file_path: Optional[str] = None
    file_format: str = "txt"

    # Changes summary
    changes_summary: Optional[ChangesSummary] = None
    optimization_duration: Optional[int] = None

    created_at: datetime

    class Config:
        from_attributes = True


class OptimizedResumeDownloadResponse(BaseModel):
    """Response for resume download"""
    resume_id: int
    file_path: str
    file_format: str
    download_url: str
    message: str = "Optimized resume ready for download"
