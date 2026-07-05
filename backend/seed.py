import sys
from pathlib import Path
from datetime import datetime, date, timedelta
from passlib.context import CryptContext

# Set up path resolution to import from app
sys.path.append(str(Path(__file__).resolve().parent))

from app.database.session import engine, SessionLocal, Base
from app.models.models import User, Hotel, Room, Booking, Payment, Invoice, Review, Coupon

# Setup password encryptor
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def seed_database():
    print("[Database Seed] Connecting to SQLite database...")
    
    # Recreate all tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        print("[Database Seed] Generating Roles and Users...")
        
        # 1. Create Default Users
        admin_pass = get_password_hash("Admin@123")
        manager_pass = get_password_hash("Manager@123")
        user_pass = get_password_hash("User@123")
        
        # Admin User
        admin_user = User(
            email="admin@panunghar.com",
            hashed_password=admin_pass,
            full_name="Mir Furqaan",
            phone="+91 7889984798",
            role_name="Admin",
            is_active=True,
            is_verified=True
        )
        # Manager User
        manager_user = User(
            email="manager@panunghar.com",
            hashed_password=manager_pass,
            full_name="Suhail Bhat",
            phone="+91 94190 11223",
            role_name="Manager",
            is_active=True,
            is_verified=True
        )
        # Registered Customer
        registered_user = User(
            email="guest@panunghar.com",
            hashed_password=user_pass,
            full_name="Aarav Sharma",
            phone="+91 91490 55667",
            role_name="User",
            is_active=True,
            is_verified=True
        )
        
        db.add(admin_user)
        db.add(manager_user)
        db.add(registered_user)
        db.flush() # Flush to retrieve primary keys
        
        print("[Database Seed] Creating Hotel 'Panun Ghar'...")
        
        # 2. Create Default Hotel
        hotel = Hotel(
            name="Panun Ghar Luxury Resort",
            description="A premium heritage-infused sanctuary designed for comfort, luxury, and cultural connection in Kashmir. Nestled near Dal Lake amidst beautiful pine-forested slopes, offering private cinema theater rooms, organic gardens, heated swimming pools, and traditional hospitality.",
            address="Near Dal Lake, Srinagar, Kashmir - 190001",
            city="Srinagar",
            email="panunghar@example.com",
            phone="+91 7889984798",
            manager_id=manager_user.id,
            is_approved=True
        )
        db.add(hotel)
        db.flush()
        
        print("[Database Seed] Seeding Rooms...")
        
        # 3. Create Default Rooms
        rooms_list = [
            Room(hotel_id=hotel.id, room_type="Single Room", room_number=101, price_per_night=90, is_available=True),
            Room(hotel_id=hotel.id, room_type="Single Room", room_number=102, price_per_night=90, is_available=True),
            Room(hotel_id=hotel.id, room_type="Double Room", room_number=201, price_per_night=140, is_available=True),
            Room(hotel_id=hotel.id, room_type="Double Room", room_number=202, price_per_night=140, is_available=True),
            Room(hotel_id=hotel.id, room_type="Deluxe Suite", room_number=301, price_per_night=240, is_available=True),
            Room(hotel_id=hotel.id, room_type="Deluxe Suite", room_number=302, price_per_night=240, is_available=True),
            Room(hotel_id=hotel.id, room_type="President Suite", room_number=501, price_per_night=550, is_available=True)
        ]
        for r in rooms_list:
            db.add(r)
        db.flush()
        
        print("[Database Seed] Seeding Coupons...")
        
        # 4. Create Coupons
        coupon1 = Coupon(
            code="WELCOME10",
            discount_percent=10,
            is_active=True,
            expires_at=date.today() + timedelta(days=90)
        )
        coupon2 = Coupon(
            code="KASHMIR20",
            discount_percent=20,
            is_active=True,
            expires_at=date.today() + timedelta(days=90)
        )
        db.add(coupon1)
        db.add(coupon2)
        
        print("[Database Seed] Seeding Bookings, Payments, Invoices, and Reviews...")
        
        # 5. Create Checked Out Booking
        booking_checkout = Booking(
            booking_code="HB-1001",
            user_id=registered_user.id,
            room_id=rooms_list[4].id, # Deluxe Suite 301
            check_in=date.today() - timedelta(days=7),
            check_out=date.today() - timedelta(days=3),
            booking_status="Checked Out",
            total_amount=960, # 4 nights * 240
            paid_amount=960,
            payment_option="Full"
        )
        db.add(booking_checkout)
        db.flush()
        
        # Add payment log for checked out booking
        pay_checkout = Payment(
            booking_id=booking_checkout.id,
            transaction_id="pay_checkout_123456",
            amount=960,
            payment_status="Success",
            gateway="Razorpay"
        )
        db.add(pay_checkout)
        
        # Add invoice log
        invoice_checkout = Invoice(
            booking_id=booking_checkout.id,
            invoice_code="INV-1001"
        )
        db.add(invoice_checkout)
        
        # Add review log
        review_checkout = Review(
            booking_id=booking_checkout.id,
            user_id=registered_user.id,
            rating=5,
            comment="A perfect stay at Panun Ghar! The Deluxe Suite rooms are spacious, and the manager Suhail was very polite. We spent a evening watching movies in their private cinema theater! Will return soon."
        )
        db.add(review_checkout)

        # 6. Create Active/Confirmed Booking
        booking_confirmed = Booking(
            booking_code="HB-1002",
            user_id=registered_user.id,
            room_id=rooms_list[6].id, # President Suite 501
            check_in=date.today() + timedelta(days=2),
            check_out=date.today() + timedelta(days=5),
            booking_status="Confirmed",
            total_amount=1650, # 3 nights * 550
            paid_amount=100, # Token amount pay
            payment_option="Token"
        )
        db.add(booking_confirmed)
        db.flush()
        
        pay_confirmed = Payment(
            booking_id=booking_confirmed.id,
            transaction_id="pay_token_654321",
            amount=100,
            payment_status="Success",
            gateway="Razorpay"
        )
        db.add(pay_confirmed)
        
        invoice_confirmed = Invoice(
            booking_id=booking_confirmed.id,
            invoice_code="INV-1002"
        )
        db.add(invoice_confirmed)
        
        db.commit()
        print("[Database Seed] Database seeded successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"[Database Seed] Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
