from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import re

from app.database.session import get_db
from app.models.models import User, ActivityLog
from app.schemas.schemas import UserResponse, UserCreate
from app.api.deps import RoleChecker
from app.utils.security import get_password_hash

router = APIRouter(prefix="/admin-portal", tags=["Admin Portal"])

@router.get("/users", response_model=List[UserResponse])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Manager", "Admin"]))
):
    # Returns all users except current admin user
    return db.query(User).filter(User.id != current_user.id).all()


@router.post("/managers", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_manager_directly(
    manager_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    # Check if user already exists
    existing = db.query(User).filter(User.email == manager_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
        
    # Validate Password strength criteria
    password_pattern = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$")
    if not password_pattern.match(manager_in.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
        )

    # Insert verified manager account directly
    hashed_pass = get_password_hash(manager_in.password)
    new_manager = User(
        email=manager_in.email,
        hashed_password=hashed_pass,
        full_name=manager_in.full_name,
        phone=manager_in.phone,
        role_name="Manager",
        is_active=True,
        is_verified=True
    )
    db.add(new_manager)
    db.flush()
    
    log = ActivityLog(
        user_id=current_user.id,
        action="Manager Created",
        details=f"Admin created verified manager {manager_in.email}."
    )
    db.add(log)
    db.commit()
    db.refresh(new_manager)
    return new_manager


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found"
        )
        
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete active administrative account"
        )
        
    db.delete(user)
    
    log = ActivityLog(
        user_id=current_user.id,
        action="User Deleted",
        details=f"Admin deleted user account: {user.email}."
    )
    db.add(log)
    db.commit()
    return None
