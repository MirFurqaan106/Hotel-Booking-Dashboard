from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.models import Review, Booking, User, Hotel, Room
from app.schemas.schemas import ReviewCreate, ReviewResponse, ReviewReply
from app.api.deps import get_current_user, RoleChecker

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.get("", response_model=List[ReviewResponse])
def get_all_reviews(db: Session = Depends(get_db)):
    return db.query(Review).all()


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_review(
    review_in: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Retrieve and validate booking
    booking = db.query(Booking).filter(Booking.id == review_in.booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking reservation not found"
        )
        
    # Verify booking ownership
    if booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation rejected: You do not own this booking"
        )
        
    # Verify stay complete
    if booking.booking_status != "Checked Out":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reviews can only be submitted for completed stay checkouts"
        )
        
    # Check if review already exists
    existing = db.query(Review).filter(Review.booking_id == review_in.booking_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Review already submitted for this reservation"
        )
        
    new_review = Review(
        booking_id=review_in.booking_id,
        user_id=current_user.id,
        rating=review_in.rating,
        comment=review_in.comment
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review


@router.post("/{review_id}/respond", response_model=ReviewResponse)
def respond_to_review(
    review_id: int,
    reply: ReviewReply,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Manager", "Admin"]))
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
        
    # Verify manager permissions for the targeted hotel
    if current_user.role_name == "Manager":
        booking = db.query(Booking).filter(Booking.id == review.booking_id).first()
        room = db.query(Room).filter(Room.id == booking.room_id).first()
        hotel = db.query(Hotel).filter(Hotel.id == room.hotel_id).first()
        
        if hotel.manager_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation rejected: You do not manage this hotel"
            )
            
    review.response = reply.response
    db.commit()
    db.refresh(review)
    return review
