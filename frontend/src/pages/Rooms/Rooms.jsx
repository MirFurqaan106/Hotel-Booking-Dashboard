import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import Header from '../../components/Header/Header';
import { 
  FiTv, 
  FiWifi, 
  FiWind, 
  FiBriefcase, 
  FiCompass, 
  FiCoffee,
  FiStar,
  FiCheckCircle,
  FiXCircle,
  FiUser
} from 'react-icons/fi';
import './Rooms.css';

const Rooms = () => {
  const { allBookings } = useDashboard();
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // 1. Generate static rooms metadata (150 rooms total)
  const rooms = useMemo(() => {
    const tempRooms = [];
    
    // Room configs
    const configs = [
      { type: 'Single Room', basePrice: 90, floors: [1, 2], countPerFloor: 15, facilities: [FiWifi, FiTv, FiWind] },
      { type: 'Double Room', basePrice: 140, floors: [2, 3], countPerFloor: 15, facilities: [FiWifi, FiTv, FiWind, FiCoffee] },
      { type: 'Deluxe Suite', basePrice: 240, floors: [4], countPerFloor: 10, facilities: [FiWifi, FiTv, FiWind, FiCoffee, FiCompass, FiBriefcase] },
      { type: 'President Suite', basePrice: 550, floors: [5], countPerFloor: 5, facilities: [FiWifi, FiTv, FiWind, FiCoffee, FiCompass, FiBriefcase] }
    ];

    // Determine occupied rooms from active bookings (status = 'Checked In')
    const occupiedMap = {};
    allBookings.forEach(b => {
      if (b.BookingStatus === 'Checked In') {
        occupiedMap[b.RoomNumber] = {
          guestName: b.GuestName,
          checkOut: b.CheckOut,
          bookingId: b.BookingID
        };
      }
    });

    configs.forEach(config => {
      config.floors.forEach(floor => {
        for (let i = 1; i <= config.countPerFloor; i++) {
          const roomNum = floor * 100 + i;
          
          // Generate a rating based on historical reviews for that room, fallback to mock rating
          const historicalReviews = allBookings.filter(b => b.RoomNumber === roomNum && b.Rating);
          const avgRating = historicalReviews.length > 0
            ? (historicalReviews.reduce((sum, b) => sum + b.Rating, 0) / historicalReviews.length).toFixed(1)
            : (4.0 + Math.random() * 1.0).toFixed(1);

          const occupancy = occupiedMap[roomNum] || null;

          tempRooms.push({
            roomNumber: roomNum,
            roomType: config.type,
            price: config.basePrice,
            facilities: config.facilities,
            rating: avgRating,
            occupancy: occupancy, // Null means available, object means occupied
            available: occupancy === null
          });
        }
      });
    });

    return tempRooms.sort((a, b) => a.roomNumber - b.roomNumber);
  }, [allBookings]);

  // 2. Filter Rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      const typeMatches = selectedType === 'All' || r.roomType === selectedType;
      const statusMatches = selectedStatus === 'All' || 
        (selectedStatus === 'Available' && r.available) ||
        (selectedStatus === 'Occupied' && !r.available);
      
      return typeMatches && statusMatches;
    });
  }, [rooms, selectedType, selectedStatus]);

  // Group metrics
  const stats = useMemo(() => {
    const total = rooms.length;
    const occupied = rooms.filter(r => !r.available).length;
    const available = total - occupied;
    
    return { total, occupied, available };
  }, [rooms]);

  return (
    <div className="rooms-page page-container animate-fade-in">
      <Header title="Hotel Rooms Layout" subtitle="Track real-time room availability, inspect occupying guests, and review standard rates" />

      {/* Overview Cards */}
      <div className="rooms-stats-grid">
        <div className="stats-mini-card card">
          <span className="lbl">Total Hotel Rooms</span>
          <h3>{stats.total}</h3>
        </div>
        <div className="stats-mini-card card">
          <span className="lbl text-success">Available Rooms</span>
          <h3 className="text-success">{stats.available}</h3>
        </div>
        <div className="stats-mini-card card">
          <span className="lbl text-danger">Occupied Rooms</span>
          <h3 className="text-danger">{stats.occupied}</h3>
        </div>
      </div>

      {/* Filter controls */}
      <div className="rooms-filters card glass-panel">
        <div className="filter-group">
          <label>Room Category:</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="All">All Categories</option>
            <option value="Single Room">Single Rooms</option>
            <option value="Double Room">Double Rooms</option>
            <option value="Deluxe Suite">Deluxe Suites</option>
            <option value="President Suite">President Suites</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Occupied">Occupied</option>
          </select>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="rooms-grid">
        {filteredRooms.map((room) => (
          <div key={room.roomNumber} className={`room-card card ${room.available ? 'room-avail' : 'room-occ'}`}>
            {/* Visual Cover Gradients representing room types */}
            <div className={`room-cover cover-${room.roomType.toLowerCase().replace(/\s+/g, '-')}`}>
              <span className="room-badge-num">Room {room.roomNumber}</span>
              <span className="room-price-night">${room.price} <span className="night-text">/ night</span></span>
            </div>

            <div className="room-body">
              <div className="room-title-rating">
                <h4>{room.roomType}</h4>
                <div className="rating-tag">
                  <FiStar size={13} fill="currentColor" />
                  <span>{room.rating}</span>
                </div>
              </div>

              {/* Facility Icons */}
              <div className="facilities-row">
                {room.facilities.map((Icon, idx) => (
                  <div key={idx} className="facility-icon" title={Icon.name}>
                    <Icon size={14} />
                  </div>
                ))}
              </div>

              {/* Availability Banner */}
              <div className="availability-row">
                {room.available ? (
                  <div className="status-label text-success">
                    <FiCheckCircle size={16} />
                    <span>Ready for Check-In</span>
                  </div>
                ) : (
                  <div className="occupancy-info">
                    <div className="status-label text-danger">
                      <FiXCircle size={16} />
                      <span>Occupied</span>
                    </div>
                    <div className="occupant-details">
                      <FiUser size={12} />
                      <span className="occupant-name">{room.occupancy.guestName}</span>
                    </div>
                    <span className="out-date">Until {room.occupancy.checkOut}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rooms;
export { Rooms };
