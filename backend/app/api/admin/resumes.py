"""
Admin Resume Management Endpoints
Manage resumes from admin panel
"""
import logging
import math
import os
import asyncio
from typing import Optional, Dict, Any
from io import BytesIO
from datetime import datetime, timedelta, timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.colors import HexColor

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
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
from app.services.s3_service import get_presigned_url, get_file_content_from_s3
from app.config import settings
from pathlib import Path

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
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Alias for limit parameter"),
):
    logger.info(f"Admin {admin_user.id} listing resumes")

    # Use page_size if provided, otherwise use limit
    actual_limit = page_size if page_size is not None else limit
    logger.info(f"Request parameters: page={page}, limit={limit}, page_size={page_size}, actual_limit={actual_limit}")

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

    resumes = query.offset((page - 1) * actual_limit).limit(actual_limit).all()

    user_ids = [r.user_id for r in resumes]
    resume_stats = db.query(
        Resume.user_id,
        func.max(Resume.created_at).label("last_active")
    ).filter(Resume.user_id.in_(user_ids)).group_by(Resume.user_id).all()

    resume_stats_dict = {u: t for u, t in resume_stats}

    supabase_service = SupabaseService()
    resume_items = []

    # Collect all unique user IDs
    unique_user_ids = list(set([r.user_id for r in resumes]))
    logger.info(f"Fetching user data for {len(unique_user_ids)} unique users in parallel")

    # Fetch all user data in parallel using asyncio.gather
    user_data_tasks = [supabase_service.get_user_by_id(user_id) for user_id in unique_user_ids]
    user_data_results = await asyncio.gather(*user_data_tasks, return_exceptions=True)

    # Create a dictionary for fast lookup: user_id -> user_info
    user_data_dict: Dict[str, Optional[Dict[str, Any]]] = {}
    for user_id, user_info in zip(unique_user_ids, user_data_results):
        if isinstance(user_info, Exception):
            logger.warning(f"Error fetching user {user_id}: {user_info}")
            user_data_dict[user_id] = None
        else:
            user_data_dict[user_id] = user_info

    logger.info(f"Successfully fetched user data for {len([v for v in user_data_dict.values() if v is not None])} users")

    # Process resumes using the pre-fetched user data
    for resume in resumes:
        user_info = user_data_dict.get(resume.user_id)

        if search:
            search_lower = search.lower()
            resume_filename = (resume.original_filename or "").lower()
            user_email = (user_info.get("email", "") if user_info else "").lower()
            
            if search_lower not in resume_filename and search_lower not in user_email:
                continue

        # Determine user status
        user_status = None
        if user_info:
            # Check if user is banned
            banned_until = user_info.get('banned_until')
            if banned_until:
                user_status = UserStatus.INACTIVE
            else:
                # Check last active time from resume stats
                last_active = resume_stats_dict.get(resume.user_id)
                if last_active:
                    # Check if last active is within threshold (24 hours)
                    threshold = timedelta(hours=settings.USER_INACTIVE_THRESHOLD_HOURS)
                    now = datetime.now(timezone.utc)
                    if isinstance(last_active, datetime):
                        # Ensure both datetimes are timezone-aware
                        if last_active.tzinfo is None:
                            last_active = last_active.replace(tzinfo=timezone.utc)
                        time_diff = now - last_active
                        user_status = UserStatus.ACTIVE if time_diff <= threshold else UserStatus.INACTIVE
                    else:
                        # If last_active is not a datetime, default to INACTIVE
                        user_status = UserStatus.INACTIVE
                else:
                    # No activity, check last_sign_in_at
                    last_sign_in = user_info.get('last_sign_in_at')
                    if last_sign_in:
                        try:
                            if isinstance(last_sign_in, str):
                                last_sign_in_dt = datetime.fromisoformat(last_sign_in.replace('Z', '+00:00') if 'Z' in last_sign_in else last_sign_in)
                            else:
                                last_sign_in_dt = last_sign_in
                            threshold = timedelta(hours=settings.USER_INACTIVE_THRESHOLD_HOURS)
                            now = datetime.now(timezone.utc)
                            # Ensure both datetimes are timezone-aware
                            if isinstance(last_sign_in_dt, datetime):
                                if last_sign_in_dt.tzinfo is None:
                                    last_sign_in_dt = last_sign_in_dt.replace(tzinfo=timezone.utc)
                                time_diff = now - last_sign_in_dt
                                user_status = UserStatus.ACTIVE if time_diff <= threshold else UserStatus.INACTIVE
                            else:
                                user_status = UserStatus.INACTIVE
                        except:
                            user_status = UserStatus.INACTIVE
                    else:
                        user_status = UserStatus.INACTIVE

        # Build resume item
        resume_item = AdminResumeListItem(
            id=resume.id,
            request_number=f"#{resume.id}",
            user_name=user_info.get("full_name") if user_info else None,
            user_email=user_info.get("email") if user_info else None,
            original_filename=resume.original_filename or "Unknown",
            status=map_resume_status(resume.status),
            user_status=user_status,
            created_at=resume.created_at,
            file_size=getattr(resume, 'file_size', None)
        )
        resume_items.append(resume_item)

    # Calculate total pages
    total_pages = math.ceil(total / actual_limit) if actual_limit > 0 else 1

    # Log the response for debugging
    logger.info(f"Returning {len(resume_items)} resume items out of {total} total resumes (page {page}, actual_limit {actual_limit})")

    # Return response
    return AdminResumeListResponse(
        resumes=resume_items,
        total=total,
        page=page,
        page_size=actual_limit,
        total_pages=total_pages
    )


