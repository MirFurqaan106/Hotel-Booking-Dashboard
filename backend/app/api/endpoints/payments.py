from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.models import Booking, Payment, User, ActivityLog
from app.schemas.schemas import PaymentCreate, PaymentResponse
from app.api.deps import get_current_user, RoleChecker
from app.services.email import EmailService

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/verify", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def verify_payment(
    payment_in: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Retrieve and validate booking
    booking = db.query(Booking).filter(Booking.id == payment_in.booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking reservation not found"
        )
        
    # Check if transaction ID is already registered
    existing_pay = db.query(Payment).filter(Payment.transaction_id == payment_in.transaction_id).first()
    if existing_pay:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction ID already verified"
        )
        
    # 2. Add Payment record
    new_payment = Payment(
        booking_id=payment_in.booking_id,
        transaction_id=payment_in.transaction_id,
        amount=payment_in.amount,
        payment_status=payment_in.payment_status,
        gateway="Razorpay"
    )
    db.add(new_payment)
    
    # 3. Update Booking Paid status if payment is Success
    if payment_in.payment_status == "Success":
        booking.paid_amount = min(booking.paid_amount + payment_in.amount, booking.total_amount)
        booking.booking_status = "Confirmed"
        
    # 4. Log Action
    log = ActivityLog(
        user_id=current_user.id,
        action="Payment Verified",
        details=f"Verified Razorpay txn {payment_in.transaction_id} for booking {booking.booking_code}. Status: {payment_in.payment_status}."
    )
    db.add(log)
    db.commit()
    db.refresh(new_payment)
    
    # 5. Dispatch Confirmation email
    if payment_in.payment_status == "Success":
        subject = f"[Panun Ghar] Booking Confirmed: {booking.booking_code}"
        body_text = f"Payment of ${payment_in.amount} received successfully. Reservation {booking.booking_code} is Confirmed!"
        body_html = f"""
        <html>
            <body>
                <h2>Payment Success & Booking Confirmed!</h2>
                <p>Hello {current_user.full_name}, we have received your payment of <strong>${payment_in.amount}</strong>.</p>
                <p><strong>Booking Ref:</strong> {booking.booking_code}<br/>
                   <strong>Transaction ID:</strong> {payment_in.transaction_id}</p>
                <p>Enjoy your stay at Panun Ghar!</p>
            </body>
        </html>
        """
        EmailService.send_email(current_user.email, subject, body_html, body_text)
        
    return new_payment


@router.get("/history", response_model=List[PaymentResponse])
def get_payment_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Retrieve payments associated with user's bookings
    return db.query(Payment).join(Booking).filter(Booking.user_id == current_user.id).all()


@router.post("/{payment_id}/refund", response_model=PaymentResponse)
def refund_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Manager", "Admin"]))
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment transaction not found"
        )
        
    if payment.payment_status == "Refunded":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction is already refunded"
        )
        
    # Mark payment as refunded
    payment.payment_status = "Refunded"
    
    # Mark booking as cancelled
    booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
    if booking:
        booking.booking_status = "Cancelled"
        booking.paid_amount = max(booking.paid_amount - payment.amount, 0)
        
    log = ActivityLog(
        user_id=current_user.id,
        action="Refund Dispatched",
        details=f"Refunded transaction {payment.transaction_id} (Amount: {payment.amount})."
    )
    db.add(log)
    db.commit()
    db.refresh(payment)
    
    return payment
