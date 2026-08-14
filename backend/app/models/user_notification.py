"""
User Notification Model
Stores user-specific notifications
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from app.db.database import Base
import enum


class UserNotificationType(str, enum.Enum):
    """Types of user notifications"""
    RESUME_OPTIMIZED = "resume_optimized"
    RESUME_FAILED = "resume_failed"
    RESUME_PROCESSING = "resume_processing"
    PAYMENT_SUCCESS = "payment_success"
    PAYMENT_FAILED = "payment_failed"
    ACCOUNT_UPDATED = "account_updated"
    WELCOME = "welcome"


class UserNotification(Base):
    """User-specific notification table"""
    __tablename__ = "user_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)  # Foreign key to Supabase user ID
    type = Column(Enum(UserNotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    related_id = Column(String(100), nullable=True)  # e.g., resume_id, payment_id
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<UserNotification(id={self.id}, user_id={self.user_id}, type={self.type.value}, is_read={self.is_read})>"

