import os
from pathlib import Path
from dotenv import load_dotenv

# Locate and load the environment variables from the backend root
BASE_DIR = Path(__file__).resolve().parent.parent.parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "Panun Ghar Booking Engine"
    
    # Database - force absolute path inside the backend folder for SQLite
    DATABASE_URL: str = os.getenv("DATABASE_URL") or ""
    
    def __init__(self):
        # If DATABASE_URL is not set or is a relative sqlite URL, force absolute path inside the backend folder
        if not self.DATABASE_URL or self.DATABASE_URL.startswith("sqlite:///.") or "hotel_booking.db" in self.DATABASE_URL:
            # Force sqlite absolute path inside the backend directory
            backend_dir = Path(__file__).resolve().parent.parent.parent
            self.DATABASE_URL = f"sqlite:///{backend_dir}/hotel_booking.db"
    
    # JWT Auth
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "9a6e1dc285e68334468f7663e26bbbb6c128c11aa2319208a0d0a0b0c0d0e0f0")
    JWT_REFRESH_SECRET_KEY: str = os.getenv("JWT_REFRESH_SECRET_KEY", "1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # Gmail SMTP Notifier
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_SENDER_EMAIL: str = os.getenv("SMTP_SENDER_EMAIL", "mirfurkaan106@gmail.com")
    
    # Razorpay Developer API credentials
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_yourKeyIdHere")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "yourKeySecretHere")

settings = Settings()
