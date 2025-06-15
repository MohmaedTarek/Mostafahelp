import React from 'react';

const RecommendationCard = ({ recommendation }) => {
    // Helper functions to work with your existing data structure
    const getPlaceName = (place) => {
        return place.name || place.Name || place.hotel_name || 'Unnamed Place';
    };

    const getPlaceImage = (place) => {
        // Check multiple possible image fields from your data
        const imageUrl = place.image_1 || place.image || place.imageUrl || place.imageURL;

        if (imageUrl) {
            return imageUrl;
        }

        // Fallback to category-based image
        const category = getCategoryName(place);
        return `https://source.unsplash.com/300x200/?${category},cairo`;
    };

    const getCategoryName = (place) => {
        const raw = place.category || place.Category || '';
        const category = raw.toLowerCase();

        if (category.includes('restaurant') || category.includes('food')) return 'restaurants';
        if (category.includes('cafe') || category.includes('coffee')) return 'cafes';
        if (category.includes('hotel') || category.includes('accommodation')) return 'hotels';

        return 'monuments'; // everything else is considered monuments
    };


        if (place.Category) {
            const backendCategory = place.Category;
            const categoryMapping = {
                'Restaurant': 'restaurants',
                'Cafe': 'cafes',
                'Hotel': 'hotels',
                'Church': 'monuments',
                'Mosque': 'monuments',
                'Historical': 'monuments',
                'Museum': 'monuments',
                'Palace': 'monuments',
                'Fortress': 'monuments',
                'Shrine': 'monuments',
                'Fountain': 'monuments',
                'Market': 'monuments',
                'School': 'monuments'
            };
            return categoryMapping[backendCategory] || 'monuments';
        }

        if (place.hotel_name) {
            return 'hotels';
        }

        return 'monuments';
    };

    const formatRating = (place) => {
        const rating = place.Attributes || place.rating || place.Rating;
        if (rating === undefined || rating === null) return 'N/A';
        const numRating = Number(rating);
        if (isNaN(numRating)) return 'N/A';
        return numRating % 1 === 0 ? numRating.toFixed(0) : numRating.toFixed(1);
    };

    const formatPrice = (place) => {
        // Use the same price formatting as your Home component
        const PRICE_RANGES = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

        if ((place.hotel_name || getCategoryName(place) === 'hotels') && place.price_per_night) {
            return `${place.price_per_night} ${place.currency || 'EGP'}/night`;
        }
        return PRICE_RANGES[place.priceLevel] || 'Price varies';
    };

    const isHotel = (place) => {
        return place.hotel_name || getCategoryName(place) === 'hotels';
    };

    const handleGetLocation = (place) => {
        if (place.hotel_name || place.booking_link || getCategoryName(place) === 'hotels') {
            if (place.booking_link) {
                window.open(place.booking_link, '_blank');
            } else {
                alert(`View details for ${getPlaceName(place)}`);
            }
        } else if (place.GoogleMapsLink || place.googleMapsLink) {
            window.open(place.GoogleMapsLink || place.googleMapsLink, '_blank');
        } else {
            alert(`Getting directions to ${getPlaceName(place)}`);
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        const numRating = parseFloat(rating) || 0;
        const fullStars = Math.floor(numRating);
        const hasHalfStar = numRating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<span key={i} style={{ color: '#FFD700', fontSize: '14px' }}>★</span>);
        }

        if (hasHalfStar) {
            stars.push(<span key="half" style={{ color: '#FFD700', fontSize: '14px' }}>★</span>);
        }

        const emptyStars = 5 - Math.ceil(numRating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<span key={`empty-${i}`} style={{ color: '#ddd', fontSize: '14px' }}>☆</span>);
        }

        return stars;
    };

    // Category colors matching your Home component
    const categoryColors = {
        'restaurants': '#FF6B6B',
        'cafes': '#4ECDC4',
        'hotels': '#45B7D1',
        'monuments': '#96CEB4'
    };

    const category = getCategoryName(recommendation);
    const rating = formatRating(recommendation);

    return (
        <div className="place-card" style={{ marginBottom: '20px' }}>
            <div className="card-image-container">
                <img
                    src={getPlaceImage(recommendation)}
                    alt={getPlaceName(recommendation)}
                    className="card-image"
                    loading="lazy"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://source.unsplash.com/300x200/?${category},cairo`;
                    }}
                />

                <div className="card-image-overlay"></div>

                <div
                    className="category-tag"
                    style={{ backgroundColor: categoryColors[category] || '#4A00E0' }}
                >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                </div>

                <div className="rating-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="#FFD700" className="rating-star-icon">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    <span className="rating-number">{rating}</span>
                </div>
            </div>

            <div className="card-content">
                <h3 className="card-title">{getPlaceName(recommendation)}</h3>

                <div className="card-info">
                    <div className="price-info">
                        {formatPrice(recommendation)}
                    </div>

                    <div className={`status-info ${recommendation.openStatus?.includes('Open') ? 'open' : 'closed'}`}>
                        <span className="status-dot"></span>
                        {isHotel(recommendation)
                            ? `${recommendation.review_count || recommendation.reviewCount || 0} reviews`
                            : (recommendation.openStatus?.includes('Open') ? 'Open Now' : 'Closed')}
                    </div>
                </div>

                {/* Distance info if available */}
                {recommendation.distanceKM !== undefined && (
                    <div className="distance-info" style={{
                        color: '#666',
                        fontSize: '14px',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}>
                        <span>📍</span>
                        <span>{recommendation.distanceKM.toFixed(1)} km away</span>
                    </div>
                )}

                {/* Match score if available */}
                {recommendation.score && (
                    <div className="match-score" style={{
                        color: '#4A00E0',
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '10px'
                    }}>
                        Match Score: {(recommendation.score * 100).toFixed(0)}%
                    </div>
                )}

                <div className="location-info">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="location-icon">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>{recommendation.address || recommendation.Address || recommendation.distance || 'Cairo, Egypt'}</span>
                </div>

                <button
                    className="directions-button"
                    onClick={() => handleGetLocation(recommendation)}
                >
                    <span>{isHotel(recommendation) ? 'View Details' : 'Get Directions'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="arrow-icon">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default RecommendationCard;