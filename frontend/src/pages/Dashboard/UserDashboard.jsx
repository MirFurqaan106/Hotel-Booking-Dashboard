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
  FiLogOut,
  FiLock
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
  
  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

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
      setToastMsg("Booking cancelled successfully!");
      fetchDashboardData();
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || "Cancellation failed. Rooms already checked out or cancel window exceeded.");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', {
        booking_id: selectedBookingForReview.id,
        rating,
        comment
      });
      setToastMsg("Thank you for your stay feedback!");
      setSelectedBookingForReview(null);
      setRating(5);
      setComment('');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to submit review.");
    }
  };

  const handlePayRemaining = async (booking) => {
    const outstanding = booking.total_amount - booking.paid_amount;
    if (outstanding <= 0) return;
    
    try {
      // 1. Create Razorpay order for remaining balance
      const orderRes = await api.post(`/payments/create-order?booking_id=${booking.id}`);
      const orderData = orderRes.data;

      // 2. Open Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Panun Ghar Resort",
        description: `Settle Balance Due for Stay (${booking.booking_code})`,
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            await api.post('/payments/verify-signature', {
              booking_id: booking.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            setToastMsg("Payment verified! Balance settled successfully.");
            fetchDashboardData();
            setTimeout(() => setToastMsg(''), 4000);
          } catch (err) {
            alert(err.response?.data?.detail || "Payment verification failed.");
          }
        },
        prefill: {
          name: localStorage.getItem('user_name') || "Resort Guest",
          email: localStorage.getItem('user_email') || "guest@panunghar.com"
        },
        theme: {
          color: "#4f46e5"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not initialize payment window.");
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPasswordError("Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
      return;
    }
    
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setToastMsg("Password changed successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setActiveTab('bookings');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.detail || "Error changing password. Ensure current password is correct.");
    }
  };


  const printInvoice = (booking) => {
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
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 25px; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px;">
            <div style="width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #06b6d4); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; font-family: sans-serif; line-height: 46px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center;">P</div>
            <div>
              <h2 style="margin: 0; color: #1e3a8a; font-size: 20px; font-weight: 800; border: none; padding: 0;">PANUN GHAR LUXURY RESORT</h2>
              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; font-weight: 600; display: block; margin-top: 2px;">Srinagar, Kashmir</span>
            </div>
          </div>
          <div class="details">
            <p><strong>Booking Code:</strong> ${booking.booking_code}</p>
            <p><strong>Check-In:</strong> ${booking.check_in}</p>
            <p><strong>Check-Out:</strong> ${booking.check_out}</p>
            <p><strong>Status:</strong> ${booking.booking_status}</p>
          </div>
          <hr style="border: none; border-top: 1px dashed #ccc; margin: 20px 0;" />
          <div class="item">
            <span>Room Reservation Fee</span>
            <span>₹${booking.total_amount}</span>
          </div>
          <div class="item">
            <span>Amount Paid</span>
            <span>₹${booking.paid_amount}</span>
          </div>
          <div class="item" style="font-weight: bold; font-size: 1.1em;">
            <span>Outstanding Balance</span>
            <span>₹${booking.total_amount - booking.paid_amount}</span>
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

  const handleSignOut = () => {
    localStorage.clear();
    window.location.href = '/';
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
            <h2>Hello, {localStorage.getItem('user_name') || 'Guest Customer'}!</h2>
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

          <button 
            className={`dash-nav-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <FiLock size={16} />
            <span>Change Password</span>
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
                        <button className="dash-act-btn print-btn" onClick={() => printInvoice(booking)}>
                          <FiFileText size={14} />
                          <span>Print Invoice</span>
                        </button>
                        
                        {booking.total_amount - booking.paid_amount > 0 && booking.booking_status !== 'Cancelled' && (
                          <button
                            className="dash-act-btn pay-btn"
                            style={{ background: 'var(--success-light)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 700 }}
                            onClick={() => handlePayRemaining(booking)}
                          >
                            <FiDollarSign size={14} />
                            <span>Pay Balance (₹{booking.total_amount - booking.paid_amount})</span>
                          </button>
                        )}

                        {booking.booking_status === 'Checked Out' && (
                          <button className="dash-act-btn review-btn" onClick={() => setSelectedBookingForReview(booking)}>
                            <FiStar size={14} />
                            <span>Leave Review</span>
                          </button>
                        )}

                        {booking.booking_status === 'Confirmed' && (
                          <button className="dash-act-btn cancel-btn" onClick={() => handleCancelBooking(booking.id)}>
                            <FiTrash2 size={14} />
                            <span>Cancel Stay</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-dash-list card">
                    <p>No stays or checkout logs located. Visit room booking to plan your reservation!</p>
                  </div>
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

          {activeTab === 'security' && (
            <div className="dashboard-sub-section">
              <h3>Security Settings</h3>
              <div className="dash-bookings-vertical-list card glass-panel" style={{ padding: '2rem' }}>
                <form onSubmit={handleChangePasswordSubmit} className="checkout-form" style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {passwordError && (
                    <div className="error-alert-box">
                      <FiAlertCircle size={16} />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <div className="grp" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Current Password</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', outline: 'none' }}
                    />
                  </div>

                  <div className="grp" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', outline: 'none' }}
                    />
                  </div>

                  <div className="grp" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', outline: 'none' }}
                    />
                  </div>

                  <button type="submit" className="confirm-booking-btn" style={{ padding: '0.75rem', fontWeight: 700, fontSize: '0.9rem', width: '100%', marginTop: '0.5rem' }}>
                    Save Password Changes
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedBookingForReview && (
        <div className="modal-backdrop">
          <div className="checkout-modal card glass-panel animate-fade-in">
            <div className="modal-header">
              <h3>Review stay: {selectedBookingForReview.booking_code}</h3>
              <button className="close-modal-btn" onClick={() => setSelectedBookingForReview(null)}>
                ×
              </button>
            </div>
            <form onSubmit={handleReviewSubmit} className="checkout-form">
              <div className="grp">
                <label>Rating Out of 5 Stars</label>
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                  <option value={5}>⭐⭐⭐⭐⭐ (Excellent)</option>
                  <option value={4}>⭐⭐⭐⭐ (Very Good)</option>
                  <option value={3}>⭐⭐⭐ (Satisfactory)</option>
                  <option value={2}>⭐⭐ (Fair)</option>
                  <option value={1}>⭐ (Poor)</option>
                </select>
              </div>
              <div className="grp">
                <label>Write Comment</label>
                <textarea 
                  rows={4} 
                  value={comment} 
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience..."
                  required
                />
              </div>
              <button type="submit" className="confirm-booking-btn">
                Submit Review feedback
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
