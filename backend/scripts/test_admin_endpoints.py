"""
Admin API Endpoints Test Script
Tests all admin endpoints with actual API calls
"""
import os
import sys
import httpx
import asyncio
import json

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

# Configuration
BASE_URL = "http://localhost:8000"
SUPABASE_URL = os.getenv("SUPABASE_URL")
ADMIN_EMAIL = "admin@cvlab.sa"
ADMIN_PASSWORD = "Admin@CVLab2024!"

# Test results
test_results = []


def log_result(endpoint, method, status, passed, message=""):
    """Log test result"""
    result = {
        "endpoint": endpoint,
        "method": method,
        "status": status,
        "passed": passed,
        "message": message
    }
    test_results.append(result)
    status_str = "[PASS]" if passed else "[FAIL]"
    print(f"{status_str} {method} {endpoint} - {status} {message}")


async def get_admin_token():
    """Get admin JWT token"""
    async with httpx.AsyncClient() as client:
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
            return response.json().get("access_token")
        return None


async def test_health(client, headers):
    """Test health endpoints"""
    print("\n" + "=" * 60)
    print("HEALTH CHECK")
    print("=" * 60)

    # Admin health
    response = await client.get(f"{BASE_URL}/api/admin/health", headers=headers)
    log_result("/api/admin/health", "GET", response.status_code,
               response.status_code == 200)


async def test_stats(client, headers):
    """Test dashboard stats endpoint"""
    print("\n" + "=" * 60)
    print("DASHBOARD STATS")
    print("=" * 60)

    response = await client.get(f"{BASE_URL}/api/admin/stats", headers=headers)
    passed = response.status_code == 200

    if passed:
        data = response.json()
        log_result("/api/admin/stats", "GET", response.status_code, passed,
                   f"users={data.get('total_users')}, resumes={data.get('resumes_processed')}")
    else:
        log_result("/api/admin/stats", "GET", response.status_code, passed,
                   response.text[:100])


async def test_users(client, headers):
    """Test user management endpoints"""
    print("\n" + "=" * 60)
    print("USER MANAGEMENT")
    print("=" * 60)

    # List users
    response = await client.get(
        f"{BASE_URL}/api/admin/users",
        headers=headers,
        params={"page": 1, "limit": 10}
    )
    passed = response.status_code == 200

    if passed:
        data = response.json()
        log_result("/api/admin/users", "GET", response.status_code, passed,
                   f"total={data.get('total')}")

        # Get first user if exists
        if data.get('users'):
            user_id = data['users'][0]['id']

            # Get single user
            response2 = await client.get(
                f"{BASE_URL}/api/admin/users/{user_id}",
                headers=headers
            )
            log_result(f"/api/admin/users/{{id}}", "GET", response2.status_code,
                       response2.status_code == 200)
    else:
        log_result("/api/admin/users", "GET", response.status_code, passed,
                   response.text[:100])

    # Test with filters
    response = await client.get(
        f"{BASE_URL}/api/admin/users",
        headers=headers,
        params={"status": "active", "role": "user"}
    )
    log_result("/api/admin/users?status&role", "GET", response.status_code,
               response.status_code == 200, "with filters")


