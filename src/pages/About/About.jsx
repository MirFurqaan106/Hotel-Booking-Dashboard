import React from 'react';
import { FiTv, FiWifi, FiWind, FiCoffee, FiCompass } from 'react-icons/fi';
import hotelLiving from '../../assets/hotel-living.jpg';
import hotelCinema from '../../assets/hotel-cinema.jpg';
import './About.css';

const About = () => {
  const amenities = [
    { name: 'Complimentary High-speed WiFi', icon: FiWifi },
    { name: 'Heated Rooms & Air Conditioning', icon: FiWind },
    { name: 'Traditional Kahwa Coffee & Tea', icon: FiCoffee },
    { name: 'Guided Kashmiri Sightseeing Tours', icon: FiCompass },
  ];

  return (
    <div className="about-page page-container animate-fade-in">
      <div className="about-header-section">
        <h1>About Panun Ghar</h1>
        <p>A heritage-infused sanctuary designed for comfort, luxury, and cultural connection in Kashmir.</p>
      </div>

      {/* Narrative Section 1 */}
      <section className="narrative-section grid-2">
        <div className="narrative-content">
          <h2>Our Heritage & Philosophy</h2>
          <p>
            Established with a vision to preserve the rich architectural soul of Kashmir, **Panun Ghar** (meaning *Our Own Home*) is a sanctuary where guests can experience the grandeur of Kashmiri culture combined with modern luxury.
          </p>
          <p>
            Every corner of the hotel features intricate woodwork, hand-carved ceilings, and authentic carpets woven by local artisans, bringing the cultural richness of the valley directly to your stay.
          </p>
          <div className="mini-amenities-list">
            {amenities.map((am, idx) => {
              const Icon = am.icon;
              return (
                <div key={idx} className="mini-am-item">
                  <Icon className="text-primary" />
                  <span>{am.name}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="narrative-image-wrapper">
          <img src={hotelLiving} alt="Hotel Lobby Lounge at Panun Ghar" className="narrative-img card" />
        </div>
      </section>

      {/* Focus Feature: PRIVATE CINEMA (User Request!) */}
      <section className="narrative-section grid-2 reverse">
        <div className="narrative-image-wrapper">
          <img src={hotelCinema} alt="Private Cinema Lounge at Panun Ghar" className="narrative-img card" />
        </div>
        <div className="narrative-content">
          <span className="feature-label-badge bg-warning-light text-warning">Exclusive Amenity</span>
          <h2>Private Cinema Theater Room</h2>
          <p>
            One of our most unique features is the private cinema hall at Panun Ghar. Relax in ultra-premium reclining velvet loungers designed for absolute comfort.
          </p>
          <p>
            Equipped with a high-end 4K projection screen and a **Dolby Atmos Surround Sound** setup, we screen selected classics, blockbusters, and documentaries about Kashmir daily. Complimentary popcorn, traditional tea, and snacks are provided for all in-house guests.
          </p>
          <div className="cinema-specs">
            <div className="spec-item">
              <strong>Capacity</strong>
              <span>12 Reclining Loungers</span>
            </div>
            <div className="spec-item">
              <strong>Technology</strong>
              <span>4K Ultra HD & Dolby Atmos</span>
            </div>
            <div className="spec-item">
              <strong>Access</strong>
              <span>Complimentary for Stays</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