@router.get("/resumes/{resume_id}", response_model=AdminResumeDetail)
async def get_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user),
):
    """
    Get detailed information about a specific resume

    Args:
        resume_id: The resume ID

    Returns:
        AdminResumeDetail: Resume details
    """
    logger.info(f"Admin {admin_user.id} fetching resume {resume_id}")

    # Fetch resume with relationships
    resume = db.query(Resume).options(
        joinedload(Resume.optimized_resume),
        joinedload(Resume.analysis)
    ).filter(Resume.id == resume_id).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Get user information from Supabase
    supabase_service = SupabaseService()
    user_info = await supabase_service.get_user_by_id(resume.user_id)

    # Determine user status
    user_status = None
    if user_info:
        # Check if user is banned
        banned_until = user_info.get('banned_until')
        if banned_until:
            user_status = UserStatus.INACTIVE
        else:
            # Check last active time from resume stats
            resume_stats = db.query(
                func.max(Resume.created_at).label("last_active")
            ).filter(Resume.user_id == resume.user_id).scalar()
            
            if resume_stats:
                threshold = timedelta(hours=settings.USER_INACTIVE_THRESHOLD_HOURS)
                now = datetime.now(timezone.utc)
                if isinstance(resume_stats, datetime):
                    if resume_stats.tzinfo is None:
                        resume_stats = resume_stats.replace(tzinfo=timezone.utc)
                    time_diff = now - resume_stats
                    user_status = UserStatus.ACTIVE if time_diff <= threshold else UserStatus.INACTIVE
                else:
                    # If resume_stats is not a datetime, default to INACTIVE
                    user_status = UserStatus.INACTIVE
            else:
                # No activity, check last_sign_in_at
                last_sign_in = user_info.get('last_sign_in_at')
                if last_sign_in:
                    try:
                        if isinstance(last_sign_in, str):
                            last_sign_in_dt = datetime.fromisoformat(last_sign_in.replace('Z', '+00:00') if 'Z' in last_sign_in else last_sign_in)
                        else:
                            last_sign_in_dt = last_sign_in
                        threshold = timedelta(hours=settings.USER_INACTIVE_THRESHOLD_HOURS)
                        now = datetime.now(timezone.utc)
                        if isinstance(last_sign_in_dt, datetime):
                            if last_sign_in_dt.tzinfo is None:
                                last_sign_in_dt = last_sign_in_dt.replace(tzinfo=timezone.utc)
                            time_diff = now - last_sign_in_dt
                            user_status = UserStatus.ACTIVE if time_diff <= threshold else UserStatus.INACTIVE
                        else:
                            user_status = UserStatus.INACTIVE
                    except:
                        user_status = UserStatus.INACTIVE
                else:
                    user_status = UserStatus.INACTIVE

    # Build AI optimization info if optimized_resume exists
    ai_optimization = None
    if resume.optimized_resume:
        opt = resume.optimized_resume
        opt_json = opt.optimized_json or {}
        changes_summary = opt.changes_summary or {}
        
        # Extract optimization metrics from optimized_json or changes_summary
        optimization_score = None
        ats_score = None
        readability_score = None
        improvements = []

        # Try to get scores from optimized_json
        if isinstance(opt_json, dict):
            optimization_score = opt_json.get('optimization_score') or opt_json.get('score')
            ats_score = opt_json.get('ats_score') or opt_json.get('ats_compatibility_score')
            readability_score = opt_json.get('readability_score') or opt_json.get('readability')
            
            # Get improvements list
            if 'improvements' in opt_json:
                improvements = opt_json['improvements'] if isinstance(opt_json['improvements'], list) else []
            elif 'enhancements' in opt_json:
                improvements = opt_json['enhancements'] if isinstance(opt_json['enhancements'], list) else []
            elif 'changes' in opt_json:
                changes = opt_json['changes']
                if isinstance(changes, list):
                    improvements = [str(c) for c in changes]
                elif isinstance(changes, dict):
                    improvements = [f"{k}: {v}" for k, v in changes.items()]

        # Fallback to changes_summary if available
        if not optimization_score and isinstance(changes_summary, dict):
            # Calculate a score based on changes
            total_changes = changes_summary.get('total_changes', 0)
            if total_changes > 0:
                # Simple scoring: more changes = higher score (capped at 100)
                optimization_score = min(100, 50 + (total_changes * 2))
            
            # Get sections enhanced as improvements
            sections_enhanced = changes_summary.get('sections_enhanced', [])
            if sections_enhanced:
                improvements.extend([f"Enhanced {section} section" for section in sections_enhanced])

        # Determine status based on resume status
        opt_status = "optimized" if resume.status == ResumeStatus.OPTIMIZED else "processing"

        ai_optimization = AIOptimizationInfo(
            status=opt_status,
            optimization_score=optimization_score,
            readability_score=str(readability_score) if readability_score else None,
            ats_score=ats_score,
            improvements=improvements[:10] if improvements else []  # Limit to 10 improvements
        )

    # Build and return AdminResumeDetail
    return AdminResumeDetail(
        id=resume.id,
        request_number=f"#{resume.id}",
        user_id=resume.user_id,
        user_name=user_info.get("full_name") if user_info else None,
        user_email=user_info.get("email") if user_info else None,
        user_status=user_status,
        original_filename=resume.original_filename or "Unknown",
        file_type=resume.file_type or "unknown",
        file_size=resume.file_size,
        status=map_resume_status(resume.status),
        created_at=resume.created_at,
        updated_at=resume.updated_at,
        extracted_text=resume.extracted_text,
        ai_optimization=ai_optimization,
        error_message=resume.error_message
    )


