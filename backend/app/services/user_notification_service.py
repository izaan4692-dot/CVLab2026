"""
User Notification Service
Service for managing user-specific notifications
"""
import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.models.user_notification import UserNotification, UserNotificationType

logger = logging.getLogger(__name__)


class UserNotificationService:
    """Service for managing user-specific notifications"""

    @staticmethod
    def create_notification(
        db: Session,
        user_id: str,
        notification_type: UserNotificationType,
        title: str,
        message: str,
        related_id: Optional[str] = None
    ) -> UserNotification:
        """
        Create a new user notification.
        """
        notification = UserNotification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            related_id=related_id,
            is_read=False
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        logger.info(f"Created user notification for user {user_id}: {title}")
        return notification

    @staticmethod
    def get_notifications_for_user(
        db: Session,
        user_id: str,
        limit: int = 10,
        unread_only: bool = False
    ) -> List[UserNotification]:
        """
        Get recent notifications for a specific user.
        """
        query = db.query(UserNotification).filter(
            UserNotification.user_id == user_id
        )
        
        if unread_only:
            query = query.filter(UserNotification.is_read == False)
        
        return query.order_by(desc(UserNotification.created_at)).limit(limit).all()

    @staticmethod
    def get_unread_count_for_user(db: Session, user_id: str) -> int:
        """
        Get the count of unread notifications for a specific user.
        """
        return db.query(UserNotification).filter(
            UserNotification.user_id == user_id,
            UserNotification.is_read == False
        ).count()

    @staticmethod
    def mark_as_read_for_user(db: Session, notification_id: int, user_id: str) -> bool:
        """
        Mark a specific notification as read for a user.
        """
        from datetime import datetime
        notification = db.query(UserNotification).filter(
            UserNotification.id == notification_id,
            UserNotification.user_id == user_id
        ).first()
        if notification:
            notification.is_read = True
            notification.read_at = func.now()
            db.commit()
            db.refresh(notification)
            logger.info(f"User {user_id} marked notification {notification_id} as read.")
            return True
        return False

    @staticmethod
    def mark_all_as_read_for_user(db: Session, user_id: str) -> int:
        """
        Mark all unread notifications as read for a specific user.
        """
        from datetime import datetime
        updated_count = db.query(UserNotification).filter(
            UserNotification.user_id == user_id,
            UserNotification.is_read == False
        ).update({UserNotification.is_read: True, UserNotification.read_at: func.now()}, synchronize_session=False)
        db.commit()
        logger.info(f"User {user_id} marked {updated_count} notifications as read.")
        return updated_count


user_notification_service = UserNotificationService()

