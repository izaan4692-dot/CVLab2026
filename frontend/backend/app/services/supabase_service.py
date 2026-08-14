"""
Supabase Service
Handles interactions with Supabase for user management
"""
import logging
from typing import Optional, Dict, Any
import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class SupabaseService:
    """Service for Supabase Admin API operations"""

    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.service_role_key = settings.SUPABASE_SERVICE_ROLE_KEY
        self.headers = {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
            "Content-Type": "application/json"
        }

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user details from Supabase by ID

        Args:
            user_id: Supabase user UUID

        Returns:
            User data dict or None if not found
        """
        if not self.supabase_url or not self.service_role_key:
            logger.warning("Supabase credentials not configured")
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.supabase_url}/auth/v1/admin/users/{user_id}",
                    headers=self.headers,
                    timeout=10.0
                )

                if response.status_code == 200:
                    user_data = response.json()
                    # Get role from user_metadata first, then raw_user_meta_data, then default to 'authenticated'
                    user_metadata = user_data.get('user_metadata', {})
                    raw_metadata = user_data.get('raw_user_meta_data', {})
                    custom_role = user_metadata.get('role') or raw_metadata.get('role')
                    # If no custom role, use the auth role (usually 'authenticated' for regular users)
                    auth_role = user_data.get('role', 'authenticated')
                    # Prefer custom role over auth role
                    user_role = custom_role if custom_role else auth_role
                    
                    return {
                        'id': user_data.get('id'),
                        'email': user_data.get('email'),
                        'full_name': user_metadata.get('full_name') or raw_metadata.get('full_name'),
                        'role': user_role,
                        'status': 'active' if not user_data.get('banned_until') else 'inactive',
                        'created_at': user_data.get('created_at'),
                        'last_sign_in_at': user_data.get('last_sign_in_at'),
                        'email_confirmed_at': user_data.get('email_confirmed_at')
                    }
                elif response.status_code == 404:
                    logger.info(f"User {user_id} not found in Supabase")
                    return None
                else:
                    logger.error(f"Failed to get user from Supabase: {response.status_code}")
                    return None

        except Exception as e:
            logger.error(f"Error fetching user from Supabase: {e}")
            return None

    async def list_users(
        self,
        page: int = 1,
        per_page: int = 50
    ) -> Dict[str, Any]:
        """
        List all users from Supabase

        Args:
            page: Page number
            per_page: Items per page

        Returns:
            Dict with users list and total count
        """
        if not self.supabase_url or not self.service_role_key:
            logger.warning("Supabase credentials not configured")
            return {"users": [], "total": 0}

        try:
            async with httpx.AsyncClient() as client:
              # Supabase Admin API uses different pagination - try both formats
                response = await client.get(
                    f"{self.supabase_url}/auth/v1/admin/users",
                    headers=self.headers,
                    params={"page": page, "per_page": per_page},
                    timeout=30.0
                )

                if response.status_code == 200:
                    data = response.json()
                    users = []
                    
                    # Handle different response formats
                    # Format 1: Direct array of users
                    if isinstance(data, list):
                        user_list = data
                    # Format 2: Object with 'users' key
                    elif isinstance(data, dict) and 'users' in data:
                        user_list = data['users']
                    # Format 3: Object with other structure
                    else:
                        logger.warning(f"Unexpected Supabase response format: {type(data)}")
                        user_list = []
                    
                    for user_data in user_list:
                        # Get role from user_metadata first, then raw_user_meta_data, then default to 'authenticated'
                        user_metadata = user_data.get('user_metadata', {})
                        raw_metadata = user_data.get('raw_user_meta_data', {})
                        custom_role = user_metadata.get('role') or raw_metadata.get('role')
                        # If no custom role, use the auth role (usually 'authenticated' for regular users)
                        auth_role = user_data.get('role', 'authenticated')
                        # Prefer custom role over auth role
                        user_role = custom_role if custom_role else auth_role
                        
                        users.append({
                            'id': user_data.get('id'),
                            'email': user_data.get('email'),
                            'full_name': user_metadata.get('full_name') or raw_metadata.get('full_name'),
                            'role': user_role,
                            'status': 'active' if not user_data.get('banned_until') else 'inactive',
                            'created_at': user_data.get('created_at'),
                            'last_sign_in_at': user_data.get('last_sign_in_at'),
                            'banned_until': user_data.get('banned_until')
                        })
                    
                    logger.info(f"Supabase API returned {len(users)} users for page {page}")
                    return {
                        "users": users,
                        "total": len(users)  # Total will be accumulated across all pages
                    }
                else:
                    logger.error(f"Failed to list users from Supabase: {response.status_code} - {response.text[:200]}")
                    return {"users": [], "total": 0}

        except Exception as e:
            logger.error(f"Error listing users from Supabase: {e}")
            return {"users": [], "total": 0}

    async def update_user_status(self, user_id: str, status: str) -> bool:
        """
        Update user status in Supabase (ban/unban)

        Args:
            user_id: Supabase user UUID
            status: 'active' or 'inactive'

        Returns:
            True if successful, False otherwise
        """
        if not self.supabase_url or not self.service_role_key:
            logger.warning("Supabase credentials not configured")
            return False

        try:
            async with httpx.AsyncClient() as client:
                # Use ban_duration to set status
                # Setting to "none" unbans, setting to a duration bans
                if status == 'inactive':
                    # Ban user for a very long time (essentially permanent)
                    body = {"ban_duration": "876000h"}  # ~100 years
                else:
                    # Unban user
                    body = {"ban_duration": "none"}

                response = await client.put(
                    f"{self.supabase_url}/auth/v1/admin/users/{user_id}",
                    headers=self.headers,
                    json=body,
                    timeout=10.0
                )

                if response.status_code == 200:
                    logger.info(f"User {user_id} status updated to {status}")
                    return True
                else:
                    logger.error(f"Failed to update user status: {response.status_code} - {response.text}")
                    return False

        except Exception as e:
            logger.error(f"Error updating user status in Supabase: {e}")
            return False

    async def delete_user(self, user_id: str) -> bool:
        """
        Delete a user from Supabase

        Args:
            user_id: Supabase user UUID

        Returns:
            True if successful, False otherwise
        """
        if not self.supabase_url or not self.service_role_key:
            logger.warning("Supabase credentials not configured")
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.supabase_url}/auth/v1/admin/users/{user_id}",
                    headers=self.headers,
                    timeout=10.0
                )

                if response.status_code in [200, 204]:
                    logger.info(f"User {user_id} deleted from Supabase")
                    return True
                else:
                    logger.error(f"Failed to delete user from Supabase: {response.status_code}")
                    return False

        except Exception as e:
            logger.error(f"Error deleting user from Supabase: {e}")
            return False

    async def update_user_role(self, user_id: str, role: str) -> bool:
        """
        Update user role in Supabase

        Args:
            user_id: Supabase user UUID
            role: New role ('user', 'admin', etc.)

        Returns:
            True if successful, False otherwise
        """
        if not self.supabase_url or not self.service_role_key:
            logger.warning("Supabase credentials not configured")
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.supabase_url}/auth/v1/admin/users/{user_id}",
                    headers=self.headers,
                    json={"role": role},
                    timeout=10.0
                )

                if response.status_code == 200:
                    logger.info(f"User {user_id} role updated to {role}")
                    return True
                else:
                    logger.error(f"Failed to update user role: {response.status_code}")
                    return False

        except Exception as e:
            logger.error(f"Error updating user role in Supabase: {e}")
            return False
