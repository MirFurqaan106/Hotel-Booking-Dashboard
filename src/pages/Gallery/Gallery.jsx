import React, { useState, useMemo } from 'react';
import hotelExterior from '../../assets/hotel-exterior.jpg';
import hotelRoom from '../../assets/hotel-room.jpg';
import hotelWashroom from '../../assets/hotel-washroom.jpg';
import hotelLiving from '../../assets/hotel-living.jpg';
import hotelPool from '../../assets/hotel-pool.jpg';
import hotelPark from '../../assets/hotel-park.jpg';
import hotelCinema from '../../assets/hotel-cinema.jpg';
import './Gallery.css';

const Gallery = () => {
  const [filter, setFilter] = useState('All');

  const photos = [
    { id: 1, title: 'Hotel Exterior', category: 'Exterior', image: hotelExterior, desc: 'Panun Ghar nestled in Kashmiri mountains' },
    { id: 2, title: 'Luxury Suite Bedroom', category: 'Rooms', image: hotelRoom, desc: 'Plush bedding with local wooden craft design' },
    { id: 3, title: 'Premium Washroom', category: 'Washrooms', image: hotelWashroom, desc: 'Modern marble tiling & high-end fittings' },
    { id: 4, title: 'Hotel Hearth Lobby', category: 'Living Area', image: hotelLiving, desc: 'Warm traditional fireplace and lounge seating' },
    { id: 5, title: 'Heated Swimming Pool', category: 'Pool', image: hotelPool, desc: 'Panoramic mountain views from pool decks' },
    { id: 6, title: 'Botanical Park Lawn', category: 'Park', image: hotelPark, desc: 'Lush greenery, pathways, and pine backdrops' },
    { id: 7, title: 'Private Cinema Hall', category: 'Cinema', image: hotelCinema, desc: 'Premium projection & sound screening theatre' }
  ];

  const categories = ['All', 'Exterior', 'Rooms', 'Washrooms', 'Living Area', 'Pool', 'Park', 'Cinema'];

  const filteredPhotos = useMemo(() => {
    if (filter === 'All') return photos;
    return photos.filter(p => p.category === filter);
  }, [filter]);

  return (
    <div className="gallery-page page-container animate-fade-in">
      <div className="gallery-header">
        <h1>Panun Ghar Gallery</h1>
        <p>Explore our beautiful resort grounds, visual amenities, and premium accommodation layouts.</p>
      </div>

      {/* Category filter tabs */}
      <div className="gallery-tabs">
        {categories.map((cat) => (
          <button 
            key={cat} 
            className={`gallery-tab-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Photos Grid */}
      <div className="gallery-grid">
        {filteredPhotos.map((photo) => (
          <div key={photo.id} className="gallery-item card animate-fade-in">
            <div className="gallery-img-container">
              <img src={photo.image} alt={photo.title} className="gallery-img" />
              <div className="gallery-overlay">
                <span className="gallery-overlay-cat">{photo.category}</span>
                <h4>{photo.title}</h4>
                <p>{photo.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
export { Gallery };
