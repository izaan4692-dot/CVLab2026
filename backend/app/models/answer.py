"""
Answer Model
Stores user answers to generated questions
"""
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Answer(Base):
    """Answer table - stores user responses"""
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    resume_id = Column(Integer, ForeignKey("resumes.id"), unique=True, nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)

    # User answers (JSON)
    answers_json = Column(JSON, nullable=False)
    # Structure:
    # {
    #   "answers": [
    #     {
    #       "question_id": 1,
    #       "answer": "I led a team of 5...",
    #       "status": "complete",  # complete, partial, minimal, skipped
    #       "word_count": 25
    #     },
    #     ...
    #   ],
    #   "metadata": {
    #     "total_answered": 12,
    #     "total_skipped": 3,
    #     "completion_percentage": 80.0
    #   }
    # }

    # Metadata
    total_answered = Column(Integer)
    total_skipped = Column(Integer)
    completion_percentage = Column(Integer)  # 0-100

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    resume = relationship("Resume", back_populates="answers")

    def __repr__(self):
        return f"<Answer(id={self.id}, resume_id={self.resume_id}, answered={self.total_answered})>"
