"""
Admin User Management Endpoints
Manage users from admin panel
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, desc, asc
from datetime import datetime, timedelta
import math

from app.db.database import get_db
from app.api.admin.middleware import get_admin_user
from app.auth.middleware import AuthUser
from app.models.resume import Resume
from app.schemas.admin import (
    AdminUserResponse,
    UserListResponse,
    UserStatusUpdate,
    UserStatus,
    UserRole
)
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)
router = APIRouter()


def map_supabase_role(role: str) -> UserRole:
    """Map Supabase role to our UserRole enum"""
    role_mapping = {
        "admin": UserRole.ADMIN,
        "service_role": UserRole.ADMIN,
        "super_admin": UserRole.ADMIN,
        "authenticated": UserRole.AUTHENTICATED,
        "user": UserRole.USER,
    }
    return role_mapping.get(role, UserRole.USER)


@router.get("/users", response_model=UserListResponse)
async def list_users(
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user),
    search: Optional[str] = Query(None, description="Search by name or email"),
    status: Optional[str] = Query(None, description="Filter by status: 'active' or 'inactive'"),
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    sort: str = Query("newest", description="Sort order: newest, oldest"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page")
):
    """
    List all users with filtering, search, and pagination
    Fetches ALL users from Supabase, not just those with resumes

    Returns:
        UserListResponse: Paginated list of users
    """
    # Convert status string to enum if provided
    status_enum = None
    if status:
        try:
            status_lower = status.lower().strip()
            status_enum = UserStatus(status_lower)  # Convert "active" -> UserStatus.ACTIVE
            logger.info(f"Status filter: '{status}' -> {status_enum} (value: {status_enum.value})")
        except ValueError as e:
            logger.warning(f"Invalid status value: '{status}' (error: {e})")
            status_enum = None
    
    # Log the received parameters
    logger.info(f"Admin {admin_user.id} listing users: status_str='{status}', status_enum={status_enum}, role={role}, page={page}, limit={limit}")

    # Get all users from Supabase (fetch in batches to get complete list)
    supabase_service = SupabaseService()
    all_supabase_users = []
    
    # Fetch all users from Supabase in batches
    # Supabase Admin API uses 1-based pagination with per_page parameter
    current_page = 1
    per_page = 50  # Supabase default per_page (can go up to 1000 but 50 is safer)
    max_pages = 100  # Safety limit to prevent infinite loops
    
    while current_page <= max_pages:
        batch = await supabase_service.list_users(page=current_page, per_page=per_page)
        batch_users = batch.get('users', [])
        
        if not batch_users:
            logger.info(f"No more users found at page {current_page}, stopping")
            break
            
        all_supabase_users.extend(batch_users)
        logger.info(f"Fetched page {current_page}: {len(batch_users)} users (total so far: {len(all_supabase_users)})")
        
        # If we got fewer users than per_page, we've reached the end
        if len(batch_users) < per_page:
            logger.info(f"Reached end of users (got {len(batch_users)} < {per_page})")
            break
            
        current_page += 1
    
    logger.info(f"Fetched {len(all_supabase_users)} total users from Supabase")
    
    if len(all_supabase_users) == 0:
        logger.warning("No users fetched from Supabase! Check Supabase credentials and API access.")
        return UserListResponse(
            users=[],
            total=0,
            page=page,
            page_size=limit,
            total_pages=0
        )

    # Get resume counts and last activity for all users in one query
    resume_stats = db.query(
        Resume.user_id,
        func.count(Resume.id).label('resumes_count'),
        func.max(Resume.created_at).label('last_active')
    ).group_by(Resume.user_id).all()
    
    # Create a dict for fast lookup
    resume_stats_dict = {
        user_id: {'count': count, 'last_active': last_active}
        for user_id, count, last_active in resume_stats
    }

    # Build user responses with resume data
    all_users = []
    skipped_count = 0
    skipped_reasons = {'no_id': 0, 'search_filter': 0, 'status_filter': 0, 'role_filter': 0, 'error': 0}
    
    for idx, supabase_user in enumerate(all_supabase_users):
        try:
            user_id = supabase_user.get('id')
            if not user_id:
                skipped_reasons['no_id'] += 1
                logger.warning(f"Skipping user {idx} with no ID: {supabase_user.get('email', 'no-email')}")
                continue
                
            stats = resume_stats_dict.get(user_id, {'count': 0, 'last_active': None})
            
            # Determine last_active: use resume activity or sign-in time
            last_active = stats['last_active']
            if not last_active and supabase_user.get('last_sign_in_at'):
                last_active = supabase_user.get('last_sign_in_at')
            if not last_active:
                last_active = supabase_user.get('created_at')

            # Parse dates if they're strings
            created_at = supabase_user.get('created_at')
            if created_at and isinstance(created_at, str):
                try:
                    from datetime import datetime
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00') if 'Z' in created_at else created_at)
                except:
                    pass  # Keep as string if parsing fails
            
            if last_active and isinstance(last_active, str):
                try:
                    from datetime import datetime
                    last_active = datetime.fromisoformat(last_active.replace('Z', '+00:00') if 'Z' in last_active else last_active)
                except:
                    pass  # Keep as string if parsing fails

            # Determine user status: check banned_until first, then check activity time
            # If user hasn't been active for 5 minutes, mark as inactive
            banned_until = supabase_user.get('banned_until')
            
            # Check if user is banned (highest priority)
            if banned_until:
                user_status = UserStatus.INACTIVE
            else:
                # Check if user has been active in the last 5 minutes
                is_active = False
                if last_active:
                    # Parse last_active if it's a string, or use it directly if it's already a datetime
                    last_active_dt = None
                    if isinstance(last_active, datetime):
                        last_active_dt = last_active
                    elif isinstance(last_active, str):
                        try:
                            last_active_dt = datetime.fromisoformat(last_active.replace('Z', '+00:00') if 'Z' in last_active else last_active)
                        except:
                            # If parsing fails, assume inactive
                            pass
                    
                    # Calculate time difference if we have a valid datetime
                    if last_active_dt:
                        # Get current time in same timezone or UTC
                        now = datetime.now(last_active_dt.tzinfo) if last_active_dt.tzinfo else datetime.utcnow()
                        # Calculate time difference
                        time_diff = now - last_active_dt
                        # If active within last 5 minutes, mark as active
                        is_active = time_diff <= timedelta(minutes=5)
                
                user_status = UserStatus.ACTIVE if is_active else UserStatus.INACTIVE

            # Map Supabase role to our UserRole enum
            supabase_role_raw = supabase_user.get('role', 'user')
            mapped_role = map_supabase_role(supabase_role_raw)
            
            user_response = AdminUserResponse(
                id=user_id,
                email=supabase_user.get('email'),
                full_name=supabase_user.get('full_name'),
                role=mapped_role,
                status=user_status,
                last_active=last_active,
                created_at=created_at,
                resumes_count=stats['count']
            )
            
            # Debug logging for first few users
            if idx < 3:
                logger.info(f"User {idx}: {user_response.email}, supabase_role='{supabase_role_raw}', mapped_role={mapped_role.value}, status={user_status.value}")

            # Apply search filter
            if search:
                search_lower = search.lower()
                email = user_response.email or ''
                full_name = user_response.full_name or ''
                if search_lower not in email.lower() and search_lower not in full_name.lower():
                    skipped_reasons['search_filter'] += 1
                    continue

            # Apply status filter using status_enum (converted from string parameter)
            # Direct enum comparison - same logic as resume filtering
            if status_enum is not None:
                # Directly compare enum values
                if user_response.status != status_enum:
                    # Status doesn't match filter - skip this user
                    skipped_reasons['status_filter'] += 1
                    logger.debug(f"Status filter: User {user_response.email} status={user_response.status.value} != filter={status_enum.value}, skipping")
                    continue
                # If we reach here, status matches - include this user
                logger.debug(f"Status filter: User {user_response.email} status={user_response.status.value} == filter={status_enum.value}, including")

            # Apply role filter
            # Direct enum comparison - same logic as resume filtering
            if role is not None:
                # Special handling: when filtering by "user", also include "authenticated" users
                # because Supabase default role is "authenticated" but they are regular users
                if role == UserRole.USER:
                    # Include both USER and AUTHENTICATED roles when filtering by USER
                    if user_response.role not in [UserRole.USER, UserRole.AUTHENTICATED]:
                        skipped_reasons['role_filter'] += 1
                        logger.debug(f"Role filter: User {user_response.email} role={user_response.role.value} not in [user, authenticated], skipping")
                        continue
                    logger.debug(f"Role filter: User {user_response.email} role={user_response.role.value} matches user filter, including")
                else:
                    # For other roles (admin), do exact enum match
                    if user_response.role != role:
                        skipped_reasons['role_filter'] += 1
                        logger.debug(f"Role filter: User {user_response.email} role={user_response.role.value} != filter={role.value}, skipping")
                        continue
                    logger.debug(f"Role filter: User {user_response.email} role={user_response.role.value} == filter={role.value}, including")

            all_users.append(user_response)
        except Exception as e:
            skipped_reasons['error'] += 1
            logger.error(f"Error processing user {idx} (ID: {supabase_user.get('id', 'unknown')}): {str(e)}")
            continue

    logger.info(f"Processed {len(all_supabase_users)} Supabase users -> {len(all_users)} after filtering. Skipped: {skipped_reasons}. Filter params: status={status}, status_enum={status_enum}, role={role}")
    if len(all_supabase_users) != len(all_users):
        logger.warning(f"⚠️ USER COUNT MISMATCH: Fetched {len(all_supabase_users)} from Supabase but only {len(all_users)} passed filtering!")
        logger.warning(f"   Skipped breakdown: {skipped_reasons}")

    # Apply sorting with proper date handling
    def get_sort_key(user: AdminUserResponse, use_last_active: bool = True):
        """Get sort key for user, handling None dates"""
        if use_last_active and user.last_active:
            try:
                # Try to parse as ISO format date
                from datetime import datetime
                dt = datetime.fromisoformat(user.last_active.replace('Z', '+00:00') if 'Z' in user.last_active else user.last_active)
                return dt.timestamp()
            except:
                return user.last_active or ''
        elif user.created_at:
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(user.created_at.replace('Z', '+00:00') if 'Z' in user.created_at else user.created_at)
                return dt.timestamp()
            except:
                return user.created_at or ''
        return 0  # Put users with no dates at the end
    
    if sort == "oldest":
        all_users.sort(key=lambda u: get_sort_key(u, use_last_active=False), reverse=False)
    else:  # newest
        # Sort by last_active (most recent activity first), then by created_at
        all_users.sort(key=lambda u: get_sort_key(u, use_last_active=True), reverse=True)

    # Get total count after filtering
    total = len(all_users)
    
    # Apply pagination
    offset = (page - 1) * limit
    paginated_users = all_users[offset:offset + limit]

    total_pages = math.ceil(total / limit) if total > 0 else 1

    logger.info(f"Returning {len(paginated_users)} users (page {page} of {total_pages}, total: {total})")

    return UserListResponse(
        users=paginated_users,
        total=total,
        page=page,
        page_size=limit,
        total_pages=total_pages
    )


@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user)
):
    """
    Get detailed information about a specific user

    Args:
        user_id: The user's ID

    Returns:
        AdminUserResponse: User details
    """
    logger.info(f"Admin {admin_user.id} fetching user {user_id}")

    # Get user activity from resumes
    user_activity = db.query(
        func.count(Resume.id).label('resumes_count'),
        func.max(Resume.created_at).label('last_active')
    ).filter(Resume.user_id == user_id).first()

    if not user_activity or user_activity[0] == 0:
        # Check Supabase even if no resumes
        supabase_service = SupabaseService()
        user_info = await supabase_service.get_user_by_id(user_id)
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")

        return AdminUserResponse(
            id=user_id,
            email=user_info.get('email'),
            full_name=user_info.get('full_name'),
            role=map_supabase_role(user_info.get('role', 'user')),
            status=UserStatus(user_info.get('status', 'active')),
            last_active=user_info.get('last_sign_in_at'),
            created_at=user_info.get('created_at'),
            resumes_count=0
        )

    # Get user details from Supabase
    supabase_service = SupabaseService()
    user_info = await supabase_service.get_user_by_id(user_id)

    return AdminUserResponse(
        id=user_id,
        email=user_info.get('email') if user_info else None,
        full_name=user_info.get('full_name') if user_info else None,
        role=map_supabase_role(user_info.get('role', 'user')) if user_info else UserRole.USER,
        status=UserStatus(user_info.get('status', 'active')) if user_info else UserStatus.ACTIVE,
        last_active=user_activity[1],
        created_at=user_info.get('created_at') if user_info else user_activity[1],
        resumes_count=user_activity[0]
    )


@router.patch("/users/{user_id}/status", response_model=AdminUserResponse)
async def update_user_status(
    user_id: str,
    status_update: UserStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user)
):
    """
    Update a user's status (active/inactive)

    Args:
        user_id: The user's ID
        status_update: New status

    Returns:
        AdminUserResponse: Updated user details
    """
    logger.info(f"Admin {admin_user.id} updating status for user {user_id} to {status_update.status}")

    # Update status in Supabase
    supabase_service = SupabaseService()
    success = await supabase_service.update_user_status(user_id, status_update.status.value)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to update user status")

    # Return updated user
    return await get_user(user_id, db, admin_user)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user)
):
    """
    Delete a user and all their data

    Args:
        user_id: The user's ID

    Returns:
        dict: Confirmation message
    """
    logger.info(f"Admin {admin_user.id} deleting user {user_id}")

    # Prevent deleting yourself
    if user_id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    # Delete user's resumes and related data from database
    resumes = db.query(Resume).filter(Resume.user_id == user_id).all()

    for resume in resumes:
        # Delete related records (cascading should handle this, but being explicit)
        if resume.analysis:
            db.delete(resume.analysis)
        if resume.questions:
            db.delete(resume.questions)
        if resume.answers:
            db.delete(resume.answers)
        if resume.optimized_resume:
            db.delete(resume.optimized_resume)
        db.delete(resume)

    db.commit()

    # Delete from Supabase
    supabase_service = SupabaseService()
    await supabase_service.delete_user(user_id)

    return {"message": f"User {user_id} and all associated data deleted successfully"}
