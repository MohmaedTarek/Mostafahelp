import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { getPlaces } from '../../utils/api';
import '../styles/searchpage.css';

const SearchPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [allPlaces, setAllPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchInputRef = useRef(null);

    // Load all places on component mount for suggestions
    useEffect(() => {
        loadAllPlaces();
    }, []);

    // Get search query from URL when component mounts or URL changes
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const query = params.get('query');

        if (query) {
            setSearchQuery(query);
            performSearch(query);
        } else {
            setLoading(false);
        }
    }, [location.search]);

    // Load all places for suggestions
    const loadAllPlaces = async () => {
        try {
            const res = await getPlaces();
            if (res.success) {
                const processedPlaces = res.data.map(place => ({
                    ...place,
                    category: getCategoryFromPlace(place),
                    displayName: getPlaceName(place),
                    displayRating: getRating(place),
                    displayAddress: getAddress(place),
                    displayImage: getImage(place)
                }));
                setAllPlaces(processedPlaces);
            }
        } catch (error) {
            console.error('Error loading places for suggestions:', error);
        }
    };

    // Generate suggestions based on input
    const generateSuggestions = (query) => {
        if (!query.trim() || query.length < 2) {
            setSuggestions([]);
            return;
        }

        const queryLower = query.toLowerCase();
        const matchedPlaces = allPlaces.filter(place => {
            const name = place.displayName.toLowerCase();
            const address = place.displayAddress.toLowerCase();
            const category = place.category.toLowerCase();

            return name.includes(queryLower) ||
                address.includes(queryLower) ||
                category.includes(queryLower);
        });

        // Get unique suggestions
        const uniqueSuggestions = [];
        const seenNames = new Set();

        matchedPlaces.forEach(place => {
            if (!seenNames.has(place.displayName.toLowerCase())) {
                seenNames.add(place.displayName.toLowerCase());
                uniqueSuggestions.push({
                    name: place.displayName,
                    category: place.category,
                    address: place.displayAddress,
                    type: 'place'
                });
            }
        });

        // Add category suggestions
        const categories = ['restaurant', 'hotel', 'cafe', 'mosque', 'museum', 'monument'];
        categories.forEach(cat => {
            if (cat.includes(queryLower)) {
                uniqueSuggestions.unshift({
                    name: cat.charAt(0).toUpperCase() + cat.slice(1) + 's',
                    category: cat,
                    type: 'category'
                });
            }
        });

        setSuggestions(uniqueSuggestions.slice(0, 8));
    };

    // Handle input change with suggestions
    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        generateSuggestions(value);
        setShowSuggestions(true);
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion) => {
        if (suggestion.type === 'place') {
            setSearchQuery(suggestion.name);
            navigate(`/search?query=${encodeURIComponent(suggestion.name)}`);
        } else if (suggestion.type === 'category') {
            setSearchQuery(suggestion.category);
            navigate(`/search?query=${encodeURIComponent(suggestion.category)}`);
        }
        setShowSuggestions(false);
    };

    // Hide suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Perform search across all categories
    const performSearch = async (query) => {
        setLoading(true);
        try {
            const res = await getPlaces();

            if (!res.success) throw new Error(res.message);

            const allPlacesData = res.data.map(place => {
                return {
                    ...place,
                    category: getCategoryFromPlace(place),
                    displayName: getPlaceName(place),
                    displayRating: getRating(place),
                    displayAddress: getAddress(place),
                    displayImage: getImage(place)
                };
            });

            // Filter results based on search query
            const results = allPlacesData.filter(place => {
                const name = place.displayName || '';
                const address = place.displayAddress || '';
                const description = place.ShortDescription || place.FullDescription || place.description || '';
                const category = place.category || '';

                const searchString = `${name} ${address} ${description} ${category}`.toLowerCase();
                const queryLower = query.toLowerCase();

                return searchString.includes(queryLower);
            });

            // Sort results by relevance
            results.sort((a, b) => {
                const nameA = a.displayName.toLowerCase();
                const nameB = b.displayName.toLowerCase();
                const queryLower = query.toLowerCase();

                if (nameA === queryLower) return -1;
                if (nameB === queryLower) return 1;

                const aStartsWith = nameA.startsWith(queryLower);
                const bStartsWith = nameB.startsWith(queryLower);
                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;

                const ratingA = parseFloat(a.displayRating) || 0;
                const ratingB = parseFloat(b.displayRating) || 0;
                return ratingB - ratingA;
            });

            setSearchResults(results);
        } catch (err) {
            console.error('Error fetching search data:', err);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Get category from place data
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
        const imageFields = [
            place.image_1,
            place.image,
            place.imageUrl,
            place.imageURL,
            place.Image
        ];

        for (const img of imageFields) {
            if (img && typeof img === 'string' && img.trim()) {
                return img.trim();
            }
        }

        const category = getCategoryFromPlace(place);
        const fallbackImages = {
            restaurants: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop',
            cafes: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=250&fit=crop',
            hotels: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop',
            monuments: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=400&h=250&fit=crop'
        };

        return fallbackImages[category] || fallbackImages.monuments;
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
            setShowSuggestions(false);
        }
    };

    const getFilteredResults = () => {
        if (activeFilter === 'all') return searchResults;
        return searchResults.filter(place => place.category === activeFilter);
    };

    const getCategoryCounts = () => {
        const counts = {
            all: searchResults.length,
            restaurants: 0,
            cafes: 0,
            hotels: 0,
            monuments: 0
        };

        searchResults.forEach(place => {
            if (counts[place.category] !== undefined) {
                counts[place.category]++;
            }
        });

        return counts;
    };

    const getCategoryName = (category) => {
        const categories = {
            restaurants: 'Restaurant',
            cafes: 'Cafe',
            hotels: 'Hotel',
            monuments: 'Monument'
        };
        return categories[category] || 'Place';
    };

    const categoryIcons = {
        all: '🌟',
        restaurants: '🍽️',
        cafes: '☕',
        hotels: '🏨',
        monuments: '🏛️'
    };

    const categoryCounts = getCategoryCounts();
    const filteredResults = getFilteredResults();

    return (
        <div className="search-page">
            {/* Header */}
            <div className="search-header">
                <button onClick={() => navigate('/')} className="back-btn">
                    ← Back to Home
                </button>
                <h1>Search Places in Cairo</h1>
            </div>

            {/* Search Form with Suggestions */}
            <div className="search-container">
                <form onSubmit={handleSearchSubmit} className="search-form">
                    <div className="search-input-wrapper" ref={searchInputRef}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleInputChange}
                            onFocus={() => setShowSuggestions(true)}
                            placeholder="Search for restaurants, hotels, cafes, or monuments..."
                            className="search-input"
                        />
                        <button type="submit" className="search-btn" disabled={loading}>
                            {loading ? 'Searching...' : 'Search'}
                        </button>

                        {/* Search Suggestions */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="search-suggestions">
                                {suggestions.map((suggestion, index) => (
                                    <div
                                        key={index}
                                        className="suggestion-item"
                                        onClick={() => handleSuggestionClick(suggestion)}
                                    >
                                        <div className="suggestion-icon">
                                            {suggestion.type === 'place' ? '📍' : '🔍'}
                                        </div>
                                        <div className="suggestion-content">
                                            <div className="suggestion-name">{suggestion.name}</div>
                                            {suggestion.address && (
                                                <div className="suggestion-address">{suggestion.address}</div>
                                            )}
                                        </div>
                                        <div className="suggestion-category">
                                            {categoryIcons[suggestion.category] || '🏛️'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>
            </div>

            {/* Category Filter */}
            {searchResults.length > 0 && (
                <div className="category-filter">
                    {Object.entries(categoryIcons).map(([category, icon]) => (
                        <button
                            key={category}
                            onClick={() => setActiveFilter(category)}
                            className={`category-btn ${activeFilter === category ? 'active' : ''}`}
                        >
                            <span className="category-icon">{icon}</span>
                            <span className="category-name">
                                {category === 'all' ? 'All' : getCategoryName(category)}
                            </span>
                            <span className="category-count">({categoryCounts[category] || 0})</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Results */}
            <div className="results-section">
                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Searching for the best places in Cairo...</p>
                    </div>
                ) : filteredResults.length > 0 ? (
                    <>
                        <div className="results-info">
                            <p>
                                Found {filteredResults.length} places
                                {searchQuery && ` for "${searchQuery}"`}
                                {activeFilter !== 'all' && ` in ${getCategoryName(activeFilter)}s`}
                            </p>
                        </div>
                        <div className="results-list">
                            {filteredResults.map((place, index) => (
                                <div
                                    key={place.id || place.hotel_id || place.locationID || place.LocationID || index}
                                    className="place-card-full"
                                    onClick={() => navigate(`/nearby?category=${place.category}`)}
                                >
                                    <div className="place-image-full">
                                        <img
                                            src={place.displayImage}
                                            alt={place.displayName}
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=400&h=250&fit=crop';
                                            }}
                                        />
                                        <div className="place-category-badge">{categoryIcons[place.category]}</div>
                                    </div>
                                    <div className="place-content-full">
                                        <div className="place-header-full">
                                            <h3 className="place-name-full">{place.displayName}</h3>
                                            <div className="place-rating-full">
                                                <span className="rating-star">⭐</span>
                                                <span className="rating-value">{place.displayRating}</span>
                                            </div>
                                        </div>
                                        <p className="place-address-full">📍 {place.displayAddress}</p>
                                        {(place.ShortDescription || place.FullDescription || place.description) && (
                                            <p className="place-description-full">
                                                {(() => {
                                                    const desc = place.ShortDescription || place.FullDescription || place.description || '';
                                                    return desc.length > 200 ? `${desc.substring(0, 200)}...` : desc;
                                                })()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : searchQuery && !loading ? (
                    <div className="no-results">
                        <h3>No places found</h3>
                        <p>Try different keywords or explore all places</p>
                        <Link to="/nearby" className="explore-btn">Explore All Places</Link>
                    </div>
                ) : !searchQuery && !loading ? (
                    <div className="search-prompt">
                        <h3>🔍 Search for Amazing Places</h3>
                        <p>Enter a keyword to find restaurants, hotels, cafes, or monuments in Cairo</p>
                        <div className="search-examples">
                            <h4>Try searching for:</h4>
                            <div className="example-tags">
                                <button
                                    onClick={() => {
                                        setSearchQuery('restaurant');
                                        navigate('/search?query=restaurant');
                                    }}
                                    className="example-tag"
                                >
                                    🍽️ Restaurant
                                </button>
                                <button
                                    onClick={() => {
                                        setSearchQuery('hotel');
                                        navigate('/search?query=hotel');
                                    }}
                                    className="example-tag"
                                >
                                    🏨 Hotel
                                </button>
                                <button
                                    onClick={() => {
                                        setSearchQuery('cafe');
                                        navigate('/search?query=cafe');
                                    }}
                                    className="example-tag"
                                >
                                    ☕ Cafe
                                </button>
                                <button
                                    onClick={() => {
                                        setSearchQuery('mosque');
                                        navigate('/search?query=mosque');
                                    }}
                                    className="example-tag"
                                >
                                    🕌 Mosque
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default SearchPage;