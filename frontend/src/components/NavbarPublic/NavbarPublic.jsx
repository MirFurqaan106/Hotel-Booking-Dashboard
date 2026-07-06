import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FiMenu, FiX, FiLock, FiSun, FiMoon, FiUser, FiLogOut } from 'react-icons/fi';
import { useDashboard } from '../../context/DashboardContext';
import logoImg from '../../assets/logo.jpg';
import './NavbarPublic.css';

const NavbarPublic = () => {
  const { theme, toggleTheme } = useDashboard();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('user_role');

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Know Us', path: '/about' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Book Room', path: '/book' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Support', path: '/support' },
    { name: 'Reviews', path: '/reviews' }
  ];

  return (
    <header className="navbar-public glass-panel">
      <div className="nav-container">
        <Link to="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src={logoImg} alt="Panun Ghar Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
          <span className="brand-title-text">Panun<span className="brand-sub-text"> Ghar</span></span>
        </Link>

        {/* Desktop Links */}
        <nav className="desktop-nav">
          <ul className="nav-links-list">
            {links.map((link) => (
              <li key={link.name}>
                <NavLink 
                  to={link.path} 
                  className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}
                >
                  {link.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Actions */}
        <div className="nav-right-actions">
          {/* Light/Dark Toggle */}
          <button className="theme-toggle-public" onClick={toggleTheme}>
            {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
          </button>

          {/* Dynamic Login / Portal Buttons */}
          {token ? (
            <>
              {role === 'User' ? (
                <Link to="/dashboard" className="portal-login-btn">
                  <FiUser size={14} />
                  <span>My Dashboard</span>
                </Link>
              ) : (
                <Link to="/admin" className="portal-login-btn">
                  <FiLock size={14} />
                  <span>Manager Portal</span>
                </Link>
              )}
              <button onClick={handleLogout} className="theme-toggle-public" title="Sign Out">
                <FiLogOut size={16} />
              </button>
            </>
          ) : (
            <Link to="/login" className="portal-login-btn">
              <FiUser size={14} />
              <span>Sign In</span>
            </Link>
          )}

          {/* Hamburger Menu Toggle */}
          <button className="mobile-menu-toggle-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {menuOpen && (
        <div className="mobile-menu-panel card glass-panel animate-fade-in">
          <nav className="mobile-nav">
            <ul>
              {links.map((link) => (
                <li key={link.name}>
                  <NavLink 
                    to={link.path} 
                    className="mobile-nav-link"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.name}
                  </NavLink>
                </li>
              ))}
              {token && (role === 'Admin' || role === 'Manager') && (
                <li className="mobile-portal-item">
                  <Link to="/admin" className="mobile-portal-link" onClick={() => setMenuOpen(false)}>
                    <FiLock size={14} />
                    <span>Manager Portal</span>
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default NavbarPublic;