@router.get("/resumes/{resume_id}/download/original")
async def download_original_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user),
):
    """
    Download original resume file

    Args:
        resume_id: The resume ID
        db: Database session
        admin_user: Authenticated admin user

    Returns:
        FileResponse or RedirectResponse with original resume file
    """
    logger.info(f"Admin {admin_user.id} downloading original resume {resume_id}")

    # Fetch resume
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Generate download filename
    original_filename = resume.original_filename or f"resume_{resume_id}.{resume.file_type}"
    download_filename = f"resume_{resume_id}_original.{resume.file_type}"

    # If S3 key exists, generate presigned URL or return file content
    if resume.s3_key:
        try:
            # Try to get presigned URL first (for direct download)
            presigned_url = get_presigned_url(
                resume.s3_key,
                expiration=3600,
                filename=download_filename,
                force_download=True
            )
            if presigned_url:
                logger.info(f"Returning S3 presigned URL for original resume {resume_id}")
                # Return JSON with presigned URL so frontend can handle it
                return JSONResponse(content={"download_url": presigned_url})
            
            # Fallback: get file content from S3 and stream it
            file_content = get_file_content_from_s3(resume.s3_key)
            if file_content:
                logger.info(f"Streaming original resume {resume_id} from S3")
                return StreamingResponse(
                    BytesIO(file_content),
                    media_type=f"application/{resume.file_type}",
                    headers={
                        "Content-Disposition": f'attachment; filename="{download_filename}"'
                    }
                )
        except Exception as e:
            logger.warning(f"Failed to get file from S3, falling back to local: {e}")

    # Fallback to local file
    if resume.file_path:
        file_path = Path(resume.file_path)
        if file_path.exists():
            logger.info(f"Returning local file for original resume {resume_id}")
            return FileResponse(
                path=str(file_path),
                filename=download_filename,
                media_type=f"application/{resume.file_type}"
            )

    raise HTTPException(status_code=404, detail="Original resume file not found")


