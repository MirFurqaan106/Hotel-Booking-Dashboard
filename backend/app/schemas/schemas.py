from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date

# ==========================================
# AUTHENTICATION & TOKENS SCHEMAS
# ==========================================

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


class OTPVerify(BaseModel):
    email: EmailStr
    code: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

# ==========================================
# USER SCHEMAS
# ==========================================

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role_name: Optional[str] = "User"  # User, Manager, Admin


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# HOTEL SCHEMAS
# ==========================================

class HotelBase(BaseModel):
    name: str
    description: Optional[str] = None
    address: str
    city: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class HotelCreate(HotelBase):
    pass


class HotelResponse(HotelBase):
    id: int
    manager_id: int
    is_approved: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# ROOM SCHEMAS
# ==========================================

class RoomBase(BaseModel):
    room_type: str  # Single Room, Double Room, Deluxe Suite, President Suite
    room_number: int
    price_per_night: int
    is_available: Optional[bool] = True


class RoomCreate(RoomBase):
    pass


class RoomResponse(RoomBase):
    id: int
    hotel_id: int

    class Config:
        from_attributes = True

# ==========================================
# BOOKING SCHEMAS
# ==========================================

class BookingBase(BaseModel):
    room_id: int
    check_in: date
    check_out: date
    payment_option: str = "Later"  # Full, Token, Later


class BookingCreate(BookingBase):
    pass


class BookingResponse(BaseModel):
    id: int
    booking_code: str
    user_id: int
    room_id: int
    check_in: date
    check_out: date
    booking_status: str
    total_amount: int
    paid_amount: int
    payment_option: str
    created_at: datetime
    room: Optional[RoomResponse] = None

    class Config:
        from_attributes = True

# ==========================================
# PAYMENT SCHEMAS
# ==========================================

class PaymentCreate(BaseModel):
    booking_id: int
    transaction_id: str
    amount: int
    payment_status: str = "Success"  # Success, Failed, Refunded


class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    transaction_id: str
    amount: int
    payment_status: str
    gateway: str
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# REVIEW SCHEMAS
# ==========================================

class ReviewCreate(BaseModel):
    booking_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewReply(BaseModel):
    response: str


class ReviewResponse(BaseModel):
    id: int
    booking_id: int
    user_id: int
    rating: int
    comment: Optional[str] = None
    response: Optional[str] = None
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# ==========================================
# COUPON SCHEMAS
# ==========================================

class CouponBase(BaseModel):
    code: str
    discount_percent: int = Field(..., ge=1, le=100)
    is_active: Optional[bool] = True
    expires_at: date


class CouponCreate(CouponBase):
    pass


class CouponResponse(CouponBase):
    id: int

    class Config:
        from_attributes = True

# ==========================================
# NOTIFICATION SCHEMAS
# ==========================================

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
