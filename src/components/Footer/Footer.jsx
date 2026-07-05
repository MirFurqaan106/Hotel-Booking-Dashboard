import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-copy">
          &copy; {currentYear} <strong>HorizonStay</strong>. All rights reserved.
        </p>
        <div className="footer-status">
          <span className="status-dot"></span>
          <span className="status-text">System Status: Active</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
