import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import api from '../../services/api';
import logoImg from '../../assets/logo.jpg';
import {
  FiChevronUp,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFileText,
  FiX,
  FiPrinter,
  FiTrash2,
  FiEye
} from 'react-icons/fi';
import './BookingTable.css';

/* ─── Invoice Print Styles (injected into print window) ─────────────── */
const INVOICE_CSS = `
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #1a1a2e; }
  .inv-wrap { max-width: 720px; margin: 0 auto; padding: 40px 32px; }
  .inv-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #4f46e5; padding-bottom: 24px; margin-bottom: 28px; }
  .inv-brand { display: flex; align-items: center; gap: 14px; }
  .inv-brand img { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; }
  .inv-brand-info h1 { font-size: 1.4rem; font-weight: 800; color: #4f46e5; margin: 0 0 2px; }
  .inv-brand-info p { font-size: 0.78rem; color: #6b7280; margin: 0; }
  .inv-meta { text-align: right; }
  .inv-meta h2 { font-size: 1.6rem; font-weight: 900; letter-spacing: 1px; color: #1a1a2e; margin: 0 0 6px; }
  .inv-meta p { font-size: 0.8rem; color: #6b7280; margin: 2px 0; }
  .inv-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .inv-party h4 { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin: 0 0 8px; }
  .inv-party p { font-size: 0.88rem; margin: 3px 0; color: #374151; }
  .inv-party strong { color: #1a1a2e; }
  .inv-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .inv-table th { background: #4f46e5; color: #fff; font-size: 0.78rem; font-weight: 700; padding: 10px 14px; text-align: left; }
  .inv-table td { padding: 10px 14px; font-size: 0.86rem; border-bottom: 1px solid #f3f4f6; }
  .inv-table tr:last-child td { border-bottom: none; }
  .inv-totals { margin-left: auto; width: 280px; }
  .inv-totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.86rem; }
  .inv-totals-row.grand { border-top: 2px solid #4f46e5; margin-top: 8px; padding-top: 10px; font-size: 1rem; font-weight: 800; color: #4f46e5; }
  .inv-status-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
  .inv-status-paid { background: #d1fae5; color: #065f46; }
  .inv-status-pending { background: #fef3c7; color: #92400e; }
  .inv-footer { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 28px; text-align: center; font-size: 0.78rem; color: #9ca3af; }
  .inv-footer strong { color: #4f46e5; }
  .razorpay-note { background: #f0f0ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 0.82rem; }
  .razorpay-note strong { color: #4f46e5; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;

/* ─── Invoice Print Function ─────────────────────────────────────────── */
const printInvoice = (b) => {
  const nights = Math.max(1, Math.round(
    (new Date(b.CheckOut) - new Date(b.CheckIn)) / (1000 * 60 * 60 * 24)
  ));
  const pricePerNight = Math.round(b.Revenue / nights);
  const paid = b._raw?.paid_amount ?? 0;
  const remaining = b.Revenue - paid;
  const invoiceNo = `INV-${b.BookingID.replace('HB-', '')}-${new Date().getFullYear()}`;
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const payStatus = remaining <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Pending');
  const payBadgeClass = remaining <= 0 ? 'inv-status-paid' : 'inv-status-pending';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice ${invoiceNo}</title>
<style>${INVOICE_CSS}</style></head>
<body>
<div class="inv-wrap">
  <div class="inv-header">
    <div class="inv-brand">
      <img src="http://localhost:5173/src/assets/logo.jpg" alt="Logo" />
      <div class="inv-brand-info">
        <h1>Panun Ghar Resort</h1>
        <p>Near Dal Lake, Srinagar, Kashmir — 190001</p>
        <p>info@panunghar.com | +91-194-2501234</p>
        <p>GSTIN: 01AAACP1234Z1ZX</p>
      </div>
    </div>
    <div class="inv-meta">
      <h2>INVOICE</h2>
      <p><strong>${invoiceNo}</strong></p>
      <p>Date: ${today}</p>
      <p>Booking: <strong>${b.BookingID}</strong></p>
      <p><span class="inv-status-badge ${payBadgeClass}">${payStatus}</span></p>
    </div>
  </div>

  <div class="razorpay-note">
    <strong>🔒 Razorpay Secured Payment</strong> &nbsp;|&nbsp; Transaction verified via Razorpay Payment Gateway.
    Payment Method: ${b.PaymentMethod || 'N/A'} &nbsp;|&nbsp; Gateway: Razorpay India Pvt. Ltd.
  </div>

  <div class="inv-parties">
    <div class="inv-party">
      <h4>Bill To</h4>
      <p><strong>${b.GuestName}</strong></p>
      <p>${b.Country}</p>
    </div>
    <div class="inv-party">
      <h4>Stay Details</h4>
      <p>Room: <strong>${b.RoomType} (Room ${b.RoomNumber})</strong></p>
      <p>Check-In: <strong>${b.CheckIn}</strong></p>
      <p>Check-Out: <strong>${b.CheckOut}</strong></p>
      <p>Duration: <strong>${nights} Night${nights > 1 ? 's' : ''}</strong></p>
    </div>
  </div>

  <table class="inv-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>Rate</th>
        <th>Qty (Nights)</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>${b.RoomType} — Room ${b.RoomNumber}<br/><small style="color:#9ca3af">Panun Ghar Resort, Srinagar</small></td>
        <td>₹${pricePerNight.toLocaleString('en-IN')}</td>
        <td>${nights}</td>
        <td>₹${b.Revenue.toLocaleString('en-IN')}</td>
      </tr>
    </tbody>
  </table>

  <div class="inv-totals">
    <div class="inv-totals-row"><span>Subtotal</span><span>₹${b.Revenue.toLocaleString('en-IN')}</span></div>
    <div class="inv-totals-row"><span>GST (12%)</span><span>Inclusive</span></div>
    <div class="inv-totals-row"><span>Amount Paid</span><span>₹${paid.toLocaleString('en-IN')}</span></div>
    <div class="inv-totals-row"><span>Balance Due</span><span>₹${remaining.toLocaleString('en-IN')}</span></div>
    <div class="inv-totals-row grand"><span>Total</span><span>₹${b.Revenue.toLocaleString('en-IN')}</span></div>
  </div>

  <div class="inv-footer">
    <p>Thank you for choosing <strong>Panun Ghar Resort</strong>. We look forward to welcoming you again!</p>
    <p>For queries: info@panunghar.com | This is a computer-generated invoice. No signature required.</p>
  </div>
</div>
</body></html>`;

  const win = window.open('', '_blank', 'width=800,height=900');
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 600);
};

