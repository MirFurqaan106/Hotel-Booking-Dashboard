import React, { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import Header from '../../components/Header/Header';
import Filters from '../../components/Filters/Filters';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { 
  FiDollarSign, 
  FiTrendingUp, 
  FiLayers, 
  FiActivity 
} from 'react-icons/fi';
import './Revenue.css';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'];

const Revenue = () => {
  const { filteredBookings, loadLiveBookings } = useDashboard();

  React.useEffect(() => {
    loadLiveBookings();
  }, []);

  // 1. Core Financial KPI Metrics
  const metrics = useMemo(() => {
    const bookingsCount = filteredBookings.length;
    const totalRev = filteredBookings.reduce((sum, b) => sum + b.Revenue, 0);
    const avgBookingValue = bookingsCount > 0 ? Math.round(totalRev / bookingsCount) : 0;
    
    // Profit approximation: 72% margin (mocking operating costs of 28%)
    const projectedProfit = Math.round(totalRev * 0.72);
    
    // Growth indicator mock
    const growthPercent = 12.4;

    return {
      totalRevenue: totalRev,
      avgValue: avgBookingValue,
      profit: projectedProfit,
      growth: growthPercent
    };
  }, [filteredBookings]);

  // 2. Chart Data: Monthly Revenue & Profits
  const monthlyFinancials = useMemo(() => {
    const monthly = {};
    filteredBookings.forEach(b => {
      const monthKey = b.CheckIn.substring(0, 7); // "2026-05"
      if (!monthly[monthKey]) {
        monthly[monthKey] = 0;
      }
      monthly[monthKey] += b.Revenue;
    });

    return Object.keys(monthly)
      .sort()
      .map(key => {
        const [year, month] = key.split('-');
        const dateObj = new Date(year, parseInt(month) - 1, 1);
        const label = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const revenue = monthly[key];
        const profit = Math.round(revenue * 0.72); // 72% profit margin
        
        return {
          month: label,
          Revenue: revenue,
          Profit: profit
        };
      });
  }, [filteredBookings]);

  // 3. Chart Data: Revenue by Room Type
  const revenueByRoomType = useMemo(() => {
    const roomTypeMap = {};
    filteredBookings.forEach(b => {
      roomTypeMap[b.RoomType] = (roomTypeMap[b.RoomType] || 0) + b.Revenue;
    });

    return Object.keys(roomTypeMap).map(key => ({
      name: key,
      value: roomTypeMap[key]
    }));
  }, [filteredBookings]);

  // 4. Chart Data: Average Booking Value Trend
  const averageBookingValueTrend = useMemo(() => {
    const monthly = {};
    filteredBookings.forEach(b => {
      const monthKey = b.CheckIn.substring(0, 7);
      if (!monthly[monthKey]) {
        monthly[monthKey] = { sum: 0, count: 0 };
      }
      monthly[monthKey].sum += b.Revenue;
      monthly[monthKey].count++;
    });

    return Object.keys(monthly)
      .sort()
      .map(key => {
        const [year, month] = key.split('-');
        const dateObj = new Date(year, parseInt(month) - 1, 1);
        const label = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const avg = Math.round(monthly[key].sum / monthly[key].count);
        
        return {
          month: label,
          AverageValue: avg
        };
      });
  }, [filteredBookings]);

  return (
    <div className="revenue-page page-container animate-fade-in">
      <Header title="Revenue Analytics" subtitle="Track financial growth, evaluate room class profits, and inspect revenue margins" />

      {/* Financial KPIs */}
      <div className="revenue-kpis-grid">
        <div className="rev-kpi-card card">
          <div className="rev-card-header">
            <span className="lbl">Total Revenue</span>
            <div className="kpi-icon-wrapper bg-success-light text-success">
              <FiDollarSign size={20} />
            </div>
          </div>
          <h3>₹{metrics.totalRevenue.toLocaleString()}</h3>
          <p className="kpi-desc-sub"><span className="trend-up">+{metrics.growth}%</span> since last month</p>
        </div>

        <div className="rev-kpi-card card">
          <div className="rev-card-header">
            <span className="lbl">Average Booking Value</span>
            <div className="kpi-icon-wrapper bg-primary-light text-primary">
              <FiActivity size={20} />
            </div>
          </div>
          <h3>₹{metrics.avgValue.toLocaleString()}</h3>
          <p className="kpi-desc-sub">Avg transaction size per stay</p>
        </div>

        <div className="rev-kpi-card card">
          <div className="rev-card-header">
            <span className="lbl">Net Estimated Profit</span>
            <div className="kpi-icon-wrapper bg-info-light text-info">
              <FiTrendingUp size={20} />
            </div>
          </div>
          <h3>₹{metrics.profit.toLocaleString()}</h3>
          <p className="kpi-desc-sub">72% profit margin projection</p>
        </div>

        <div className="rev-kpi-card card">
          <div className="rev-card-header">
            <span className="lbl">Active Room Classes</span>
            <div className="kpi-icon-wrapper bg-warning-light text-warning">
              <FiLayers size={20} />
            </div>
          </div>
          <h3>{revenueByRoomType.length}</h3>
          <p className="kpi-desc-sub">Contributing categories</p>
        </div>
      </div>

      {/* Financial Charts */}
      <div className="revenue-charts-grid">
        {/* Profit Trend (Area/Line comparison) */}
        <div className="chart-large card">
          <div className="chart-header-custom">
            <h3>Revenue vs Net Profit Trend</h3>
            <p>Evaluating monthly margins and operational costs</p>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={monthlyFinancials} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="Revenue" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                <Area type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProf)" name="Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue By Room Type (Pie Chart) */}
        <div className="chart-medium card">
          <div className="chart-header-custom">
            <h3>Revenue by Room Class</h3>
            <p>Earnings share across categories</p>
          </div>
          <div className="chart-content flex-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={revenueByRoomType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {revenueByRoomType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} />
                <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Booking Value Trend (Bar Chart) */}
        <div className="chart-medium card">
          <div className="chart-header-custom">
            <h3>Average Booking Value</h3>
            <p>Monthly ticket size variations</p>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={averageBookingValueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip formatter={(val) => `₹${val}`} />
                <Bar dataKey="AverageValue" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Avg Stay Ticket" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Revenue;
export { Revenue };
