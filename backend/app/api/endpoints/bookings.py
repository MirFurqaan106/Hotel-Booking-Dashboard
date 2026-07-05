from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List
from datetime import date, datetime

from app.database.session import get_db
from app.models.models import Booking, Room, User, Invoice, ActivityLog
from app.schemas.schemas import BookingCreate, BookingResponse
from app.api.deps import get_current_user, RoleChecker
from app.services.email import EmailService

router = APIRouter(prefix="/bookings", tags=["Bookings"])

# Reusable overlap validation algorithm
def check_room_overlap(db: Session, room_id: int, check_in: date, check_out: date) -> bool:
    if check_in >= check_out:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-In date must be before Check-Out date"
        )
        
    overlapping_booking = db.query(Booking).filter(
        Booking.room_id == room_id,
        Booking.booking_status.in_(["Confirmed", "Pending", "Checked In"]),
        and_(
            check_in < Booking.check_out,
            check_out > Booking.check_in
        )
    ).first()
    
    return overlapping_booking is not None


@router.get("/check-availability")
def check_availability(
    room_id: int = Query(...),
    check_in: date = Query(...),
    check_out: date = Query(...),
    db: Session = Depends(get_db)
):
    is_overlapping = check_room_overlap(db, room_id, check_in, check_out)
    return {"available": not is_overlapping}


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Retrieve and validate room existence
    room = db.query(Room).filter(Room.id == booking_in.room_id).first()
    if not room or not room.is_available:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room is not active or available"
        )
        
    # 2. Assert no booking scheduling overlaps
    if check_room_overlap(db, booking_in.room_id, booking_in.check_in, booking_in.check_out):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room is already reserved for the requested dates"
        )
        
    # 3. Calculate financial cost
    delta = booking_in.check_out - booking_in.check_in
    nights = max(delta.days, 1)
    total_amount = nights * room.price_per_night
    
    # Define paid amount based on option
    paid_amount = 0
    initial_status = "Pending"
    if booking_in.payment_option == "Later":
        initial_status = "Confirmed"
    elif booking_in.payment_option == "Token":
        paid_amount = 100 # Flat token rate
        initial_status = "Pending" # Becomes Confirmed on payment success
    elif booking_in.payment_option == "Full":
        paid_amount = total_amount
        initial_status = "Pending" # Becomes Confirmed on payment success
        
    # 4. Generate unique Booking ID code
    count = db.query(Booking).count()
    booking_code = f"HB-{1001 + count}"
    
    # 5. Insert Booking
    new_booking = Booking(
        booking_code=booking_code,
        user_id=current_user.id,
        room_id=booking_in.room_id,
        check_in=booking_in.check_in,
        check_out=booking_in.check_out,
        booking_status=initial_status,
        total_amount=total_amount,
        paid_amount=paid_amount,
        payment_option=booking_in.payment_option
    )
    db.add(new_booking)
    db.flush()
    
    # 6. Generate Invoice
    new_invoice = Invoice(
        booking_id=new_booking.id,
        invoice_code=f"INV-{1001 + count}"
    )
    db.add(new_invoice)
    
    # 7. Log Action
    log = ActivityLog(
        user_id=current_user.id,
        action="Booking Created",
        details=f"Created booking {booking_code} for room {room.room_number}. Status: {initial_status}."
    )
    db.add(log)
    db.commit()
    db.refresh(new_booking)
    
    # Dispatch Email notification if Confirmed
    if initial_status == "Confirmed":
        subject = f"[Panun Ghar] Booking Confirmation: {new_booking.booking_code}"
        body_text = f"Your reservation {new_booking.booking_code} is confirmed! Check-in: {new_booking.check_in}."
        body_html = f"""
        <html>
            <body>
                <h2>Booking Confirmed!</h2>
                <p>Hello {current_user.full_name}, your room reservation has been successfully confirmed.</p>
                <p><strong>Booking Ref:</strong> {new_booking.booking_code}<br/>
                   <strong>Check-In:</strong> {new_booking.check_in}<br/>
                   <strong>Check-Out:</strong> {new_booking.check_out}</p>
            </body>
        </html>
        """
        EmailService.send_email(current_user.email, subject, body_html, body_text)
        
    return new_booking


@router.get("", response_model=List[BookingResponse])
def get_all_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Manager", "Admin"]))
):
    if current_user.role_name == "Admin":
        return db.query(Booking).all()
    
    # Manager: fetch bookings for rooms belonging to hotels managed by current_user
    from app.models.models import Room, Hotel
    return db.query(Booking).join(Room).join(Hotel).filter(Hotel.manager_id == current_user.id).all()


@router.get("/my", response_model=List[BookingResponse])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Booking).filter(Booking.user_id == current_user.id).all()


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
        
    # Verify ownership or permissions
    if booking.user_id != current_user.id and current_user.role_name not in ["Manager", "Admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation rejected: You do not own this booking"
        )
        
    if booking.booking_status == "Cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking is already cancelled"
        )
        
    booking.booking_status = "Cancelled"
    
    log = ActivityLog(
        user_id=current_user.id,
        action="Booking Cancelled",
        details=f"Cancelled booking {booking.booking_code}. Refund status pending verify."
    )
    db.add(log)
    db.commit()
    db.refresh(booking)
    
    # Notify user
    subject = f"[Panun Ghar] Booking Cancellation: {booking.booking_code}"
    body_text = f"Your reservation {booking.booking_code} has been cancelled successfully."
    body_html = f"""
    <html>
        <body>
            <h2>Reservation Cancelled</h2>
            <p>Your room reservation {booking.booking_code} has been successfully cancelled.</p>
        </body>
    </html>
    """
    EmailService.send_email(current_user.user.email if hasattr(current_user, 'user') else current_user.email, subject, body_html, body_text)
    
    return booking


@router.post("/{booking_id}/status", response_model=BookingResponse)
def update_booking_status(
    booking_id: int,
    status_val: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Manager", "Admin"]))
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
        
    # Verify Manager ownership
    if current_user.role_name == "Manager":
        from app.models.models import Room, Hotel
        room = db.query(Room).filter(Room.id == booking.room_id).first()
        hotel = db.query(Hotel).filter(Hotel.id == room.hotel_id).first()
        if hotel.manager_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation rejected: You do not manage this hotel"
            )
            
    if status_val not in ["Confirmed", "Pending", "Checked In", "Checked Out", "Cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid booking status value"
        )
        
    booking.booking_status = status_val
    
    log = ActivityLog(
        user_id=current_user.id,
        action="Booking Status Updated",
        details=f"Updated booking {booking.booking_code} status to {status_val}."
    )
    db.add(log)
    db.commit()
    db.refresh(booking)
    return booking
