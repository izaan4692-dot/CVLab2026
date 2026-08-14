"""
API v1 Router
Aggregates all API endpoints
"""
from fastapi import APIRouter

from app.api.v1 import upload, status, questions, answers, download, claims, notifications

# Create main router
router = APIRouter()


# Health check endpoint
@router.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for API v1"""
    return {
        "status": "healthy",
        "api_version": "v1"
    }


# Include all endpoint routers
router.include_router(upload.router, tags=["Upload"])
router.include_router(status.router, tags=["Status"])
router.include_router(questions.router, tags=["Questions"])
router.include_router(answers.router, tags=["Answers"])
router.include_router(download.router, tags=["Download"])
router.include_router(claims.router, tags=["Claims"])
router.include_router(notifications.router, tags=["Notifications"])