def generate_pdf_from_text(text: str) -> BytesIO:
    """
    Generate PDF from text content using reportlab
    
    Args:
        text: Text content to convert to PDF
        
    Returns:
        BytesIO: PDF file as bytes
    """
    buffer = BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15*mm,
        leftMargin=15*mm,
        topMargin=15*mm,
        bottomMargin=15*mm
    )
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Create custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=HexColor('#2563eb'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=HexColor('#2563eb'),
        spaceAfter=6,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        spaceAfter=6,
        alignment=TA_LEFT
    )
    
    # Build story (content)
    story = []
    
    # Split text into lines and process
    lines = text.split('\n')
    current_section = []
    
    for line in lines:
        line = line.strip()
        if not line:
            if current_section:
                # Add accumulated content
                story.append(Paragraph(' '.join(current_section), normal_style))
                story.append(Spacer(1, 6))
                current_section = []
            continue
        
        # Check if line is a heading (starts with ** or is all caps)
        if line.startswith('**') and line.endswith('**'):
            # Markdown bold heading found
            if current_section:
                story.append(Paragraph(' '.join(current_section), normal_style))
                story.append(Spacer(1, 6))
                current_section = []
            heading_text = line.strip('*').strip()
            story.append(Paragraph(heading_text, heading_style))
        elif line.isupper() and len(line) > 3:
            # All caps heading (like "PROFESSIONAL SUMMARY" or "PROFESSIONAL EXPERIENCE")
            # Check if it's likely a section header (not just random all caps text)
            # Section headers are typically 2-5 words, all caps, and match common patterns
            words = line.split()
            is_likely_header = (
                len(words) >= 1 and len(words) <= 5 and
                all(len(word) > 2 for word in words) and
                not any(char.isdigit() for char in line) and  # Not a date or number
                not '@' in line and  # Not an email
                not any(char in line for char in ['|', ':', '•', '-'])  # Not a formatted line
            )
            if is_likely_header:
                if current_section:
                    story.append(Paragraph(' '.join(current_section), normal_style))
                    story.append(Spacer(1, 6))
                    current_section = []
                story.append(Paragraph(line, heading_style))
            else:
                # Regular all caps text, add to current section
                current_section.append(line)
        elif line.startswith('* ') or line.startswith('- '):
            # Bullet point
            if current_section:
                story.append(Paragraph(' '.join(current_section), normal_style))
                current_section = []
            bullet_text = line[2:].strip()
            story.append(Paragraph(f"• {bullet_text}", normal_style))
        elif '|' in line and len(line.split('|')) >= 2:
            # Formatted line with pipes (e.g., "Title | Company | Location" or "Degree | Institution | Period")
            # This is typically experience or education entry
            if current_section:
                story.append(Paragraph(' '.join(current_section), normal_style))
                story.append(Spacer(1, 3))
                current_section = []
            # Format as bold for the first part, normal for the rest
            parts = [p.strip() for p in line.split('|')]
            if len(parts) >= 2:
                # First part (title/degree) in bold, rest normal
                formatted_line = f"<b>{parts[0]}</b>"
                if len(parts) > 1:
                    formatted_line += f" | {' | '.join(parts[1:])}"
                story.append(Paragraph(formatted_line, normal_style))
            else:
                story.append(Paragraph(line, normal_style))
            story.append(Spacer(1, 3))
        else:
            # Regular text
            current_section.append(line)
    
    # Add remaining content
    if current_section:
        story.append(Paragraph(' '.join(current_section), normal_style))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer


