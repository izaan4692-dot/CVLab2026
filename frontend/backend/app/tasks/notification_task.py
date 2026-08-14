"""
Notification Background Task
Periodically checks for new user registrations and creates notifications
"""
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.tasks.celery_app import celery_app
from app.db.database import SessionLocal
from app.models.notification import Notification, NotificationType
from app.services.supabase_service import SupabaseService
from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.check_new_users")
def check_new_users_task():
    """
    Background task to check for new user registrations
    Runs periodically to detect new users and create notifications
    
    Returns:
        dict: Task results
    """
    db: Session = SessionLocal()
    
    try:
        # Get the most recent notification for user registration
        last_notification = db.query(Notification).filter(
            Notification.type == NotificationType.USER_REGISTERED
        ).order_by(Notification.created_at.desc()).first()
        
        # Determine cutoff time (last notification time or 24 hours ago)
        if last_notification:
            cutoff_time = last_notification.created_at
        else:
            # If no previous notifications, check users from last 24 hours
            cutoff_time = datetime.utcnow() - timedelta(hours=24)
        
        logger.info(f"Checking for new users since {cutoff_time}")
        
        # Get all users from Supabase
        supabase_service = SupabaseService()
        all_users = []
        current_page = 1
        per_page = 50
        max_pages = 100
        
        # Handle async call in sync Celery task
        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        while current_page <= max_pages:
            users_batch = loop.run_until_complete(
                supabase_service.list_users(page=current_page, per_page=per_page)
            )
            if not users_batch:
                break
            
            all_users.extend(users_batch)
            
            if len(users_batch) < per_page:
                break
            
            current_page += 1
        
        # Filter new users (created after cutoff time)
        new_users = []
        for user in all_users:
            created_at = user.get('created_at')
            if created_at:
                # Parse created_at if it's a string
                if isinstance(created_at, str):
                    try:
                        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00') if 'Z' in created_at else created_at)
                    except:
                        continue
                
                # Compare with cutoff time (handle timezone-aware datetimes)
                if isinstance(created_at, datetime):
                    if created_at.tzinfo:
                        cutoff_aware = cutoff_time.replace(tzinfo=created_at.tzinfo) if cutoff_time.tzinfo is None else cutoff_time
                    else:
                        cutoff_aware = cutoff_time.replace(tzinfo=None) if cutoff_time.tzinfo else cutoff_time
                    
                    if created_at > cutoff_aware:
                        new_users.append(user)
        
        # Create notifications for new users
        notifications_created = 0
        for user in new_users:
            user_id = user.get('id')
            if not user_id:
                continue
            
            # Check if notification already exists for this user
            existing = db.query(Notification).filter(
                Notification.type == NotificationType.USER_REGISTERED,
                Notification.related_id == user_id
            ).first()
            
            if not existing:
                try:
                    notification_service.create_user_registered_notification(
                        db=db,
                        user_id=user_id,
                        user_name=user.get('user_metadata', {}).get('full_name'),
                        user_email=user.get('email')
                    )
                    notifications_created += 1
                except Exception as e:
                    logger.error(f"Failed to create notification for user {user_id}: {e}")
        
        logger.info(f"Created {notifications_created} notifications for new users")
        
        return {
            "status": "success",
            "new_users_found": len(new_users),
            "notifications_created": notifications_created
        }
        
    except Exception as e:
        logger.error(f"Error checking for new users: {e}", exc_info=True)
        return {
            "status": "failed",
            "error": str(e)
        }
    finally:
        db.close()

