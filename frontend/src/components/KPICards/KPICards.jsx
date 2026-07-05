import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  FiCalendar, 
  FiDollarSign, 
  FiPercent, 
  FiXCircle, 
  FiClock, 
  FiGrid, 
  FiLogIn, 
  FiLogOut,
  FiBookOpen,
  FiArrowUpRight
} from 'react-icons/fi';
import './KPICards.css';

const KPICards = () => {
  const { filteredBookings } = useDashboard();
  const currentDateStr = '2026-07-05';
  const totalHotelRooms = 12;

  // 1. Calculations
  const totalBookings = filteredBookings.length;
  
  const totalRevenue = filteredBookings.reduce((sum, b) => sum + b.Revenue, 0);

  const checkedInBookings = filteredBookings.filter(b => b.BookingStatus === 'Checked In');
  const checkedInCount = checkedInBookings.length;

  const checkedOutCount = filteredBookings.filter(b => b.BookingStatus === 'Checked Out').length;
  const cancelledCount = filteredBookings.filter(b => b.BookingStatus === 'Cancelled').length;

  const cancellationRate = totalBookings > 0 
    ? Math.round((cancelledCount / totalBookings) * 100) 
    : 0;

  // Occupancy Rate: Active guests currently checked in divided by total rooms
  const occupancyRate = Math.round((checkedInCount / totalHotelRooms) * 100);

  // Available Rooms: Total rooms - currently occupied rooms
  const availableRooms = Math.max(0, totalHotelRooms - checkedInCount);

  // Average Stay duration (nights)
  const totalNights = filteredBookings.reduce((sum, b) => {
    const checkIn = new Date(b.CheckIn);
    const checkOut = new Date(b.CheckOut);
    const nights = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    return sum + (isNaN(nights) ? 0 : nights);
  }, 0);
  const averageStay = totalBookings > 0 
    ? (totalNights / totalBookings).toFixed(1) 
    : '0.0';

  // Today's Bookings: bookings made on 2026-07-05
  const todaysBookingsCount = filteredBookings.filter(b => b.BookingDate === currentDateStr).length;

  // Upcoming Reservations: Confirmed status checkin after 2026-07-05
  const upcomingReservationsCount = filteredBookings.filter(
    b => b.BookingStatus === 'Confirmed' && b.CheckIn > currentDateStr
  ).length;

  const cardsData = [
    {
      title: 'Total Bookings',
      value: totalBookings.toLocaleString(),
      icon: FiBookOpen,
      color: 'primary',
      desc: 'All reservations in scope'
    },
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: FiDollarSign,
      color: 'success',
      desc: 'Sum of stays & fees'
    },
    {
      title: 'Occupancy Rate',
      value: `${occupancyRate}%`,
      icon: FiPercent,
      color: 'info',
      desc: `${checkedInCount} of ${totalHotelRooms} rooms`
    },
    {
      title: 'Cancellation Rate',
      value: `${cancellationRate}%`,
      icon: FiXCircle,
      color: 'danger',
      desc: `${cancelledCount} cancelled stay(s)`
    },
    {
      title: 'Average Stay',
      value: `${averageStay} nights`,
      icon: FiClock,
      color: 'warning',
      desc: 'Avg nights per guest'
    },
    {
      title: 'Available Rooms',
      value: availableRooms,
      icon: FiGrid,
      color: 'success',
      desc: 'Ready for new guests'
    },
    {
      title: 'Checked In Guests',
      value: checkedInCount,
      icon: FiLogIn,
      color: 'info',
      desc: 'Currently in-house'
    },
    {
      title: 'Checked Out Guests',
      value: checkedOutCount,
      icon: FiLogOut,
      color: 'primary',
      desc: 'Completed stays'
    },
    {
      title: "Today's Bookings",
      value: todaysBookingsCount,
      icon: FiCalendar,
      color: 'warning',
      desc: 'Created today'
    },
    {
      title: 'Upcoming Reservations',
      value: upcomingReservationsCount,
      icon: FiArrowUpRight,
      color: 'primary',
      desc: 'Future arrivals'
    }
  ];

  return (
    <div className="kpi-grid">
      {cardsData.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className={`kpi-card card border-${card.color}`}>
            <div className="kpi-card-header">
              <span className="kpi-title">{card.title}</span>
              <div className={`kpi-icon-wrapper bg-${card.color}-light text-${card.color}`}>
                <Icon size={20} />
              </div>
            </div>
            <div className="kpi-card-body">
              <h3 className="kpi-value">{card.value}</h3>
              <p className="kpi-desc">{card.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;
