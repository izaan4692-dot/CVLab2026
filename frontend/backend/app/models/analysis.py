"""
Analysis Model
Stores Prompt 1 (The Analyst) output - CV analysis report
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Analysis(Base):
    """Analysis table - stores Prompt 1 output"""
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign key
    resume_id = Column(Integer, ForeignKey("resumes.id"), unique=True, nullable=False)

    # Analysis report (JSON from Prompt 1)
    report_json = Column(JSON, nullable=False)
    # Structure:
    # {
    #   "issues": [...],  # List of identified issues
    #   "ceiling_floor_mapping": {...},  # Ceiling/Floor/Delta for each issue
    #   "metadata": {...},  # Analysis metadata
    #   "statistics": {...}  # Stats about the CV
    # }

    # Metadata
    total_issues = Column(Integer)
    confidence_level = Column(String(20))  # HIGH, MEDIUM, LOW
    analysis_duration = Column(Integer)  # seconds

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    resume = relationship("Resume", back_populates="analysis")

    def __repr__(self):
        return f"<Analysis(id={self.id}, resume_id={self.resume_id}, issues={self.total_issues})>"
