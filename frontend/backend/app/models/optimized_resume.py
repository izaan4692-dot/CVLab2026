"""
Optimized Resume Model
Stores Prompt 3 (The Craftsman) output - enhanced resume
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class OptimizedResume(Base):
    """Optimized Resume table - stores Prompt 3 output"""
    __tablename__ = "optimized_resumes"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    resume_id = Column(Integer, ForeignKey("resumes.id"), unique=True, nullable=False)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    answer_id = Column(Integer, ForeignKey("answers.id"), nullable=False)

    # Optimized content
    optimized_text = Column(Text, nullable=False)  # Enhanced resume text
    optimized_json = Column(JSON)  # Structured JSON of the enhanced resume

    # File information
    file_path = Column(String(500))  # Path to generated PDF/DOCX
    file_format = Column(String(10))  # pdf, docx

    # S3 Storage
    s3_key = Column(String(500), nullable=True)  # S3 object key for optimized file
    s3_url = Column(String(1000), nullable=True)  # S3 URL for optimized file

    # Metadata
    changes_summary = Column(JSON)
    # Structure:
    # {
    #   "total_changes": 45,
    #   "ceiling_applied": 30,
    #   "floor_applied": 15,
    #   "sections_enhanced": ["experience", "skills", "education"],
    #   "word_count_original": 250,
    #   "word_count_optimized": 320
    # }

    optimization_duration = Column(Integer)  # seconds

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    resume = relationship("Resume", back_populates="optimized_resume")

    def __repr__(self):
        return f"<OptimizedResume(id={self.id}, resume_id={self.resume_id})>"
