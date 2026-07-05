import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiCalendar, 
  FiDollarSign, 
  FiCheckCircle, 
  FiX, 
  FiMail, 
  FiMessageSquare,
  FiAlertCircle
} from 'react-icons/fi';
import api from '../../services/api';
import hotelRoom from '../../assets/hotel-room.jpg';
import './BookingSection.css';

const BookingSection = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search Inputs
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [paymentOption, setPaymentOption] = useState('Later');
  const [errorMsg, setErrorMsg] = useState('');

  // Outcome states
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      // Hotel ID 1 is seeded as Panun Ghar Resort
      const res = await api.get('/hotels/1/rooms');
      setRooms(res.data);
    } catch (err) {
      console.error("Error loading rooms details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleBookClick = (room) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
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
      const res = await api.post('/bookings', {
        room_id: selectedRoom.id,
        check_in: checkIn,
        check_out: checkOut,
        payment_option: paymentOption
      });

      const newBooking = res.data;
      setBookingConfirmed(newBooking);

      if (paymentOption === 'Later') {
        setSelectedRoom(null);
      } else {
        setShowPayModal(true);
        setSelectedRoom(null);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Booking failed. Verify stay dates scheduling slots.");
    }
  };

  const handlePaymentVerify = async () => {
    try {
      const payAmount = paymentOption === 'Token' ? 100 : bookingConfirmed.total_amount;
      await api.post('/payments/verify', {
        booking_id: bookingConfirmed.id,
        transaction_id: `txn_razorpay_${Date.now()}`,
        amount: payAmount,
        payment_status: 'Success'
      });
      
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
    const subject = encodeURIComponent(`[Panun Ghar] Stay Reservation: ${bookingConfirmed.booking_code}`);
    const body = encodeURIComponent(
      `Dear Mir Furqaan,\n\n` +
      `A guest has placed a stay booking at Panun Ghar:\n\n` +
      `- Ref ID: ${bookingConfirmed.booking_code}\n` +
      `- Scheduled: ${bookingConfirmed.check_in} to ${bookingConfirmed.check_out}\n` +
      `- Paid Amount: $${bookingConfirmed.paid_amount}\n` +
      `System Email: mirfurkaan106@gmail.com`
    );
    window.location.href = `mailto:mirfurkaan106@gmail.com?subject=${subject}&body=${body}`;
  };

  const sendWhatsAppAlert = () => {
    if (!bookingConfirmed) return;
    const message = encodeURIComponent(
      `*Panun Ghar Resort Stay*\n` +
      `• *Booking ID*: ${bookingConfirmed.booking_code}\n` +
      `• *Dates*: ${bookingConfirmed.check_in} to ${bookingConfirmed.check_out}\n` +
      `• *Paid Amount*: $${bookingConfirmed.paid_amount}`
    );
    window.open(`https://wa.me/917889984798?text=${message}`, '_blank');
  };

  if (loading) return <div className="loading-spinner-box">Retrieving Panun Ghar suites...</div>;

  return (
    <div className="booking-section-page page-container animate-fade-in">
      <div className="section-title-box">
        <h2>Book Your Stay at Panun Ghar</h2>
        <p>Input check-in and check-out dates to view rates and verify slots.</p>
      </div>

      {/* Main suite grid */}
      <div className="booking-suites-grid">
        {rooms.map((room) => (
          <div key={room.id} className="suite-catalog-card card glass-panel">
            <img src={hotelRoom} alt={room.room_type} className="suite-img" />
            <div className="suite-details">
              <h3>{room.room_type}</h3>
              <span className="suite-number-label">Room Number: {room.room_number}</span>
              <p className="suite-amenities">🎬 Cinema Lounger access • Heated pool • Free breakfast</p>
              
              <div className="suite-footer">
                <div className="suite-price">
                  <strong>${room.price_per_night}</strong>
                  <span>/ Night</span>
                </div>
                <button 
                  className="suite-book-btn"
                  onClick={() => handleBookClick(room)}
                >
                  Book Category
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Date Select & Booking Checkout Modal */}
      {selectedRoom && (
        <div className="modal-backdrop">
          <div className="checkout-modal card glass-panel animate-fade-in">
            <div className="modal-header">
              <h3>Checkout: Room {selectedRoom.room_number}</h3>
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
                <label>Payment Mode</label>
                <select 
                  value={paymentOption}
                  onChange={(e) => setPaymentOption(e.target.value)}
                >
                  <option value="Later">Pay Later during Check-In ($0 now)</option>
                  <option value="Token">Pay Token advance ($100 now)</option>
                  <option value="Full">Pay Full amount now</option>
                </select>
              </div>

              <button type="submit" className="confirm-booking-btn">
                Confirm Reservation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Razorpay simulation */}
      {showPayModal && bookingConfirmed && (
        <div className="modal-backdrop">
          <div className="razorpay-simulation-modal card glass-panel animate-fade-in">
            <div className="rzp-header">
              <span className="rzp-badge">Razorpay Secure Checkout</span>
              <h3>Verify simulated gateway transaction</h3>
              <p>Reference: <strong>{bookingConfirmed.booking_code}</strong></p>
            </div>
            <div className="rzp-details">
              <p>Amount to Charge: <strong>${paymentOption === 'Token' ? 100 : bookingConfirmed.total_amount}</strong></p>
            </div>
            <button className="rzp-pay-success-btn" onClick={handlePaymentVerify}>
              Simulate Successful Payment Verified Check
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
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

            <button className="close-success-modal-btn" onClick={() => setBookingConfirmed(null)}>
              Return to Booking List
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingSection;
export { BookingSection };
