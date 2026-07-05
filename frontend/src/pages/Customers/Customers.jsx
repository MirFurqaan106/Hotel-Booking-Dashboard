import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import Header from '../../components/Header/Header';
import { FiSearch, FiMail, FiPhone, FiMapPin, FiAward, FiCalendar, FiDollarSign } from 'react-icons/fi';
import './Customers.css';

const Customers = () => {
  const { allBookings } = useDashboard();
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loyaltyFilter, setLoyaltyFilter] = useState('All');

  // 1. Process bookings data to aggregate customer metrics
  const customers = useMemo(() => {
    const customerMap = {};

    allBookings.forEach((b) => {
      const name = b.GuestName;
      if (!customerMap[name]) {
        // Generate mock email and phone based on name
        const cleanName = name.toLowerCase().replace(/\s+/g, '.');
        const email = `${cleanName}@example.com`;
        const phone = `+1 (${100 + Math.floor(Math.random() * 899)}) 555-${1000 + Math.floor(Math.random() * 8999)}`;
        
        customerMap[name] = {
          id: cleanName,
          name: name,
          email: email,
          phone: phone,
          country: b.Country,
          gender: b.Gender,
          age: b.Age,
          bookings: []
        };
      }
      customerMap[name].bookings.push(b);
    });

    return Object.values(customerMap).map((c) => {
      const totalBookings = c.bookings.length;
      const totalSpent = c.bookings.reduce((sum, b) => sum + b.Revenue, 0);
      
      // Determine loyalty tier based on number of bookings
      let loyaltyStatus = 'Regular';
      if (totalBookings >= 4) loyaltyStatus = 'VIP';
      else if (totalBookings === 3) loyaltyStatus = 'Gold';
      else if (totalBookings === 2) loyaltyStatus = 'Silver';

      return {
        ...c,
        totalBookings,
        totalSpent,
        loyaltyStatus
      };
    });
  }, [allBookings]);

  // 2. Filter & Search Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch = 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.country.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesLoyalty = loyaltyFilter === 'All' || c.loyaltyStatus === loyaltyFilter;

      return matchesSearch && matchesLoyalty;
    });
  }, [customers, searchQuery, loyaltyFilter]);

  // Set default selected customer if none selected
  const activeCustomer = useMemo(() => {
    if (selectedCustomerId) {
      return customers.find(c => c.id === selectedCustomerId) || customers[0];
    }
    return filteredCustomers[0] || null;
  }, [selectedCustomerId, customers, filteredCustomers]);

  const getLoyaltyBadgeClass = (status) => {
    switch (status) {
      case 'VIP': return 'loyalty-vip';
      case 'Gold': return 'loyalty-gold';
      case 'Silver': return 'loyalty-silver';
      default: return 'loyalty-regular';
    }
  };

  return (
    <div className="customers-page page-container animate-fade-in">
      <Header title="Customers Database" subtitle="View client details, track loyalty statuses, and inspect booking history" />

      {/* Controls: Search and Loyalty filter */}
      <div className="customers-controls card glass-panel">
        <div className="search-box">
          <FiSearch className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Search customers by name, email, country..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <label>Loyalty Tier:</label>
          <select 
            value={loyaltyFilter} 
            onChange={(e) => setLoyaltyFilter(e.target.value)}
          >
            <option value="All">All Tiers</option>
            <option value="VIP">VIP</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Regular">Regular</option>
          </select>
        </div>
      </div>

      <div className="customers-layout">
        {/* Left Side: Customers list */}
        <div className="customers-list-panel card">
          <h3>Customer Profiles ({filteredCustomers.length})</h3>
          <div className="customers-list-scroll">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((c) => (
                <div 
                  key={c.id} 
                  className={`customer-item ${activeCustomer?.id === c.id ? 'active' : ''}`}
                  onClick={() => setSelectedCustomerId(c.id)}
                >
                  <div className="customer-avatar-col">
                    <div className="avatar-placeholder">
                      {c.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                  <div className="customer-info-col">
                    <div className="name-row">
                      <h4>{c.name}</h4>
                      <span className={`loyalty-badge ${getLoyaltyBadgeClass(c.loyaltyStatus)}`}>
                        {c.loyaltyStatus}
                      </span>
                    </div>
                    <span className="email-span">{c.email}</span>
                    <span className="country-span">{c.country} • {c.totalBookings} stay(s)</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No customers found matching search criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Profile Card & Booking History */}
        {activeCustomer ? (
          <div className="customer-detail-panel card">
            <div className="customer-profile-card">
              <div className="profile-banner"></div>
              <div className="profile-details-wrapper">
                <div className="large-avatar">
                  {activeCustomer.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="profile-name-tier">
                  <h2>{activeCustomer.name}</h2>
                  <span className={`loyalty-badge ${getLoyaltyBadgeClass(activeCustomer.loyaltyStatus)}`}>
                    <FiAward size={14} />
                    <span>{activeCustomer.loyaltyStatus} Member</span>
                  </span>
                </div>
                
                <div className="profile-contacts">
                  <div className="contact-item">
                    <FiMail size={16} />
                    <span>{activeCustomer.email}</span>
                  </div>
                  <div className="contact-item">
                    <FiPhone size={16} />
                    <span>{activeCustomer.phone}</span>
                  </div>
                  <div className="contact-item">
                    <FiMapPin size={16} />
                    <span>{activeCustomer.country}</span>
                  </div>
                </div>

                <div className="profile-kpis">
                  <div className="profile-kpi-item">
                    <FiCalendar size={18} className="text-primary" />
                    <div className="kpi-meta">
                      <span className="kpi-lbl">Total Stays</span>
                      <span className="kpi-val">{activeCustomer.totalBookings}</span>
                    </div>
                  </div>
                  <div className="profile-kpi-item">
                    <FiDollarSign size={18} className="text-success" />
                    <div className="kpi-meta">
                      <span className="kpi-lbl">Total Spent</span>
                      <span className="kpi-val">${activeCustomer.totalSpent.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking History list */}
            <div className="booking-history-section">
              <h3>Stay History</h3>
              <div className="history-list">
                {activeCustomer.bookings.map((b) => (
                  <div key={b.BookingID} className="history-item">
                    <div className="history-icon-wrapper bg-primary-light text-primary">
                      <FiCalendar size={16} />
                    </div>
                    <div className="history-meta">
                      <div className="history-row">
                        <span className="history-room">{b.RoomType} (Room {b.RoomNumber})</span>
                        <span className="history-id">{b.BookingID}</span>
                      </div>
                      <div className="history-row-dates">
                        <span className="dates-text">{b.CheckIn} to {b.CheckOut}</span>
                        <span className={`badge ${
                          b.BookingStatus === 'Checked In' ? 'badge-success' :
                          b.BookingStatus === 'Checked Out' ? 'badge-info' :
                          b.BookingStatus === 'Cancelled' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {b.BookingStatus}
                        </span>
                      </div>
                    </div>
                    <div className="history-revenue">
                      <span>${b.Revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="customer-detail-panel card empty-detail">
            <p>Select a customer to view their details.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;
export { Customers };
