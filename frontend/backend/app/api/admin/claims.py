"""
Admin Claims Management Endpoints
Manage support claims/tickets from admin panel
"""
import logging
import math
from typing import Optional
from io import BytesIO
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from openpyxl import Workbook

from app.db.database import get_db
from app.api.admin.middleware import get_admin_user
from app.auth.middleware import AuthUser
from app.models.claim import Claim, ClaimStatus as DBClaimStatus
from app.schemas.admin import (
    ClaimResponse,
    ClaimListResponse,
    ClaimStatsResponse,
    ClaimStatusUpdate,
    ClaimStatus
)
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)
router = APIRouter()


def map_claim_status(status: DBClaimStatus) -> ClaimStatus:
    """Map database claim status to schema status"""
    mapping = {
        DBClaimStatus.OPEN: ClaimStatus.OPEN,
        DBClaimStatus.IN_REVIEW: ClaimStatus.IN_REVIEW,
        DBClaimStatus.RESOLVED: ClaimStatus.RESOLVED
    }
    return mapping.get(status, ClaimStatus.OPEN)


def map_to_db_status(status: ClaimStatus) -> DBClaimStatus:
    """Map schema status to database claim status"""
    mapping = {
        ClaimStatus.OPEN: DBClaimStatus.OPEN,
        ClaimStatus.IN_REVIEW: DBClaimStatus.IN_REVIEW,
        ClaimStatus.RESOLVED: DBClaimStatus.RESOLVED
    }
    return mapping.get(status, DBClaimStatus.OPEN)


@router.get("/claims/stats", response_model=ClaimStatsResponse)
async def get_claims_stats(
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user)
):
    """
    Get claims statistics for admin dashboard

    Returns:
        ClaimStatsResponse: Open, in review, and resolved counts
    """
    logger.info(f"Admin {admin_user.id} fetching claims stats")

    open_claims = db.query(func.count(Claim.id)).filter(
        Claim.status == DBClaimStatus.OPEN
    ).scalar() or 0

    in_review = db.query(func.count(Claim.id)).filter(
        Claim.status == DBClaimStatus.IN_REVIEW
    ).scalar() or 0

    resolved = db.query(func.count(Claim.id)).filter(
        Claim.status == DBClaimStatus.RESOLVED
    ).scalar() or 0

    total = open_claims + in_review + resolved

    return ClaimStatsResponse(
        open_claims=open_claims,
        in_review=in_review,
        resolved=resolved,
        total=total
    )


@router.get("/claims", response_model=ClaimListResponse)
async def list_claims(
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user),
    search: Optional[str] = Query(None, description="Search by claim ID, user, or subject"),
    status: Optional[ClaimStatus] = Query(None, description="Filter by status"),
    sort: str = Query("newest", description="Sort order: newest, oldest"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page")
):
    """
    List all claims with filtering, search, and pagination

    Returns:
        ClaimListResponse: Paginated list of claims
    """
    logger.info(f"Admin {admin_user.id} listing claims")

    # Build base query
    query = db.query(Claim)

    # Apply status filter
    if status:
        query = query.filter(Claim.status == map_to_db_status(status))

    # Apply search filter (on subject)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Claim.subject.ilike(search_pattern)) |
            (Claim.description.ilike(search_pattern))
        )

    # Get total count before pagination
    total = query.count()

    # Apply sorting
    if sort == "oldest":
        query = query.order_by(asc(Claim.created_at))
    else:  # newest
        query = query.order_by(desc(Claim.created_at))

    # Apply pagination
    offset = (page - 1) * limit
    claims = query.offset(offset).limit(limit).all()

    # Get user info for each claim
    supabase_service = SupabaseService()
    claim_items = []

    for claim in claims:
        user_info = await supabase_service.get_user_by_id(claim.user_id)

        claim_items.append(ClaimResponse(
            id=claim.id,
            claim_id=claim.claim_id_formatted,
            user_id=claim.user_id,
            user_name=user_info.get('full_name') if user_info else None,
            user_email=user_info.get('email') if user_info else None,
            subject=claim.subject,
            description=claim.description,
            status=map_claim_status(claim.status),
            created_at=claim.created_at,
            updated_at=claim.updated_at,
            resolved_at=claim.resolved_at,
            resolved_by=claim.resolved_by
        ))

    total_pages = math.ceil(total / limit) if total > 0 else 1

    return ClaimListResponse(
        claims=claim_items,
        total=total,
        page=page,
        page_size=limit,
        total_pages=total_pages
    )


