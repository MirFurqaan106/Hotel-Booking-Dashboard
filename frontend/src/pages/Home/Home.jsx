import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin, FiCalendar, FiUsers, FiCompass, FiAward, FiStar } from 'react-icons/fi';
import api from '../../services/api';
import hotelExterior from '../../assets/hotel-exterior.jpg';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Search Inputs
  const [citySearch, setCitySearch] = useState('Srinagar');
  const [keywordSearch, setKeywordSearch] = useState('');

  // Logged In User Bookings state
  const token = localStorage.getItem('access_token');
  const [myBookings, setMyBookings] = useState([]);
  const [myBookingsLoading, setMyBookingsLoading] = useState(false);
  
  const fetchHotels = async (cityVal = '', searchVal = '') => {
    setLoading(true);
    try {
      let url = '/hotels';
      const params = [];
      if (cityVal) params.push(`city=${encodeURIComponent(cityVal)}`);
      if (searchVal) params.push(`search=${encodeURIComponent(searchVal)}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      
      const res = await api.get(url);
      setHotels(res.data);
    } catch (err) {
      console.error("Error fetching hotels from backend:", err);
    } finally {
      setLoading(false);
    }
  };

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
    // Initial fetch for approved hotels
    fetchHotels('Srinagar');
    if (token) {
      fetchMyBookings();
    }
  }, [token]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHotels(citySearch, keywordSearch);
  };

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
      {/* Hero Section with Search Card */}
      <section className="hero-section" style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.5)), url(${hotelExterior})` }}>
        <div className="hero-content">
          <span className="hero-welcome-badge">Panun Ghar Resort</span>
          <h1>Find Your Perfect Kashmiri Stay</h1>
          <p>Book premium hotels and heritage resorts in Kashmir with Razorpay & Gmail verification.</p>
          
          {/* Goibibo Style Horizontal Search Bar Panel */}
          <form onSubmit={handleSearchSubmit} className="search-bar-panel card glass-panel">
            <div className="search-col">
              <label><FiMapPin size={12} /> City Destination</label>
              <input 
                type="text" 
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Enter city (e.g. Srinagar)"
              />
            </div>
            
            <div className="search-col">
              <label><FiSearch size={12} /> Search Hotels</label>
              <input 
                type="text" 
                value={keywordSearch}
                onChange={(e) => setKeywordSearch(e.target.value)}
                placeholder="Hotel name or keyword..."
              />
            </div>

            <div className="search-col date-col">
              <label><FiCalendar size={12} /> Check-In / Out</label>
              <input type="text" defaultValue="Anytime" readOnly />
            </div>

            <button type="submit" className="search-submit-btn">
              <FiSearch size={16} />
              <span>Search</span>
            </button>
          </form>
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

      {/* Main Listings Grid */}
      <section className="hotels-listings-section">
        <div className="intro-header">
          <h2>Available Approved Accommodations</h2>
          <p>Explore verified hotel stays. Sign in to place reservations instantly.</p>
        </div>

        {loading ? (
          <div className="loading-spinner-box">Searching hotels...</div>
        ) : hotels.length > 0 ? (
          <div className="hotels-search-results-grid">
            {hotels.map((hotel) => (
              <div key={hotel.id} className="hotel-listing-card card glass-panel">
                <div className="hotel-card-img-wrapper">
                  <img src={hotelExterior} alt={hotel.name} />
                  <div className="hotel-rating-tag">
                    <FiStar size={12} fill="currentColor" />
                    <span>4.9</span>
                  </div>
                </div>
                
                <div className="hotel-card-details">
                  <div className="hotel-card-header">
                    <h3>{hotel.name}</h3>
                    <span className="location-badge">
                      <FiMapPin size={12} />
                      <span>{hotel.city}</span>
                    </span>
                  </div>
                  
                  <p className="hotel-card-desc">{hotel.description}</p>
                  
                  <div className="hotel-card-footer">
                    <div className="hotel-features-icons">
                      <span title="Cinema Theatre">🎬 Private Cinema</span>
                      <span title="Heated Pool">🏊 Heated Pool</span>
                    </div>
                    <button 
                      className="view-rooms-btn"
                      onClick={() => navigate(`/hotel/${hotel.id}`)}
                    >
                      View Rooms & Rates
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-hotels-box card">
            <p>No verified hotels found in <strong>{citySearch || 'your search'}</strong>. Try searching "Srinagar".</p>
          </div>
        )}
      </section>

      {/* Benefits / Services section */}
      <section className="home-benefits">
        <div className="features-grid-home">
          <div className="feature-home-card card">
            <div className="icon-box-home bg-primary-light text-primary">
              <FiAward size={24} />
            </div>
            <h3>Relational Security</h3>
            <p>Full secure role-based access controls (RBAC) with password hashing and JWT sessions.</p>
          </div>

          <div className="feature-home-card card">
            <div className="icon-box-home bg-success-light text-success">
              <FiCompass size={24} />
            </div>
            <h3>Fast Verification</h3>
            <p>Instant verify registration and security resets using One-Time Passwords (OTP).</p>
          </div>

          <div className="feature-home-card card">
            <div className="icon-box-home bg-warning-light text-warning">
              <FiStar size={24} />
            </div>
            <h3>Razorpay Integrated</h3>
            <p>Confirm booking receipts via full pay, token advance, or pay at desk options.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
export { Home };
