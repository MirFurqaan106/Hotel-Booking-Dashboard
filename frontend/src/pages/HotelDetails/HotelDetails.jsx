import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiMapPin, 
  FiCalendar, 
  FiDollarSign, 
  FiCheckCircle, 
  FiX, 
  FiMail, 
  FiMessageSquare,
  FiAlertCircle
} from 'react-icons/fi';
import api from '../../services/api';
import hotelExterior from '../../assets/hotel-exterior.jpg';
import hotelRoom from '../../assets/hotel-room.jpg';
import './HotelDetails.css';

const HotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Checkout Modal State
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [paymentOption, setPaymentOption] = useState('Later');
  const [errorMsg, setErrorMsg] = useState('');

  // Outcome states
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);

  const fetchHotelData = async () => {
    setLoading(true);
    try {
      const hotelRes = await api.get(`/hotels/${id}`);
      setHotel(hotelRes.data);
      
      const roomsRes = await api.get(`/hotels/${id}/rooms`);
      setRooms(roomsRes.data);
    } catch (err) {
      console.error("Error fetching hotel rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotelData();
  }, [id]);

  const handleBookClick = (room) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      // Redirect to login if unauthenticated (Goibibo model)
      navigate('/login');
      return;
    }
    setSelectedRoom(room);
    setErrorMsg('');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      // Place booking via FastAPI
      const res = await api.post('/bookings', {
        room_id: selectedRoom.id,
        check_in: checkIn,
        check_out: checkOut,
        payment_option: paymentOption
      });

      const newBooking = res.data;
      setBookingConfirmed(newBooking);

      if (paymentOption === 'Later') {
        // Confirm immediately, no payment verification needed
        setSelectedRoom(null);
      } else {
        // Trigger Razorpay checkout payment simulation
        setShowPayModal(true);
        setSelectedRoom(null);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Booking failed. Verify date ranges.");
    }
  };

  // Razorpay simulated success verification
  const handlePaymentVerify = async () => {
    try {
      const payAmount = paymentOption === 'Token' ? 100 : bookingConfirmed.total_amount;
      const res = await api.post('/payments/verify', {
        booking_id: bookingConfirmed.id,
        transaction_id: `txn_razorpay_${Date.now()}`,
        amount: payAmount,
        payment_status: 'Success'
      });
      
      // Update local booking reference
      setBookingConfirmed(prev => ({
        ...prev,
        booking_status: 'Confirmed',
        paid_amount: payAmount
      }));
      setShowPayModal(false);
    } catch (err) {
      console.error("Payment verify failed:", err);
    }
  };

  const sendEmailAlert = () => {
    if (!bookingConfirmed) return;
    const subject = encodeURIComponent(`[Panun Ghar] New Room Reservation: ${bookingConfirmed.booking_code}`);
    const body = encodeURIComponent(
      `Dear Mir Furqaan,\n\n` +
      `You have a new reservation at Panun Ghar Resort:\n\n` +
      `- Ref ID: ${bookingConfirmed.booking_code}\n` +
      `- Room Category: ${selectedRoom?.room_type || 'Selected'}\n` +
      `- Scheduled: ${bookingConfirmed.check_in} to ${bookingConfirmed.check_out}\n` +
      `- Amount: $${bookingConfirmed.total_amount} (Paid: $${bookingConfirmed.paid_amount})\n` +
      `- Payment Option: ${bookingConfirmed.payment_option}\n\n` +
      `System Destination: mirfurkaan106@gmail.com`
    );
    window.location.href = `mailto:mirfurkaan106@gmail.com?subject=${subject}&body=${body}`;
  };

  const sendWhatsAppAlert = () => {
    if (!bookingConfirmed) return;
    const message = encodeURIComponent(
      `*Panun Ghar Luxury Resort*\n` +
      `*New Reservation Alert!*\n\n` +
      `• *Booking ID*: ${bookingConfirmed.booking_code}\n` +
      `• *Check-In*: ${bookingConfirmed.check_in}\n` +
      `• *Check-Out*: ${bookingConfirmed.check_out}\n` +
      `• *Amount*: $${bookingConfirmed.total_amount} (Paid: $${bookingConfirmed.paid_amount})\n` +
      `• *Option*: ${bookingConfirmed.payment_option}\n\n` +
      `Please check manager dashboard.`
    );
    window.open(`https://wa.me/917889984798?text=${message}`, '_blank');
  };

  const handleCloseOutcome = () => {
    setBookingConfirmed(null);
    setCheckIn('');
    setCheckOut('');
    setPaymentOption('Later');
  };

  if (loading) return <div className="loading-spinner-box">Loading hotel rates...</div>;
  if (!hotel) return <div className="empty-hotels-box card">Hotel not found.</div>;

  return (
    <div className="hotel-details-page page-container animate-fade-in">
      
      {/* Banner */}
      <section className="hotel-details-banner" style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${hotelExterior})` }}>
        <div className="banner-text">
          <h1>{hotel.name}</h1>
          <p className="city-loc"><FiMapPin size={16} /> {hotel.city} | Near Dal Lake, Srinagar</p>
        </div>
      </section>

      {/* Grid splits details and rooms */}
      <div className="hotel-details-split-grid">
        <div className="details-left">
          <div className="details-card card glass-panel">
            <h3>About the Property</h3>
            <p className="desc-text">{hotel.description}</p>
            
            <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>Hotel Amenities</h4>
            <div className="details-amenities-tags">
              <span>🎬 Private Cinema Lounger</span>
              <span>🏊 Heated Swimming Pool</span>
              <span>📶 High-Speed WiFi</span>
              <span>☕ Traditional Kashmiri Kahwa</span>
              <span>🚗 Valet Parking</span>
            </div>
          </div>
        </div>

        <div className="rooms-right">
          <h3>Available Rooms & Rates</h3>
          
          <div className="hotel-rooms-list-vertical">
            {rooms.length > 0 ? (
              rooms.map((room) => (
                <div key={room.id} className="room-item-card card glass-panel">
                  <img src={hotelRoom} alt={room.room_type} className="room-thumb" />
                  
                  <div className="room-info">
                    <h4>{room.room_type}</h4>
                    <span className="room-num">Room Number: {room.room_number}</span>
                    
                    <div className="room-rate-footer">
                      <div className="price-tag">
                        <strong>${room.price_per_night}</strong>
                        <span>/ night</span>
                      </div>
                      
                      <button 
                        className="pub-book-room-btn"
                        onClick={() => handleBookClick(room)}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-hotels-box card">No rooms configured for this hotel yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Date Select & Booking Checkout Drawer/Modal Overlay */}
      {selectedRoom && (
        <div className="modal-backdrop">
          <div className="checkout-modal card glass-panel animate-fade-in">
            <div className="modal-header">
              <h3>Confirm Booking: {selectedRoom.room_type}</h3>
              <button className="close-modal-btn" onClick={() => setSelectedRoom(null)}>
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="checkout-form">
              {errorMsg && (
                <div className="error-alert-box">
                  <FiAlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="form-row-group">
                <div className="grp">
                  <label>Check-In Date</label>
                  <input 
                    type="date" 
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    required
                  />
                </div>
                <div className="grp">
                  <label>Check-Out Date</label>
                  <input 
                    type="date" 
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grp">
                <label>Payment Option</label>
                <select 
                  value={paymentOption}
                  onChange={(e) => setPaymentOption(e.target.value)}
                >
                  <option value="Later">Pay Later during Check-In ($0 now)</option>
                  <option value="Token">Pay Token advance ($100 now)</option>
                  <option value="Full">Pay Full amount now</option>
                </select>
              </div>

              <div className="checkout-totals">
                <span>Room Rate: <strong>${selectedRoom.price_per_night} / Night</strong></span>
              </div>

              <button type="submit" className="confirm-booking-btn">
                Confirm Reservation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Razorpay Developer Simulation Modal */}
      {showPayModal && bookingConfirmed && (
        <div className="modal-backdrop">
          <div className="razorpay-simulation-modal card glass-panel animate-fade-in">
            <div className="rzp-header">
              <span className="rzp-badge">Razorpay Secure Checkout</span>
              <h3>Simulated Payment Checkout</h3>
              <p>Reference: <strong>{bookingConfirmed.booking_code}</strong></p>
            </div>

            <div className="rzp-details">
              <p>Total Stay Cost: <strong>${bookingConfirmed.total_amount}</strong></p>
              <p>Amount to Charge: <strong>${paymentOption === 'Token' ? 100 : bookingConfirmed.total_amount}</strong></p>
            </div>

            <div className="rzp-disclaimer">
              <p>This is the Razorpay Developer integration sandbox. Confirming will simulate a successful transaction callback.</p>
            </div>

            <button className="rzp-pay-success-btn" onClick={handlePaymentVerify}>
              Simulate Payment Success (Verified Check)
            </button>
          </div>
        </div>
      )}

      {/* Booking confirmation outcomes */}
      {bookingConfirmed && !showPayModal && (
        <div className="modal-backdrop">
          <div className="success-modal card glass-panel animate-fade-in">
            <div className="success-icon-header">
              <FiCheckCircle size={54} className="text-success" />
              <h2>Booking Placed Successfully!</h2>
              <p className="booking-ref-txt">Reference ID: <strong>{bookingConfirmed.booking_code}</strong></p>
            </div>

            <div className="success-details-box">
              <p>Stay Schedule: <strong>{bookingConfirmed.check_in} to {bookingConfirmed.check_out}</strong></p>
              <p>Total Stay Cost: <strong>${bookingConfirmed.total_amount}</strong></p>
              <p>Amount Paid: <strong>${bookingConfirmed.paid_amount}</strong></p>
              <p>Booking Status: <strong>{bookingConfirmed.booking_status}</strong></p>
            </div>

            <div className="notification-actions-box">
              <p className="act-txt">Alert Manager <strong>Mir Furqaan</strong> via Gmail or WhatsApp:</p>
              <div className="actions-vertical-grid">
                <button className="notify-btn gmail-btn" onClick={sendEmailAlert}>
                  <FiMail size={16} />
                  <span>Send Notification via Gmail</span>
                </button>
                <button className="notify-btn whatsapp-btn" onClick={sendWhatsAppAlert}>
                  <FiMessageSquare size={16} />
                  <span>Send Notification via WhatsApp</span>
                </button>
              </div>
            </div>

            <button className="close-success-modal-btn" onClick={handleCloseOutcome}>
              Return to Hotel Listing
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default HotelDetails;
export { HotelDetails };
