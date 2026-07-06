import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMapPin, FiCalendar, FiCompass, FiAward, FiStar, FiClock, FiVideo, FiMap } from 'react-icons/fi';
import api from '../../services/api';
import hotelExterior from '../../assets/hotel-exterior.jpg';
import hotelLiving from '../../assets/hotel-living.jpg';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  
  // Logged In User Bookings state
  const token = localStorage.getItem('access_token');
  const [myBookings, setMyBookings] = useState([]);
  const [myBookingsLoading, setMyBookingsLoading] = useState(false);

  const fetchMyBookings = async () => {
    setMyBookingsLoading(true);
    try {
      const res = await api.get('/bookings/my');
      setMyBookings(res.data);
    } catch (err) {
      console.error("Error loading my bookings on home page:", err);
    } finally {
      setMyBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyBookings();
    }
  }, [token]);

  // Filter for confirmed stays in future
  const upcomingStays = myBookings.filter(b => {
    if (b.booking_status === 'Cancelled') return false;
    const checkoutDate = new Date(b.check_out);
    const today = new Date();
    today.setHours(0,0,0,0);
    return checkoutDate >= today;
  });

  return (
    <div className="home-page animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section" style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.5)), url(${hotelExterior})` }}>
        <div className="hero-content">
          <span className="hero-welcome-badge">Dal Lake, Srinagar</span>
          <h1>Welcome to Panun Ghar Resort</h1>
          <p>A premium heritage sanctuary designed for comfort, luxury, and cultural connection in Kashmir.</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button className="search-submit-btn" onClick={() => navigate('/book')}>
              Book Your Stay Now
            </button>
            <button className="search-submit-btn" style={{ backgroundColor: 'transparent', border: '1px solid #ffffff' }} onClick={() => navigate('/about')}>
              Explore Details
            </button>
          </div>
        </div>
      </section>

      {/* Logged in User Bookings Section */}
      {token && upcomingStays.length > 0 && (
        <section className="upcoming-stays-section animate-fade-in">
          <div className="upcoming-header">
            <h2>Welcome back, {localStorage.getItem('user_name') || 'Guest'}!</h2>
            <p>Here are your upcoming stays and reservations at Panun Ghar Resort:</p>
          </div>
          <div className="upcoming-stays-grid">
            {upcomingStays.map((booking) => (
              <div key={booking.id} className="upcoming-stay-card card glass-panel">
                <div className={`stay-card-badge ${booking.booking_status === 'Confirmed' ? 'text-success' : 'text-warning'}`}>
                  {booking.booking_status}
                </div>
                <h4>Reservation: {booking.booking_code}</h4>
                <div className="stay-meta-grid">
                  <div className="stay-meta-item">
                    <span>Check-In:</span>
                    <strong>{booking.check_in}</strong>
                  </div>
                  <div className="stay-meta-item">
                    <span>Check-Out:</span>
                    <strong>{booking.check_out}</strong>
                  </div>
                  <div className="stay-meta-item">
                    <span>Room Class:</span>
                    <strong>{booking.room ? booking.room.room_type : 'Suite Category'} (Room {booking.room ? booking.room.room_number : 'TBD'})</strong>
                  </div>
                  <div className="stay-meta-item">
                    <span>Paid Advance:</span>
                    <strong>₹{booking.paid_amount} / ₹{booking.total_amount}</strong>
                  </div>
                </div>
                <div className="stay-card-footer" style={{ marginTop: '0.5rem' }}>
                  <Link to="/dashboard" className="manage-stay-link-btn">
                    Manage Stay Details & Invoices
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Single Hotel Detailed Showcase Section */}
      <section className="hotels-listings-section">
        <div className="intro-header">
          <h2>About Panun Ghar Resort</h2>
          <p>Nestled near Dal Lake amidst beautiful pine-forested slopes, offering traditional Kashmiri hospitality.</p>
        </div>

        <div className="hotels-search-results-grid">
          <div className="hotel-listing-card card glass-panel" style={{ gridTemplateColumns: '1fr 1fr', padding: '2rem', gap: '2rem' }}>
            <div className="hotel-card-img-wrapper" style={{ height: '380px' }}>
              <img src={hotelLiving} alt="Panun Ghar Living Room" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div className="hotel-rating-tag">
                <FiStar size={12} fill="currentColor" />
                <span>4.9</span>
              </div>
            </div>
            
            <div className="hotel-card-details" style={{ height: 'auto', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Panun Ghar Luxury Resort</h3>
                <span className="location-badge">
                  <FiMapPin size={12} />
                  <span>Srinagar, Kashmir</span>
                </span>
              </div>
              
              <p className="hotel-card-desc" style={{ fontSize: '0.95rem', margin: 0 }}>
                Experience premium luxury designed for comfort, luxury, and cultural connection in Kashmir. 
                Our resort features classic wooden architecture, premium suites, a heated indoor swimming pool, 
                and an exclusive private cinema theater lounge.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <FiVideo size={16} className="text-primary" />
                  <span>🎬 Private Cinema Lounge</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <FiClock size={16} className="text-primary" />
                  <span>🏊 Heated Swimming Pool</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <FiMap size={16} className="text-primary" />
                  <span>📍 Near Dal Lake, Srinagar</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <FiClock size={16} className="text-primary" />
                  <span>🛎️ 24/7 Butler Desk</span>
                </div>
              </div>
              
              <div className="hotel-card-footer" style={{ border: 'none', padding: 0, marginTop: '0.5rem' }}>
                <button 
                  className="view-rooms-btn"
                  style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                  onClick={() => navigate('/book')}
                >
                  View Room Categories & Rates
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
export { Home };
