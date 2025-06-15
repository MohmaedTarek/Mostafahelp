// File: components/placecard.jsx
import React from 'react';

const PlaceCard = ({ place, category }) => {
  // Get the correct name field based on category
  const getName = () => {
    if (category === 'hotels') return place.hotel_name;
    return place.name;
  };
  
  // Get the correct price display based on category
  const getPriceDisplay = () => {
    if (category === 'hotels') return `${place.price_per_night} ${place.currency}/night`;
    return '$'.repeat(place.price_level || 1);
  };
  
  return (
    <div className="place-card">
      <div className="place-image-container">
        <img 
          src={place.image_1} 
          alt={getName()} 
          className="place-image" 
        />
        <div className="place-rating-badge">
          <span className="star-icon">★</span>
          <span>{place.rating}</span>
        </div>
      </div>
      
      <div className="place-info">
        <div className="place-header">
          <h3 className="place-name">{getName()}</h3>
          <div className="place-price">{getPriceDisplay()}</div>
        </div>
        
        <p>{place.description}</p>
        
        <div className="place-details">
          <div className="place-distance">
            <span className="detail-icon">📍</span>
            <span>{place.address}</span>
          </div>
          {/* Other details specific to the category */}
        </div>
      </div>
      
      {/* Button based on category */}
      {category === 'hotels' ? (
        <button className="directions-button">
          <span className="arrow-icon">↗️</span>
          Book Now
        </button>
      ) : (
        <button className="directions-button">
          <span className="arrow-icon">↗️</span>
          Get Directions
        </button>
      )}
    </div>
  );
};

export default PlaceCard;