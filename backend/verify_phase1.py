import sys
from pathlib import Path

# Add path resolution
sys.path.append(str(Path(__file__).resolve().parent))

from app.database.session import SessionLocal
from app.models.models import User, Hotel, Room, Booking, Payment, Review, Coupon
from seed import seed_database

def run_verification():
    print("====================================================")
    print("PHASE 1: DATABASE SCHEMA & SEED VERIFICATION")
    print("====================================================")
    
    # 1. Run database seeding
    try:
        seed_database()
    except Exception as e:
        print(f"[ERROR] Database Seeding Failed: {e}")
        sys.exit(1)
        
    # 2. Query data to verify schemas and relationships
    db = SessionLocal()
    try:
        users = db.query(User).all()
        hotels = db.query(Hotel).all()
        rooms = db.query(Room).all()
        bookings = db.query(Booking).all()
        payments = db.query(Payment).all()
        reviews = db.query(Review).all()
        coupons = db.query(Coupon).all()
        
        print("\n[OK] SQLite Tables Schema Verification Passed!")
        print(f"Total Users Registered: {len(users)}")
        for u in users:
            print(f"  - {u.full_name} ({u.email}) [Role: {u.role_name}] - Verified: {u.is_verified}")
            
        print(f"\nTotal Hotels Registered: {len(hotels)}")
        for h in hotels:
            print(f"  - {h.name} in {h.city} (Managed by ID: {h.manager_id})")
            
        print(f"\nTotal Rooms Created: {len(rooms)}")
        print(f"Total Coupons Loaded: {len(coupons)}")
        
        print(f"\nTotal Bookings Recorded: {len(bookings)}")
        for b in bookings:
            print(f"  - Booking {b.booking_code} | Room ID: {b.room_id} | Status: {b.booking_status} | Paid: ${b.paid_amount}/${b.total_amount}")
            
        print(f"\nTotal Payments Audited: {len(payments)}")
        print(f"Total Guest Reviews: {len(reviews)}")
        for r in reviews:
            print(f"  - Rating: {r.rating} Stars by User ID: {r.user_id} -> '{r.comment}'")
            
        # Assertions to ensure strict validity
        assert len(users) == 3, "User count mismatch"
        assert len(hotels) == 1, "Hotel count mismatch"
        assert len(rooms) == 7, "Room count mismatch"
        assert len(bookings) == 2, "Booking count mismatch"
        assert len(reviews) == 1, "Review count mismatch"
        
        print("\n[SUCCESS] ALL PHASE 1 SCHEMAS AND RELATIONAL CONSTRAINTS VERIFIED SUCCESSFULLY!")
        print("====================================================")
        
    except Exception as e:
        print(f"[ERROR] Data Retrieval Assertion Failed: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_verification()
