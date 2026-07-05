import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  FiMenu, 
  FiSearch, 
  FiBell, 
  FiSun, 
  FiMoon, 
  FiGlobe,
  FiUser
} from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const {
    searchQuery,
    setSearchQuery,
    theme,
    toggleTheme,
    language,
    setLanguage,
    setMobileSidebarOpen
  } = useDashboard();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New reservation received from Jane Doe', time: '5m ago', read: false },
    { id: 2, text: 'Room 304 has been checked out', time: '1h ago', read: false },
    { id: 3, text: 'Cancellation request for Booking HB-1234', time: '3h ago', read: true }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLangChange = (e) => {
    setLanguage(e.target.value);
  };

  return (
    <header className="navbar glass-panel">
      {/* Menu burger button for mobile */}
      <button 
        className="mobile-toggle-btn"
        onClick={() => setMobileSidebarOpen(true)}
      >
        <FiMenu size={22} />
      </button>

      {/* Global Search Bar */}
      <div className="navbar-search">
        <FiSearch className="search-icon" size={18} />
        <input 
          type="text" 
          placeholder="Search bookings, guests, ID..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
        )}
      </div>

      {/* Right Controls */}
      <div className="navbar-actions">
        {/* Language selector */}
        <div className="navbar-action-item lang-selector">
          <FiGlobe className="action-icon" size={18} />
          <select value={language} onChange={handleLangChange}>
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="fr">FR</option>
            <option value="de">DE</option>
          </select>
        </div>

        {/* Theme toggle */}
        <button 
          className="navbar-action-item theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
        </button>

        {/* Notifications */}
        <div className="navbar-action-item notifications-container">
          <button 
            className="notifications-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <FiBell size={20} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          
          {showNotifications && (
            <div className="notifications-dropdown card animate-fade-in">
              <div className="dropdown-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead}>Mark all read</button>
                )}
              </div>
              <ul className="dropdown-list">
                {notifications.map(n => (
                  <li key={n.id} className={`dropdown-item ${n.read ? 'read' : 'unread'}`}>
                    <p className="item-text">{n.text}</p>
                    <span className="item-time">{n.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="navbar-profile">
          <div className="profile-info">
            <span className="profile-name">Alex Morgan</span>
            <span className="profile-role">Admin Manager</span>
          </div>
          <div className="profile-avatar">
            <FiUser size={18} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
