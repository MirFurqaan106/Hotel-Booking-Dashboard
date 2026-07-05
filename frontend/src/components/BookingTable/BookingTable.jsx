import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  FiChevronUp, 
  FiChevronDown, 
  FiChevronLeft, 
  FiChevronRight,
  FiDownload,
  FiFileText
} from 'react-icons/fi';
import './BookingTable.css';

const BookingTable = () => {
  const { filteredBookings } = useDashboard();
  
  // 1. Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // 2. Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'CheckIn', direction: 'ascending' });

  // Reset pagination when data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredBookings]);

  // 3. Sorting Logic
  const sortedBookings = useMemo(() => {
    let sortableItems = [...filteredBookings];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle numeric parsing if sorting revenue
        if (sortConfig.key === 'Revenue') {
          aValue = parseFloat(aValue) || 0;
          bValue = parseFloat(bValue) || 0;
        }

        // Handle date sorting
        if (sortConfig.key === 'CheckIn' || sortConfig.key === 'CheckOut' || sortConfig.key === 'BookingDate') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredBookings, sortConfig]);

  // 4. Pagination Calculation
  const totalEntries = sortedBookings.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = sortedBookings.slice(indexOfFirstEntry, indexOfLastEntry);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <FiChevronUp /> : <FiChevronDown />;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Checked In': return <span className="badge badge-success">Checked In</span>;
      case 'Checked Out': return <span className="badge badge-info">Checked Out</span>;
      case 'Confirmed': return <span className="badge badge-warning">Confirmed</span>;
      case 'Cancelled': return <span className="badge badge-danger">Cancelled</span>;
      default: return <span className="badge badge-info">{status}</span>;
    }
  };

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'Paid': return <span className="badge badge-success">Paid</span>;
      case 'Pending': return <span className="badge badge-warning">Pending</span>;
      case 'Refunded': return <span className="badge badge-info">Refunded</span>;
      case 'Failed': return <span className="badge badge-danger">Failed</span>;
      default: return <span className="badge badge-info">{status}</span>;
    }
  };

  // 5. CSV Downloader
  const downloadCSV = () => {
    const headers = [
      'Booking ID', 'Guest Name', 'Room Type', 'Room Number', 'Check-In', 
      'Check-Out', 'Status', 'Payment Status', 'Payment Method', 'Amount (₹)', 'Country'
    ];
    
    const rows = filteredBookings.map(b => [
      b.BookingID,
      b.GuestName,
      b.RoomType,
      b.RoomNumber,
      b.CheckIn,
      b.CheckOut,
      b.BookingStatus,
      b.PaymentStatus,
      b.PaymentMethod,
      b.Revenue,
      b.Country
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HorizonStay_Bookings_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="table-container card">
      <div className="table-controls">
        <div className="entries-selector">
          <span>Show</span>
          <select 
            value={entriesPerPage} 
            onChange={(e) => {
              setEntriesPerPage(parseInt(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="table-actions">
          <button className="table-btn" onClick={downloadCSV} title="Export current list to CSV">
            <FiDownload size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="bookings-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('BookingID')} className="sortable">
                Booking ID {getSortIcon('BookingID')}
              </th>
              <th onClick={() => requestSort('GuestName')} className="sortable">
                Guest Name {getSortIcon('GuestName')}
              </th>
              <th>Room Type</th>
              <th onClick={() => requestSort('CheckIn')} className="sortable">
                Check-In {getSortIcon('CheckIn')}
              </th>
              <th onClick={() => requestSort('CheckOut')} className="sortable">
                Check-Out {getSortIcon('CheckOut')}
              </th>
              <th>Status</th>
              <th>Payment Status</th>
              <th onClick={() => requestSort('Revenue')} className="sortable">
                Amount {getSortIcon('Revenue')}
              </th>
              <th onClick={() => requestSort('Country')} className="sortable">
                Country {getSortIcon('Country')}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentEntries.length > 0 ? (
              currentEntries.map((b) => (
                <tr key={b.BookingID}>
                  <td className="font-semibold">{b.BookingID}</td>
                  <td>
                    <div className="guest-info">
                      <span className="guest-name-main">{b.GuestName}</span>
                      <span className="guest-meta-sub">{b.Age} y/o • {b.Gender}</span>
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
                  <td className="revenue-cell">₹{b.Revenue}</td>
                  <td>
                    <span className="country-badge">{b.Country}</span>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, totalEntries)} of {totalEntries} entries
          </div>
          <div className="pagination-pages">
            <button 
              className="pagination-btn" 
              onClick={() => setCurrentPage(1)} 
              disabled={currentPage === 1}
            >
              First
            </button>
            <button 
              className="pagination-btn" 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
              disabled={currentPage === 1}
            >
              <FiChevronLeft size={16} />
            </button>

            {/* Render a limited number of page numbers around the current page */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
              // Sliding window of page numbers
              let pageNum = idx + 1;
              if (currentPage > 3) {
                pageNum = currentPage - 3 + idx;
              }
              if (pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  className={`pagination-page-number ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}

            <button 
              className="pagination-btn" 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
              disabled={currentPage === totalPages}
            >
              <FiChevronRight size={16} />
            </button>
            <button 
              className="pagination-btn" 
              onClick={() => setCurrentPage(totalPages)} 
              disabled={currentPage === totalPages}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingTable;
export { BookingTable };
