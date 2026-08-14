"""
Question Model
Stores Prompt 2 (The Gatherer) output - generated questions
"""
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Question(Base):
    """Question table - stores Prompt 2 output"""
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    resume_id = Column(Integer, ForeignKey("resumes.id"), unique=True, nullable=False)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)

    # Questions (JSON from Prompt 2)
    questions_json = Column(JSON, nullable=False)
    # Structure:
    # {
    #   "questions": [
    #     {
    #       "id": 1,
    #       "question": "Tell me about...",
    #       "category": "achievement_metrics",
    #       "related_issue_id": 123,
    #       "priority": "high"
    #     },
    #     ...
    #   ],
    #   "metadata": {
    #     "total_questions": 15,
    #     "chronological_order": true
    #   }
    # }

    # Metadata
    total_questions = Column(Integer)
    generation_duration = Column(Integer)  # seconds

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    resume = relationship("Resume", back_populates="questions")

    def __repr__(self):
        return f"<Question(id={self.id}, resume_id={self.resume_id}, total={self.total_questions})>"
