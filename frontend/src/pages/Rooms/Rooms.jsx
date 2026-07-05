import React, { useState, useEffect, useMemo } from 'react';
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
import api from '../../services/api';
import './Rooms.css';

const Rooms = () => {
  const { allBookings, loadLiveBookings } = useDashboard();
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [dbRooms, setDbRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRoomsData = async () => {
    setLoading(true);
    try {
      await loadLiveBookings();
      const res = await api.get('/hotels/1/rooms');
      setDbRooms(res.data);
    } catch (err) {
      console.error("Error loading rooms list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomsData();
  }, []);

  // Map backend rooms with active bookings to determine occupied vs. ready rooms
  const rooms = useMemo(() => {
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

    return dbRooms.map(r => {
      const occupancy = occupiedMap[r.room_number] || null;
      return {
        roomNumber: r.room_number,
        roomType: r.room_type,
        price: r.price_per_night,
        facilities: [FiWifi, FiTv, FiWind, FiCoffee],
        rating: "4.9",
        occupancy: occupancy, // Null means available, object means occupied
        available: occupancy === null
      };
    }).sort((a, b) => a.roomNumber - b.roomNumber);
  }, [dbRooms, allBookings]);

  // Filter Rooms
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

  if (loading) return <div className="loading-spinner-box">Loading rooms status...</div>;

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
            <option value="Deluxe Suite">Deluxe Suites</option>
            <option value="Executive Suite">Executive Suites</option>
            <option value="President Suite">President Suites</option>
            <option value="Heritage Suite">Heritage Suites</option>
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
              <span className="room-price-night">₹{room.price} <span className="night-text">/ night</span></span>
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
