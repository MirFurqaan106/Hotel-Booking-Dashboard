import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FiMenu, FiX, FiLock, FiSun, FiMoon } from 'react-icons/fi';
import { useDashboard } from '../../context/DashboardContext';
import './NavbarPublic.css';

const NavbarPublic = () => {
  const { theme, toggleTheme } = useDashboard();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { name: 'Home', path: '/' },
    { name: 'About The Hotel', path: '/about' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Book Room', path: '/book' },
    { name: 'Customer Reviews', path: '/reviews' },
    { name: 'Contact Us', path: '/contact' }
  ];

  return (
    <header className="navbar-public glass-panel">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="brand-logo-icon">P</span>
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

          {/* Admin Login Link */}
          <Link to="/admin" className="portal-login-btn" title="Manager Portal login">
            <FiLock size={14} />
            <span>Manager Portal</span>
          </Link>

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
              <li className="mobile-portal-item">
                <Link to="/admin" className="mobile-portal-link" onClick={() => setMenuOpen(false)}>
                  <FiLock size={14} />
                  <span>Manager Portal</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default NavbarPublic;
