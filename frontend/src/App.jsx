import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { DashboardProvider, useDashboard } from './context/DashboardContext';

// Public Layout Components & Pages
import NavbarPublic from './components/NavbarPublic/NavbarPublic';
import FooterPublic from './components/FooterPublic/FooterPublic';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Gallery from './pages/Gallery/Gallery';
import BookingSection from './pages/BookingSection/BookingSection';
import Reviews from './pages/Reviews/Reviews';
import ContactUs from './pages/ContactUs/ContactUs';
import HotelDetails from './pages/HotelDetails/HotelDetails';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import UserDashboard from './pages/Dashboard/UserDashboard';

// Admin Layout Components & Pages
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

// Layout wrapper selector based on current path location
const AppContent = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const { sidebarCollapsed } = useDashboard();

  if (isAdminPath) {
    // Admin Management Portal
    return (
      <div className={`app-layout ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Sidebar />
        <div className="main-panel">
          <Navbar />
          <main className="content-area">
            <Routes>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/bookings" element={<Bookings />} />
              <Route path="/admin/customers" element={<Customers />} />
              <Route path="/admin/rooms" element={<Rooms />} />
              <Route path="/admin/revenue" element={<Revenue />} />
              <Route path="/admin/settings" element={<Settings />} />
            </Routes>
            <Footer />
          </main>
        </div>
      </div>
    );
  }

  // Public Facing Website
  return (
    <div className="public-layout">
      <NavbarPublic />
      <main className="public-content-area animate-fade-in">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/book" element={<BookingSection />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/hotel/:id" element={<HotelDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<UserDashboard />} />
        </Routes>
      </main>
      <FooterPublic />
    </div>
  );
};

function App() {
  return (
    <Router>
      <DashboardProvider>
        <AppContent />
      </DashboardProvider>
    </Router>
  );
}

export default App;
