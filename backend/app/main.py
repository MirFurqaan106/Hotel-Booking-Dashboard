from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import auth, hotels, bookings, payments, coupons, reviews
from app.api.deps import get_current_user, RoleChecker
from app.models.models import User

app = FastAPI(
    title="Panun Ghar Booking Engine API",
    description="Production-grade secure backend API for Kashmiri luxury room bookings",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(hotels.router)
app.include_router(bookings.router)
app.include_router(payments.router)
app.include_router(coupons.router)
app.include_router(reviews.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Panun Ghar Booking API. Head to /docs for OpenAPI Swagger definition."}

# Test secure endpoints to verify RBAC
@app.get("/test/user-only")
def test_user_route(current_user: User = Depends(RoleChecker(["User", "Manager", "Admin"]))):
    return {"message": f"Hello {current_user.full_name}, you have USER privileges!"}

@app.get("/test/manager-only")
def test_manager_route(current_user: User = Depends(RoleChecker(["Manager", "Admin"]))):
    return {"message": f"Hello {current_user.full_name}, you have MANAGER privileges!"}

@app.get("/test/admin-only")
def test_admin_route(current_user: User = Depends(RoleChecker(["Admin"]))):
    return {"message": f"Hello {current_user.full_name}, you have ADMIN privileges!"}
