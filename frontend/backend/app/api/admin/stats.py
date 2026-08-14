"""
Admin Stats Endpoint
Dashboard statistics for admin panel
"""
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct

from app.db.database import get_db
from app.api.admin.middleware import get_admin_user
from app.auth.middleware import AuthUser
from app.models.resume import Resume, ResumeStatus
from app.schemas.admin import DashboardStats
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user)
):
    """
    Get dashboard statistics for admin panel

    Returns:
        DashboardStats: Server uptime, resumes processed, sessions, users count
    """
    logger.info(f"Admin {admin_user.id} fetching dashboard stats")

    # Count total resumes processed (completed statuses)
    processed_statuses = [
        ResumeStatus.ANALYZED,
        ResumeStatus.QUESTIONS_GENERATED,
        ResumeStatus.OPTIMIZING,
        ResumeStatus.OPTIMIZED
    ]
    resumes_processed = db.query(func.count(Resume.id)).filter(
        Resume.status.in_(processed_statuses)
    ).scalar() or 0

    # Count total users from Supabase (all users, not just those with resumes)
    supabase_service = SupabaseService()
    all_supabase_users = []
    current_page = 1
    per_page = 50
    max_pages = 100  # Safety limit to prevent infinite loops
    
    while current_page <= max_pages:
        batch = await supabase_service.list_users(page=current_page, per_page=per_page)
        batch_users = batch.get('users', [])
        
        if not batch_users:
            logger.info(f"No more users found at page {current_page}, stopping")
            break
            
        all_supabase_users.extend(batch_users)
        
        # If we got fewer users than per_page, we've reached the end
        if len(batch_users) < per_page:
            logger.info(f"Reached end of users (got {len(batch_users)} < {per_page})")
            break
            
        current_page += 1
    
    total_users = len(all_supabase_users)
    logger.info(f"Total users from Supabase: {total_users}")

    # Count total sessions (total resume uploads)
    total_sessions = db.query(func.count(Resume.id)).scalar() or 0

    return DashboardStats(
        server_uptime="99.9%",  # Static for now, can be made dynamic with monitoring
        resumes_processed=resumes_processed,
        total_sessions=total_sessions,
        total_users=total_users
    )
