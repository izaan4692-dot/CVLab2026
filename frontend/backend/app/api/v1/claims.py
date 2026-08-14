"""
User Claims Endpoints
Allow users to submit support claims/tickets
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
import math

from app.db.database import get_db
from app.auth.middleware import get_current_user, AuthUser
from app.models.claim import Claim, ClaimStatus
from app.schemas.admin import ClaimCreate, ClaimResponse, ClaimStatus as SchemaClaimStatus

logger = logging.getLogger(__name__)
router = APIRouter()


def map_claim_status(status: ClaimStatus) -> SchemaClaimStatus:
    """Map database claim status to schema status"""
    mapping = {
        ClaimStatus.OPEN: SchemaClaimStatus.OPEN,
        ClaimStatus.IN_REVIEW: SchemaClaimStatus.IN_REVIEW,
        ClaimStatus.RESOLVED: SchemaClaimStatus.RESOLVED
    }
    return mapping.get(status, SchemaClaimStatus.OPEN)


@router.post("/claims", response_model=ClaimResponse)
async def create_claim(
    claim_data: ClaimCreate,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Create a new support claim/ticket

    Args:
        claim_data: Claim subject and description

    Returns:
        ClaimResponse: Created claim details
    """
    logger.info(f"User {current_user.id} creating new claim: {claim_data.subject}")

    # Create claim
    claim = Claim(
        user_id=current_user.id,
        subject=claim_data.subject,
        description=claim_data.description,
        status=ClaimStatus.OPEN
    )

    db.add(claim)
    db.commit()
    db.refresh(claim)

    logger.info(f"Claim {claim.id} created successfully")

    return ClaimResponse(
        id=claim.id,
        claim_id=claim.claim_id_formatted,
        user_id=claim.user_id,
        user_name=current_user.full_name,
        user_email=current_user.email,
        subject=claim.subject,
        description=claim.description,
        status=map_claim_status(claim.status),
        created_at=claim.created_at,
        updated_at=claim.updated_at,
        resolved_at=claim.resolved_at,
        resolved_by=claim.resolved_by
    )


@router.get("/claims", response_model=dict)
async def list_user_claims(
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=50, description="Items per page")
):
    """
    List current user's claims

    Returns:
        List of user's claims with pagination
    """
    logger.info(f"User {current_user.id} listing their claims")

    # Query user's claims
    query = db.query(Claim).filter(Claim.user_id == current_user.id)

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * limit
    claims = query.order_by(desc(Claim.created_at)).offset(offset).limit(limit).all()

    claim_responses = []
    for claim in claims:
        claim_responses.append(ClaimResponse(
            id=claim.id,
            claim_id=claim.claim_id_formatted,
            user_id=claim.user_id,
            user_name=current_user.full_name,
            user_email=current_user.email,
            subject=claim.subject,
            description=claim.description,
            status=map_claim_status(claim.status),
            created_at=claim.created_at,
            updated_at=claim.updated_at,
            resolved_at=claim.resolved_at,
            resolved_by=claim.resolved_by
        ))

    total_pages = math.ceil(total / limit) if total > 0 else 1

    return {
        "claims": claim_responses,
        "total": total,
        "page": page,
        "page_size": limit,
        "total_pages": total_pages
    }


@router.get("/claims/{claim_id}", response_model=ClaimResponse)
async def get_user_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Get a specific claim (user can only view their own claims)

    Args:
        claim_id: The claim ID

    Returns:
        ClaimResponse: Claim details
    """
    logger.info(f"User {current_user.id} fetching claim {claim_id}")

    claim = db.query(Claim).filter(
        Claim.id == claim_id,
        Claim.user_id == current_user.id
    ).first()

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    return ClaimResponse(
        id=claim.id,
        claim_id=claim.claim_id_formatted,
        user_id=claim.user_id,
        user_name=current_user.full_name,
        user_email=current_user.email,
        subject=claim.subject,
        description=claim.description,
        status=map_claim_status(claim.status),
        created_at=claim.created_at,
        updated_at=claim.updated_at,
        resolved_at=claim.resolved_at,
        resolved_by=claim.resolved_by
    )
