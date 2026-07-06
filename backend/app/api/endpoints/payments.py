from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import requests
import hmac
import hashlib
import uuid

from app.database.session import get_db
from app.models.models import Booking, Payment, User, ActivityLog
from app.schemas.schemas import (
    PaymentCreate, PaymentResponse, RazorpayOrderResponse,
    RazorpaySignatureVerify, ManualPaymentRecord, PaymentReminderRequest
)
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
    
    # 2. Determine pricing (initial payment vs paying remaining balance)
    remaining_balance = booking.total_amount - booking.paid_amount
    
    # If booking is already confirmed/pending and has some paid amount, we charge the remaining balance
    if booking.booking_status in ["Confirmed", "Pending", "Checked In"] and booking.paid_amount > 0:
        amount_in_rupees = remaining_balance
    else:
        # Initial checkout
        if booking.payment_option == "Token":
            amount_in_rupees = int(booking.total_amount * 0.20)
        else:
            amount_in_rupees = booking.total_amount

    if amount_in_rupees <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Outstanding balance is zero. No payment needed."
        )
        
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
    remaining_balance = booking.total_amount - booking.paid_amount
    if booking.booking_status in ["Confirmed", "Pending", "Checked In"] and booking.paid_amount > 0:
        amount_in_rupees = remaining_balance
    else:
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
    
    # 4. Confirm the booking stay and update paid status
    booking.paid_amount = min(booking.paid_amount + amount_in_rupees, booking.total_amount)
    if booking.paid_amount >= booking.total_amount:
        booking.payment_option = "Full"
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
        subject = f"[Panun Ghar] Booking Confirmed / Payment Success: {booking.booking_code}"
        body_text = f"Payment of ₹{amount_in_rupees} received successfully via Razorpay. Reservation {booking.booking_code} status updated."
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


# ─────────────────────────────────────────────────────────────────
# Manager / Admin: view all payments across all bookings
# ─────────────────────────────────────────────────────────────────

@router.get("/all", response_model=List[PaymentResponse])
def get_all_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Manager", "Admin"]))
):
    """Return all payment records for admin/manager view."""
    return db.query(Payment).order_by(Payment.created_at.desc()).all()


# ─────────────────────────────────────────────────────────────────
# Manager / Admin: record a manual offline payment (Cash / Card)
# ─────────────────────────────────────────────────────────────────