async def test_resumes(client, headers):
    """Test resume management endpoints"""
    print("\n" + "=" * 60)
    print("RESUME MANAGEMENT")
    print("=" * 60)

    # List resumes
    response = await client.get(
        f"{BASE_URL}/api/admin/resumes",
        headers=headers,
        params={"page": 1, "limit": 10}
    )
    passed = response.status_code == 200

    if passed:
        data = response.json()
        log_result("/api/admin/resumes", "GET", response.status_code, passed,
                   f"total={data.get('total')}")

        # Get first resume if exists
        if data.get('resumes'):
            resume_id = data['resumes'][0]['id']

            # Get single resume
            response2 = await client.get(
                f"{BASE_URL}/api/admin/resumes/{resume_id}",
                headers=headers
            )
            log_result(f"/api/admin/resumes/{{id}}", "GET", response2.status_code,
                       response2.status_code == 200)

            # Test download original
            response3 = await client.get(
                f"{BASE_URL}/api/admin/resumes/{resume_id}/download/original",
                headers=headers
            )
            log_result(f"/api/admin/resumes/{{id}}/download/original", "GET",
                       response3.status_code,
                       response3.status_code in [200, 404])  # 404 if file not found is OK

            # Test download optimized
            response4 = await client.get(
                f"{BASE_URL}/api/admin/resumes/{resume_id}/download/optimized",
                headers=headers
            )
            log_result(f"/api/admin/resumes/{{id}}/download/optimized", "GET",
                       response4.status_code,
                       response4.status_code in [200, 404])  # 404 if not optimized is OK
    else:
        log_result("/api/admin/resumes", "GET", response.status_code, passed,
                   response.text[:100])

    # Test with filters
    response = await client.get(
        f"{BASE_URL}/api/admin/resumes",
        headers=headers,
        params={"status": "optimized", "sort": "newest"}
    )
    log_result("/api/admin/resumes?status&sort", "GET", response.status_code,
               response.status_code == 200, "with filters")

    # Test export
    response = await client.get(
        f"{BASE_URL}/api/admin/resumes/export",
        headers=headers
    )
    log_result("/api/admin/resumes/export", "GET", response.status_code,
               response.status_code == 200, "Excel export")


async def test_claims(client, headers):
    """Test claims management endpoints"""
    print("\n" + "=" * 60)
    print("CLAIMS MANAGEMENT")
    print("=" * 60)

    # Get claims stats
    response = await client.get(
        f"{BASE_URL}/api/admin/claims/stats",
        headers=headers
    )
    passed = response.status_code == 200

    if passed:
        data = response.json()
        log_result("/api/admin/claims/stats", "GET", response.status_code, passed,
                   f"open={data.get('open_claims')}, resolved={data.get('resolved')}")
    else:
        log_result("/api/admin/claims/stats", "GET", response.status_code, passed,
                   response.text[:100])

    # List claims
    response = await client.get(
        f"{BASE_URL}/api/admin/claims",
        headers=headers,
        params={"page": 1, "limit": 10}
    )
    passed = response.status_code == 200

    if passed:
        data = response.json()
        log_result("/api/admin/claims", "GET", response.status_code, passed,
                   f"total={data.get('total')}")

        # If claims exist, test single get and status update
        if data.get('claims'):
            claim_id = data['claims'][0]['id']

            # Get single claim
            response2 = await client.get(
                f"{BASE_URL}/api/admin/claims/{claim_id}",
                headers=headers
            )
            log_result(f"/api/admin/claims/{{id}}", "GET", response2.status_code,
                       response2.status_code == 200)

            # Update status
            response3 = await client.patch(
                f"{BASE_URL}/api/admin/claims/{claim_id}/status",
                headers=headers,
                json={"status": "in_review"}
            )
            log_result(f"/api/admin/claims/{{id}}/status", "PATCH", response3.status_code,
                       response3.status_code == 200)
    else:
        log_result("/api/admin/claims", "GET", response.status_code, passed,
                   response.text[:100])

    # Test export
    response = await client.get(
        f"{BASE_URL}/api/admin/claims/export",
        headers=headers
    )
    log_result("/api/admin/claims/export", "GET", response.status_code,
               response.status_code == 200, "Excel export")


async def test_prompts_llm(client, headers):
    """Test prompts and LLM config endpoints"""
    print("\n" + "=" * 60)
    print("PROMPTS & LLM CONFIG")
    print("=" * 60)

    # Get LLM config
    response = await client.get(
        f"{BASE_URL}/api/admin/llm-config",
        headers=headers
    )
    passed = response.status_code == 200

    if passed:
        data = response.json()
        log_result("/api/admin/llm-config", "GET", response.status_code, passed,
                   f"provider={data.get('provider')}, model={data.get('model')}")
    else:
        log_result("/api/admin/llm-config", "GET", response.status_code, passed,
                   response.text[:100])

    # List prompts
    response = await client.get(
        f"{BASE_URL}/api/admin/prompts",
        headers=headers
    )
    passed = response.status_code == 200

    if passed:
        data = response.json()
        prompts = data.get('prompts', [])
        log_result("/api/admin/prompts", "GET", response.status_code, passed,
                   f"count={len(prompts)}")

        # Get single prompt
        if prompts:
            prompt_id = prompts[0]['id']
            response2 = await client.get(
                f"{BASE_URL}/api/admin/prompts/{prompt_id}",
                headers=headers
            )
            log_result(f"/api/admin/prompts/{{id}}", "GET", response2.status_code,
                       response2.status_code == 200)
    else:
        log_result("/api/admin/prompts", "GET", response.status_code, passed,
                   response.text[:100])


