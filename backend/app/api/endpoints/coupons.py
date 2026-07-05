from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import List

from app.database.session import get_db
from app.models.models import Coupon, User
from app.schemas.schemas import CouponCreate, CouponResponse
from app.api.deps import get_current_user, RoleChecker

router = APIRouter(prefix="/coupons", tags=["Coupons"])

@router.get("", response_model=List[CouponResponse])
def get_coupons(db: Session = Depends(get_db)):
    return db.query(Coupon).filter(Coupon.is_active == True, Coupon.expires_at >= date.today()).all()


@router.post("", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
def create_coupon(
    coupon_in: CouponCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    existing = db.query(Coupon).filter(Coupon.code == coupon_in.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon code already exists"
        )
        
    new_coupon = Coupon(
        code=coupon_in.code,
        discount_percent=coupon_in.discount_percent,
        is_active=coupon_in.is_active,
        expires_at=coupon_in.expires_at
    )
    db.add(new_coupon)
    db.commit()
    db.refresh(new_coupon)
    return new_coupon


@router.get("/verify")
def verify_coupon(
    code: str = Query(...),
    db: Session = Depends(get_db)
):
    coupon = db.query(Coupon).filter(
        Coupon.code == code,
        Coupon.is_active == True,
        Coupon.expires_at >= date.today()
    ).first()
    
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid, expired or inactive coupon code"
        )
        
    return {
        "valid": True,
        "code": coupon.code,
        "discount_percent": coupon.discount_percent
    }
