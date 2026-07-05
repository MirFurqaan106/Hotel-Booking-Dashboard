import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useDashboard } from '../../context/DashboardContext';
import './Charts.css';

// 1. Theme-aware Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((p, idx) => (
          <p key={idx} className="tooltip-value" style={{ color: p.color }}>
            <span className="dot" style={{ backgroundColor: p.color }}></span>
            {p.name}: {formatter ? formatter(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Color Palette
const COLORS = {
  primary: '#2563eb',  // Blue
  success: '#10b981',  // Green
  warning: '#f59e0b',  // Yellow
  danger: '#ef4444',   // Red
  info: '#06b6d4',     // Cyan
  purple: '#8b5cf6',   // Purple
  pink: '#ec4899',     // Pink
  orange: '#f97316'    // Orange
};

const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.purple, COLORS.pink, COLORS.orange];

// Utility: Group by Month for Time-series Charts
const useMonthlyData = (bookings) => {
  return useMemo(() => {
    const monthly = {};
    bookings.forEach(b => {
      const monthKey = b.CheckIn.substring(0, 7); // "2026-05"
      if (!monthly[monthKey]) {
        monthly[monthKey] = {
          bookings: 0,
          revenue: 0,
          cancellations: 0,
          checkedIn: 0
        };
      }
      monthly[monthKey].bookings++;
      monthly[monthKey].revenue += b.Revenue;
      if (b.BookingStatus === 'Cancelled') {
        monthly[monthKey].cancellations++;
      } else if (b.BookingStatus === 'Checked In' || b.BookingStatus === 'Checked Out') {
        monthly[monthKey].checkedIn++;
      }
    });

    return Object.keys(monthly)
      .sort()
      .map(key => {
        const [year, month] = key.split('-');
        const dateObj = new Date(year, parseInt(month) - 1, 1);
        const label = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        // Mock dynamic occupancy rate based on bookings/checkedIn relative to a hypothetical capacity
        const monthlyCapacity = 12 * 30; // 12 rooms * 30 days = 360 room-nights
        const estimatedNights = monthly[key].bookings * 3.5; // Average stay 3.5 nights
        const occupancyRate = Math.min(95, Math.round((estimatedNights / monthlyCapacity) * 100));

        return {
          month: label,
          monthKey: key,
          Bookings: monthly[key].bookings,
          Revenue: monthly[key].revenue,
          Cancellations: monthly[key].cancellations,
          Occupancy: occupancyRate
        };
      });
  }, [bookings]);
};

// ==========================================
// 1. REVENUE TREND (Area Chart)
// ==========================================
export const RevenueTrendChart = () => {
  const { filteredBookings } = useDashboard();
  const data = useMonthlyData(filteredBookings);

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
          <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(val) => `₹${val/1000}k`} />
          <Tooltip content={<CustomTooltip formatter={(val) => `₹${val.toLocaleString()}`} />} />
          <Area type="monotone" dataKey="Revenue" stroke={COLORS.success} strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ==========================================
// 2. MONTHLY BOOKINGS (Bar Chart)
// ==========================================
export const MonthlyBookingsChart = () => {
  const { filteredBookings } = useDashboard();
  const data = useMonthlyData(filteredBookings);

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
          <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Bookings" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Bookings" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ==========================================
// 3. OCCUPANCY RATE (Line Chart)
// ==========================================
export const OccupancyTrendChart = () => {
  const { filteredBookings } = useDashboard();
  const data = useMonthlyData(filteredBookings);

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
          <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
          <Tooltip content={<CustomTooltip formatter={(val) => `${val}%`} />} />
          <Line type="monotone" dataKey="Occupancy" stroke={COLORS.info} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Occupancy Rate" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// ==========================================
// 4. ROOM TYPE DISTRIBUTION (Pie Chart)
// ==========================================
export const RoomTypeDistributionChart = () => {
  const { filteredBookings } = useDashboard();

  const data = useMemo(() => {
    const counts = {};
    filteredBookings.forEach(b => {
      counts[b.RoomType] = (counts[b.RoomType] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    }));
  }, [filteredBookings]);

  return (
    <div className="chart-wrapper pie-container">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(val) => `${val} bookings`} />
          <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// ==========================================
// 5. CANCELLATION TREND (Grouped Bar Chart)
// ==========================================
export const CancellationTrendChart = () => {
  const { filteredBookings } = useDashboard();
  const data = useMonthlyData(filteredBookings);

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
          <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <Bar dataKey="Bookings" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Total Bookings" />
          <Bar dataKey="Cancellations" fill={COLORS.danger} radius={[4, 4, 0, 0]} name="Cancellations" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ==========================================
// 6. COUNTRY-WISE CUSTOMERS (Horizontal Bar Chart)
// ==========================================
export const CountryCustomersChart = () => {
  const { filteredBookings } = useDashboard();

  const data = useMemo(() => {
    const counts = {};
    filteredBookings.forEach(b => {
      counts[b.Country] = (counts[b.Country] || 0) + 1;
    });
    return Object.keys(counts)
      .map(key => ({ name: key, Guests: counts[key] }))
      .sort((a, b) => b.Guests - a.Guests)
      .slice(0, 6); // Top 6 countries
  }, [filteredBookings]);

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
          <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Guests" fill={COLORS.purple} radius={[0, 4, 4, 0]} name="Guests" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ==========================================
// 7. BOOKING SOURCE (Pie/Donut Chart)
// ==========================================
export const BookingSourceChart = () => {
  const { filteredBookings } = useDashboard();

  const data = useMemo(() => {
    const counts = {};
    filteredBookings.forEach(b => {
      counts[b.BookingSource || 'Direct'] = (counts[b.BookingSource || 'Direct'] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    }));
  }, [filteredBookings]);

  return (
    <div className="chart-wrapper pie-container">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(val) => `${val} bookings`} />
          <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// ==========================================
// 8. CUSTOMER RATINGS (Bar Chart)
// ==========================================
export const CustomerRatingsChart = () => {
  const { filteredBookings } = useDashboard();

  const data = useMemo(() => {
    const ratings = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    filteredBookings.forEach(b => {
      if (b.Rating) {
        ratings[b.Rating] = (ratings[b.Rating] || 0) + 1;
      }
    });
    return Object.keys(ratings)
      .map(key => ({
        rating: `${key} Star`,
        Count: ratings[key]
      }))
      .reverse(); // Display 5 stars first
  }, [filteredBookings]);

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
          <XAxis dataKey="rating" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Count" fill={COLORS.orange} radius={[4, 4, 0, 0]} name="Reviews" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ==========================================
// 9. ROOM AVAILABILITY (Donut Chart)
// ==========================================
export const RoomAvailabilityChart = () => {
  const { filteredBookings } = useDashboard();
  const totalHotelRooms = 12;

  const data = useMemo(() => {
    // Rooms currently occupied: status "Checked In"
    const occupied = filteredBookings.filter(b => b.BookingStatus === 'Checked In').length;
    const available = Math.max(0, totalHotelRooms - occupied);
    
    return [
      { name: 'Occupied', value: occupied },
      { name: 'Available', value: available }
    ];
  }, [filteredBookings]);

  return (
    <div className="chart-wrapper pie-container">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
          >
            <Cell key="occupied" fill={COLORS.danger} />
            <Cell key="available" fill={COLORS.success} />
          </Pie>
          <Tooltip formatter={(val) => `${val} rooms`} />
          <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// ==========================================
// 10. PAYMENT METHODS (Pie/Donut Chart)
// ==========================================
export const PaymentMethodsChart = () => {
  const { filteredBookings } = useDashboard();

  const data = useMemo(() => {
    const counts = {};
    filteredBookings.forEach(b => {
      counts[b.PaymentMethod] = (counts[b.PaymentMethod] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    }));
  }, [filteredBookings]);

  return (
    <div className="chart-wrapper pie-container">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={0}
            outerRadius={90}
            paddingAngle={0}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[(index + 3) % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(val) => `${val} transactions`} />
          <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