@router.post("/manual-record", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def record_manual_payment(
    req: ManualPaymentRecord,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Manager", "Admin"]))
):
    """
    Manager/Admin: record an offline payment received in cash or card at the desk.
    Updates the booking's paid_amount and confirms it if fully paid.
    """
    booking = db.query(Booking).filter(Booking.id == req.booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if req.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment amount must be positive")

    remaining = booking.total_amount - booking.paid_amount
    if req.amount > remaining:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Amount exceeds outstanding balance of ₹{remaining}"
        )

    # Generate a unique offline transaction reference
    txn_id = f"OFFLINE-{req.method.upper()}-{uuid.uuid4().hex[:10].upper()}"

    new_payment = Payment(
        booking_id=booking.id,
        transaction_id=txn_id,
        amount=req.amount,
        payment_status="Success",
        gateway=req.method  # Cash / Card / UPI
    )
    db.add(new_payment)

    booking.paid_amount += req.amount
    if booking.paid_amount >= booking.total_amount:
        booking.payment_option = "Full"
        if booking.booking_status not in ["Checked In", "Checked Out", "Cancelled"]:
            booking.booking_status = "Confirmed"

    log = ActivityLog(
        user_id=current_user.id,
        action="Manual Payment Recorded",
        details=f"{req.method} payment of ₹{req.amount} recorded for booking {booking.booking_code} by {current_user.full_name}. Note: {req.note or 'N/A'}"
    )
    db.add(log)
    db.commit()
    db.refresh(new_payment)

    # Notify guest by email if they have an account
    if booking.user and booking.user.email:
        try:
            subject = f"[Panun Ghar] Payment Received: {booking.booking_code}"
            body_html = f"""
            <html><body>
            <h2 style="color:#4f46e5;">Payment Received – Panun Ghar Resort</h2>
            <p>Dear {booking.user.full_name},</p>
            <p>We have received your <strong>{req.method}</strong> payment of <strong>₹{req.amount}</strong>
            for booking <strong>{booking.booking_code}</strong>.</p>
            <p>Total: ₹{booking.total_amount} &nbsp;|&nbsp; Paid: ₹{booking.paid_amount} &nbsp;|&nbsp;
            Balance: ₹{booking.total_amount - booking.paid_amount}</p>
            <p>Thank you for choosing Panun Ghar Resort, Srinagar!</p>
            </body></html>
            """
            EmailService.send_email(booking.user.email, subject, body_html, f"Payment of ₹{req.amount} received for {booking.booking_code}.")
        except Exception as e:
            print(f"Email notification error: {e}")

    return new_payment


# ─────────────────────────────────────────────────────────────────
# Manager / Admin: send payment reminder email to guest
# ─────────────────────────────────────────────────────────────────

@router.post("/send-reminder/{booking_id}", status_code=status.HTTP_200_OK)
def send_payment_reminder(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Manager", "Admin"]))
):
    """Send a payment due reminder email to the guest for an unpaid/partially paid booking."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    remaining = booking.total_amount - booking.paid_amount
    if remaining <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This booking has been fully paid.")

    if not booking.user or not booking.user.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No guest email associated with this booking.")

    subject = f"[Panun Ghar] Payment Reminder: {booking.booking_code}"
    body_html = f"""
    <html><body style="font-family: Arial, sans-serif; color: #1a1a2e; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 24px; color: white; text-align: center;">
        <h2 style="margin: 0; font-size: 1.5rem;">💳 Payment Reminder</h2>
        <p style="margin: 6px 0 0; opacity: 0.85;">Panun Ghar Resort, Srinagar</p>
      </div>
      <div style="padding: 28px;">
        <p>Dear <strong>{booking.user.full_name}</strong>,</p>
        <p>This is a friendly reminder that your booking <strong>{booking.booking_code}</strong>
        has an outstanding balance of <strong style="color:#4f46e5;">₹{remaining}</strong>.</p>
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin:4px 0;"><strong>Booking Ref:</strong> {booking.booking_code}</p>
          <p style="margin:4px 0;"><strong>Check-In:</strong> {booking.check_in}</p>
          <p style="margin:4px 0;"><strong>Check-Out:</strong> {booking.check_out}</p>
          <p style="margin:4px 0;"><strong>Total Amount:</strong> ₹{booking.total_amount}</p>
          <p style="margin:4px 0;"><strong>Amount Paid:</strong> ₹{booking.paid_amount}</p>
          <p style="margin:4px 0;"><strong style="color:#ef4444;">Balance Due:</strong> ₹{remaining}</p>
        </div>
        <p>You can settle the balance at the resort desk or online via your dashboard.</p>
        <p>Please contact us at <a href="mailto:info@panunghar.com">info@panunghar.com</a> or call +91-194-2501234 for any assistance.</p>
        <p style="color: #9ca3af; font-size: 0.8rem; margin-top: 24px;">
          This reminder was sent by {current_user.full_name} from Panun Ghar Resort Management.
        </p>
      </div>
    </div>
    </body></html>
    """
    body_text = f"Payment reminder for booking {booking.booking_code}. Balance due: ₹{remaining}. Please settle at the front desk."

    try:
        EmailService.send_email(booking.user.email, subject, body_html, body_text)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to send reminder email: {str(e)}")

    log = ActivityLog(
        user_id=current_user.id,
        action="Payment Reminder Sent",
        details=f"Reminder sent to {booking.user.email} for booking {booking.booking_code}. Balance: ₹{remaining}."
    )
    db.add(log)
    db.commit()

    return {"message": f"Payment reminder sent successfully to {booking.user.email}"}
