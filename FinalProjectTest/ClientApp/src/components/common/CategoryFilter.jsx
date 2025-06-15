import React from 'react';

const CategoryFilter = ({ selectedCategory, onChange }) => {
    const categories = [
        { id: 'Restaurant', name: 'Restaurants', icon: '🍽️' },
        { id: 'Cafe', name: 'Cafes', icon: '☕' },
        { id: 'Hotel', name: 'Hotels', icon: '🏨' },
        { id: 'Museum', name: 'Museums', icon: '🖼️' },
        { id: 'Palace', name: 'Palaces', icon: '🏰' },
        { id: 'Mosque', name: 'Mosques', icon: '🕌' },
        { id: 'Church', name: 'Churches', icon: '⛪' },
        { id: 'Fortress', name: 'Fortresses', icon: '🛡️' },
        { id: 'Fountain', name: 'Fountains', icon: '⛲' },
        { id: 'Market', name: 'Markets', icon: '🛒' },
        { id: 'School', name: 'Schools', icon: '🏫' },
        { id: 'Shrine', name: 'Shrines', icon: '🕍' },
        { id: 'Historical', name: 'Historical', icon: '📜' }
    ];

    return (
        <div className="category-filter">
            <h3>I'm looking for:</h3>
            <div className="category-buttons">
                {categories.map(category => (
                    <button
                        key={category.id}
                        className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
                        onClick={() => onChange(category.id)}
                    >
                        <span className="category-icon">{category.icon}</span>
                        <span>{category.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CategoryFilter;
