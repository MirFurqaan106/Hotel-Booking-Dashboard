import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import Header from '../../components/Header/Header';
import KPICards from '../../components/KPICards/KPICards';
import Filters from '../../components/Filters/Filters';
import { 
  RevenueTrendChart, 
  MonthlyBookingsChart, 
  OccupancyTrendChart, 
  RoomTypeDistributionChart 
} from '../../components/Charts/Charts';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
  const { filteredBookings } = useDashboard();

  // Get top 5 upcoming reservations
  const upcomingBookings = React.useMemo(() => {
    return filteredBookings
      .filter(b => b.BookingStatus === 'Confirmed')
      .slice(0, 5);
  }, [filteredBookings]);

  // Get status color helper
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Checked In': return 'badge-success';
      case 'Checked Out': return 'badge-info';
      case 'Confirmed': return 'badge-warning';
      case 'Cancelled': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  return (
    <div className="dashboard-page page-container animate-fade-in">
      <Header title="Overview Dashboard" />
      
      {/* Filters collapsible/expandable or static at top */}
      <Filters />

      {/* Primary Indicators Grid */}
      <KPICards />

      {/* Main Analytical Charts */}
      <div className="dashboard-charts-grid">
        <div className="chart-card card">
          <div className="chart-header">
            <h3>Revenue Trend</h3>
            <p>Monthly financial earnings comparison</p>
          </div>
          <RevenueTrendChart />
        </div>

        <div className="chart-card card">
          <div className="chart-header">
            <h3>Monthly Stays</h3>
            <p>Total checked-in guest counts</p>
          </div>
          <MonthlyBookingsChart />
        </div>

        <div className="chart-card card">
          <div className="chart-header">
            <h3>Occupancy Rate (%)</h3>
            <p>In-house guests compared to hotel room capacity</p>
          </div>
          <OccupancyTrendChart />
        </div>

        <div className="chart-card card">
          <div className="chart-header">
            <h3>Room Type Distribution</h3>
            <p>Ratio of Single, Double, Deluxe, and Suites</p>
          </div>
          <RoomTypeDistributionChart />
        </div>
      </div>

      {/* Quick Table for Upcoming Bookings */}
      <div className="dashboard-secondary-grid">
        <div className="dashboard-quick-list card">
          <div className="quick-list-header">
            <div className="header-meta">
              <h3>Upcoming Reservations</h3>
              <p>Top upcoming guests and check-in schedules</p>
            </div>
            <Link to="/bookings" className="view-all-link">
              <span>View All</span>
              <FiArrowRight size={14} />
            </Link>
          </div>

          <div className="quick-list-table-wrapper">
            {upcomingBookings.length > 0 ? (
              <table className="quick-list-table">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Room Type</th>
                    <th>Check-In</th>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingBookings.map((b) => (
                    <tr key={b.BookingID}>
                      <td>
                        <div className="guest-cell">
                          <span className="guest-name">{b.GuestName}</span>
                          <span className="guest-id">{b.BookingID}</span>
                        </div>
                      </td>
                      <td>{b.RoomType}</td>
                      <td>{b.CheckIn}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(b.BookingStatus)}`}>
                          {b.BookingStatus}
                        </span>
                      </td>
                      <td className="amount-cell">${b.Revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-quick-list">
                <p>No upcoming bookings match current filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
