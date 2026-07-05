from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.models import User
from app.utils.jwt import decode_token
from app.config.config import settings

# Configure OAuth2 client security schemes matching Swagger UI Authorize
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate session credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decode access token
    payload = decode_token(token, settings.JWT_SECRET_KEY)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception
        
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )
        
    return user


class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role_name not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Operation not permitted for your security role"
            )
        return current_user
