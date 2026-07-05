import React from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiMapPin, FiCompass, FiAward } from 'react-icons/fi';
import hotelExterior from '../../assets/hotel-exterior.jpg';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section" style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.5)), url(${hotelExterior})` }}>
        <div className="hero-content">
          <span className="hero-welcome-badge">Welcome to Kashmir</span>
          <h1>Panun Ghar Luxury Resort</h1>
          <p>A serene mountainous paradise blending traditional Kashmiri warmth with modern premium luxury.</p>
          <div className="hero-actions">
            <Link to="/book" className="btn-hero-primary">
              <FiCalendar size={16} />
              <span>Book Your Room</span>
            </Link>
            <Link to="/about" className="btn-hero-secondary">
              Explore Amenities
            </Link>
          </div>
        </div>
      </section>

      {/* Hotel Intro Cards */}
      <section className="home-intro-section">
        <div className="home-container">
          <div className="intro-header">
            <h2>Your Scenic Oasis in Srinagar</h2>
            <p>Panun Ghar offers a curated experience situated amidst pine-forested slopes and mist-covered valleys.</p>
          </div>

          <div className="features-grid-home">
            <div className="feature-home-card card">
              <div className="icon-box-home bg-primary-light text-primary">
                <FiMapPin size={24} />
              </div>
              <h3>Majestic Location</h3>
              <p>Nestled near Dal Lake, Srinagar, offering panoramic views of snow-capped mountains and tall pine trees.</p>
            </div>

            <div className="feature-home-card card">
              <div className="icon-box-home bg-success-light text-success">
                <FiCompass size={24} />
              </div>
              <h3>World-Class Comfort</h3>
              <p>Equipped with heated swimming pools, private cinema lounges, lush botanical parks, and premium suites.</p>
            </div>

            <div className="feature-home-card card">
              <div className="icon-box-home bg-warning-light text-warning">
                <FiAward size={24} />
              </div>
              <h3>Traditional Hospitality</h3>
              <p>Authentic Kashmiri hospitality, organic local culinary delights, and dedicated concierge managers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Promo banner section */}
      <section className="home-promo-banner card glass-panel">
        <div className="promo-text">
          <h2>Planning a Trip to Kashmir?</h2>
          <p>Book directly through our website to secure the best rates, complimentary room upgrades, and local tour guiding.</p>
        </div>
        <Link to="/book" className="btn-promo-booking">
          Reserve Room Now
        </Link>
      </section>
    </div>
  );
};

export default Home;
