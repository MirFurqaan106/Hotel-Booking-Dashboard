import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add path resolution
sys.path.append(str(Path(__file__).resolve().parent))

from app.main import app

client = TestClient(app)

def verify_business_logic():
    print("====================================================")
    print("PHASE 3: CORE BUSINESS LOGIC & PAYMENT API VERIFICATION")
    print("====================================================")

    # 1. Fetch hotels
    print("[Verification] Querying public Hotels registry...")
    hotels_res = client.get("/hotels")
    assert hotels_res.status_code == 200, "Hotels fetch failed"
    hotels = hotels_res.json()
    print(f"[OK] Found {len(hotels)} approved hotels. Primary: '{hotels[0].get('name')}' in {hotels[0].get('city')}")
    hotel_id = hotels[0].get("id")

    # 2. Fetch rooms
    print("[Verification] Querying hotel Rooms...")
    rooms_res = client.get(f"/hotels/{hotel_id}/rooms")
    assert rooms_res.status_code == 200, "Rooms fetch failed"
    rooms = rooms_res.json()
    print(f"[OK] Found {len(rooms)} rooms. Type of first: '{rooms[0].get('room_type')}' Price: ${rooms[0].get('price_per_night')}")
    room_id = rooms[0].get("id")

    # 3. Retrieve login token for Aarav Sharma (Customer account seeded)
    print("[Verification] Log in as Customer (guest@panunghar.com)...")
    login_res = client.post(
        "/auth/login",
        data={"username": "guest@panunghar.com", "password": "User@123"}
    )
    assert login_res.status_code == 200, "Customer login failed"
    token = login_res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Check slot availability
    print("[Verification] Checking scheduling slot availability...")
    avail_res = client.get(
        f"/bookings/check-availability?room_id={room_id}&check_in=2026-08-10&check_out=2026-08-15"
    )
    assert avail_res.status_code == 200, "Availability check failed"
    print(f"[OK] Slot check result: available = {avail_res.json().get('available')}")

    # 5. Place valid booking reservation
    print("[Verification] Booking room...")
    book_res = client.post(
        "/bookings",
        json={
            "room_id": room_id,
            "check_in": "2026-08-10",
            "check_out": "2026-08-15",
            "payment_option": "Token"
        },
        headers=headers
    )
    assert book_res.status_code == 201, "Booking failed"
    booking = book_res.json()
    booking_id = booking.get("id")
    print(f"[OK] Booking created successfully: ID {booking_id} | Code: {booking.get('booking_code')} | Status: {booking.get('booking_status')} | Paid: ${booking.get('paid_amount')}/${booking.get('total_amount')}")

    # 6. Test overlapping check (should block)
    print("[Verification] Attempting overlapping double-booking on same room...")
    overlap_res = client.post(
        "/bookings",
        json={
            "room_id": room_id,
            "check_in": "2026-08-12",
            "check_out": "2026-08-17",
            "payment_option": "Later"
        },
        headers=headers
    )
    assert overlap_res.status_code == 400, "Overlapping validation bypassed!"
    print(f"[OK] Duplicate overlap successfully blocked: Status {overlap_res.status_code} ({overlap_res.json().get('detail')})")

    # 7. Test Coupon code check
    print("[Verification] Checking coupon discount validation...")
    coupon_res = client.get("/coupons/verify?code=WELCOME10")
    assert coupon_res.status_code == 200, "Coupon verification failed"
    print(f"[OK] Coupon validated: Discount {coupon_res.json().get('discount_percent')}% off")

    # 8. Test Razorpay mock verify
    print("[Verification] Simulating Razorpay verify dispatch...")
    pay_res = client.post(
        "/payments/verify",
        json={
            "booking_id": booking_id,
            "transaction_id": "txn_razorpay_9988776655",
            "amount": 3500,
            "payment_status": "Success"
        },
        headers=headers
    )
    assert pay_res.status_code == 201, "Payment verification failed"
    pay_record = pay_res.json()
    print(f"[OK] Payment transaction registered: ID {pay_record.get('id')} | Status: {pay_record.get('payment_status')}")

    # 9. Verify Booking status transitioned to Confirmed after payment success
    my_books = client.get("/bookings/my", headers=headers).json()
    my_booking = next(b for b in my_books if b["id"] == booking_id)
    print(f"[OK] Final Booking State: Status: {my_booking.get('booking_status')} | Paid amount updated: ${my_booking.get('paid_amount')}")
    assert my_booking.get("booking_status") == "Confirmed", "Booking status fail to transition"

    print("\n[SUCCESS] ALL PHASE 3 BOOKING FLOWS, SCHEDULER ALGORITHMS AND PAYMENT APIS WORK FLAWLESSLY!")
    print("====================================================")

if __name__ == "__main__":
    verify_business_logic()
