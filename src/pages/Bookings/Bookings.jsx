import React from 'react';
import Header from '../../components/Header/Header';
import Filters from '../../components/Filters/Filters';
import BookingTable from '../../components/BookingTable/BookingTable';
import './Bookings.css';

const Bookings = () => {
  return (
    <div className="bookings-page page-container animate-fade-in">
      <Header 
        title="Bookings Registry" 
        subtitle="Manage and analyze hotel reservations, filter entries, and export reports"
      />
      
      {/* Search and filter controls */}
      <Filters />

      {/* Main Registry Table */}
      <BookingTable />
    </div>
  );
};

export default Bookings;
