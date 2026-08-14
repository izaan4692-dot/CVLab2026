"""
Notification Service
Handles creation and management of admin notifications
"""
import logging
from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType
from app.models.resume import Resume
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for managing notifications"""
    
    @staticmethod
    def create_resume_optimized_notification(
        db: Session,
        resume_id: int,
        resume_filename: str
    ) -> Notification:
        """
        Create notification when a resume is optimized
        
        Args:
            db: Database session
            resume_id: Resume ID
            resume_filename: Original filename
            
        Returns:
            Notification: Created notification
        """
        notification = Notification(
            type=NotificationType.RESUME_OPTIMIZED,
            title="Resume Optimized",
            message=f"Resume '{resume_filename}' has been successfully optimized.",
            related_id=str(resume_id),
            is_read=False
        )
        
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        logger.info(f"Created resume optimized notification for resume_id={resume_id}")
        return notification
    
    @staticmethod
    def create_user_registered_notification(
        db: Session,
        user_id: str,
        user_name: str = None,
        user_email: str = None
    ) -> Notification:
        """
        Create notification when a new user registers
        
        Args:
            db: Database session
            user_id: User UUID
            user_name: User's full name
            user_email: User's email
            
        Returns:
            Notification: Created notification
        """
        # Format user display name
        if user_name:
            display_name = user_name
        elif user_email:
            display_name = user_email.split('@')[0]
        else:
            display_name = "New User"
        
        notification = Notification(
            type=NotificationType.USER_REGISTERED,
            title="New User Registered",
            message=f"A new user {display_name} ({user_email or 'no email'}) has joined.",
            related_id=user_id,
            is_read=False
        )
        
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        logger.info(f"Created user registered notification for user_id={user_id}")
        return notification
    
    @staticmethod
    def get_unread_count(db: Session) -> int:
        """
        Get count of unread notifications
        
        Args:
            db: Database session
            
        Returns:
            int: Count of unread notifications
        """
        return db.query(Notification).filter(Notification.is_read == False).count()
    
    @staticmethod
    def mark_as_read(db: Session, notification_id: int) -> bool:
        """
        Mark a notification as read
        
        Args:
            db: Database session
            notification_id: Notification ID
            
        Returns:
            bool: True if successful
        """
        from datetime import datetime
        
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if notification:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            db.commit()
            return True
        return False
    
    @staticmethod
    def mark_all_as_read(db: Session) -> int:
        """
        Mark all notifications as read
        
        Args:
            db: Database session
            
        Returns:
            int: Number of notifications marked as read
        """
        from datetime import datetime
        
        count = db.query(Notification).filter(Notification.is_read == False).update({
            Notification.is_read: True,
            Notification.read_at: datetime.utcnow()
        })
        db.commit()
        return count


# Global instance
notification_service = NotificationService()

