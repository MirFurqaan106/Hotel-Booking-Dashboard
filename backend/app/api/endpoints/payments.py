from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import requests
import hmac
import hashlib

from app.database.session import get_db
from app.models.models import Booking, Payment, User, ActivityLog
from app.schemas.schemas import PaymentCreate, PaymentResponse, RazorpayOrderResponse, RazorpaySignatureVerify
from app.api.deps import get_current_user, RoleChecker
from app.services.email import EmailService
from app.config.config import settings

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/create-order", response_model=RazorpayOrderResponse)
def create_razorpay_order(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Retrieve the booking
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking reservation not found"
        )
    
    # 2. Determine stay pricing details (Token vs Full)
    if booking.payment_option == "Token":
        # Dynamic 20% token rate
        amount_in_rupees = int(booking.total_amount * 0.20)
    else:
        # Full payment
        amount_in_rupees = booking.total_amount
        
    amount_in_paise = amount_in_rupees * 100 # Razorpay requires paise
    
    # 3. Call Razorpay API to create an order
    try:
        auth = (settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        payload = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": f"receipt_{booking.booking_code}",
            "payment_capture": 1
        }
        res = requests.post(
            "https://api.razorpay.com/v1/orders",
            json=payload,
            auth=auth
        )
        if res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Razorpay Order creation failed: {res.text}"
            )
        order_data = res.json()
        return RazorpayOrderResponse(
            order_id=order_data["id"],
            amount=amount_in_paise,
            currency="INR",
            key_id=settings.RAZORPAY_KEY_ID
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error contacting Razorpay payment gateway: {str(e)}"
        )


@router.post("/verify-signature", status_code=status.HTTP_200_OK)
def verify_razorpay_signature(
    verification: RazorpaySignatureVerify,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Retrieve the booking
    booking = db.query(Booking).filter(Booking.id == verification.booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking reservation not found"
        )
        
    # 2. Verify signature
    msg = f"{verification.razorpay_order_id}|{verification.razorpay_payment_id}"
    generated_sig = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
        msg.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(generated_sig, verification.razorpay_signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Razorpay Signature mismatch. Payment validation failed."
        )
        
    # 3. Signature is verified successfully. Create a successful payment log record.
    # Determine the transaction amount in rupees
    if booking.payment_option == "Token":
        amount_in_rupees = int(booking.total_amount * 0.20)
    else:
        amount_in_rupees = booking.total_amount
        
    new_payment = Payment(
        booking_id=verification.booking_id,
        transaction_id=verification.razorpay_payment_id,
        amount=amount_in_rupees,
        payment_status="Success",
        gateway="Razorpay"
    )
    db.add(new_payment)
    
    # 4. Confirm the booking stay
    booking.paid_amount = min(booking.paid_amount + amount_in_rupees, booking.total_amount)
    booking.booking_status = "Confirmed"
    
    # 5. Log action
    log = ActivityLog(
        user_id=current_user.id,
        action="Razorpay Payment Verified",
        details=f"Securely verified signature for order {verification.razorpay_order_id}. Txn: {verification.razorpay_payment_id}. Booking: {booking.booking_code}"
    )
    db.add(log)
    db.commit()
    
    # 6. Dispatch Confirmation Email
    try:
        subject = f"[Panun Ghar] Booking Confirmed: {booking.booking_code}"
        body_text = f"Payment of ₹{amount_in_rupees} received successfully via Razorpay. Reservation {booking.booking_code} is Confirmed!"
        body_html = f"""
        <html>
            <body>
                <h2 style="color: #2563eb;">Payment Success & Booking Confirmed!</h2>
                <p>Hello {current_user.full_name}, we have received your payment of <strong>₹{amount_in_rupees}</strong>.</p>
                <p><strong>Booking Ref:</strong> {booking.booking_code}<br/>
                   <strong>Transaction ID:</strong> {verification.razorpay_payment_id}</p>
                <p>Enjoy your stay at Panun Ghar Resort, Srinagar!</p>
            </body>
        </html>
        """
        EmailService.send_email(current_user.email, subject, body_html, body_text)
    except Exception as email_err:
        print(f"Error dispatching email: {email_err}")
        
    return {"message": "Signature verified successfully and booking confirmed."}


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
        body_text = f"Payment of ₹{payment_in.amount} received successfully. Reservation {booking.booking_code} is Confirmed!"
        body_html = f"""
        <html>
            <body>
                <h2 style="color: #2563eb;">Payment Success & Booking Confirmed!</h2>
                <p>Hello {current_user.full_name}, we have received your payment of <strong>₹{payment_in.amount}</strong>.</p>
                <p><strong>Booking Ref:</strong> {booking.booking_code}<br/>
                   <strong>Transaction ID:</strong> {payment_in.transaction_id}</p>
                <p>Enjoy your stay at Panun Ghar Resort, Srinagar!</p>
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
        
    payment.payment_status = "Refunded"
    
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