@router.get("/resumes/{resume_id}/download/optimized")
async def download_optimized_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user),
):
    """
    Download optimized resume file as PDF
    
    Always generates PDF on-demand from optimized_text or optimized_json,
    ignoring stored .txt files.

    Args:
        resume_id: The resume ID
        db: Database session
        admin_user: Authenticated admin user

    Returns:
        StreamingResponse with optimized resume file as PDF
    """
    logger.info(f"Admin {admin_user.id} downloading optimized resume {resume_id} as PDF")

    # Fetch resume with optimized_resume relationship
    resume = db.query(Resume).options(
        joinedload(Resume.optimized_resume)
    ).filter(Resume.id == resume_id).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if not resume.optimized_resume:
        raise HTTPException(status_code=404, detail="Optimized resume not found")

    opt = resume.optimized_resume

    # Generate download filename (always PDF)
    if resume.original_filename:
        base_name = os.path.splitext(resume.original_filename)[0]
    else:
        base_name = f'resume_{resume_id}'
    
    download_filename = f"optimized_{base_name}.pdf"

    # Always generate PDF on-demand from optimized_text or optimized_json
    # Ignore stored .txt files to ensure we always return PDF
    try:
        text_content = None
        
        # Prefer optimized_text as it contains the complete, full-formatted resume
        # optimized_json might be incomplete or missing sections
        if opt.optimized_text:
            text_content = opt.optimized_text
            logger.info(f"Using optimized_text for PDF generation (length: {len(text_content)} chars)")
        
        # Fallback to structured data if optimized_text is not available
        if not text_content and opt.optimized_json and isinstance(opt.optimized_json, dict):
            structured_data = opt.optimized_json.get("structured_data")
            if structured_data:
                # Convert structured data to text format
                text_content = format_structured_data_as_text(structured_data)
                logger.info(f"Using optimized_json structured_data for PDF generation")
        
        if not text_content:
            raise HTTPException(status_code=404, detail="Optimized resume content not found")
        
        # Log content length for debugging
        logger.info(f"Generating PDF on-demand for resume {resume_id} (content length: {len(text_content)} chars, lines: {text_content.count(chr(10)) + 1})")
        
        # Generate PDF from text
        pdf_buffer = generate_pdf_from_text(text_content)
        
        return StreamingResponse(
            BytesIO(pdf_buffer.read()),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{download_filename}"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate PDF for resume {resume_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")


