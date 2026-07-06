import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import Header from '../../components/Header/Header';
import KPICards from '../../components/KPICards/KPICards';
import { 
  RevenueTrendChart, 
  RoomTypeDistributionChart 
} from '../../components/Charts/Charts';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
  const { filteredBookings, loadLiveBookings } = useDashboard();

  React.useEffect(() => {
    loadLiveBookings();
  }, []);

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
      <Header 
        title="Management Dashboard Overview" 
        subtitle="Real-time analytical stats and booking metrics synced with SQL database"
      />
      
      {/* Primary Indicators Grid (4 Clean cards) */}
      <KPICards />

      {/* Main Analytical Charts (Only 2 premium ones!) */}
      <div className="dashboard-charts-grid" style={{ gridTemplateColumns: '2fr 1.1fr', gap: '1.5rem', margin: '2rem 0' }}>
        <div className="chart-card card" style={{ padding: '1.5rem' }}>
          <div className="chart-header">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Revenue Margin Analysis</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>Monthly earnings performance relative to operating margins</p>
          </div>
          <RevenueTrendChart />
        </div>

        <div className="chart-card card" style={{ padding: '1.5rem' }}>
          <div className="chart-header">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Suites Share</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>Distribution ratio of room classes reserved</p>
          </div>
          <RoomTypeDistributionChart />
        </div>
      </div>

      {/* Quick Table for Upcoming Bookings */}
      <div className="dashboard-secondary-grid">
        <div className="dashboard-quick-list card" style={{ padding: '1.5rem' }}>
          <div className="quick-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div className="header-meta">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Upcoming Reservations</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>Top upcoming arrivals and stay schedules</p>
            </div>
            <Link to="/admin/bookings" className="view-all-link">
              <span>View Registry list</span>
              <FiArrowRight size={14} />
            </Link>
          </div>

          <div className="quick-list-table-wrapper">
            {upcomingBookings.length > 0 ? (
              <table className="quick-list-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700 }}>Guest</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700 }}>Room Type</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700 }}>Check-In</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingBookings.map((b) => (
                    <tr key={b.BookingID} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div className="guest-cell">
                          <span className="guest-name" style={{ fontWeight: 600 }}>{b.GuestName}</span>
                          <span className="guest-id" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{b.BookingID}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{b.RoomType} (Room {b.RoomNumber})</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{b.CheckIn}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span className={`status-badge-val ${b.BookingStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                          {b.BookingStatus}
                        </span>
                      </td>
                      <td className="amount-cell" style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>₹{b.Revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-quick-list" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No upcoming stays scheduled. Check room vacancies registry!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
export { Dashboard };
