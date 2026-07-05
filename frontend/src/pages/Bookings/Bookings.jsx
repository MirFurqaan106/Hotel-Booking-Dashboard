import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import Header from '../../components/Header/Header';
import Filters from '../../components/Filters/Filters';
import BookingTable from '../../components/BookingTable/BookingTable';
import { FiPlus, FiX, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';
import './Bookings.css';

const Bookings = () => {
  const { allBookings, loadLiveBookings } = useDashboard();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [dbRooms, setDbRooms] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({
    roomId: '',
    checkIn: '',
    checkOut: '',
    paymentOption: 'Later'
  });

  useEffect(() => {
    loadLiveBookings();
    
    // Load real rooms inventory from database
    const fetchRooms = async () => {
      try {
        const res = await api.get('/hotels/1/rooms');
        setDbRooms(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, roomId: res.data[0].id }));
        }
      } catch (err) {
        console.error("Error loading rooms list for form:", err);
      }
    };
    fetchRooms();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        room_id: parseInt(formData.roomId),
        check_in: formData.checkIn,
        check_out: formData.checkOut,
        payment_option: formData.paymentOption
      };
      
      await api.post('/bookings', payload);
      setIsModalOpen(false);
      setToastMessage(`Walk-in booking created successfully!`);
      loadLiveBookings();
      setTimeout(() => setToastMessage(''), 4000);
      
      // Reset
      setFormData({
        roomId: dbRooms.length > 0 ? dbRooms[0].id : '',
        checkIn: '',
        checkOut: '',
        paymentOption: 'Later'
      });
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to reserve room. Schedule overlap detected.");
    }
  };

  return (
    <div className="bookings-page page-container animate-fade-in">
      <Header 
        title="Bookings Registry" 
        subtitle="Manage hotel reservations, check-in arrivals, and verify payments in real-time"
      />
      
      {toastMessage && (
        <div className="toast-notification animate-fade-in">
          <FiCheckCircle size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Registry Top Banner Actions */}
      <div className="bookings-actions-banner card glass-panel">
        <div className="banner-left">
          <h3>Reservations Registry</h3>
          <p>Register new walk-in stays and manage checkout schedules</p>
        </div>
        <button className="create-booking-btn" onClick={() => setIsModalOpen(true)}>
          <FiPlus size={18} />
          <span>Create Walk-In Booking</span>
        </button>
      </div>

      {/* Search and filter controls */}
      <Filters />

      {/* Main Registry Table */}
      <BookingTable />

      {/* Create Booking Overlay Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="booking-modal card glass-panel animate-fade-in" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>New Walk-In Reservation</h3>
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="booking-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Select Room Category</label>
                <select 
                  name="roomId" 
                  value={formData.roomId} 
                  onChange={handleInputChange}
                  style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', outline: 'none' }}
                  required
                >
                  {dbRooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_number} - {r.room_type} (₹{r.price_per_night}/night)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Check-In Date</label>
                <input 
                  type="date" 
                  name="checkIn"
                  value={formData.checkIn}
                  onChange={handleInputChange}
                  style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', outline: 'none' }}
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Check-Out Date</label>
                <input 
                  type="date" 
                  name="checkOut"
                  value={formData.checkOut}
                  onChange={handleInputChange}
                  style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', outline: 'none' }}
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Payment Plan</label>
                <select 
                  name="paymentOption" 
                  value={formData.paymentOption} 
                  onChange={handleInputChange}
                  style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', outline: 'none' }}
                >
                  <option value="Later">Pay At Desk</option>
                  <option value="Full">Full Prepayment</option>
                </select>
              </div>

              <div className="form-actions-row" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', background: 'none', cursor: 'pointer', fontWeight: 700 }} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-action" style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--primary)', color: '#ffffff', cursor: 'pointer', fontWeight: 700 }}>
                  Confirm Stay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
export { Bookings };