def format_structured_data_as_text(structured_data: Dict[str, Any]) -> str:
    """
    Convert structured data to plain text format for PDF generation
    
    Args:
        structured_data: Structured resume data from optimized_json
        
    Returns:
        str: Formatted text content
    """
    lines = []
    
    # Name
    if structured_data.get("name"):
        lines.append(f"**{structured_data['name'].upper()}**")
        lines.append("")
    
    # Contact info
    contact_parts = []
    if structured_data.get("email"):
        contact_parts.append(structured_data["email"])
    if structured_data.get("phone"):
        contact_parts.append(structured_data["phone"])
    if structured_data.get("location"):
        contact_parts.append(structured_data["location"])
    if structured_data.get("linkedin"):
        contact_parts.append(structured_data["linkedin"])
    if contact_parts:
        lines.append(" | ".join(contact_parts))
        lines.append("")
    
    # Professional Summary
    if structured_data.get("summary"):
        lines.append("**PROFESSIONAL SUMMARY**")
        lines.append(structured_data["summary"])
        lines.append("")
    
    # Experience
    if structured_data.get("experience"):
        lines.append("**PROFESSIONAL EXPERIENCE**")
        for exp in structured_data["experience"]:
            title = exp.get("title", "")
            company = exp.get("company", "")
            period = exp.get("period", "")
            location = exp.get("location", "")
            
            # Build header with title, company, location, and period
            header_parts = []
            if title:
                header_parts.append(title)
            if company:
                header_parts.append(company)
            if location:
                header_parts.append(location)
            if period:
                header_parts.append(period)
            
            if header_parts:
                lines.append(" | ".join(header_parts))
            
            # Handle bullets (preferred) or description/responsibilities (fallback)
            if exp.get("bullets"):
                for bullet in exp["bullets"]:
                    lines.append(f"* {bullet}")
            elif exp.get("description"):
                lines.append(exp["description"])
            elif exp.get("responsibilities"):
                for resp in exp["responsibilities"]:
                    lines.append(f"* {resp}")
            lines.append("")
    
    # Education
    if structured_data.get("education"):
        lines.append("**EDUCATION**")
        for edu in structured_data["education"]:
            degree = edu.get("degree", "")
            institution = edu.get("institution", "")
            period = edu.get("period", "")
            if degree and institution:
                header = f"{degree} | {institution}"
                if period:
                    header += f" | {period}"
                lines.append(header)
            if edu.get("gpa"):
                lines.append(f"GPA: {edu['gpa']}")
            lines.append("")
    
    # Skills
    if structured_data.get("skills"):
        lines.append("**TECHNICAL SKILLS**")
        if isinstance(structured_data["skills"], list):
            lines.append(", ".join(structured_data["skills"]))
        elif isinstance(structured_data["skills"], dict):
            # Handle skills as dictionary (e.g., {"Frontend": ["React", "Vue"], "Backend": ["Node", "Python"]})
            skill_lines = []
            for category, skill_list in structured_data["skills"].items():
                if isinstance(skill_list, list):
                    skill_lines.append(f"{category}: {', '.join(skill_list)}")
                else:
                    skill_lines.append(f"{category}: {skill_list}")
            lines.append(" | ".join(skill_lines))
        else:
            lines.append(str(structured_data["skills"]))
        lines.append("")
    
    # Certifications
    if structured_data.get("certifications"):
        lines.append("**CERTIFICATIONS**")
        for cert in structured_data["certifications"]:
            if isinstance(cert, dict):
                cert_name = cert.get("name", cert.get("certification", ""))
                issuer = cert.get("issuer", cert.get("organization", ""))
                date = cert.get("date", cert.get("issued_date", ""))
                if cert_name:
                    cert_line = cert_name
                    if issuer:
                        cert_line += f" | {issuer}"
                    if date:
                        cert_line += f" | {date}"
                    lines.append(cert_line)
            elif isinstance(cert, str):
                lines.append(cert)
        lines.append("")
    
    # Projects
    if structured_data.get("projects"):
        lines.append("**PROJECTS**")
        for project in structured_data["projects"]:
            if isinstance(project, dict):
                project_name = project.get("name", project.get("title", ""))
                description = project.get("description", "")
                technologies = project.get("technologies", project.get("tech_stack", []))
                if project_name:
                    lines.append(project_name)
                if description:
                    lines.append(description)
                if technologies:
                    if isinstance(technologies, list):
                        lines.append(f"Technologies: {', '.join(technologies)}")
                    else:
                        lines.append(f"Technologies: {technologies}")
            elif isinstance(project, str):
                lines.append(project)
            lines.append("")
    
    # Awards
    if structured_data.get("awards"):
        lines.append("**AWARDS**")
        for award in structured_data["awards"]:
            if isinstance(award, dict):
                award_name = award.get("name", award.get("title", ""))
                issuer = award.get("issuer", award.get("organization", ""))
                date = award.get("date", "")
                if award_name:
                    award_line = award_name
                    if issuer:
                        award_line += f" | {issuer}"
                    if date:
                        award_line += f" | {date}"
                    lines.append(award_line)
            elif isinstance(award, str):
                lines.append(award)
        lines.append("")
    
    # Languages
    if structured_data.get("languages"):
        lines.append("**LANGUAGES**")
        if isinstance(structured_data["languages"], list):
            lang_list = []
            for lang in structured_data["languages"]:
                if isinstance(lang, dict):
                    lang_name = lang.get("language", lang.get("name", ""))
                    proficiency = lang.get("proficiency", lang.get("level", ""))
                    if lang_name:
                        lang_entry = lang_name
                        if proficiency:
                            lang_entry += f" ({proficiency})"
                        lang_list.append(lang_entry)
                elif isinstance(lang, str):
                    lang_list.append(lang)
            lines.append(", ".join(lang_list))
        else:
            lines.append(str(structured_data["languages"]))
        lines.append("")
    
    # Publications
    if structured_data.get("publications"):
        lines.append("**PUBLICATIONS**")
        for pub in structured_data["publications"]:
            if isinstance(pub, dict):
                title = pub.get("title", "")
                authors = pub.get("authors", "")
                journal = pub.get("journal", pub.get("publication", ""))
                date = pub.get("date", pub.get("year", ""))
                if title:
                    lines.append(title)
                if authors:
                    lines.append(f"Authors: {authors}")
                if journal:
                    lines.append(f"Published in: {journal}")
                if date:
                    lines.append(f"Date: {date}")
            elif isinstance(pub, str):
                lines.append(pub)
            lines.append("")
    
    # Additional sections (handle any other keys that might exist)
    known_keys = {"name", "email", "phone", "location", "linkedin", "summary", 
                  "experience", "education", "skills", "certifications", 
                  "projects", "awards", "languages", "publications"}
    
    for key, value in structured_data.items():
        if key not in known_keys and value:
            # Convert key to readable format (e.g., "volunteer_work" -> "VOLUNTEER WORK")
            section_title = key.replace("_", " ").upper()
            lines.append(f"**{section_title}**")
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        # Try to format as key-value pairs
                        item_str = " | ".join([f"{k}: {v}" for k, v in item.items() if v])
                        lines.append(item_str)
                    else:
                        lines.append(str(item))
            elif isinstance(value, dict):
                # Format as key-value pairs
                for k, v in value.items():
                    lines.append(f"{k}: {v}")
            else:
                lines.append(str(value))
            lines.append("")
    
    return "\n".join(lines)
