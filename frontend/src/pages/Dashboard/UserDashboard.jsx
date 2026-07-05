import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUser, 
  FiCalendar, 
  FiFileText, 
  FiDollarSign, 
  FiStar, 
  FiTrash2, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiLogOut 
} from 'react-icons/fi';
import api from '../../services/api';
import './UserDashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  
  // Review Form States
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const bookingsRes = await api.get('/bookings/my');
      setBookings(bookingsRes.data);
      
      const paymentsRes = await api.get('/payments/history');
      setPayments(paymentsRes.data);
    } catch (err) {
      console.error("Error loading dashboard content:", err);
      setErrorMsg("Failed to load dashboard. Session expired.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      setToastMsg("Booking cancelled successfully.");
      setTimeout(() => setToastMsg(''), 3000);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || "Cancellation failed.");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', {
        booking_id: selectedBookingForReview.id,
        rating: rating,
        comment: comment
      });
      setToastMsg("Review submitted successfully! Thank you.");
      setTimeout(() => setToastMsg(''), 3000);
      setSelectedBookingForReview(null);
      setRating(5);
      setComment('');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || "Review submission failed.");
    }
  };

  const handleSignOut = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleDownloadInvoice = (booking) => {
    // Print window simulator for invoices
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${booking.booking_code}</title>
          <style>
            body { font-family: monospace; padding: 40px; color: #333; line-height: 1.5; }
            h2 { border-bottom: 2px solid #000; padding-bottom: 10px; }
            .details { margin: 20px 0; }
            .item { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .footer { border-top: 1px dashed #999; margin-top: 30px; padding-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <h2>PANUN GHAR RESORT INVOICE</h2>
          <div class="details">
            <p><strong>Booking Code:</strong> ${booking.booking_code}</p>
            <p><strong>Check-In:</strong> ${booking.check_in}</p>
            <p><strong>Check-Out:</strong> ${booking.check_out}</p>
            <p><strong>Status:</strong> ${booking.booking_status}</p>
          </div>
          <hr />
          <div class="item">
            <span>Room Reservation Fee</span>
            <span>₹{booking.total_amount}</span>
          </div>
          <div class="item">
            <span>Amount Paid</span>
            <span>₹{booking.paid_amount}</span>
          </div>
          <div class="item" style="font-weight: bold; font-size: 1.1em;">
            <span>Outstanding Balance</span>
            <span>₹{booking.total_amount - booking.paid_amount}</span>
          </div>
          <div class="footer">
            <p>Thank you for choosing Panun Ghar, Kashmir.</p>
            <p>Customer Support: +91 7889984798</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return <div className="loading-spinner-box">Loading your dashboard...</div>;

  return (
    <div className="user-dashboard-page page-container animate-fade-in">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="toast-notification animate-fade-in">
          <FiCheckCircle size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="user-dash-header card glass-panel">
        <div className="user-meta-info">
          <div className="avatar-box">
            <FiUser size={32} />
          </div>
          <div>
            <h2>Hello, Guest Customer!</h2>
            <p>{localStorage.getItem('user_email')}</p>
          </div>
        </div>
        <button className="signout-btn" onClick={handleSignOut}>
          <FiLogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="user-dash-layout-split">
        {/* Navigation Sidebar */}
        <div className="user-dash-nav-card card glass-panel">
          <button 
            className={`dash-nav-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <FiCalendar size={16} />
            <span>My Bookings</span>
          </button>
          
          <button 
            className={`dash-nav-btn ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <FiDollarSign size={16} />
            <span>Payment History</span>
          </button>
        </div>

        {/* Content Panel */}
        <div className="user-dash-content-panel">
          {activeTab === 'bookings' && (
            <div className="dashboard-sub-section">
              <h3>Reservation History</h3>
              <div className="dash-bookings-vertical-list">
                {bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <div key={booking.id} className="dash-booking-card card glass-panel">
                      <div className="book-card-header">
                        <h4>Booking Ref: {booking.booking_code}</h4>
                        <span className={`status-badge-val ${booking.booking_status.toLowerCase()}`}>
                          {booking.booking_status}
                        </span>
                      </div>
                      
                      <div className="book-card-body-details">
                        <p>Dates: <strong>{booking.check_in} to {booking.check_out}</strong></p>
                        <p>Options: <strong>{booking.payment_option} Option</strong> | Charged: <strong>₹{booking.total_amount}</strong> (Paid: <strong>₹{booking.paid_amount}</strong>)</p>
                      </div>

                      <div className="book-card-actions">
                        <button 
                          className="btn-invoice"
                          onClick={() => handleDownloadInvoice(booking)}
                        >
                          <FiFileText size={14} />
                          <span>Print Invoice</span>
                        </button>

                        {booking.booking_status === 'Checked Out' && (
                          <button 
                            className="btn-review"
                            onClick={() => setSelectedBookingForReview(booking)}
                          >
                            <FiStar size={14} />
                            <span>Leave Review</span>
                          </button>
                        )}

                        {(booking.booking_status === 'Pending' || booking.booking_status === 'Confirmed') && (
                          <button 
                            className="btn-cancel"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            <FiTrash2 size={14} />
                            <span>Cancel Stay</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-hotels-box card">No room reservations found. Search and book from the home catalog!</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="dashboard-sub-section">
              <h3>Verified Transactions</h3>
              <div className="dash-payments-table-card card glass-panel">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Transaction ID</th>
                      <th>Gateway</th>
                      <th>Amount (₹)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length > 0 ? (
                      payments.map((p) => (
                        <tr key={p.id}>
                          <td>{new Date(p.created_at).toLocaleDateString()}</td>
                          <td style={{ fontFamily: 'monospace' }}>{p.transaction_id}</td>
                          <td>{p.gateway}</td>
                          <td><strong>₹{p.amount}</strong></td>
                          <td>
                            <span className={`status-badge-val ${p.payment_status.toLowerCase()}`}>
                              {p.payment_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No payment records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Dialog modal */}
      {selectedBookingForReview && (
        <div className="modal-backdrop">
          <div className="review-modal card glass-panel animate-fade-in">
            <div className="modal-header">
              <h3>Review stay: {selectedBookingForReview.booking_code}</h3>
              <button className="close-modal-btn" onClick={() => setSelectedBookingForReview(null)}>×</button>
            </div>

            <form onSubmit={handleReviewSubmit} className="review-submit-form">
              <div className="grp">
                <label>Rating Stars</label>
                <select value={rating} onChange={(e) => setRating(e.target.value)} className="auth-select">
                  <option value={5}>5 Stars (Excellent)</option>
                  <option value={4}>4 Stars (Very Good)</option>
                  <option value={3}>3 Stars (Good)</option>
                  <option value={2}>2 Stars (Average)</option>
                  <option value={1}>1 Star (Poor)</option>
                </select>
              </div>

              <div className="grp">
                <label>Commentary Feedback</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your stay particulars and rating details..."
                  rows={4}
                  required
                ></textarea>
              </div>

              <button type="submit" className="confirm-booking-btn">
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserDashboard;
export { UserDashboard };
