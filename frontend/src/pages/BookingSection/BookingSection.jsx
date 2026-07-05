import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiCalendar, 
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

  // Razorpay simulated states
  const [payTab, setPayTab] = useState('card'); // card, upi
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [payLoadingStep, setPayLoadingStep] = useState(''); // '', 'connecting', 'authorizing', 'complete'

  // Dynamic cost calculations
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end - start;
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nightsCount = calculateNights();
  const totalCost = selectedRoom ? nightsCount * selectedRoom.price_per_night : 0;
  const tokenCost = Math.ceil(totalCost * 0.20);

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
    
    if (nightsCount <= 0) {
      setErrorMsg("Check-Out date must be after Check-In date.");
      return;
    }

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

  const handleProceedPayment = async (e) => {
    e.preventDefault();
    
    // Simulate Razorpay Gateway steps
    setPayLoadingStep('connecting');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setPayLoadingStep('authorizing');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setPayLoadingStep('complete');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Call verify endpoint
    try {
      const payAmount = paymentOption === 'Token' ? tokenCost : totalCost;
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
      setPayLoadingStep('');
      
      // Clear forms
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setCardName('');
      setUpiId('');
    } catch (err) {
      console.error("Payment verify failed:", err);
      setPayLoadingStep('');
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
      `- Paid Amount: ₹${bookingConfirmed.paid_amount}\n` +
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
      `• *Paid Amount*: ₹${bookingConfirmed.paid_amount}`
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
                  <strong>₹{room.price_per_night}</strong>
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

              {nightsCount > 0 && (
                <div className="stay-summary-box">
                  <p>Stay Duration: <strong>{nightsCount} Nights</strong></p>
                  <p>Total Stay Cost: <strong>₹{totalCost}</strong></p>
                </div>
              )}

              <div className="grp">
                <label>Payment Mode</label>
                <select 
                  value={paymentOption}
                  onChange={(e) => setPaymentOption(e.target.value)}
                >
                  <option value="Later">Pay Later during Check-In (₹0 now)</option>
                  <option value="Token">Pay Token advance (₹{nightsCount > 0 ? tokenCost : '20%'} now)</option>
                  <option value="Full">Pay Full amount (₹{nightsCount > 0 ? totalCost : ''} now)</option>
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
            {payLoadingStep ? (
              <div className="rzp-loading-overlay">
                <div className="rzp-spinner"></div>
                {payLoadingStep === 'connecting' && <p>Connecting to Razorpay secure payment gateway...</p>}
                {payLoadingStep === 'authorizing' && <p>Authorizing transaction with bank authentication servers...</p>}
                {payLoadingStep === 'complete' && <p className="text-success" style={{ fontWeight: 700 }}>Payment Captured Successfully!</p>}
              </div>
            ) : (
              <>
                <div className="rzp-header">
                  <div className="rzp-brand-row">
                    <span className="rzp-logo-badge">R</span>
                    <span className="rzp-title-brand">Razorpay Secure Checkout</span>
                  </div>
                  <div className="rzp-meta">
                    <p>Reference: <strong>{bookingConfirmed.booking_code}</strong></p>
                    <p className="rzp-amt-label">Amount: <strong className="text-primary">₹{paymentOption === 'Token' ? tokenCost : totalCost}</strong></p>
                  </div>
                </div>

                <div className="rzp-tabs">
                  <button 
                    type="button" 
                    className={`rzp-tab-btn ${payTab === 'card' ? 'active' : ''}`} 
                    onClick={() => setPayTab('card')}
                  >
                    Credit / Debit Card
                  </button>
                  <button 
                    type="button" 
                    className={`rzp-tab-btn ${payTab === 'upi' ? 'active' : ''}`} 
                    onClick={() => setPayTab('upi')}
                  >
                    UPI / QR Code
                  </button>
                </div>

                <form onSubmit={handleProceedPayment} className="rzp-payment-form">
                  {payTab === 'card' ? (
                    <div className="rzp-card-fields">
                      <div className="rzp-grp">
                        <label>Card Number</label>
                        <input 
                          type="text" 
                          placeholder="4111 2222 3333 4444" 
                          maxLength={19} 
                          value={cardNumber} 
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())} 
                          required 
                        />
                      </div>
                      <div className="rzp-row">
                        <div className="rzp-grp">
                          <label>Expiry (MM/YY)</label>
                          <input 
                            type="text" 
                            placeholder="12/28" 
                            maxLength={5} 
                            value={cardExpiry} 
                            onChange={(e) => setCardExpiry(e.target.value)} 
                            required 
                          />
                        </div>
                        <div className="rzp-grp">
                          <label>CVV</label>
                          <input 
                            type="password" 
                            placeholder="•••" 
                            maxLength={3} 
                            value={cardCvv} 
                            onChange={(e) => setCardCvv(e.target.value)} 
                            required 
                          />
                        </div>
                      </div>
                      <div className="rzp-grp">
                        <label>Cardholder Name</label>
                        <input 
                          type="text" 
                          placeholder="Mir Furqaan" 
                          value={cardName} 
                          onChange={(e) => setCardName(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="rzp-upi-fields">
                      <div className="rzp-grp">
                        <label>Virtual UPI ID (VPA)</label>
                        <input 
                          type="text" 
                          placeholder="mirfurkaan@okaxis" 
                          value={upiId} 
                          onChange={(e) => setUpiId(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="rzp-qr-mock">
                        <div className="qr-visual">[ Simulated UPI QR Code ]</div>
                        <span>Scan the mock gateway QR via any banking application</span>
                      </div>
                    </div>
                  )}

                  <button type="submit" className="rzp-submit-pay-btn">
                    Proceed to Pay ₹{paymentOption === 'Token' ? tokenCost : totalCost}
                  </button>
                  <button type="button" className="rzp-cancel-btn" onClick={() => { setShowPayModal(false); setSelectedRoom(null); }}>
                    Cancel Checkout
                  </button>
                </form>
              </>
            )}
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
              <p>Total Stay Cost: <strong>₹{bookingConfirmed.total_amount}</strong></p>
              <p>Amount Paid: <strong>₹{bookingConfirmed.paid_amount}</strong></p>
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
