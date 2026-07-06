from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import re

from app.database.session import get_db
from app.models.models import User, Hotel, Booking, Review, Notification, ActivityLog
from app.schemas.schemas import UserResponse, UserCreate
from app.api.deps import RoleChecker, get_current_user
from app.utils.security import get_password_hash

router = APIRouter(prefix="/admin-portal", tags=["Admin Portal"])


@router.get("/users", response_model=List[UserResponse])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Manager", "Admin"]))
):
    """Return all users except the currently logged-in admin/manager."""
    return db.query(User).filter(User.id != current_user.id).all()


@router.post("/managers", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_manager_directly(
    manager_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    """Admin-only: create a pre-verified Manager account."""
    existing = db.query(User).filter(User.email == manager_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )

    password_pattern = re.compile(
        r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
    )
    if not password_pattern.match(manager_in.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters and contain uppercase, lowercase, number, and special character."
        )

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
    current_user: User = Depends(RoleChecker(["Admin", "Manager"]))
):
    """
    Delete a user account.
    Safely handles FK constraints by:
    - Nullifying bookings (anonymising) instead of cascading to preserve history
    - Reassigning hotels managed by the user to the current admin
    - Deleting notifications, reviews, and activity logs for the user
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found"
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    # 1. Reassign hotels that this user manages to the current admin
    hotels_managed = db.query(Hotel).filter(Hotel.manager_id == user_id).all()
    for hotel in hotels_managed:
        hotel.manager_id = current_user.id

    # 2. Anonymise bookings made by this user (keep records, nullify user FK)
    #    We need a nullable user_id for this - use raw SQL to bypass ORM constraint
    from sqlalchemy import text
    db.execute(
        text("UPDATE bookings SET user_id = NULL WHERE user_id = :uid"),
        {"uid": user_id}
    )

    # 3. Delete related records that are fully owned by the user
    db.query(Notification).filter(Notification.user_id == user_id).delete()
    db.query(ActivityLog).filter(ActivityLog.user_id == user_id).delete()

    # 4. Nullify reviews authored by the user
    db.execute(
        text("UPDATE reviews SET user_id = NULL WHERE user_id = :uid"),
        {"uid": user_id}
    )

    # 5. Flush pending changes so FK constraint is clear before deletion
    db.flush()

    # 6. Now delete the user
    db.delete(user)

    log = ActivityLog(
        user_id=current_user.id,
        action="User Deleted",
        details=f"Deleted user account: {user.email}."
    )
    db.add(log)
    db.commit()
    return None


@router.delete("/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin", "Manager"]))
):
    """Admin/Manager: permanently delete a booking and its related records."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    # Mark room as available again if it was occupied
    if booking.room:
        booking.room.is_available = True

    db.delete(booking)

    log = ActivityLog(
        user_id=current_user.id,
        action="Booking Deleted",
        details=f"Deleted booking {booking.booking_code}."
    )
    db.add(log)
    db.commit()
    return None
