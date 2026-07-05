import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import Sidebar from './components/Sidebar/Sidebar';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Dashboard from './pages/Dashboard/Dashboard';
import Bookings from './pages/Bookings/Bookings';
import Customers from './pages/Customers/Customers';
import Rooms from './pages/Rooms/Rooms';
import Revenue from './pages/Revenue/Revenue';
import Settings from './pages/Settings/Settings';
import './App.css';

// A wrapper component to get state from DashboardContext
const DashboardLayout = () => {
  const { sidebarCollapsed } = useDashboard();
  
  return (
    <div className={`app-layout ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <Sidebar />
      <div className="main-panel">
        <Navbar />
        <main className="content-area">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/revenue" element={<Revenue />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
          <Footer />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <DashboardProvider>
        <DashboardLayout />
      </DashboardProvider>
    </Router>
  );
}

export default App;
