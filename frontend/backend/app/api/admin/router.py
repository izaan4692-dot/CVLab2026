"""
Admin API Router
Aggregates all admin endpoints
"""
from fastapi import APIRouter

from app.api.admin import stats, users, resumes, claims, prompts, notifications

# Create main admin router
router = APIRouter()


# Health check endpoint for admin API
@router.get("/health", tags=["Admin Health"])
async def admin_health_check():
    """Health check endpoint for Admin API"""
    return {
        "status": "healthy",
        "api_version": "admin/v1"
    }


# Include all admin endpoint routers
router.include_router(stats.router, tags=["Admin Stats"])
router.include_router(users.router, tags=["Admin Users"])
router.include_router(resumes.router, tags=["Admin Resumes"])
router.include_router(claims.router, tags=["Admin Claims"])
router.include_router(prompts.router, tags=["Admin Prompts"])
router.include_router(notifications.router, tags=["Admin Notifications"])
