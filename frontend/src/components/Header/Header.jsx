import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { FiRefreshCw, FiCalendar } from 'react-icons/fi';
import './Header.css';

const Header = ({ title, subtitle }) => {
  const { filteredBookings, allBookings, resetFilters, filters } = useDashboard();

  // Determine if any filters are active
  const hasActiveFilters = 
    filters.startDate || 
    filters.endDate || 
    filters.roomType !== 'All' || 
    filters.country !== 'All' || 
    filters.bookingStatus !== 'All' || 
    filters.paymentStatus !== 'All';

  // Format today's date nicely
  const getTodayFormatted = () => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <div className="header-container animate-fade-in">
      <div className="header-meta">
        <h1 className="header-title">{title}</h1>
        {subtitle ? (
          <p className="header-subtitle">{subtitle}</p>
        ) : (
          <p className="header-subtitle">
            Showing <strong className="highlight-text">{filteredBookings.length}</strong> of {allBookings.length} bookings
          </p>
        )}
      </div>

      <div className="header-controls">
        {/* Date Display */}
        <div className="header-date">
          <FiCalendar size={16} />
          <span>{getTodayFormatted()}</span>
        </div>

        {/* Reset Filters button if filters are active */}
        {hasActiveFilters && (
          <button 
            className="header-reset-btn" 
            onClick={resetFilters}
            title="Reset all filters to default"
          >
            <FiRefreshCw size={14} className="reset-icon" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;
