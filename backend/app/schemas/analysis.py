"""
Analysis Schemas
Pydantic models for Prompt 1 (The Analyst) analysis results
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class IssueDetail(BaseModel):
    """Individual issue identified in CV"""
    issue_id: int
    category: str  # vague_statement, missing_metrics, etc.
    description: str
    original_text: str
    ceiling: str  # Best version WITH user info
    floor: str  # Best version WITHOUT user info
    delta: str  # The gap between ceiling and floor
    confidence: str = "HIGH"  # HIGH, MEDIUM, LOW


class AnalysisTriggerRequest(BaseModel):
    """Request to trigger analysis"""
    resume_id: int


class AnalysisResponse(BaseModel):
    """Response containing Prompt 1 analysis results"""
    id: int
    resume_id: int

    # Analysis results
    total_issues: int
    issues: List[IssueDetail]

    # Metadata
    confidence_level: str
    analysis_duration: Optional[int] = None

    # CV Statistics
    statistics: Optional[Dict[str, Any]] = Field(
        default=None,
        description="CV statistics: word count, sections, experience level, etc."
    )

    created_at: datetime

    class Config:
        from_attributes = True


class AnalysisDetailResponse(BaseModel):
    """Detailed analysis response with full report JSON"""
    id: int
    resume_id: int
    report_json: Dict[str, Any]
    total_issues: int
    confidence_level: str
    analysis_duration: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
