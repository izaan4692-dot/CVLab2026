"""
Resume Model
Stores uploaded resume information and extracted text
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.db.database import Base


class ResumeStatus(str, enum.Enum):
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


class Resume(Base):
    """Resume table"""
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)

    # File information
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(10), nullable=False)  # pdf, doc, docx
    file_size = Column(Integer)  # in bytes

    # S3 Storage (optional - for cloud storage)
    s3_key = Column(String(500), nullable=True)  # S3 object key
    s3_url = Column(String(1000), nullable=True)  # S3 URL

    # Extracted content
    extracted_text = Column(Text)

    # Status
    status = Column(
        Enum(ResumeStatus),
        default=ResumeStatus.UPLOADED,
        nullable=False
    )

    # Error tracking
    error_message = Column(Text)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # User identification (Supabase user UUID)
    user_id = Column(String(100), nullable=False, index=True)

    # Relationships
    analysis = relationship("Analysis", back_populates="resume", uselist=False)
    questions = relationship("Question", back_populates="resume", uselist=False)
    answers = relationship("Answer", back_populates="resume", uselist=False)
    optimized_resume = relationship("OptimizedResume", back_populates="resume", uselist=False)

    def __repr__(self):
        return f"<Resume(id={self.id}, filename={self.original_filename}, status={self.status})>"
