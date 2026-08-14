"""
Notification Model
Stores admin notifications for new users and optimized resumes
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from app.db.database import Base
import enum


class NotificationType(str, enum.Enum):
    """Notification types"""
    USER_REGISTERED = "user_registered"
    RESUME_OPTIMIZED = "resume_optimized"


class Notification(Base):
    """Notification table - stores admin notifications"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    
    # Notification details
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Related entity (user_id or resume_id)
    related_id = Column(String(100), nullable=True)  # Can be user UUID or resume ID
    
    # Read status
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Notification(id={self.id}, type={self.type.value}, is_read={self.is_read})>"

