import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { FiSliders, FiRefreshCw } from 'react-icons/fi';
import './Filters.css';

const Filters = () => {
  const {
    filters,
    setFilters,
    filterOptions,
    resetFilters,
    maxBookingPrice
  } = useDashboard();

  const handleSelectChange = (field, e) => {
    setFilters((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handlePriceChange = (index, val) => {
    const newVal = parseInt(val) || 0;
    setFilters((prev) => {
      const newRange = [...prev.priceRange];
      newRange[index] = newVal;
      return {
        ...prev,
        priceRange: newRange,
      };
    });
  };

  const handleDateChange = (field, e) => {
    setFilters((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <div className="filters-card card glass-panel animate-fade-in">
      <div className="filters-header">
        <div className="filters-title">
          <FiSliders size={18} className="text-primary" />
          <h3>Filter Data</h3>
        </div>
        <button className="filters-reset-btn" onClick={resetFilters}>
          <FiRefreshCw size={14} />
          <span>Reset</span>
        </button>
      </div>

      <div className="filters-grid">
        {/* Date Inputs */}
        <div className="filter-item">
          <label>Check-In From</label>
          <input 
            type="date" 
            value={filters.startDate}
            onChange={(e) => handleDateChange('startDate', e)}
          />
        </div>

        <div className="filter-item">
          <label>Check-In To</label>
          <input 
            type="date" 
            value={filters.endDate}
            onChange={(e) => handleDateChange('endDate', e)}
          />
        </div>

        {/* Room Type */}
        <div className="filter-item">
          <label>Room Type</label>
          <select 
            value={filters.roomType} 
            onChange={(e) => handleSelectChange('roomType', e)}
          >
            {filterOptions.roomTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Country */}
        <div className="filter-item">
          <label>Country</label>
          <select 
            value={filters.country} 
            onChange={(e) => handleSelectChange('country', e)}
          >
            {filterOptions.countries.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        {/* Booking Status */}
        <div className="filter-item">
          <label>Booking Status</label>
          <select 
            value={filters.bookingStatus} 
            onChange={(e) => handleSelectChange('bookingStatus', e)}
          >
            {filterOptions.bookingStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Payment Status */}
        <div className="filter-item">
          <label>Payment Status</label>
          <select 
            value={filters.paymentStatus} 
            onChange={(e) => handleSelectChange('paymentStatus', e)}
          >
            {filterOptions.paymentStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div className="filter-item price-range-item">
          <label>Price Range (₹)</label>
          <div className="price-inputs">
            <input 
              type="number" 
              placeholder="Min" 
              value={filters.priceRange[0]}
              min={0}
              max={maxBookingPrice}
              onChange={(e) => handlePriceChange(0, e.target.value)}
            />
            <span className="price-divider">to</span>
            <input 
              type="number" 
              placeholder="Max" 
              value={filters.priceRange[1]}
              min={0}
              max={maxBookingPrice}
              onChange={(e) => handlePriceChange(1, e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filters;
