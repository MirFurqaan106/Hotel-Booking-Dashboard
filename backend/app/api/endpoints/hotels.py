from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.session import get_db
from app.models.models import Hotel, Room, User
from app.schemas.schemas import HotelCreate, HotelResponse, RoomCreate, RoomResponse
from app.api.deps import get_current_user, RoleChecker

router = APIRouter(prefix="/hotels", tags=["Hotels & Rooms"])

@router.get("", response_model=List[HotelResponse])
def get_hotels(
    city: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Hotel).filter(Hotel.is_approved == True)
    
    if city:
        query = query.filter(Hotel.city.ilike(f"%{city}%"))
        
    if search:
        query = query.filter(Hotel.name.ilike(f"%{search}%") | Hotel.description.ilike(f"%{search}%"))
        
    return query.all()


@router.get("/{hotel_id}", response_model=HotelResponse)
def get_hotel_details(hotel_id: int, db: Session = Depends(get_db)):
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    if not hotel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel not found"
        )
    return hotel


@router.post("", response_model=HotelResponse, status_code=status.HTTP_201_CREATED)
def create_hotel(
    hotel_in: HotelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Manager", "Admin"]))
):
    new_hotel = Hotel(
        name=hotel_in.name,
        description=hotel_in.description,
        address=hotel_in.address,
        city=hotel_in.city,
        email=hotel_in.email,
        phone=hotel_in.phone,
        manager_id=current_user.id,
        is_approved=(current_user.role_name == "Admin") # Auto-approve for admin
    )
    db.add(new_hotel)
    db.commit()
    db.refresh(new_hotel)
    return new_hotel


@router.get("/{hotel_id}/rooms", response_model=List[RoomResponse])
def get_hotel_rooms(
    hotel_id: int,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    room_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Room).filter(Room.hotel_id == hotel_id)
    
    if min_price is not None:
        query = query.filter(Room.price_per_night >= min_price)
    if max_price is not None:
        query = query.filter(Room.price_per_night <= max_price)
    if room_type:
        query = query.filter(Room.room_type == room_type)
        
    return query.all()


@router.post("/{hotel_id}/rooms", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def add_room_to_hotel(
    hotel_id: int,
    room_in: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Manager", "Admin"]))
):
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    if not hotel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel not found"
        )
        
    # Verify Manager ownership
    if current_user.role_name == "Manager" and hotel.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation rejected: You do not manage this hotel"
        )
        
    new_room = Room(
        hotel_id=hotel_id,
        room_type=room_in.room_type,
        room_number=room_in.room_number,
        price_per_night=room_in.price_per_night,
        is_available=room_in.is_available
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room


@router.put("/rooms/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: int,
    room_in: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Manager", "Admin"]))
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
        
    hotel = db.query(Hotel).filter(Hotel.id == room.hotel_id).first()
    if current_user.role_name == "Manager" and hotel.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation rejected: You do not manage this hotel"
        )
        
    room.room_type = room_in.room_type
    room.room_number = room_in.room_number
    room.price_per_night = room_in.price_per_night
    room.is_available = room_in.is_available
    
    db.commit()
    db.refresh(room)
    return room
