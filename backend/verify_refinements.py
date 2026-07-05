import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add path resolution
sys.path.append(str(Path(__file__).resolve().parent))

from app.main import app

client = TestClient(app)

def run_tests():
    print("====================================================")
    print("VERIFYING BACKEND REFINEMENTS & ADMIN PORTAL APIS")
    print("====================================================")

    # 1. Assert registering as Manager fails (blocked)
    print("[Verification] Registering as Manager (Should fail)...")
    res_mgr = client.post(
        "/auth/register",
        json={
            "email": "badmanager@example.com",
            "password": "Password@123",
            "full_name": "Bad Manager",
            "phone": "+91 9900998877",
            "role_name": "Manager"
        }
    )
    assert res_mgr.status_code == 400
    print(f"[OK] Manager registration correctly blocked: '{res_mgr.json().get('detail')}'")

    # 2. Assert registering with weak password fails
    print("[Verification] Registering with weak password (Should fail)...")
    res_weak = client.post(
        "/auth/register",
        json={
            "email": "weakuser@example.com",
            "password": "123456",
            "full_name": "Weak User",
            "phone": "+91 9900998877",
            "role_name": "User"
        }
    )
    print(f"[Debug] Weak registration status: {res_weak.status_code} | Details: {res_weak.json()}")
    assert res_weak.status_code == 400
    print(f"[OK] Weak password registration correctly blocked: '{res_weak.json().get('detail')}'")

    # 3. Log in as Admin
    print("[Verification] Authenticating Admin user (admin@panunghar.com)...")
    res_login = client.post(
        "/auth/login",
        data={"username": "admin@panunghar.com", "password": "Admin@123"}
    )
    assert res_login.status_code == 200, "Admin login failed"
    admin_token = res_login.json().get("access_token")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 4. Directly add manager account (Admin only)
    print("[Verification] Creating manager directly via Admin credentials...")
    res_add_mgr = client.post(
        "/admin-portal/managers",
        json={
            "email": "newmanager@panunghar.com",
            "password": "Manager@12345",
            "full_name": "New Manager",
            "phone": "+91 9988776655",
            "role_name": "Manager"
        },
        headers=headers
    )
    assert res_add_mgr.status_code == 201, f"Failed: {res_add_mgr.json()}"
    new_mgr_id = res_add_mgr.json().get("id")
    print(f"[OK] Verified manager created directly: ID {new_mgr_id} | Email: {res_add_mgr.json().get('email')}")

    # 5. Fetch all users
    print("[Verification] Listing all users...")
    res_users = client.get("/admin-portal/users", headers=headers)
    assert res_users.status_code == 200
    users_list = res_users.json()
    print(f"[OK] Retrieved {len(users_list)} registered users.")

    # 6. Delete a user account
    print(f"[Verification] Deleting user account (ID {new_mgr_id})...")
    res_del = client.delete(f"/admin-portal/users/{new_mgr_id}", headers=headers)
    assert res_del.status_code == 204
    print("[OK] User deleted successfully.")

    print("\n[SUCCESS] ALL REFINED BACKEND CONSTRAINTS AND PORTAL APIS VERIFIED PERFECTLY!")
    print("====================================================")

if __name__ == "__main__":
    run_tests()
