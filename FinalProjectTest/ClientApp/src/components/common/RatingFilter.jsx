import React from 'react';

const RatingFilter = ({ value, onChange }) => {
  return (
    <div className="rating-filter">
      <h3 className="filter-heading">Minimum Rating</h3>
      <div className="star-rating">
        {[3, 3.5, 4, 4.5, 5].map(star => (
          <button
            key={star}
            className={`rating-button ${star === value ? 'active' : ''}`}
            onClick={() => onChange(star)}
          >
            <span>{star}+</span>
            <span className="star-icon">★</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RatingFilter;