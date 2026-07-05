import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDashboard } from '../../context/DashboardContext';
import { 
  FiHome, 
  FiCalendar, 
  FiUsers, 
  FiActivity, 
  FiDollarSign, 
  FiSettings, 
  FiChevronLeft, 
  FiChevronRight,
  FiX
} from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = () => {
  const { 
    sidebarCollapsed, 
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen
  } = useDashboard();

  const navigationItems = [
    { name: 'Dashboard', path: '/', icon: FiHome },
    { name: 'Bookings', path: '/bookings', icon: FiCalendar },
    { name: 'Customers', path: '/customers', icon: FiUsers },
    { name: 'Rooms', path: '/rooms', icon: FiActivity },
    { name: 'Revenue', path: '/revenue', icon: FiDollarSign },
    { name: 'Settings', path: '/settings', icon: FiSettings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <span className="logo-icon">P</span>
            {!sidebarCollapsed && <span className="logo-text">Panun<span className="logo-sub"> Ghar</span></span>}
          </div>
          
          {/* Mobile Close Button */}
          <button className="mobile-close-btn" onClick={() => setMobileSidebarOpen(false)}>
            <FiX size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileSidebarOpen(false)}
                  >
                    <Icon className="nav-icon" size={20} />
                    {!sidebarCollapsed && <span className="nav-text">{item.name}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button 
            className="collapse-btn" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
            {!sidebarCollapsed && <span>Collapse menu</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