/* ─── Booking Detail Modal ───────────────────────────────────────────── */
const BookingDetailModal = ({ booking, onClose, onDelete }) => {
  if (!booking) return null;
  const { loadLiveBookings } = useDashboard();
  const role = localStorage.getItem('user_role');
  const nights = Math.max(1, Math.round(
    (new Date(booking.CheckOut) - new Date(booking.CheckIn)) / (1000 * 60 * 60 * 24)
  ));
  const paid = booking._raw?.paid_amount ?? 0;
  const remaining = booking.Revenue - paid;

  // Manual payment state
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payNote, setPayNote] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [loadingReminder, setLoadingReminder] = useState(false);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) return;
    setLoadingPayment(true);
    try {
      const rawId = booking._raw?.id || booking.BookingID.replace('HB-', '');
      await api.post('/payments/manual-record', {
        booking_id: parseInt(rawId),
        amount: parseInt(payAmount),
        method: payMethod,
        note: payNote
      });
      alert('Offline payment registered successfully!');
      setPayAmount('');
      setPayNote('');
      loadLiveBookings();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to record manual payment.');
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleSendReminder = async () => {
    setLoadingReminder(true);
    try {
      const rawId = booking._raw?.id || booking.BookingID.replace('HB-', '');
      await api.post(`/payments/send-reminder/${rawId}`);
      alert('Payment reminder email sent successfully to the guest!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send payment reminder.');
    } finally {
      setLoadingReminder(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="booking-modal card glass-panel animate-fade-in"
        style={{ maxWidth: '600px', width: '95%', maxHeight: '95vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Booking Detail</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{booking.BookingID}</span>
          </div>
          <button className="close-modal-btn" onClick={onClose}><FiX size={20} /></button>
        </div>

        {/* Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Guest Name', value: booking.GuestName },
            { label: 'Country', value: booking.Country },
            { label: 'Room Type', value: booking.RoomType },
            { label: 'Room Number', value: `Room ${booking.RoomNumber}` },
            { label: 'Check-In', value: booking.CheckIn },
            { label: 'Check-Out', value: booking.CheckOut },
            { label: 'Duration', value: `${nights} Night${nights > 1 ? 's' : ''}` },
            { label: 'Booking Status', value: booking.BookingStatus },
            { label: 'Payment Status', value: booking.PaymentStatus },
            { label: 'Payment Method', value: booking.PaymentMethod || 'N/A' },
            { label: 'Total Amount', value: `₹${booking.Revenue?.toLocaleString('en-IN')}` },
            { label: 'Amount Paid', value: `₹${paid.toLocaleString('en-IN')}` },
            { label: 'Balance Due', value: `₹${remaining.toLocaleString('en-IN')}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{label}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Manager/Admin Payment Controls */}
        {(role === 'Admin' || role === 'Manager') && remaining > 0 && (
          <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700 }}>Record Desk Payment / Reminders</h4>
            
            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', background: 'rgba(79,70,229,0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: '1 1 120px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Amount (₹)</label>
                <input
                  type="number"
                  placeholder={`Max ₹${remaining}`}
                  max={remaining}
                  min={1}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  required
                  style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: '1 1 100px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Method</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loadingPayment}
                style={{ padding: '0.55rem 1rem', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
              >
                {loadingPayment ? 'Saving...' : 'Record Pay'}
              </button>
            </form>

            <button
              onClick={handleSendReminder}
              disabled={loadingReminder}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', background: 'var(--warning-light)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem', width: '100%', justifyContent: 'center' }}
            >
              📩 {loadingReminder ? 'Sending Reminder...' : 'Send Outstanding Payment Reminder Email'}
            </button>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          {(role === 'Admin' || role === 'Manager') && (
            <button
              onClick={() => onDelete(booking)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              <FiTrash2 size={15} />
              Delete Booking
            </button>
          )}
          <button
            onClick={() => printInvoice(booking)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
          >
            <FiPrinter size={15} />
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main BookingTable Component ────────────────────────────────────── */
const BookingTable = () => {
  const { filteredBookings, updateBookingStatus, cancelBooking, loadLiveBookings } = useDashboard();

  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'CheckIn', direction: 'ascending' });
  const [selectedBooking, setSelectedBooking] = useState(null);

  const role = localStorage.getItem('user_role');

  React.useEffect(() => { setCurrentPage(1); }, [filteredBookings]);

  const sortedBookings = useMemo(() => {
    let sortableItems = [...filteredBookings];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (sortConfig.key === 'Revenue') {
          aValue = parseFloat(aValue) || 0;
          bValue = parseFloat(bValue) || 0;
        }
        if (['CheckIn', 'CheckOut', 'BookingDate'].includes(sortConfig.key)) {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredBookings, sortConfig]);

  const totalEntries = sortedBookings.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = sortedBookings.slice(indexOfFirstEntry, indexOfLastEntry);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <FiChevronUp /> : <FiChevronDown />;
  };

  const getStatusBadge = (status) => {
    const map = {
      'Checked In': 'badge-success',
      'Checked Out': 'badge-info',
      'Confirmed': 'badge-warning',
      'Cancelled': 'badge-danger',
      'Pending': 'badge-warning'
    };
    return <span className={`badge ${map[status] || 'badge-info'}`}>{status}</span>;
  };

  const getPaymentBadge = (status) => {
    const map = { Paid: 'badge-success', Pending: 'badge-warning', Refunded: 'badge-info', Failed: 'badge-danger' };
    return <span className={`badge ${map[status] || 'badge-info'}`}>{status}</span>;
  };

  const downloadCSV = () => {
    const headers = ['Booking ID', 'Guest Name', 'Room Type', 'Room Number', 'Check-In', 'Check-Out', 'Status', 'Payment Status', 'Amount (₹)', 'Country'];
    const rows = filteredBookings.map(b => [b.BookingID, b.GuestName, b.RoomType, b.RoomNumber, b.CheckIn, b.CheckOut, b.BookingStatus, b.PaymentStatus, b.Revenue, b.Country]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'PanunGhar_Bookings.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteBooking = async (booking) => {
    if (!window.confirm(`Delete booking ${booking.BookingID}? This action cannot be undone.`)) return;
    try {
      const rawId = booking._raw?.id || booking.BookingID.replace('HB-', '');
      await api.delete(`/admin-portal/bookings/${rawId}`);
      setSelectedBooking(null);
      loadLiveBookings();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete booking.');
    }
  };

  return (
    <>
      <div className="table-container card">
        <div className="table-controls">
          <div className="entries-selector">
            <span>Show</span>
            <select value={entriesPerPage} onChange={(e) => { setEntriesPerPage(parseInt(e.target.value)); setCurrentPage(1); }}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>
          <div className="table-actions">
            <button className="table-btn" onClick={downloadCSV} title="Export to CSV">
              <FiDownload size={16} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="bookings-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('BookingID')} className="sortable">Booking ID {getSortIcon('BookingID')}</th>
                <th onClick={() => requestSort('GuestName')} className="sortable">Guest Name {getSortIcon('GuestName')}</th>
                <th>Room</th>
                <th onClick={() => requestSort('CheckIn')} className="sortable">Check-In {getSortIcon('CheckIn')}</th>
                <th onClick={() => requestSort('CheckOut')} className="sortable">Check-Out {getSortIcon('CheckOut')}</th>
                <th>Status</th>
                <th>Payment</th>
                <th onClick={() => requestSort('Revenue')} className="sortable">Amount {getSortIcon('Revenue')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.length > 0 ? (
                currentEntries.map((b) => (
                  <tr
                    key={b.BookingID}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedBooking(b)}
                  >
                    <td className="font-semibold">{b.BookingID}</td>
                    <td>
                      <div className="guest-info">
                        <span className="guest-name-main">{b.GuestName}</span>
                        <span className="guest-meta-sub">{b.Country}</span>
                      </div>
                    </td>
                    <td>
                      <div className="room-info">
                        <span className="room-type-text">{b.RoomType}</span>
                        <span className="room-num-text">Room {b.RoomNumber}</span>
                      </div>
                    </td>
                    <td>{b.CheckIn}</td>
                    <td>{b.CheckOut}</td>
                    <td>{getStatusBadge(b.BookingStatus)}</td>
                    <td>{getPaymentBadge(b.PaymentStatus)}</td>
                    <td className="revenue-cell">₹{b.Revenue?.toLocaleString('en-IN')}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        <button
                          title="View Details & Invoice"
                          style={{ padding: '0.25rem 0.45rem', fontSize: '0.72rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', border: 'none', backgroundColor: 'var(--primary-light, rgba(79,70,229,0.12))', color: 'var(--primary)', cursor: 'pointer' }}
                          onClick={() => setSelectedBooking(b)}
                        >
                          <FiEye size={13} />
                        </button>
                        {b.BookingStatus === 'Confirmed' && (
                          <>
                            <button
                              style={{ padding: '0.25rem 0.45rem', fontSize: '0.72rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', border: 'none', backgroundColor: 'var(--success-light)', color: 'var(--success)', cursor: 'pointer' }}
                              onClick={() => updateBookingStatus(b.BookingID, 'Checked In')}
                            >In</button>
                            <button
                              style={{ padding: '0.25rem 0.45rem', fontSize: '0.72rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', border: 'none', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', cursor: 'pointer' }}
                              onClick={() => cancelBooking(b.BookingID)}
                            >✕</button>
                          </>
                        )}
                        {b.BookingStatus === 'Checked In' && (
                          <button
                            style={{ padding: '0.25rem 0.45rem', fontSize: '0.72rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', border: 'none', backgroundColor: 'var(--info-light)', color: 'var(--info)', cursor: 'pointer' }}
                            onClick={() => updateBookingStatus(b.BookingID, 'Checked Out')}
                          >Out</button>
                        )}
                        {(role === 'Admin' || role === 'Manager') && (
                          <button
                            title="Delete Booking"
                            style={{ padding: '0.25rem 0.45rem', fontSize: '0.72rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', border: 'none', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', cursor: 'pointer' }}
                            onClick={() => handleDeleteBooking(b)}
                          >
                            <FiTrash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="no-records-cell">
                    <FiFileText size={40} className="text-muted" />
                    <p>No bookings found matching the filters/search criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, totalEntries)} of {totalEntries} entries
            </div>
            <div className="pagination-pages">
              <button className="pagination-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>First</button>
              <button className="pagination-btn" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                <FiChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                let pageNum = idx + 1;
                if (currentPage > 3) pageNum = currentPage - 3 + idx;
                if (pageNum > totalPages) return null;
                return (
                  <button key={pageNum} className={`pagination-page-number ${currentPage === pageNum ? 'active' : ''}`} onClick={() => setCurrentPage(pageNum)}>
                    {pageNum}
                  </button>
                );
              })}
              <button className="pagination-btn" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                <FiChevronRight size={16} />
              </button>
              <button className="pagination-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Last</button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onDelete={handleDeleteBooking}
        />
      )}
    </>
  );
};

export default BookingTable;
export { BookingTable };
