"""
Admin Resume Management Endpoints
Manage resumes from admin panel
"""
import logging
import math
import os
from typing import Optional
from io import BytesIO
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, asc
from openpyxl import Workbook

from app.db.database import get_db
from app.api.admin.middleware import get_admin_user
from app.auth.middleware import AuthUser
from app.models.resume import Resume, ResumeStatus
from app.models.analysis import Analysis
from app.models.optimized_resume import OptimizedResume
from app.schemas.admin import (
    AdminResumeListItem,
    AdminResumeListResponse,
    AdminResumeDetail,
    AdminResumeStatus,
    AIOptimizationInfo,
    UserStatus
)
from app.services.supabase_service import SupabaseService
from app.services import s3_service
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


def map_resume_status(status: ResumeStatus) -> AdminResumeStatus:
    """Map internal resume status to admin-friendly status"""
    if status == ResumeStatus.OPTIMIZED:
        return AdminResumeStatus.OPTIMIZED
    elif status in [ResumeStatus.ANALYZED, ResumeStatus.QUESTIONS_GENERATED]:
        return AdminResumeStatus.ANALYZED
    elif status == ResumeStatus.FAILED:
        return AdminResumeStatus.FAILED
    else:
        return AdminResumeStatus.PROCESSING


@router.get("/resumes", response_model=AdminResumeListResponse)
async def list_resumes(
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user),
    search: Optional[str] = Query(None, description="Search by filename or email"),
    status: Optional[AdminResumeStatus] = Query(None, description="Filter by status"),
    sort: str = Query("newest", description="Sort order: newest, oldest"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
):
    logger.info(f"Admin {admin_user.id} listing resumes")

    query = db.query(Resume)

    if status:
        if status == AdminResumeStatus.OPTIMIZED:
            query = query.filter(Resume.status == ResumeStatus.OPTIMIZED)
        elif status == AdminResumeStatus.ANALYZED:
            query = query.filter(
                Resume.status.in_([ResumeStatus.ANALYZED, ResumeStatus.QUESTIONS_GENERATED])
            )
        elif status == AdminResumeStatus.FAILED:
            query = query.filter(Resume.status == ResumeStatus.FAILED)
        elif status == AdminResumeStatus.PROCESSING:
            query = query.filter(
                Resume.status.in_([
                    ResumeStatus.UPLOADED,
                    ResumeStatus.EXTRACTING,
                    ResumeStatus.EXTRACTED,
                    ResumeStatus.ANALYZING,
                    ResumeStatus.OPTIMIZING
                ])
            )

    total = query.count()

    updated_or_created = func.coalesce(Resume.updated_at, Resume.created_at)
    query = query.order_by(
        asc(updated_or_created) if sort == "oldest" else desc(updated_or_created)
    )

    resumes = query.offset((page - 1) * limit).limit(limit).all()

    user_ids = [r.user_id for r in resumes]
    resume_stats = db.query(
        Resume.user_id,
        func.max(Resume.created_at).label("last_active")
    ).filter(Resume.user_id.in_(user_ids)).group_by(Resume.user_id).all()

    resume_stats_dict = {u: t for u, t in resume_stats}

    supabase_service = SupabaseService()
    resume_items = []

    for resume in resumes:
        user_info = await supabase_service.get_user_by_id(resume.user_id)

        if search:
            search_lower = search.lower()
            if not user_info or (
                search_lower not in re_
