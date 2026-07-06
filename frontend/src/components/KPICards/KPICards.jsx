import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  FiCalendar, 
  FiDollarSign, 
  FiPercent, 
  FiGrid
} from 'react-icons/fi';
import './KPICards.css';

const KPICards = () => {
  const { filteredBookings } = useDashboard();
  const totalHotelRooms = 12;

  // 1. Calculations
  const totalBookings = filteredBookings.length;
  const totalRevenue = filteredBookings.reduce((sum, b) => sum + b.Revenue, 0);
  const checkedInCount = filteredBookings.filter(b => b.BookingStatus === 'Checked In').length;
  const occupancyRate = totalHotelRooms > 0 ? Math.round((checkedInCount / totalHotelRooms) * 100) : 0;
  const availableRooms = Math.max(0, totalHotelRooms - checkedInCount);

  const cardsData = [
    {
      title: 'Total Bookings',
      value: totalBookings.toLocaleString(),
      icon: FiCalendar,
      color: 'primary',
      desc: 'All reservations in database'
    },
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: FiDollarSign,
      color: 'success',
      desc: 'Sum of stayed & confirmed fees'
    },
    {
      title: 'Occupancy Rate',
      value: `${occupancyRate}%`,
      icon: FiPercent,
      color: 'info',
      desc: `${checkedInCount} of ${totalHotelRooms} active suites occupied`
    },
    {
      title: 'Available Rooms',
      value: availableRooms,
      icon: FiGrid,
      color: 'warning',
      desc: 'Suites ready for immediate guest stays'
    }
  ];

  return (
    <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
      {cardsData.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className={`kpi-card card border-${card.color}`} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="kpi-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="kpi-title" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{card.title}</span>
              <div className={`kpi-icon-wrapper bg-${card.color}-light text-${card.color}`} style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifycontent: 'center' }}>
                <Icon size={18} />
              </div>
            </div>
            <div className="kpi-card-body">
              <h3 className="kpi-value" style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{card.value}</h3>
              <p className="kpi-desc" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>{card.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;
export { KPICards };