async def test_user_claims(client, headers):
    """Test user-facing claims endpoints (v1)"""
    print("\n" + "=" * 60)
    print("USER CLAIMS (V1 API)")
    print("=" * 60)

    # Create a claim
    response = await client.post(
        f"{BASE_URL}/api/v1/claims",
        headers=headers,
        json={
            "subject": "Test Claim from Admin",
            "description": "This is a test claim created during endpoint testing to verify the claims system works correctly."
        }
    )
    passed = response.status_code == 200

    if passed:
        data = response.json()
        log_result("/api/v1/claims", "POST", response.status_code, passed,
                   f"claim_id={data.get('claim_id')}")

        # List user's claims
        response2 = await client.get(
            f"{BASE_URL}/api/v1/claims",
            headers=headers
        )
        log_result("/api/v1/claims", "GET", response2.status_code,
                   response2.status_code == 200)

        # Get single claim
        claim_id = data.get('id')
        response3 = await client.get(
            f"{BASE_URL}/api/v1/claims/{claim_id}",
            headers=headers
        )
        log_result(f"/api/v1/claims/{{id}}", "GET", response3.status_code,
                   response3.status_code == 200)
    else:
        log_result("/api/v1/claims", "POST", response.status_code, passed,
                   response.text[:100])


async def test_unauthorized():
    """Test that endpoints reject unauthorized requests"""
    print("\n" + "=" * 60)
    print("AUTHORIZATION TESTS")
    print("=" * 60)

    async with httpx.AsyncClient(timeout=30.0) as client:
        # No token
        response = await client.get(f"{BASE_URL}/api/admin/stats")
        log_result("/api/admin/stats (no auth)", "GET", response.status_code,
                   response.status_code == 401, "Should require auth")

        # Invalid token
        response = await client.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": "Bearer invalid_token"}
        )
        log_result("/api/admin/stats (bad token)", "GET", response.status_code,
                   response.status_code in [401, 403], "Should reject bad token")


async def main():
    print("=" * 60)
    print("ADMIN API ENDPOINT TESTS")
    print("=" * 60)

    # Get admin token
    print("\n[INFO] Getting admin JWT token...")
    token = await get_admin_token()

    if not token:
        print("[ERROR] Failed to get admin token!")
        print("[INFO] Make sure to run setup_admin.py first")
        return

    print("[OK] Token obtained")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Check if server is running
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(f"{BASE_URL}/health")
            if response.status_code != 200:
                print(f"\n[ERROR] Server not responding correctly at {BASE_URL}")
                print("[INFO] Make sure to start the server with: uvicorn app.main:app --reload")
                return
        except Exception as e:
            print(f"\n[ERROR] Cannot connect to server at {BASE_URL}")
            print(f"[INFO] Error: {e}")
            print("[INFO] Make sure to start the server with: uvicorn app.main:app --reload")
            return

        print(f"[OK] Server is running at {BASE_URL}")

        # Run all tests
        await test_health(client, headers)
        await test_stats(client, headers)
        await test_users(client, headers)
        await test_resumes(client, headers)
        await test_claims(client, headers)
        await test_prompts_llm(client, headers)
        await test_user_claims(client, headers)

    # Test unauthorized access
    await test_unauthorized()

    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = sum(1 for r in test_results if r['passed'])
    failed = sum(1 for r in test_results if not r['passed'])
    total = len(test_results)

    print(f"Total:  {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Rate:   {(passed/total*100):.1f}%")

    if failed > 0:
        print("\nFailed tests:")
        for r in test_results:
            if not r['passed']:
                print(f"  - {r['method']} {r['endpoint']}: {r['status']} {r['message']}")


if __name__ == "__main__":
    asyncio.run(main())
