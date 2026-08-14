"""
User Notifications API Endpoint
Get and manage user-specific notifications
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from app.db.database import get_db
from app.auth.middleware import get_current_user, AuthUser
from app.services.user_notification_service import user_notification_service
from app.models.user_notification import UserNotificationType

logger = logging.getLogger(__name__)
router = APIRouter()


# Pydantic schemas for API response
class UserNotificationResponse(BaseModel):
    id: int
    type: UserNotificationType
    title: str
    message: str
    related_id: Optional[str] = None
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserNotificationListResponse(BaseModel):
    notifications: List[UserNotificationResponse]
    unread_count: int
    total: int


@router.get("/notifications", response_model=UserNotificationListResponse)
async def list_user_notifications(
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=50),
    unread_only: bool = Query(False, description="Only return unread notifications")
):
    """
    Get all notifications for the current user.
    """
    logger.info(f"User {current_user.id} fetching notifications")
    
    notifications = user_notification_service.get_notifications_for_user(
        db, current_user.id, limit, unread_only
    )
    unread_count = user_notification_service.get_unread_count_for_user(db, current_user.id)
    
    return UserNotificationListResponse(
        notifications=notifications,
        unread_count=unread_count,
        total=len(notifications)
    )


@router.get("/notifications/unread-count", response_model=dict)
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Get the count of unread notifications for the current user.
    """
    logger.info(f"User {current_user.id} fetching unread count")
    unread_count = user_notification_service.get_unread_count_for_user(db, current_user.id)
    return {"unread_count": unread_count}


@router.patch("/notifications/{notification_id}/read")
async def mark_user_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Mark a specific user notification as read.
    """
    logger.info(f"User {current_user.id} marking notification {notification_id} as read")
    success = user_notification_service.mark_as_read_for_user(db, notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found or not owned by user")
    return {"message": "Notification marked as read", "id": notification_id}


@router.patch("/notifications/read-all")
async def mark_all_user_notifications_read(
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Mark all unread notifications as read for the current user.
    """
    logger.info(f"User {current_user.id} marking all notifications as read")
    count = user_notification_service.mark_all_as_read_for_user(db, current_user.id)
    return {"message": f"Marked {count} notifications as read", "count": count}

