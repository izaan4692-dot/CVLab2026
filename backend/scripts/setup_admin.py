"""
Admin User Setup Script
Creates an admin user in Supabase with admin role
"""
import os
import sys
import httpx
import asyncio

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Admin credentials - CHANGE THESE IN PRODUCTION
ADMIN_EMAIL = "admin@cvlab.sa"
ADMIN_PASSWORD = "Admin@CVLab2024!"
ADMIN_NAME = "System Administrator"


async def create_admin_user():
    """Create admin user in Supabase"""

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print("[ERROR] Supabase credentials not configured!")
        return None

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        # Check if admin user already exists
        print(f"[INFO] Checking if admin user exists: {ADMIN_EMAIL}")

        response = await client.get(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            headers=headers,
            params={"page": 1, "per_page": 100},
            timeout=30.0
        )

        if response.status_code == 200:
            users = response.json().get("users", [])
            existing_admin = next(
                (u for u in users if u.get("email") == ADMIN_EMAIL),
                None
            )

            if existing_admin:
                print(f"[INFO] Admin user already exists with ID: {existing_admin['id']}")

                # Check if role is properly set in both metadata fields
                user_metadata = existing_admin.get("user_metadata", {})
                app_metadata = existing_admin.get("app_metadata", {})
                user_metadata_role = user_metadata.get("role")
                app_metadata_role = app_metadata.get("role")
                
                # Always update to ensure role is in both metadata fields (fixes admin route access)
                needs_update = (
                    user_metadata_role != "admin" or 
                    app_metadata_role != "admin" or
                    existing_admin.get("role") != "admin"
                )
                
                if needs_update:
                    print("[INFO] Updating admin user metadata to ensure role is set correctly...")
                    print(f"   Current user_metadata.role: {user_metadata_role or 'NOT SET'}")
                    print(f"   Current app_metadata.role: {app_metadata_role or 'NOT SET'}")
                    
                    update_response = await client.put(
                        f"{SUPABASE_URL}/auth/v1/admin/users/{existing_admin['id']}",
                        headers=headers,
                        json={
                            "role": "admin",
                            "user_metadata": {
                                **user_metadata,  # Preserve existing metadata
                                "full_name": ADMIN_NAME,
                                "is_admin": True,
                                "role": "admin"  # Ensure role is in user_metadata
                            },
                            "app_metadata": {
                                **app_metadata,  # Preserve existing metadata
                                "role": "admin"  # Ensure role is in app_metadata
                            }
                        },
                        timeout=10.0
                    )

                    if update_response.status_code == 200:
                        print("[OK] Admin role updated successfully in both metadata fields!")
                        updated_data = update_response.json()
                        print(f"   New user_metadata.role: {updated_data.get('user_metadata', {}).get('role', 'NOT SET')}")
                        print(f"   New app_metadata.role: {updated_data.get('app_metadata', {}).get('role', 'NOT SET')}")
                    else:
                        print(f"[ERROR] Failed to update role: {update_response.status_code}")
                        print(f"   Response: {update_response.text}")
                else:
                    print("[OK] Admin user already has correct role in both metadata fields")

                return existing_admin['id']

        # Create new admin user
        print("[INFO] Creating new admin user...")

        create_response = await client.post(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            headers=headers,
            json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD,
                "email_confirm": True,  # Auto-confirm email
                "role": "admin",
                "user_metadata": {
                    "full_name": ADMIN_NAME,
                    "is_admin": True,
                    "role": "admin"  # Add role to user_metadata
                },
                "app_metadata": {
                    "role": "admin"  # Also set in app_metadata for consistency
                }
            },
            timeout=10.0
        )

        if create_response.status_code in [200, 201]:
            user_data = create_response.json()
            print(f"[OK] Admin user created successfully!")
            print(f"    User ID: {user_data.get('id')}")
            return user_data.get('id')
        else:
            print(f"[ERROR] Failed to create admin: {create_response.status_code}")
            print(f"    Response: {create_response.text}")
            return None


async def get_admin_token():
    """Get JWT token for admin user"""

    async with httpx.AsyncClient() as client:
        print("[INFO] Getting admin JWT token...")

        response = await client.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={
                "apikey": os.getenv("SUPABASE_ANON_KEY"),
                "Content-Type": "application/json"
            },
            json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            },
            timeout=10.0
        )

        if response.status_code == 200:
            data = response.json()
            print("[OK] Admin token obtained successfully!")
            return data.get("access_token")
        else:
            print(f"[ERROR] Failed to get token: {response.status_code}")
            print(f"    Response: {response.text}")
            return None


async def main():
    print("=" * 60)
    print("CVLab Admin User Setup")
    print("=" * 60)
    print()

    # Create admin user
    admin_id = await create_admin_user()

    if admin_id:
        # Get token
        token = await get_admin_token()

        print()
        print("=" * 60)
        print("ADMIN CREDENTIALS")
        print("=" * 60)
        print(f"Email:    {ADMIN_EMAIL}")
        print(f"Password: {ADMIN_PASSWORD}")
        print(f"User ID:  {admin_id}")
        print()

        if token:
            print("=" * 60)
            print("JWT TOKEN (for API testing)")
            print("=" * 60)
            print(token[:50] + "..." if len(token) > 50 else token)
            print()

            # Save token to file for testing
            with open("admin_token.txt", "w") as f:
                f.write(token)
            print("[INFO] Full token saved to admin_token.txt")

        print()
        print("=" * 60)
        print("NEXT STEPS")
        print("=" * 60)
        print("1. Use these credentials to login on the frontend")
        print("2. Or use the JWT token for API testing")
        print("3. Access admin panel at /admin")
        print()
    else:
        print("[ERROR] Failed to setup admin user")


if __name__ == "__main__":
    asyncio.run(main())
