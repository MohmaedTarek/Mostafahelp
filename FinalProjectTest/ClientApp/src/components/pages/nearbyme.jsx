import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getPlacesByCategory } from '../../utils/api';
import BudgetFilter from '../common/BudgetFilter';
import '../styles/nearbyme.css';

const NearbyPlaces = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedCategory, setSelectedCategory] = useState('restaurants');
    const [budget, setBudget] = useState(4);
    const [rating, setRating] = useState(3);
    const [loading, setLoading] = useState(true);
    const [places, setPlaces] = useState([]);
    const [allPlaces, setAllPlaces] = useState([]);
    const [isSearchActive, setIsSearchActive] = useState(false);

    // Search-related state
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [recentSearches, setRecentSearches] = useState(['restaurant', 'cafe', 'hotel']);
    const searchInputRef = useRef(null);

    const categoryIcons = {
        restaurants: { icon: '🍽️', color: '#FF5722', bg: '#FFF3F0', label: 'Restaurants' },
        cafes: { icon: '☕', color: '#795548', bg: '#F1EBE9', label: 'Cafes' },
        hotels: { icon: '🏨', color: '#2196F3', bg: '#E3F2FD', label: 'Hotels' },
        monuments: { icon: '🏛️', color: '#607D8B', bg: '#ECEFF1', label: 'Monuments' }
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const categoryParam = params.get('category');
        if (categoryParam && Object.keys(categoryIcons).includes(categoryParam)) {
            setSelectedCategory(categoryParam);
        }
    }, [location.search]);

    const getPriceRange = (priceLevel) => {
        const priceRanges = {
            0: 'Free',
            1: 'Inexpensive',
            2: 'Moderate',
            3: 'Expensive',
            4: 'Very Expensive'
        };
        return priceRanges[priceLevel] || 'Price not available';
    };

    const egyptianPriceRanges = {
        restaurants: {
            1: 'Under 200 EGP',
            2: '200-500 EGP',
            3: '500-1000 EGP',
            4: 'Over 1000 EGP'
        },
        cafes: {
            1: 'Under 100 EGP',
            2: '100-250 EGP',
            3: '250-500 EGP',
            4: 'Over 500 EGP'
        },
        hotels: {
            1: 'Under 1200 EGP',
            2: '1200-2000 EGP',
            3: '2000-3000 EGP',
            4: 'Over 3000 EGP'
        },
        monuments: {
            0: 'Free',
            1: 'Under 100 EGP',
            2: '100-300 EGP',
            3: '300-500 EGP',
            4: 'Over 500 EGP'
        }
    };

    // Search functionality
    const generateSuggestions = (query) => {
        if (!query.trim() || query.length < 2) {
            setSuggestions([]);
            return;
        }

        const queryLower = query.toLowerCase();
        const matchedPlaces = allPlaces.filter(place => {
            const name = (place.displayName || place.Name || '').toLowerCase();
            const address = (place.displayAddress || place.Address || '').toLowerCase();
            return name.includes(queryLower) || address.includes(queryLower);
        });

        const uniqueSuggestions = [];
        const seenNames = new Set();

        matchedPlaces.forEach(place => {
            const placeName = place.displayName || place.Name || 'Unknown Place';
            if (!seenNames.has(placeName.toLowerCase())) {
                seenNames.add(placeName.toLowerCase());
                uniqueSuggestions.push({
                    name: placeName,
                    address: place.displayAddress || place.Address || 'Cairo, Egypt',
                    type: 'place'
                });
            }
        });

        setSuggestions(uniqueSuggestions.slice(0, 8));
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        generateSuggestions(value);
        setShowSuggestions(true);
    };

    const performSearch = (query) => {
        if (!query.trim()) return;

        const queryLower = query.toLowerCase();
        const results = allPlaces.filter(place => {
            const name = (place.displayName || place.Name || '').toLowerCase();
            const address = (place.displayAddress || place.Address || '').toLowerCase();
            const description = (place.ShortDescription || place.FullDescription || place.description || '').toLowerCase();
            const searchString = `${name} ${address} ${description}`;
            return searchString.includes(queryLower);
        });

        results.sort((a, b) => {
            const nameA = (a.displayName || a.Name || '').toLowerCase();
            const nameB = (b.displayName || b.Name || '').toLowerCase();
            if (nameA === queryLower) return -1;
            if (nameB === queryLower) return 1;
            const aStartsWith = nameA.startsWith(queryLower);
            const bStartsWith = nameB.startsWith(queryLower);
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            const ratingA = parseFloat(a.displayRating || a.Attributes || 0);
            const ratingB = parseFloat(b.displayRating || b.Attributes || 0);
            return ratingB - ratingA;
        });

        setPlaces(results);
        setIsSearchActive(true);
    };

    const handleSuggestionClick = (suggestion) => {
        setSearchQuery(suggestion.name);
        performSearch(suggestion.name);
        setShowSuggestions(false);
        const updated = [suggestion.name, ...recentSearches.filter(item => item !== suggestion.name)].slice(0, 5);
        setRecentSearches(updated);
    };

    const handleSearchSubmit = () => {
        if (searchQuery.trim()) {
            performSearch(searchQuery.trim());
            setShowSuggestions(false);
            const updated = [searchQuery.trim(), ...recentSearches.filter(item => item !== searchQuery.trim())].slice(0, 5);
            setRecentSearches(updated);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchPlaces = async () => {
        setLoading(true);
        try {
            const res = await getPlacesByCategory(selectedCategory);

            if (res.success && res.data) {
                let filtered = res.data;

                filtered = filtered.filter(place => {
                    const priceLevel = place.priceLevel || 4;
                    const ratingValue = parseFloat(place.Attributes || place.attributes || 0);
                    const passesBudget = priceLevel <= budget;
                    const passesRating = selectedCategory === 'hotels'
                        ? (ratingValue / 10) * 5 >= rating
                        : ratingValue >= rating;
                    return passesBudget && passesRating;
                });

                setPlaces(filtered);

                const processedPlaces = res.data.map(place => ({
                    ...place,
                    category: getCategoryFromPlace(place),
                    displayName: getPlaceName(place),
                    displayRating: getRating(place),
                    displayAddress: getAddress(place),
                    displayImage: getImage(place)
                }));
                setAllPlaces(processedPlaces);
            } else {
                console.warn("Failed to fetch places:", res.message);
                setPlaces([]);
                setAllPlaces([]);
            }
        } catch (error) {
            console.error("Error fetching places:", error);
            setPlaces([]);
            setAllPlaces([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPlaces();
    }, [selectedCategory, budget, rating]);

    const handleBudgetChange = (newBudget) => {
        setBudget(newBudget);
        setIsSearchActive(false);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setIsSearchActive(false);
        setSearchQuery('');
        setShowSuggestions(false);
    };

    const handleRatingChange = (newRating) => {
        setRating(newRating);
        setIsSearchActive(false);
    };

    const getCategoryFromPlace = (place) => {
        if (place.category) {
            return place.category.toLowerCase();
        }

        if (place.Category) {
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
            return categoryMapping[place.Category] || 'monuments';
        }

        if (place.hotel_name || place.booking_link) {
            return 'hotels';
        }

        return 'monuments';
    };

    const getPlaceName = (place) => {
        return place.name || place.hotel_name || place.Name || 'Unnamed Place';
    };

    const getRating = (place) => {
        const rating = place.Attributes || place.rating || place.Rating;
        if (!rating || rating === 'N/A') return 'N/A';
        const numRating = parseFloat(rating);
        if (isNaN(numRating)) return 'N/A';
        return numRating.toFixed(1);
    };

    const getAddress = (place) => {
        return place.address || place.Address || 'Cairo, Egypt';
    };

    const getImage = (place) => {
        // Try multiple image field names
        const imageFields = [
            place.imageURL,
            place.ImageURL,
            place.image_1,
            place.image,
            place.imageUrl,
            place.Image
        ];

        for (const img of imageFields) {
            if (img && typeof img === 'string' && img.trim() && img !== 'N/A') {
                return img.trim();
            }
        }

        // Check if there's an images array
        if (place.images && Array.isArray(place.images) && place.images.length > 0) {
            const firstImage = place.images[0];
            if (firstImage && firstImage.imageURL) {
                return firstImage.imageURL;
            }
        }

        // Fallback images by category
        const category = getCategoryFromPlace(place);
        const fallbackImages = {
            restaurants: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop',
            cafes: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=250&fit=crop',
            hotels: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop',
            monuments: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=400&h=250&fit=crop'
        };

        return fallbackImages[category] || fallbackImages.monuments;
    };

    const handleHotelDetails = (place) => {
        const detailsLink = (place.detailURL && place.detailURL.trim()) ||
            (place.DetailURL && place.DetailURL.trim()) ||
            (place.booking_link && place.booking_link.trim()) ||
            (place.bookingLink && place.bookingLink.trim());

        if (detailsLink) {
            window.open(detailsLink, '_blank');
        } else {
            alert('Booking details not available for this hotel');
        }
    };

    const handleGetLocation = (place) => {
        if (place.googleMapsLink && place.googleMapsLink.trim()) {
            window.open(place.googleMapsLink, '_blank');
        } else {
            const destinationText = place.address || place.Address || place.name || place.Name || '';
            if (destinationText) {
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationText)}`;
                window.open(mapsUrl, '_blank');
            } else {
                alert('Location information not available');
            }
        }
    };

    const handleMonumentInfo = (place) => {
        const infoLink = (place.detailURL && place.detailURL.trim()) ||
            (place.DetailURL && place.DetailURL.trim()) ||
            (place.description_link && place.description_link.trim()) ||
            (place.info_link && place.info_link.trim()) ||
            (place.website && place.website.trim());

        if (infoLink) {
            window.open(infoLink, '_blank');
        } else {
            alert('More information not available for this monument');
        }
    };

    const handleSocialLink = (place) => {
        const socialLink = (place.detailURL && place.detailURL.trim()) ||
            (place.DetailURL && place.DetailURL.trim()) ||
            (place.facebook_link && place.facebook_link.trim()) ||
            (place.social_link && place.social_link.trim()) ||
            (place.website && place.website.trim());

        if (socialLink) {
            window.open(socialLink, '_blank');
        } else {
            alert('Social media link not available');
        }
    };

    const getImageUrl = (place) => {
        return getImage(place);
    };

    const getPriceDisplay = (place) => {
        // For hotels
        if (selectedCategory === 'hotels' && place.price_per_night) {
            return `${place.price_per_night} ${place.currency || 'EGP'}/night`;
        }

        // For non-hotels
        const priceLevel = place.priceLevel || 0;

        if (selectedCategory in egyptianPriceRanges && priceLevel in egyptianPriceRanges[selectedCategory]) {
            return egyptianPriceRanges[selectedCategory][priceLevel];
        }

        return getPriceRange(priceLevel);
    };

    const formatRating = (rating) => {
        if (rating === undefined || rating === null) return 'N/A';
        const numRating = Number(rating);
        if (isNaN(numRating)) return 'N/A';
        return numRating % 1 === 0 ? numRating.toFixed(0) : numRating.toFixed(1);
    };

    const hasExternalLink = (place) => {
        let hasDetailURL = false;

        if (place.detailURL && place.detailURL.trim()) {
            hasDetailURL = true;
        } else if (place.DetailURL && place.DetailURL.trim()) {
            hasDetailURL = true;
        }

        if (selectedCategory === 'hotels') {
            return hasDetailURL ||
                (place.booking_link && place.booking_link.trim()) ||
                (place.bookingLink && place.bookingLink.trim());
        } else if (selectedCategory === 'monuments') {
            return hasDetailURL ||
                (place.description_link && place.description_link.trim()) ||
                (place.info_link && place.info_link.trim()) ||
                (place.website && place.website.trim());
        } else if (selectedCategory === 'restaurants' || selectedCategory === 'cafes') {
            return hasDetailURL ||
                (place.facebook_link && place.facebook_link.trim()) ||
                (place.social_link && place.social_link.trim()) ||
                (place.website && place.website.trim());
        }
        return false;
    };

    return (
        <div className="nearby-places-page">
            <div className="nearby-top-section">
                <button
                    onClick={() => navigate('/')}
                    className="back-home-btn"
                >
                    <span className="back-arrow">←</span>
                    Back to Home
                </button>
                <div className="divider-line"></div>
            </div>

            <header className="nearby-header">
                <h1 className="nearby-title">
                    Explore {categoryIcons[selectedCategory].label} in Cairo
                </h1>
                <p className="nearby-subtitle">
                    Find the best {categoryIcons[selectedCategory].label.toLowerCase()} that match your preferences
                </p>
            </header>

            <div className="filters-section">
                <div className="category-filter">
                    <h3 className="filter-heading">What are you looking for?</h3>
                    <div className="category-buttons">
                        {Object.entries(categoryIcons).map(([category, { icon, color, bg, label }]) => (
                            <button
                                key={category}
                                onClick={() => handleCategoryChange(category)}
                                className={`category-button ${selectedCategory === category ? 'active' : ''}`}
                                style={{
                                    backgroundColor: selectedCategory === category ? color : 'white',
                                    color: selectedCategory === category ? 'white' : '#333',
                                }}
                            >
                                <span
                                    className="category-icon"
                                    style={{
                                        background: selectedCategory === category ? 'rgba(255,255,255,0.2)' : bg
                                    }}
                                >
                                    {icon}
                                </span>
                                <span>
                                    {label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Box */}
                <div className="search-filter-box">
                    <h3 className="filter-box-title">
                        <span className="search-icon">🔍</span>
                        Search Places
                    </h3>

                    <div ref={searchInputRef} className="search-input-wrapper">
                        <div className="search-input-container">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder="Search places..."
                                className="search-input"
                            />
                            <button
                                onClick={handleSearchSubmit}
                                className="search-button"
                            >
                                🔍
                            </button>
                        </div>

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="search-suggestions">
                                {suggestions.map((suggestion, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="suggestion-item"
                                    >
                                        <div className="suggestion-icon">
                                            📍
                                        </div>
                                        <div className="suggestion-content">
                                            <div className="suggestion-name">{suggestion.name}</div>
                                            <div className="suggestion-address">{suggestion.address}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {recentSearches.length > 0 && (
                        <div className="recent-search-section">
                            <div className="recent-search-buttons">
                                {recentSearches.map((search, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setSearchQuery(search);
                                            performSearch(search);
                                        }}
                                        className="recent-search-btn"
                                    >
                                        <span className="recent-icon">🕐</span>
                                        {search}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setRecentSearches([])}
                                    className="clear-recent-btn"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Rating filter box - Only for hotels */}
                {!isSearchActive && selectedCategory === 'hotels' && (
                    <div className="rating-filter">
                        <h3 style={{
                            fontSize: '1.1rem',
                            marginTop: '0',
                            marginBottom: '16px',
                            fontWeight: '600',
                            color: '#333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <span>Minimum Rating</span>
                            <span style={{
                                fontSize: '0.8rem',
                                fontWeight: '400',
                                color: '#666',
                                backgroundColor: '#f0f0f0',
                                padding: '4px 8px',
                                borderRadius: '12px'
                            }}>
                                Hotels rated 0-10
                            </span>
                        </h3>

                        <div className="star-rating">
                            {[6, 7, 8, 9].map(star => {
                                // Convert current rating back to 10-scale for comparison
                                const currentRating10Scale = rating * 2;
                                // Only show active if this is the exact selected rating
                                const isActive = Math.round(currentRating10Scale) === star;

                                return (
                                    <button
                                        key={`hotel-rating-${star}`}
                                        onClick={() => {
                                            const normalizedRating = (star / 10) * 5;
                                            handleRatingChange(normalizedRating);
                                        }}
                                        className={`rating-button ${isActive ? 'active' : ''}`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '5px',
                                            padding: '10px 16px',
                                            backgroundColor: isActive ? '#FFC107' : 'white',
                                            color: isActive ? '#333' : '#555',
                                            border: `1px solid ${isActive ? '#FFC107' : '#e0e0e0'}`,
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            fontWeight: isActive ? '600' : '500',
                                            flexGrow: 1
                                        }}
                                    >
                                        <span style={{ fontWeight: '500' }}>
                                            {star}+
                                        </span>
                                        <span className="star-icon" style={{
                                            color: isActive ? '#333' : '#FFC107',
                                            fontSize: '18px'
                                        }}>⭐</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="results-section">
                <div className="results-header">
                    <h2 className="results-title">
                        {loading ? 'Finding places...' :
                            isSearchActive ? 'Search Results' :
                                `${categoryIcons[selectedCategory].label} Near You`}
                    </h2>

                    {!loading && places.length > 0 && (
                        <span className="results-count">
                            {places.length} {places.length === 1 ? 'place' : 'places'} found
                        </span>
                    )}
                </div>

                {isSearchActive && (
                    <button
                        onClick={() => {
                            setIsSearchActive(false);
                            setSearchQuery('');
                            setShowSuggestions(false);
                            fetchPlaces();
                        }}
                        className="clear-search-btn"
                    >
                        <span>✕</span>
                        Clear search - Show all {categoryIcons[selectedCategory].label.toLowerCase()}
                    </button>
                )}

                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Searching nearby places...</p>
                    </div>
                ) : places.length === 0 ? (
                    <div className="no-results">
                        <span className="no-results-icon">🔍</span>
                        <h3>
                            {isSearchActive ? 'No search results found' : 'No places match your criteria'}
                        </h3>
                        <p>
                            {isSearchActive ? 'Try different search terms' : 'Try adjusting your filters to see more results'}
                        </p>
                    </div>
                ) : (
                    <div className="places-grid">
                        {places.map((place, index) => (
                            <div key={place.id || place.hotel_id || `place-${index}`} className="place-card" style={{
                                backgroundColor: 'white',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div className="place-image-container" style={{
                                    position: 'relative',
                                    paddingTop: '65%'
                                }}>
                                    <img
                                        src={getImageUrl(place)}
                                        alt={getPlaceName(place)}
                                        className="place-image"
                                        style={{
                                            position: 'absolute',
                                            top: '0',
                                            left: '0',
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            const category = selectedCategory;
                                            const fallbackImages = {
                                                restaurants: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop',
                                                cafes: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=250&fit=crop',
                                                hotels: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop',
                                                monuments: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=400&h=250&fit=crop'
                                            };
                                            e.target.src = fallbackImages[category] || fallbackImages.monuments;
                                        }}
                                    />
                                    <div className="place-rating-badge">
                                        <span>⭐</span>
                                        {selectedCategory === 'hotels' ? (
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span style={{
                                                    color: '#FFC107',
                                                    fontWeight: '700'
                                                }}>{formatRating(place.Attributes)}</span>
                                                <span style={{
                                                    fontSize: '12px',
                                                    marginLeft: '2px',
                                                    opacity: '0.9'
                                                }}>/10</span>
                                            </div>
                                        ) : (
                                            <span>{formatRating(place.Attributes)}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="place-info" style={{
                                    padding: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    flexGrow: 1
                                }}>
                                    <div className="place-header">
                                        <h3 className="place-name">{getPlaceName(place)}</h3>
                                    </div>

                                    {selectedCategory === 'hotels' && place.description && (
                                        <p style={{
                                            fontSize: '14px',
                                            color: '#666',
                                            margin: '8px 0',
                                            lineHeight: '1.4'
                                        }}>
                                            {place.description.length > 100
                                                ? `${place.description.substring(0, 100).replace(/â€"/g, "-")}...`
                                                : place.description.replace(/â€"/g, "-")}
                                        </p>
                                    )}

                                    <div className="place-details">
                                        <div className="place-distance">
                                            <span className="detail-icon">📍</span>
                                            <span>{place.Address || place.address || place.distance || 'Location unavailable'}</span>
                                        </div>

                                        {selectedCategory === 'hotels' ? (
                                            <div className="place-distance">
                                                <span className="detail-icon">👥</span>
                                                <span>{place.review_count || 0} reviews</span>
                                            </div>
                                        ) : (
                                            <div className={`place-status ${place.openStatus && place.openStatus.includes('Open') ? 'open' : 'closed'}`}>
                                                <span className="detail-icon">⏱️</span>
                                                <span>{place.openStatus || 'Status unknown'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedCategory === 'hotels' ? (
                                    hasExternalLink(place) ? (
                                        <div className="two-button-layout hotel-buttons">
                                            <button onClick={() => handleHotelDetails(place)}>
                                                <span>🏨</span>
                                                <span>Book Details</span>
                                            </button>
                                            <button onClick={() => handleGetLocation(place)}>
                                                <span>📍</span>
                                                <span>Directions</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleGetLocation(place)}
                                            className="directions-button"
                                        >
                                            <span>📍</span>
                                            <span>Get Directions</span>
                                        </button>
                                    )
                                ) : selectedCategory === 'monuments' ? (
                                    <div className="two-button-layout monuments-buttons">
                                        {hasExternalLink(place) && (
                                            <button onClick={() => handleMonumentInfo(place)}>
                                                <span>ℹ️</span>
                                                <span>More Info</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleGetLocation(place)}
                                            style={{ flex: hasExternalLink(place) ? '1' : '2' }}
                                        >
                                            <span>📍</span>
                                            <span>Directions</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className={`two-button-layout ${selectedCategory}-buttons`}>
                                        {hasExternalLink(place) && (
                                            <button onClick={() => handleSocialLink(place)}>
                                                <span>🔗</span>
                                                <span>Visit Page</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleGetLocation(place)}
                                            style={{ flex: hasExternalLink(place) ? '1' : '2' }}
                                        >
                                            <span>📍</span>
                                            <span>Directions</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom back button */}
            <button
                onClick={() => navigate('/')}
                className="back-home-btn"
                style={{ marginTop: '32px', marginBottom: '40px' }}
            >
                <span className="back-arrow">←</span>
                Back to Home
            </button>
        </div>
    );
};

export default NearbyPlaces;