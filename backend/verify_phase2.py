import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add path resolution
sys.path.append(str(Path(__file__).resolve().parent))

from app.main import app
from app.database.session import SessionLocal
from app.models.models import OTPVerification, User

client = TestClient(app)

def verify_auth_pipeline():
    print("====================================================")
    print("PHASE 2: AUTHENTICATION & RBAC API VERIFICATION")
    print("====================================================")

    # 1. Register a test user
    print("[Verification] Requesting User Registration...")
    reg_response = client.post(
        "/auth/register",
        json={
            "email": "testguest@example.com",
            "password": "GuestPassword123",
            "full_name": "Test Guest User",
            "phone": "+91 9900998877",
            "role_name": "User"
        }
    )
    
    # Assert successful registration (201 Created)
    if reg_response.status_code != 201:
        print(f"[ERROR] Registration failed: {reg_response.json()}")
        sys.exit(1)
        
    print("[OK] User registered successfully (Unverified status).")
    
    # 2. Retrieve OTP verification code from database
    db = SessionLocal()
    otp_record = db.query(OTPVerification).filter(OTPVerification.email == "testguest@example.com").first()
    db.close()
    
    if not otp_record:
        print("[ERROR] Verification OTP record not found in database.")
        sys.exit(1)
        
    print(f"[OK] OTP Code retrieved from SQLite: {otp_record.code}")
    
    # 3. Verify OTP code
    print("[Verification] Requesting OTP Verification...")
    verify_response = client.post(
        "/auth/verify-otp",
        json={
            "email": "testguest@example.com",
            "code": otp_record.code
        }
    )
    
    if verify_response.status_code != 200:
        print(f"[ERROR] OTP verification failed: {verify_response.json()}")
        sys.exit(1)
        
    print("[OK] User verified successfully.")
    
    # 4. Login with credentials to retrieve JWT Access Token
    print("[Verification] Requesting JWT Login...")
    login_response = client.post(
        "/auth/login",
        data={
            "username": "testguest@example.com",
            "password": "GuestPassword123"
        }
    )
    
    if login_response.status_code != 200:
        print(f"[ERROR] JWT login failed: {login_response.json()}")
        sys.exit(1)
        
    token_data = login_response.json()
    access_token = token_data.get("access_token")
    print(f"[OK] Login successful. Access Token issued.")
    
    # 5. Access Protected RBAC endpoints using Token Header
    print("[Verification] Accessing USER protected endpoints...")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    user_route = client.get("/test/user-only", headers=headers)
    if user_route.status_code != 200:
        print(f"[ERROR] User authorization failed: {user_route.json()}")
        sys.exit(1)
    print(f"[OK] User endpoint message: '{user_route.json().get('message')}'")
    
    # Try accessing Manager protected route (should get 403 Forbidden)
    print("[Verification] Attempting unauthorized Manager protected endpoint...")
    mgr_route = client.get("/test/manager-only", headers=headers)
    if mgr_route.status_code != 403:
        print(f"[ERROR] RBAC failure! Allowed unauthorized role to bypass middleware: Status {mgr_route.status_code}")
        sys.exit(1)
    print(f"[OK] Manager endpoint access successfully blocked: Status {mgr_route.status_code} ({mgr_route.json().get('detail')})")
    
    print("\n[SUCCESS] ALL PHASE 2 AUTHENTICATION & RBAC MIDDLEWARES FUNCTION PERFECTLY!")
    print("====================================================")

if __name__ == "__main__":
    verify_auth_pipeline()
