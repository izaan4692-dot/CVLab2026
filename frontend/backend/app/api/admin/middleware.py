"""
Admin Authentication Middleware
Extends base authentication to verify admin role
"""
import logging
from typing import Optional
from fastapi import HTTPException, Depends
from app.auth.middleware import get_current_user, AuthUser

logger = logging.getLogger(__name__)

# List of admin roles that have access to admin endpoints
ADMIN_ROLES = ["admin", "service_role", "super_admin"]


async def get_admin_user(
    current_user: AuthUser = Depends(get_current_user)
) -> AuthUser:
    """
    Dependency to verify the current user has admin privileges

    Args:
        current_user: Authenticated user from JWT

    Returns:
        AuthUser: Admin user information

    Raises:
        HTTPException: If user is not an admin
    """
    # Check if user has admin role
    if current_user.role not in ADMIN_ROLES:
        logger.warning(
            f"Non-admin user {current_user.id} attempted to access admin endpoint. "
            f"Role: {current_user.role}"
        )
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required"
        )

    logger.info(f"Admin access granted to user {current_user.id} with role {current_user.role}")
    return current_user


async def get_optional_admin_user(
    current_user: AuthUser = Depends(get_current_user)
) -> Optional[AuthUser]:
    """
    Optional admin check - returns user if admin, None otherwise
    Useful for endpoints with mixed access levels
    """
    if current_user.role in ADMIN_ROLES:
        return current_user
    return None
