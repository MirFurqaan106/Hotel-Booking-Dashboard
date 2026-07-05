import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import User, OTPVerification, PasswordReset, ActivityLog
from app.schemas.schemas import UserCreate, UserResponse, OTPVerify, Token, PasswordResetRequest, PasswordResetConfirm, PasswordChangeRequest
from app.utils.security import verify_password, get_password_hash
from app.utils.jwt import create_access_token, create_refresh_token, decode_token
from app.config.config import settings
from app.services.email import EmailService
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

def generate_otp() -> str:
    return str(random.randint(100000, 999999))

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    # 0. Role and Password Strength validations
    if user_in.role_name in ["Manager", "Admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration for Manager/Admin accounts is restricted. Please contact system administrators."
        )
        
    import re
    password_pattern = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$")
    if not password_pattern.match(user_in.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
        )

    # 1. Check if user already exists
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
        
    # 2. Hash password and insert unverified user
    hashed_pass = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_pass,
        full_name=user_in.full_name,
        phone=user_in.phone,
        role_name=user_in.role_name,
        is_active=True,
        is_verified=False
    )
    db.add(new_user)
    db.flush()
    
    # 3. Generate OTP and save verification record
    otp_code = generate_otp()
    otp_record = OTPVerification(
        email=user_in.email,
        code=otp_code,
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(otp_record)
    
    # 4. Log Action
    log = ActivityLog(
        user_id=new_user.id,
        action="Registration Request",
        details="User registered. Awaiting OTP verification."
    )
    db.add(log)
    
    db.commit()
    db.refresh(new_user)
    
    # 5. Dispatch OTP Notification
    EmailService.send_otp(user_in.email, otp_code)
    
    return new_user


@router.post("/verify-otp", status_code=status.HTTP_200_OK)
def verify_otp(verify_in: OTPVerify, db: Session = Depends(get_db)):
    # 1. Retrieve valid OTP record
    otp_record = db.query(OTPVerification).filter(
        OTPVerification.email == verify_in.email,
        OTPVerification.code == verify_in.code,
        OTPVerification.expires_at > datetime.utcnow()
    ).order_by(OTPVerification.created_at.desc()).first()
    
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code"
        )
        
    # 2. Update user verification status
    user = db.query(User).filter(User.email == verify_in.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    user.is_verified = True
    
    # Clean up OTP records for this email
    db.query(OTPVerification).filter(OTPVerification.email == verify_in.email).delete()
    
    # 3. Log Action
    log = ActivityLog(
        user_id=user.id,
        action="Email Verified",
        details="User successfully verified email using OTP."
    )
    db.add(log)
    
    db.commit()
    
    # Send welcome email
    EmailService.send_welcome(user.email, user.full_name)
    
    return {"message": "Email verified successfully. You can now login."}


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Retrieve user
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 2. Assert active & verified
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )
        
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address first"
        )
        
    # 3. Issue Tokens
    token_data = {"sub": user.email, "role": user.role_name, "name": user.full_name}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)
    
    # 4. Log Action
    log = ActivityLog(
        user_id=user.id,
        action="User Login",
        details="User logged in successfully and issued JWT."
    )
    db.add(log)
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token_str: str, db: Session = Depends(get_db)):
    # 1. Decode refresh token
    payload = decode_token(refresh_token_str, settings.JWT_REFRESH_SECRET_KEY)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
        
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload"
        )
        
    # 2. Check if user is valid
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token is invalid"
        )
        
    # 3. Issue new tokens
    token_data = {"sub": user.email, "role": user.role_name, "name": user.full_name}
    new_access = create_access_token(data=token_data)
    new_refresh = create_refresh_token(data=token_data)
    
    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer"
    }


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(req: PasswordResetRequest, db: Session = Depends(get_db)):
    # 1. Check if user exists
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        # Prevent user enumeration security leakage: return successful status even if user doesn't exist
        return {"message": "If the email is registered, a password reset link will be sent."}
        
    # 2. Generate random 6-character token
    token_code = str(random.randint(100000, 999999))
    
    # Save reset record
    reset_record = PasswordReset(
        email=req.email,
        token=token_code,
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    )
    db.add(reset_record)
    
    log = ActivityLog(
        user_id=user.id,
        action="Password Reset Requested",
        details="Generated token for password reset dispatch."
    )
    db.add(log)
    db.commit()
    
    # Send email
    EmailService.send_password_reset(user.email, token_code)
    
    return {"message": "If the email is registered, a password reset token will be sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(confirm: PasswordResetConfirm, db: Session = Depends(get_db)):
    # 1. Retrieve valid token
    record = db.query(PasswordReset).filter(
        PasswordReset.token == confirm.token,
        PasswordReset.expires_at > datetime.utcnow()
    ).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
        
    # 2. Update user password
    user = db.query(User).filter(User.email == record.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    user.hashed_password = get_password_hash(confirm.new_password)
    
    # Clean token records for this email
    db.query(PasswordReset).filter(PasswordReset.email == record.email).delete()
    
    log = ActivityLog(
        user_id=user.id,
        action="Password Reset Complete",
        details="User successfully reset password."
    )
    db.add(log)
    db.commit()
    
    return {"message": "Password reset successfully. You can now login."}


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    req: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import bcrypt
    
    # 1. Verify current password
    pwd_bytes = req.current_password.encode('utf-8')
    hashed_bytes = current_user.hashed_password.encode('utf-8')
    if not bcrypt.checkpw(pwd_bytes, hashed_bytes):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
        
    # 2. Validate new password strength
    import re
    password_regex = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
    if not re.match(password_regex, req.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
        )
        
    # 3. Update password
    current_user.hashed_password = get_password_hash(req.new_password)
    
    # 4. Log Action
    log = ActivityLog(
        user_id=current_user.id,
        action="Password Changed",
        details="User successfully changed account password."
    )
    db.add(log)
    db.commit()
    
    return {"message": "Password changed successfully."}

