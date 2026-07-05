import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  FiMail, 
  FiMessageSquare, 
  FiCalendar, 
  FiCheckCircle, 
  FiUser, 
  FiMapPin, 
  FiDollarSign,
  FiSliders,
  FiBriefcase
} from 'react-icons/fi';
import './BookingSection.css';

const BookingSection = () => {
  const { allBookings, addNewBooking } = useDashboard();
  
  // Local Form state
  const [formData, setFormData] = useState({
    guestName: '',
    age: '28',
    gender: 'Male',
    country: 'India',
    roomType: 'Single Room',
    roomNumber: '101',
    checkIn: '',
    checkOut: '',
    paymentMethod: 'Credit Card',
    revenue: '150'
  });

  // Booking outcome details for modal
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBookRoom = (e) => {
    e.preventDefault();

    // Generate unique ID
    const nextId = allBookings.length + 1001;
    const newId = `HB-${nextId}`;

    const newBookingObj = {
      BookingID: newId,
      GuestName: formData.guestName,
      Age: parseInt(formData.age),
      Gender: formData.gender,
      Country: formData.country,
      HotelName: 'Panun Ghar',
      RoomType: formData.roomType,
      RoomNumber: parseInt(formData.roomNumber),
      BookingDate: new Date().toISOString().split('T')[0],
      CheckIn: formData.checkIn,
      CheckOut: formData.checkOut,
      BookingSource: 'Direct',
      PaymentMethod: formData.paymentMethod,
      BookingStatus: 'Confirmed',
      PaymentStatus: 'Paid',
      Revenue: parseInt(formData.revenue),
      Rating: null
    };

    // Inject to global context
    addNewBooking(newBookingObj);

    // Save for notifications mapping
    setConfirmedBooking(newBookingObj);
    setShowConfirmModal(true);
  };

  // 1. Gmail mailto handler
  const sendEmailAlert = () => {
    if (!confirmedBooking) return;
    const subject = encodeURIComponent(`[Panun Ghar] New Room Reservation: ${confirmedBooking.BookingID}`);
    const body = encodeURIComponent(
      `Dear Mir Furqaan,\n\n` +
      `We have received a new booking reservation at Panun Ghar:\n\n` +
      `- Booking Ref ID: ${confirmedBooking.BookingID}\n` +
      `- Guest Full Name: ${confirmedBooking.GuestName} (${confirmedBooking.Age} y/o)\n` +
      `- Country of Origin: ${confirmedBooking.Country}\n` +
      `- Reserved Room: ${confirmedBooking.RoomType} (Room ${confirmedBooking.RoomNumber})\n` +
      `- Stay Timeline: ${confirmedBooking.CheckIn} to ${confirmedBooking.CheckOut}\n` +
      `- Amount Received: $${confirmedBooking.Revenue} via ${confirmedBooking.PaymentMethod}\n\n` +
      `Kind Regards,\n` +
      `Panun Ghar Customer Desk`
    );
    window.location.href = `mailto:mirfurkaan106@gmail.com?subject=${subject}&body=${body}`;
  };

  // 2. WhatsApp API handler
  const sendWhatsAppAlert = () => {
    if (!confirmedBooking) return;
    const message = encodeURIComponent(
      `*Panun Ghar Luxury Resort*\n` +
      `*New Booking Alert!*\n\n` +
      `• *Booking ID*: ${confirmedBooking.BookingID}\n` +
      `• *Guest Name*: ${confirmedBooking.GuestName}\n` +
      `• *Room Reserved*: ${confirmedBooking.RoomType} (${confirmedBooking.RoomNumber})\n` +
      `• *Check-In*: ${confirmedBooking.CheckIn}\n` +
      `• *Check-Out*: ${confirmedBooking.CheckOut}\n` +
      `• *Amount*: $${confirmedBooking.Revenue}\n` +
      `• *Method*: ${confirmedBooking.PaymentMethod}\n\n` +
      `Please check dashboard analytics.`
    );
    window.open(`https://wa.me/917889984798?text=${message}`, '_blank');
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setConfirmedBooking(null);
    // Reset Form
    setFormData({
      guestName: '',
      age: '28',
      gender: 'Male',
      country: 'India',
      roomType: 'Single Room',
      roomNumber: '101',
      checkIn: '',
      checkOut: '',
      paymentMethod: 'Credit Card',
      revenue: '150'
    });
  };

  return (
    <div className="booking-section-page page-container animate-fade-in">
      <div className="booking-sect-header">
        <h1>Book Your Stay at Panun Ghar</h1>
        <p>Select your dates, enter guest particulars, and confirm your luxury Kashmiri reservation today.</p>
      </div>

      <div className="booking-grid-wrapper">
        
        {/* Left Side: Booking Form */}
        <div className="booking-form-panel card glass-panel">
          <div className="sect-title">
            <FiSliders size={18} className="text-primary" />
            <h3>Reservation Details</h3>
          </div>

          <form onSubmit={handleBookRoom} className="public-booking-form">
            <div className="pub-form-row">
              <div className="pub-form-group">
                <label>Guest Full Name</label>
                <div className="pub-input-wrapper">
                  <FiUser className="pub-icon" size={14} />
                  <input 
                    type="text" 
                    name="guestName"
                    value={formData.guestName}
                    onChange={handleInputChange}
                    placeholder="e.g. Suhail Bhat"
                    required
                  />
                </div>
              </div>
              
              <div className="pub-form-group-sub">
                <div className="pub-form-group">
                  <label>Age</label>
                  <input 
                    type="number" 
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min={18}
                    max={90}
                    required
                  />
                </div>
                <div className="pub-form-group">
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pub-form-row">
              <div className="pub-form-group">
                <label>Origin Country</label>
                <div className="pub-input-wrapper">
                  <FiMapPin className="pub-icon" size={14} />
                  <input 
                    type="text" 
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="e.g. India"
                    required
                  />
                </div>
              </div>

              <div className="pub-form-group">
                <label>Room Category</label>
                <select name="roomType" value={formData.roomType} onChange={handleInputChange}>
                  <option value="Single Room">Single Room ($90/N)</option>
                  <option value="Double Room">Double Room ($140/N)</option>
                  <option value="Deluxe Suite">Deluxe Suite ($240/N)</option>
                  <option value="President Suite">President Suite ($550/N)</option>
                </select>
              </div>
            </div>

            <div className="pub-form-row">
              <div className="pub-form-group">
                <label>Desired Room Number</label>
                <input 
                  type="number" 
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  min={101}
                  max={520}
                  required
                />
              </div>

              <div className="pub-form-group">
                <label>Estimated Amount ($)</label>
                <div className="pub-input-wrapper">
                  <FiDollarSign className="pub-icon" size={14} />
                  <input 
                    type="number" 
                    name="revenue"
                    value={formData.revenue}
                    onChange={handleInputChange}
                    min={1}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pub-form-row">
              <div className="pub-form-group">
                <label>Check-In Date</label>
                <input 
                  type="date" 
                  name="checkIn"
                  value={formData.checkIn}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="pub-form-group">
                <label>Check-Out Date</label>
                <input 
                  type="date" 
                  name="checkOut"
                  value={formData.checkOut}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="pub-form-row">
              <div className="pub-form-group">
                <label>Payment Method</label>
                <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange}>
                  <option value="Credit Card">Credit Card</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <button type="submit" className="pub-submit-btn">
              Confirm & Book Room
            </button>
          </form>
        </div>

        {/* Right Side: Information Block */}
        <div className="booking-info-panel card">
          <div className="sect-title">
            <FiBriefcase size={18} className="text-warning" />
            <h3>Booking Policy</h3>
          </div>
          <ul className="policy-list">
            <li><strong>Check-in:</strong> Starts from 2:00 PM. Front desk operates 24/7.</li>
            <li><strong>Check-out:</strong> Closes at 12:00 PM. Late check-outs may incur a charge.</li>
            <li><strong>Notification:</strong> After checking room availability and confirming, you will be prompted to send the notifications to email & WhatsApp.</li>
            <li><strong>Support:</strong> Direct call support operates during business hours at <strong>+91 78899 84798</strong>.</li>
          </ul>
        </div>
      </div>

      {/* Success Notification Modal overlay */}
      {showConfirmModal && confirmedBooking && (
        <div className="modal-backdrop">
          <div className="success-modal card glass-panel animate-fade-in">
            <div className="success-icon-header">
              <FiCheckCircle size={54} className="text-success" />
              <h2>Booking Confirmed!</h2>
              <p className="booking-ref-txt">Reference ID: <strong>{confirmedBooking.BookingID}</strong></p>
            </div>

            <div className="success-details-box">
              <p>Room reserved: <strong>{confirmedBooking.RoomType}</strong> (Room {confirmedBooking.RoomNumber})</p>
              <p>Stay Schedule: <strong>{confirmedBooking.CheckIn} to {confirmedBooking.CheckOut}</strong></p>
              <p>Total Revenue: <strong>${confirmedBooking.Revenue}</strong></p>
            </div>

            <div className="notification-actions-box">
              <p className="act-txt">Please trigger the notification alerts for manager <strong>Mir Furqaan</strong>:</p>
              
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

            <button className="close-success-modal-btn" onClick={handleCloseModal}>
              Return to Bookings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingSection;
export { BookingSection };
