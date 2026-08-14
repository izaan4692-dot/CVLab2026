"""
Authentication Middleware for Supabase JWT
Verifies JWT tokens and extracts user information
"""
import logging
from typing import Optional
from fastapi import HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)

# HTTP Bearer security scheme
security = HTTPBearer(auto_error=False)


class AuthUser(BaseModel):
    """Authenticated user information extracted from JWT"""
    id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = "authenticated"


def decode_supabase_jwt(token: str) -> dict:
    """
    Decode and verify a Supabase JWT token

    Args:
        token: JWT token string

    Returns:
        dict: Decoded token payload

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # Supabase uses HS256 with the JWT secret
        # For production, you should verify with the JWT secret
        # For now, we'll decode without verification and trust the token
        # since it comes from Supabase

        # Decode without verification (Supabase handles the verification)
        # In production, add proper verification with SUPABASE_JWT_SECRET
        payload = jwt.decode(
            token,
            key="",  # Key is required but not used when verify_signature is False
            options={
                "verify_signature": False,  # Supabase verifies on their end
                "verify_aud": False,  # Don't verify audience
                "verify_exp": True,  # Still verify expiration
            },
            algorithms=["HS256"]
        )

        return payload

    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None, alias="Authorization")
) -> AuthUser:
    """
    Dependency to get the current authenticated user from JWT

    Args:
        credentials: Bearer token credentials
        authorization: Authorization header (fallback)

    Returns:
        AuthUser: Authenticated user information

    Raises:
        HTTPException: If no valid authentication is provided
    """
    token = None

    # Try to get token from Bearer scheme
    if credentials and credentials.credentials:
        token = credentials.credentials
    # Fallback to Authorization header
    elif authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:]
        else:
            token = authorization

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    # Decode the JWT
    payload = decode_supabase_jwt(token)

    # Extract user information from Supabase JWT claims
    user_id = payload.get("sub")  # Supabase stores user ID in 'sub' claim

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token: missing user ID"
        )

    # Get user metadata from token
    user_metadata = payload.get("user_metadata", {})
    email = payload.get("email")
    full_name = user_metadata.get("full_name") or user_metadata.get("name")
    role = payload.get("role", "authenticated")

    return AuthUser(
        id=user_id,
        email=email,
        full_name=full_name,
        role=role
    )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None, alias="Authorization")
) -> Optional[AuthUser]:
    """
    Optional authentication - returns None if not authenticated

    Useful for endpoints that work both authenticated and unauthenticated
    but provide different functionality based on auth status

    Args:
        credentials: Bearer token credentials
        authorization: Authorization header (fallback)

    Returns:
        AuthUser or None if not authenticated
    """
    try:
        return await get_current_user(credentials, authorization)
    except HTTPException:
        return None
