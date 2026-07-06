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
    const nights = Math.max(1, Math.round(
      (new Date(booking.check_out) - new Date(booking.check_in)) / (1000 * 60 * 60 * 24)
    ));
    const paid = booking.paid_amount ?? 0;
    const remaining = booking.total_amount - paid;
    const pricePerNight = Math.round(booking.total_amount / nights);
    const invoiceNo = `INV-${booking.booking_code.replace('HB-', '')}-${new Date().getFullYear()}`;
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const payStatus = remaining <= 0 ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'PENDING');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${booking.booking_code}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px; color: #1a1a2e; background: #fff; }
            .inv-container { max-width: 650px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 20px; }
            .logo-sec h1 { margin: 0; font-size: 1.5rem; color: #4f46e5; font-weight: 800; }
            .logo-sec p { margin: 2px 0 0; font-size: 0.8rem; color: #6b7280; }
            .meta-sec { text-align: right; font-size: 0.85rem; }
            .meta-sec h2 { margin: 0 0 5px; font-size: 1.4rem; color: #1a1a2e; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
            .badge-paid { background: #d1fae5; color: #065f46; }
            .badge-pending { background: #fef3c7; color: #92400e; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 0.85rem; }
            .details-col h3 { margin: 0 0 8px; font-size: 0.75rem; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.5px; }
            .details-col p { margin: 3px 0; color: #374151; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 0.85rem; }
            .table th { background: #4f46e5; color: #fff; text-align: left; padding: 10px; font-weight: 600; }
            .table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
            .totals-sec { margin-left: auto; width: 250px; font-size: 0.85rem; }
            .totals-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .totals-row.grand { border-top: 2px solid #4f46e5; margin-top: 5px; padding-top: 8px; font-size: 1rem; font-weight: 800; color: #4f46e5; }
            .footer { border-top: 1px solid #e5e7eb; margin-top: 40px; padding-top: 20px; text-align: center; font-size: 0.78rem; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="inv-container">
            <div class="header">
              <div class="logo-sec">
                <h1>Panun Ghar Resort</h1>
                <p>Dal Lake, Srinagar, Kashmir</p>
              </div>
              <div class="meta-sec">
                <h2>INVOICE</h2>
                <p><strong>${invoiceNo}</strong></p>
                <p>Date: ${today}</p>
                <p>Booking Ref: ${booking.booking_code}</p>
                <p><span class="badge ${remaining <= 0 ? 'badge-paid' : 'badge-pending'}">${payStatus}</span></p>
              </div>
            </div>

            <div class="details-grid">
              <div class="details-col">
                <h3>Stay Details</h3>
                <p>Room: <strong>${booking.room ? booking.room.room_type : 'Deluxe Suite'} (Room ${booking.room ? booking.room.room_number : '101'})</strong></p>
                <p>Check-In: <strong>${booking.check_in}</strong></p>
                <p>Check-Out: <strong>${booking.check_out}</strong></p>
                <p>Duration: <strong>${nights} Night${nights > 1 ? 's' : ''}</strong></p>
              </div>
              <div class="details-col">
                <h3>Payment Gateway</h3>
                <p>Method: <strong>${booking.payment_option === 'Later' ? 'Pay At Desk' : booking.payment_option}</strong></p>
                <p>Portal: <strong>Razorpay Secured</strong></p>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Rate</th>
                  <th>Nights</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Stay Reservation - Room ${booking.room ? booking.room.room_number : '101'}</td>
                  <td>₹${pricePerNight.toLocaleString('en-IN')}</td>
                  <td>${nights}</td>
                  <td>₹${booking.total_amount.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>

            <div class="totals-sec">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span>₹${booking.total_amount.toLocaleString('en-IN')}</span>
              </div>
              <div class="totals-row">
                <span style="color: #059669; font-weight: 600;">Amount Paid:</span>
                <span style="color: #059669; font-weight: 600;">₹${paid.toLocaleString('en-IN')}</span>
              </div>
              <div class="totals-row">
                <span style="color: #dc2626; font-weight: 600;">Balance Due (Pending):</span>
                <span style="color: #dc2626; font-weight: 600;">₹${remaining.toLocaleString('en-IN')}</span>
              </div>
              <div class="totals-row grand">
                <span>Grand Total:</span>
                <span>₹${booking.total_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for staying at Panun Ghar Resort. For queries, contact info@panunghar.com</p>
            </div>
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
