import React from 'react';
import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiLock } from 'react-icons/fi';
import './FooterPublic.css';

const FooterPublic = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-public card">
      <div className="footer-public-container">
        {/* About Panun Ghar */}
        <div className="footer-col about-col">
          <Link to="/" className="footer-logo">
            <span className="logo-icon-p">P</span>
            <span>Panun Ghar</span>
          </Link>
          <p className="about-text">
            Experience premium luxury nestled in the scenic green mountains of Kashmir, India. Cozy rooms, private cinema, organic park gardens, and unparalleled hospitality.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-col links-col">
          <h4>Navigation</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Hotel</Link></li>
            <li><Link to="/gallery">Gallery</Link></li>
            <li><Link to="/book">Book Room</Link></li>
            <li><Link to="/reviews">Customer Reviews</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>

        {/* Contact info */}
        <div className="footer-col contact-col">
          <h4>Contact & Location</h4>
          <ul className="contact-details">
            <li>
              <FiPhone size={14} className="text-primary" />
              <span>+91 78899 84798</span>
            </li>
            <li>
              <FiMail size={14} className="text-primary" />
              <span>mirfurkaan106@gmail.com</span>
            </li>
            <li>
              <FiMapPin size={14} className="text-primary" />
              <span>Near Dal Lake, Srinagar, Kashmir, India - 190001</span>
            </li>
          </ul>
        </div>

        {/* Portals */}
        <div className="footer-col portals-col">
          <h4>Management</h4>
          <p className="portal-desc">Access secure analytical indicators, occupancy tracking, and transaction summaries.</p>
          <Link to="/admin" className="footer-portal-link">
            <FiLock size={12} />
            <span>Manager Portal</span>
          </Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} <strong>Panun Ghar Luxury Resort</strong>. All rights reserved.</p>
        <span className="designer-tag">Kashmir, India</span>
      </div>
    </footer>
  );
};

export default FooterPublic;