@router.get("/claims/export")
async def export_claims(
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user),
    status: Optional[ClaimStatus] = Query(None, description="Filter by status")
):
    """
    Export claims to Excel file

    Returns:
        Excel file download
    """
    logger.info(f"Admin {admin_user.id} exporting claims")

    # Build query
    query = db.query(Claim)

    if status:
        query = query.filter(Claim.status == map_to_db_status(status))

    claims = query.order_by(desc(Claim.created_at)).all()

    # Get user info
    supabase_service = SupabaseService()

    # Create Excel workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Claims"

    # Add headers
    headers = [
        "Claim ID", "User Name", "User Email", "Subject",
        "Description", "Status", "Created At", "Resolved At"
    ]
    ws.append(headers)

    # Add data rows
    for claim in claims:
        user_info = await supabase_service.get_user_by_id(claim.user_id)
        ws.append([
            claim.claim_id_formatted,
            user_info.get('full_name') if user_info else "N/A",
            user_info.get('email') if user_info else "N/A",
            claim.subject,
            claim.description[:100] + "..." if len(claim.description) > 100 else claim.description,
            claim.status.value,
            claim.created_at.strftime("%Y-%m-%d %H:%M") if claim.created_at else "N/A",
            claim.resolved_at.strftime("%Y-%m-%d %H:%M") if claim.resolved_at else "N/A"
        ])

    # Save to BytesIO
    output = BytesIO()
    wb.save(output)
    output.seek(0)

    # Return as downloadable file
    filename = f"claims_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/claims/{claim_id}", response_model=ClaimResponse)
async def get_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user)
):
    """
    Get detailed information about a specific claim

    Args:
        claim_id: The claim ID

    Returns:
        ClaimResponse: Claim details
    """
    logger.info(f"Admin {admin_user.id} fetching claim {claim_id}")

    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Get user details
    supabase_service = SupabaseService()
    user_info = await supabase_service.get_user_by_id(claim.user_id)

    return ClaimResponse(
        id=claim.id,
        claim_id=claim.claim_id_formatted,
        user_id=claim.user_id,
        user_name=user_info.get('full_name') if user_info else None,
        user_email=user_info.get('email') if user_info else None,
        subject=claim.subject,
        description=claim.description,
        status=map_claim_status(claim.status),
        created_at=claim.created_at,
        updated_at=claim.updated_at,
        resolved_at=claim.resolved_at,
        resolved_by=claim.resolved_by
    )


@router.patch("/claims/{claim_id}/status", response_model=ClaimResponse)
async def update_claim_status(
    claim_id: int,
    status_update: ClaimStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user)
):
    """
    Update a claim's status

    Args:
        claim_id: The claim ID
        status_update: New status

    Returns:
        ClaimResponse: Updated claim details
    """
    logger.info(f"Admin {admin_user.id} updating claim {claim_id} status to {status_update.status}")

    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Update status
    claim.status = map_to_db_status(status_update.status)

    # If resolved, track resolution info
    if status_update.status == ClaimStatus.RESOLVED:
        claim.resolved_at = datetime.utcnow()
        claim.resolved_by = admin_user.id

    db.commit()
    db.refresh(claim)

    return await get_claim(claim_id, db, admin_user)


@router.delete("/claims/{claim_id}")
async def delete_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user)
):
    """
    Delete a claim

    Args:
        claim_id: The claim ID

    Returns:
        Confirmation message
    """
    logger.info(f"Admin {admin_user.id} deleting claim {claim_id}")

    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    db.delete(claim)
    db.commit()

    return {"message": f"Claim {claim_id} deleted successfully"}
