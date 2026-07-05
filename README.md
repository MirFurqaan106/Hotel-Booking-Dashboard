# Panun Ghar Luxury Resort | Full-Stack Booking Management Engine

A production-grade, secure, and fully responsive Full-Stack Hotel Booking Engine and Management Dashboard built for **Panun Ghar Luxury Resort** (Srinagar, Kashmir). 

This project simulates a complete, interview-ready enterprise booking system (resembling Goibibo or Booking.com) featuring JWT session authentication, OTP account verification, database transaction safeguards, Razorpay payment simulations, and email notifications.

---

## 🛠️ System Architecture

```mermaid
graph TD
    A[React SPA Frontend] -->|Axios REST Requests| B[FastAPI Gateway Router]
    B -->|Middleware JWT / RBAC Check| C[FastAPI Auth & RBAC Security Layer]
    B -->|Business Operations| D[FastAPI Controllers]
    D -->|SQLAlchemy ORM| E[SQLite Relational Database]
    D -->|Simulated Webhook| F[Razorpay Gateway Payment verify]
    D -->|SMTP Service| G[Gmail Notification Dispatcher]
    
    subgraph Role Checker Guard
        C -->|Allows| Guest[Customer Room Booking]
        C -->|Allows| Manager[Room Status & Rates Control]
        C -->|Allows| Admin[Global Analytics & Coupons]
    end
```

---

## 💾 Relational Database ERD Schema

```mermaid
erDiagram
    Users ||--o{ Bookings : places
    Hotels ||--o{ Rooms : contains
    Rooms ||--o{ Bookings : reserved-in
    Bookings ||--|| Invoices : generates
    Bookings ||--o{ Payments : validates
    Bookings ||--|| Reviews : writes
    Users ||--o{ ActivityLogs : triggers
    Users ||--o{ OTPVerifications : verifies

    Users {
        int id PK
        string email UK
        string password_hash
        string full_name
        string phone
        string role_name
        boolean is_active
        datetime created_at
    }
    
    Hotels {
        int id PK
        string name
        string description
        string address
        string city
        string email
        string phone
        int manager_id FK
        boolean is_approved
    }

    Rooms {
        int id PK
        int hotel_id FK
        string room_type
        int room_number
        int price_per_night
        boolean is_available
    }

    Bookings {
        int id PK
        string booking_code UK
        int user_id FK
        int room_id FK
        date check_in
        date check_out
        string booking_status
        int total_amount
        int paid_amount
        string payment_option
        datetime created_at
    }

    Payments {
        int id PK
        int booking_id FK
        string transaction_id UK
        int amount
        string payment_status
        string gateway
        datetime created_at
    }
    
    Invoices {
        int id PK
        int booking_id FK
        string invoice_code UK
        datetime created_at
    }

    Reviews {
        int id PK
        int booking_id FK
        int user_id FK
        int rating
        string comment
        string response
        datetime created_at
    }
```

---

## 🔒 Cybersecurity & Production Safeguards

1. **Relational Parameterization**: All database query evaluations use the SQLAlchemy ORM layer. This automatically parameterizes inputs, rendering **SQL Injection (SQLi) impossible**.
2. **Password Crypt Hashing**: User passwords are never saved raw. They are processed using **Bcrypt with 12 rounds of salt** to secure user databases.
3. **Session Token Expirations**: Uses double-token JWTs:
   - **Access Token**: Valid for 60 minutes.
   - **Refresh Token**: Valid for 30 days. Auto-issued via Axios response interceptors on expired 401s without disrupting the client checkout loop.
4. **Role-Based Access Controls (RBAC)**: Fine-grained FastAPI endpoint dependency injections verify that user roles match permitted scopes (`User`, `Manager`, `Admin`).
5. **OTP Verification Expiry**: Email activation codes are limited to a **10-minute lifespan** in SQLite.
6. **No Hardcoded Secrets**: All configs (secrets, tokens, SMTP servers) are parsed from a secure `.env` file using Pydantic.

---

## 🚀 Setup & Quickstart

Deploy the complete full-stack environment instantly using Docker Compose:

### 1. Build and run containers
```bash
docker-compose up --build
```

- **Frontend App**: Served at `http://localhost` (Nginx port 80).
- **Backend API Docs**: Served at `http://localhost:8000/docs` (FastAPI Swagger UI).

### 2. Manual Development Setup

If you prefer running the servers locally for active debugging:

**Backend Setup:**
```bash
cd backend
python -m venv venv
# On Windows
.\venv\Scripts\activate
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --port 8000
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

---

## 👨‍💻 Project Ownership

- **Hotel Branding**: Panun Ghar Luxury Resort (Dal Lake, Srinagar, Kashmir)
- **Primary Owner**: Mir Furqaan
- **Primary Gmail**: `mirfurkaan106@gmail.com`
- **Contact Number**: `+91 7889984798`
