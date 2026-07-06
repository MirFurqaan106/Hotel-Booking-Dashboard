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
  FiX,
  FiLogOut
} from 'react-icons/fi';
import logoImg from '../../assets/logo.jpg';
import './Sidebar.css';

const Sidebar = () => {
  const { 
    sidebarCollapsed, 
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen
  } = useDashboard();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const navigationItems = [
    { name: 'Dashboard', path: '/admin', icon: FiHome },
    { name: 'Bookings', path: '/admin/bookings', icon: FiCalendar },
    { name: 'Customers', path: '/admin/customers', icon: FiUsers },
    { name: 'Rooms', path: '/admin/rooms', icon: FiActivity },
    { name: 'Revenue', path: '/admin/revenue', icon: FiDollarSign },
    { name: 'Settings', path: '/admin/settings', icon: FiSettings },
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
        <div className="sidebar-brand" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src={logoImg} alt="Panun Ghar Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
            {!sidebarCollapsed && <span className="logo-text" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Panun<span style={{ color: 'var(--primary)' }}> Ghar</span></span>}
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
            
            <li>
              <button 
                type="button"
                onClick={handleLogout} 
                className="nav-link" 
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--danger)' }}
              >
                <FiLogOut className="nav-icon" size={20} style={{ color: 'var(--danger)' }} />
                {!sidebarCollapsed && <span className="nav-text" style={{ fontWeight: 700 }}>Sign Out</span>}
              </button>
            </li>
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
