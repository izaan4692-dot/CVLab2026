"""
Admin Notifications Endpoints
Manage admin notifications
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime

from app.db.database import get_db
from app.api.admin.middleware import get_admin_user
from app.auth.middleware import AuthUser
from app.models.notification import Notification, NotificationType
from app.services.notification_service import notification_service
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


# Pydantic schemas
class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    related_id: Optional[str] = None
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    unread_count: int
    total: int


@router.get("/notifications", response_model=NotificationListResponse)
async def list_notifications(
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user),
    limit: int = 20
):
    """
    Get all notifications for admin
    
    Returns:
        NotificationListResponse: List of notifications with unread count
    """
    logger.info(f"Admin {admin_user.id} fetching notifications")
    
    # Get notifications ordered by most recent first
    notifications = db.query(Notification).order_by(desc(Notification.created_at)).limit(limit).all()
    
    # Get unread count
    unread_count = notification_service.get_unread_count(db)
    
    # Convert notifications to response format
    notification_responses = []
    for n in notifications:
        notification_responses.append(NotificationResponse(
            id=n.id,
            type=n.type.value,
            title=n.title,
            message=n.message,
            related_id=n.related_id,
            is_read=n.is_read,
            created_at=n.created_at,
            read_at=n.read_at
        ))
    
    return NotificationListResponse(
        notifications=notification_responses,
        unread_count=unread_count,
        total=len(notifications)
    )


@router.get("/notifications/unread-count")
async def get_unread_count(
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user)
):
    """
    Get unread notification count
    
    Returns:
        dict: Unread count
    """
    count = notification_service.get_unread_count(db)
    return {"unread_count": count}


@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user)
):
    """
    Mark a notification as read
    
    Args:
        notification_id: Notification ID
        
    Returns:
        dict: Success message
    """
    logger.info(f"Admin {admin_user.id} marking notification {notification_id} as read")
    
    success = notification_service.mark_as_read(db, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read", "id": notification_id}


@router.patch("/notifications/read-all")
async def mark_all_notifications_read(
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user)
):
    """
    Mark all notifications as read
    
    Returns:
        dict: Number of notifications marked as read
    """
    logger.info(f"Admin {admin_user.id} marking all notifications as read")
    
    count = notification_service.mark_all_as_read(db)
    return {"message": f"{count} notifications marked as read", "count": count}

