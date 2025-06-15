import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlacesByCategory } from '../../utils/api'; // Use API instead of static data
import BudgetFilter from '../common/BudgetFilter';

const PlacesNearMe = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('restaurants');
    const [budget, setBudget] = useState(4); // Default to all prices (only used for hotels)
    const [rating, setRating] = useState(3); // Default to 3+ stars
    const [loading, setLoading] = useState(true);
    const [places, setPlaces] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState('detecting'); // 'detecting', 'success', 'error'
    const [locationError, setLocationError] = useState(null);

    // Modern category icons with consistent styles
    const categoryIcons = {
        restaurants: { icon: '🍽️', color: '#FF5722', bg: '#FFF3F0', label: 'Restaurants' },
        cafes: { icon: '☕', color: '#795548', bg: '#F1EBE9', label: 'Cafes' },
        hotels: { icon: '🏨', color: '#2196F3', bg: '#E3F2FD', label: 'Hotels' },
        monuments: { icon: '🏛️', color: '#607D8B', bg: '#ECEFF1', label: 'Monuments' }
    };

    // Cairo area coordinates for fallback
    const cairoCenter = { latitude: 30.0444, longitude: 31.2357 };

    // Get user location
    useEffect(() => {
        setLocationStatus('detecting');

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userCoords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };

                    setUserLocation(userCoords);
                    setLocationStatus('success');
                    console.log('User location detected:', userCoords);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    setLocationError(error.message);
                    setLocationStatus('error');

                    // Default to Cairo center coordinates as fallback
                    setUserLocation(cairoCenter);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            setLocationStatus('error');
            setLocationError('Geolocation is not supported by your browser');

            // Default to Cairo center coordinates
            setUserLocation(cairoCenter);
        }
    }, []);

    // Updated to remove budget filtering for non-hotel categories and fix monuments showing restaurants
    const fetchPlaces = async () => {
        if (!userLocation) return; // Wait until we have user location

        setLoading(true);

        try {
            // Ensure we're requesting the correct category
            console.log(`Fetching places for category: ${selectedCategory}`);

            // POTENTIAL FIX: If monuments API is broken, use a different approach
            let res;
            if (selectedCategory === 'monuments') {
                // Try different API endpoints or parameters for monuments
                res = await getPlacesByCategory('monuments');

                // If monuments returns empty or restaurant data, try alternative
                if (!res.success || !res.data || res.data.length === 0) {
                    console.warn('Monuments API returned no data, trying alternative...');
                    // You might need to try 'tourism' or 'attractions' category
                    res = await getPlacesByCategory('tourism');
                }
            } else {
                res = await getPlacesByCategory(selectedCategory);
            }

            if (res.success && res.data && Array.isArray(res.data)) {
                let filteredPlaces = res.data;

                // DEBUG: Log the raw data to see what we're getting
                console.log(`Raw ${selectedCategory} data:`, filteredPlaces.slice(0, 3));

                // AGGRESSIVE FILTERING: Remove restaurants from monuments category
                if (selectedCategory === 'monuments') {
                    filteredPlaces = filteredPlaces.filter(place => {
                        // Check for restaurant-specific keywords in name
                        const name = (place.name || '').toLowerCase();
                        const address = (place.address || '').toLowerCase();

                        // Restaurant keywords to exclude
                        const restaurantKeywords = [
                            'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'food', 'kitchen',
                            'dining', 'bistro', 'grill', 'bar', 'pub', 'eatery', 'diner',
                            'bakery', 'pastry', 'cuisine', 'meal', 'lunch', 'dinner', 'breakfast'
                        ];

                        // Monument keywords to include
                        const monumentKeywords = [
                            'museum', 'pyramid', 'temple', 'mosque', 'church', 'palace', 'fort',
                            'castle', 'monument', 'historical', 'ancient', 'archaeological',
                            'heritage', 'tomb', 'pharaoh', 'statue', 'memorial', 'shrine',
                            'cathedral', 'basilica', 'citadel', 'ruins', 'site'
                        ];

                        // Exclude if it has restaurant keywords
                        const hasRestaurantKeywords = restaurantKeywords.some(keyword =>
                            name.includes(keyword) || address.includes(keyword)
                        );

                        // Include if it has monument keywords
                        const hasMonumentKeywords = monumentKeywords.some(keyword =>
                            name.includes(keyword) || address.includes(keyword)
                        );

                        // Exclude if it has cuisine field (restaurants have this)
                        const hasCuisine = place.cuisine || place.food_type || place.menu;

                        // Exclude if it has restaurant-specific fields
                        const hasRestaurantFields = place.serves_food || place.serves_alcohol || place.outdoor_seating;

                        // Include monument if:
                        // 1. Has monument keywords AND doesn't have restaurant keywords
                        // 2. OR doesn't have restaurant indicators (cuisine, restaurant fields, restaurant keywords)
                        const isMonument = (hasMonumentKeywords && !hasRestaurantKeywords) ||
                            (!hasCuisine && !hasRestaurantFields && !hasRestaurantKeywords);

                        // Debug rejected items
                        if (!isMonument) {
                            console.log(`Rejected restaurant from monuments: ${name}`, {
                                hasRestaurantKeywords,
                                hasCuisine,
                                hasRestaurantFields,
                                hasMonumentKeywords
                            });
                        }

                        return isMonument;
                    });

                    console.log(`Filtered monuments count: ${filteredPlaces.length}`);

                    // TEMPORARY: If no monuments found after filtering, add some sample monuments
                    if (filteredPlaces.length === 0) {
                        console.warn('No monuments found after filtering, using sample data');
                        filteredPlaces = [
                            {
                                id: 'sample-1',
                                name: 'Great Pyramid of Giza',
                                address: 'Al Giza Desert, Giza, Egypt',
                                Attributes: 4.5,
                                description: 'One of the Seven Wonders of the Ancient World'
                            },
                            {
                                id: 'sample-2',
                                name: 'Egyptian Museum',
                                address: 'Tahrir Square, Cairo, Egypt',
                                Attributes: 4.3,
                                description: 'World-famous collection of ancient Egyptian artifacts'
                            },
                            {
                                id: 'sample-3',
                                name: 'Citadel of Saladin',
                                address: 'Salah Salem St, Cairo, Egypt',
                                Attributes: 4.2,
                                description: 'Medieval Islamic fortification in Cairo'
                            }
                        ];
                    }
                }

                // Apply client-side filtering - FIXED: Only apply budget filter for hotels
                filteredPlaces = filteredPlaces.filter(place => {
                    const ratingValue = parseFloat(place.attributes || place.Attributes || 0);
                    const passesRating = selectedCategory === 'hotels'
                        ? (ratingValue / 10) * 5 >= rating
                        : ratingValue >= rating;

                    // Only apply budget filter for hotels (since other categories don't have reliable price data)
                    if (selectedCategory === 'hotels') {
                        const priceLevel = place.priceLevel || 4; // fallback
                        const passesBudget = priceLevel <= budget;
                        return passesBudget && passesRating;
                    }

                    // For other categories, only filter by rating
                    return passesRating;
                });

                // Debug log to check what data we're getting
                if (filteredPlaces.length > 0) {
                    console.log(`Sample ${selectedCategory} data:`, filteredPlaces[0]);
                }

                // Calculate distance between user and each place
                filteredPlaces = filteredPlaces.map(place => {
                    // Get place coordinates (real or simulated)
                    const placeCoords = getPlaceCoordinates(place);

                    // Calculate distance in kilometers
                    const distance = calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        placeCoords.latitude,
                        placeCoords.longitude
                    );

                    // Get area name
                    const areaName = getAreaName(place);

                    return {
                        ...place,
                        distanceValue: distance,
                        distance: formatDistance(distance),
                        area: areaName
                    };
                });

                // Sort by proximity - closest first
                filteredPlaces = filteredPlaces
                    .sort((a, b) => a.distanceValue - b.distanceValue)
                    // Limit to nearest 20 places for better performance
                    .slice(0, 20);

                setPlaces(filteredPlaces);
            } else {
                console.warn("Failed to fetch places or invalid data:", res.message);
                setPlaces([]);
            }
        } catch (error) {
            console.error("Error fetching places:", error);
            setPlaces([]);
        }

        setLoading(false);
    };

    // Filter places based on selected criteria and calculate distances
    // Updated dependency array - budget only matters for hotels
    useEffect(() => {
        fetchPlaces();
    }, [selectedCategory, rating, selectedCategory === 'hotels' ? budget : null, userLocation]);

    // Get place coordinates
    const getPlaceCoordinates = (place) => {
        // If place has actual coordinates, use them
        if (place.latitude && place.longitude) {
            return {
                latitude: place.latitude,
                longitude: place.longitude
            };
        }

        // Otherwise derive from address or assign random coordinates in Cairo
        const address = (place.address || '').toLowerCase();

        // Create a mapping of area keywords to approximate coordinates
        const areaCoordinates = {
            'maadi': { latitude: 29.9626, longitude: 31.2497 },
            'zamalek': { latitude: 30.0571, longitude: 31.2272 },
            'downtown': { latitude: 30.0444, longitude: 31.2357 },
            'giza': { latitude: 30.0131, longitude: 31.2089 },
            'tahrir': { latitude: 30.0444, longitude: 31.2357 },
            'heliopolis': { latitude: 30.0914, longitude: 31.3425 },
            'nasr city': { latitude: 30.0659, longitude: 31.3322 },
            'mohandeseen': { latitude: 30.0565, longitude: 31.2014 },
            'dokki': { latitude: 30.0411, longitude: 31.2089 },
            'garden city': { latitude: 30.0360, longitude: 31.2290 }
        };

        // Check if address contains any known area
        for (const [keyword, coords] of Object.entries(areaCoordinates)) {
            if (address.includes(keyword)) {
                // Add a small random offset (up to ~1km) to avoid all places in the same area having identical coordinates
                const latOffset = (Math.random() - 0.5) * 0.01;
                const lngOffset = (Math.random() - 0.5) * 0.01;

                return {
                    latitude: coords.latitude + latOffset,
                    longitude: coords.longitude + lngOffset
                };
            }
        }

        // If no area found in address, generate random coordinates in Cairo
        // This creates more realistic distances than all places having the same coordinates
        const latOffset = (Math.random() - 0.5) * 0.1; // ~5km north/south
        const lngOffset = (Math.random() - 0.5) * 0.1; // ~5km east/west

        return {
            latitude: cairoCenter.latitude + latOffset,
            longitude: cairoCenter.longitude + lngOffset
        };
    };

    // Get area name from address or approximate from coordinates
    const getAreaName = (place) => {
        if (!place.address) return 'Cairo';

        const address = place.address.toLowerCase();

        // Common Cairo areas
        const areas = [
            'Maadi', 'Zamalek', 'Downtown', 'Giza', 'Heliopolis',
            'Nasr City', 'Mohandeseen', 'Dokki', 'Garden City',
            'New Cairo', 'El Rehab', 'October', '6th of October'
        ];

        // Check if address contains any known area
        for (const area of areas) {
            if (address.includes(area.toLowerCase())) {
                return area;
            }
        }

        return 'Cairo';
    };

    // Handle getting directions or opening booking/info links
    const handleGetLocation = (place) => {
        // Use Google Maps directions for all categories
        const destinationText = place.address || place.name || place.hotel_name || '';
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationText)}`;
        window.open(mapsUrl, '_blank');
    };

    // Handle booking links for hotels
    const handleBooking = (place) => {
        if (place.booking_link) {
            window.open(place.booking_link, '_blank');
        } else {
            alert('Booking link not available for this hotel');
        }
    };

    // Handle info links for monuments
    const handleMoreInfo = (place) => {
        if (place.link || place.info_link || place.website) {
            const infoLink = place.link || place.info_link || place.website;
            window.open(infoLink, '_blank');
        } else {
            alert('More information link not available for this monument');
        }
    };

    // Handle social links for restaurants and cafes
    const handleSocialLink = (place) => {
        if (place.facebook_link || place.social_link || place.website) {
            const socialLink = place.facebook_link || place.social_link || place.website;
            window.open(socialLink, '_blank');
        } else {
            alert('Social media link not available for this place');
        }
    };

    // Calculate distance between two coordinates using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km
        return distance;
    };

    // Convert degrees to radians
    const deg2rad = (deg) => {
        return deg * (Math.PI / 180);
    };

    // Format distance for display
    const formatDistance = (distance) => {
        if (distance < 1) {
            return `${Math.round(distance * 1000)} m`;
        }
        return `${distance.toFixed(1)} km`;
    };

    // Function to get image URL
    const getImageUrl = (place) => {
        // Check for hotel-specific image field first
        if (place.image_1) {
            return place.image_1;
        }
        // Then try imageUrl
        else if (place.imageUrl) {
            return place.imageUrl;
        }
        // Then try image
        else if (place.image) {
            return place.image;
        }
        // Finally use fallback with appropriate search terms for each category
        else {
            const placeName = place.name || place.hotel_name || '';
            let searchTerm = selectedCategory;

            // Use more specific terms for monuments to avoid restaurant images
            if (selectedCategory === 'monuments') {
                searchTerm = 'ancient,monument,egypt,pyramid,temple,museum,historical';
                // If we have a specific monument name, use it
                if (placeName.toLowerCase().includes('pyramid')) {
                    searchTerm = 'egyptian,pyramid,giza';
                } else if (placeName.toLowerCase().includes('museum')) {
                    searchTerm = 'museum,egyptian,artifacts';
                } else if (placeName.toLowerCase().includes('mosque')) {
                    searchTerm = 'mosque,islamic,architecture';
                } else if (placeName.toLowerCase().includes('temple')) {
                    searchTerm = 'ancient,temple,egyptian';
                }
            }

            return `https://source.unsplash.com/300x200/?${encodeURIComponent(searchTerm)}`;
        }
    };

    // Get price display text - only for hotels (since other categories don't have reliable price data)
    const getPriceDisplay = (place) => {
        // For hotels - show actual price
        if (selectedCategory === 'hotels' && place.price_per_night) {
            // If price is not in EGP, convert (simplified example)
            if (place.currency && place.currency !== 'EGP') {
                // Simple conversion - in a real app, use a proper API
                const exchangeRates = {
                    'USD': 30.9, // 1 USD = 30.9 EGP (approximate)
                    'EUR': 33.7, // 1 EUR = 33.7 EGP (approximate)
                    'GBP': 39.3  // 1 GBP = 39.3 EGP (approximate)
                };

                const rate = exchangeRates[place.currency] || 1;
                const priceInEGP = Math.round(place.price_per_night * rate);
                return `${priceInEGP} EGP/night`;
            }

            return `${place.price_per_night} EGP/night`;
        }

        // For non-hotels, don't show price since we don't have reliable price data
        // This prevents showing meaningless price ranges for monuments, restaurants, and cafes
        return null;
    };

    // Get place name
    const getPlaceName = (place) => {
        return place.name || place.hotel_name || 'Unnamed Place';
    };

    // Format rating display
    const formatRating = (rating) => {
        if (rating === undefined || rating === null) return 'N/A';
        const numRating = Number(rating);
        if (isNaN(numRating)) return 'N/A';
        return numRating % 1 === 0 ? numRating.toFixed(0) : numRating.toFixed(1);
    };

    // Get location status message
    const getLocationStatusMessage = () => {
        if (locationStatus === 'detecting') {
            return 'Detecting your location...';
        } else if (locationStatus === 'error') {
            return `Unable to get precise location. Using Cairo center.`;
        } else {
            return 'Using your current location';
        }
    };

    return (
        <div className="nearby-places-page" style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}>
            {/* Modern header with gradient background */}
            <header style={{
                background: 'linear-gradient(135deg, #4A00E0, #8E2DE2)',
                borderRadius: '16px',
                padding: '32px 24px',
                color: 'white',
                marginBottom: '32px',
                boxShadow: '0 10px 25px rgba(142, 45, 226, 0.2)'
            }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    margin: '0 0 8px 0',
                    fontWeight: '700'
                }}>Places Near Me</h1>
                <p style={{
                    fontSize: '1.1rem',
                    margin: '0 0 12px 0',
                    opacity: '0.9'
                }}>Discover amazing locations close to your current position</p>

                {/* Location status indicator */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    opacity: '0.8',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    maxWidth: 'fit-content'
                }}>
                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                        height: '20px'
                    }}>
                        {locationStatus === 'detecting' ? '⏳' :
                            locationStatus === 'success' ? '📍' : '⚠️'}
                    </span>
                    <span>{getLocationStatusMessage()}</span>
                </div>
            </header>

            {/* Filter cards with clean design */}
            <div style={{ marginBottom: '32px' }}>
                {/* Category filter - horizontal scrollable on mobile */}
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{
                        fontSize: '1.2rem',
                        margin: '0 0 16px 0',
                        fontWeight: '600',
                        color: '#333'
                    }}>What are you looking for?</h3>

                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                        overflowX: 'auto',
                        padding: '4px 0'
                    }}>
                        {Object.entries(categoryIcons).map(([category, { icon, color, bg, label }]) => (
                            <button
                                key={`category-${category}`}
                                onClick={() => setSelectedCategory(category)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: '16px',
                                    backgroundColor: selectedCategory === category ? color : 'white',
                                    color: selectedCategory === category ? 'white' : '#333',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    minWidth: '100px',
                                    boxShadow: selectedCategory === category
                                        ? `0 8px 20px rgba(0,0,0,0.15)`
                                        : '0 2px 8px rgba(0,0,0,0.08)'
                                }}
                            >
                                <span style={{
                                    fontSize: '28px',
                                    marginBottom: '8px',
                                    background: selectedCategory === category ? 'rgba(255,255,255,0.2)' : bg,
                                    borderRadius: '50%',
                                    width: '50px',
                                    height: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {icon}
                                </span>
                                <span style={{ fontWeight: '500' }}>
                                    {label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Budget filter component - only shown for hotels */}
                {selectedCategory === 'hotels' && (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        marginBottom: '20px'
                    }}>
                        <BudgetFilter
                            category={selectedCategory}
                            value={budget}
                            onChange={setBudget}
                        />
                    </div>
                )}

                {/* Rating filter for all categories */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}>
                    <h3 style={{
                        fontSize: '1.1rem',
                        margin: '0 0 16px 0',
                        fontWeight: '600',
                        color: '#333'
                    }}>Minimum Rating</h3>

                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap'
                    }}>
                        {[1, 2, 3, 4, 5].map((ratingValue) => (
                            <button
                                key={`rating-${ratingValue}`}
                                onClick={() => setRating(ratingValue)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '12px 16px',
                                    backgroundColor: rating === ratingValue ? '#FFD700' : 'white',
                                    color: rating === ratingValue ? '#333' : '#666',
                                    border: `1px solid ${rating === ratingValue ? '#FFD700' : '#e0e0e0'}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    fontWeight: '500',
                                    boxShadow: rating === ratingValue ? '0 2px 8px rgba(255,215,0,0.3)' : 'none'
                                }}
                            >
                                <span>⭐</span>
                                <span>{ratingValue}+ Stars</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results section with modern card design */}
            <div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px'
                }}>
                    <h2 style={{
                        fontSize: '1.8rem',
                        margin: '0',
                        color: '#333',
                        fontWeight: '600'
                    }}>
                        {loading || locationStatus === 'detecting'
                            ? 'Finding places...'
                            : `${categoryIcons[selectedCategory].label} Near You`}
                    </h2>

                    {!loading && places.length > 0 && (
                        <span style={{ color: '#555' }}>
                            {places.length} {places.length === 1 ? 'place' : 'places'} found
                        </span>
                    )}
                </div>

                {loading || locationStatus === 'detecting' ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '60px 0',
                        color: '#555'
                    }}>
                        <div style={{
                            border: '3px solid rgba(0, 0, 0, 0.1)',
                            borderRadius: '50%',
                            borderTop: '3px solid #4A00E0',
                            width: '40px',
                            height: '40px',
                            animation: 'spin 1s linear infinite',
                            marginBottom: '16px'
                        }}></div>
                        <p style={{ margin: '0', fontWeight: '500' }}>
                            {locationStatus === 'detecting'
                                ? 'Detecting your location...'
                                : 'Searching nearby places...'}
                        </p>
                    </div>
                ) : places.length === 0 ? (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '40px 20px',
                        textAlign: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}>
                        <span style={{ fontSize: '50px', marginBottom: '16px', display: 'block' }}>🔍</span>
                        <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>No places found</h3>
                        <p style={{ margin: '0', color: '#666' }}>
                            {selectedCategory === 'monuments'
                                ? 'Try adjusting your filters or check back later as monument data is being updated'
                                : 'Try adjusting your filters'
                            }
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '40px'
                    }}>
                        {places.map((place, index) => (
                            <div key={place.id || place.hotel_id || `place-${index}`} style={{
                                backgroundColor: 'white',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                                cursor: 'pointer',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{
                                    position: 'relative',
                                    paddingTop: '65%' // Aspect ratio
                                }}>
                                    <img
                                        src={getImageUrl(place)}
                                        alt={getPlaceName(place)}
                                        style={{
                                            position: 'absolute',
                                            top: '0',
                                            left: '0',
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                        onError={(e) => {
                                            console.log(`Image failed to load for ${getPlaceName(place)}, using fallback`);
                                            e.target.onerror = null; // Prevent infinite loops
                                            const fallback = `https://source.unsplash.com/300x200/?${encodeURIComponent(selectedCategory)}`;
                                            console.log(`- Fallback image: ${fallback}`);
                                            e.target.src = fallback;
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        color: 'white',
                                        padding: '6px 10px',
                                        borderRadius: '20px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <span>⭐</span>
                                        <span>{formatRating(place.Attributes)}</span>
                                    </div>

                                    {/* Distance badge */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '12px',
                                        left: '12px',
                                        backgroundColor: '#4CAF50',
                                        color: 'white',
                                        padding: '6px 10px',
                                        borderRadius: '20px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <span>📍</span>
                                        <span>{place.distance}</span>
                                    </div>
                                </div>

                                <div style={{
                                    padding: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    flexGrow: 1
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '8px'
                                    }}>
                                        <h3 style={{
                                            margin: '0',
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            color: '#333'
                                        }}>{getPlaceName(place)}</h3>
                                        {/* Only show price for hotels */}
                                        {selectedCategory === 'hotels' && getPriceDisplay(place) && (
                                            <span style={{
                                                fontWeight: '500',
                                                color: '#4A00E0'
                                            }}>{getPriceDisplay(place)}</span>
                                        )}
                                    </div>

                                    {/* Show description for hotels */}
                                    {selectedCategory === 'hotels' && place.description && (
                                        <p style={{
                                            fontSize: '14px',
                                            color: '#666',
                                            margin: '8px 0'
                                        }}>
                                            {place.description.length > 120
                                                ? `${place.description.substring(0, 120)}...`
                                                : place.description}
                                        </p>
                                    )}

                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '12px',
                                        marginTop: 'auto',
                                        paddingTop: '16px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '14px',
                                            color: '#555'
                                        }}>
                                            <span style={{ fontSize: '16px' }}>🏢</span>
                                            <span>{place.address || place.area || 'Cairo'}</span>
                                        </div>

                                        {selectedCategory === 'hotels' ? (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '14px',
                                                color: '#555'
                                            }}>
                                                <span style={{ fontSize: '16px' }}>👥</span>
                                                <span>{place.review_count || 0} reviews</span>
                                            </div>
                                        ) : (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '14px',
                                                color: place.openStatus && place.openStatus.includes('Open') ? '#4CAF50' : '#F44336',
                                                fontWeight: '500'
                                            }}>
                                                <span style={{ fontSize: '16px' }}>⏱️</span>
                                                <span>{place.openStatus || 'Status unknown'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Dynamic buttons based on category */}
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    width: '100%'
                                }}>
                                    {selectedCategory === 'hotels' ? (
                                        // Hotels: Booking + Directions buttons
                                        <>
                                            <button
                                                onClick={() => handleBooking(place)}
                                                style={{
                                                    backgroundColor: '#4A00E0',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '12px',
                                                    fontSize: '15px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    flex: '1',
                                                    borderRadius: '0 0 0 16px'
                                                }}
                                            >
                                                <span>📅</span>
                                                <span>Book Now</span>
                                            </button>
                                            <button
                                                onClick={() => handleGetLocation(place)}
                                                style={{
                                                    backgroundColor: '#2196F3',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '12px',
                                                    fontSize: '15px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    flex: '1',
                                                    borderRadius: '0 0 16px 0'
                                                }}
                                            >
                                                <span>🗺️</span>
                                                <span>Directions</span>
                                            </button>
                                        </>
                                    ) : selectedCategory === 'monuments' ? (
                                        // Monuments: More Info + Directions buttons
                                        <>
                                            <button
                                                onClick={() => handleMoreInfo(place)}
                                                style={{
                                                    backgroundColor: '#607D8B',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '12px',
                                                    fontSize: '15px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    flex: '1',
                                                    borderRadius: '0 0 0 16px'
                                                }}
                                            >
                                                <span>ℹ️</span>
                                                <span>More Info</span>
                                            </button>
                                            <button
                                                onClick={() => handleGetLocation(place)}
                                                style={{
                                                    backgroundColor: '#2196F3',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '12px',
                                                    fontSize: '15px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    flex: '1',
                                                    borderRadius: '0 0 16px 0'
                                                }}
                                            >
                                                <span>🗺️</span>
                                                <span>Directions</span>
                                            </button>
                                        </>
                                    ) : (
                                        // Restaurants & Cafes: Social Link + Directions buttons
                                        <>
                                            <button
                                                onClick={() => handleSocialLink(place)}
                                                style={{
                                                    backgroundColor: selectedCategory === 'restaurants' ? '#FF5722' : '#795548',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '12px',
                                                    fontSize: '15px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    flex: '1',
                                                    borderRadius: '0 0 0 16px'
                                                }}
                                            >
                                                <span>📱</span>
                                                <span>Social</span>
                                            </button>
                                            <button
                                                onClick={() => handleGetLocation(place)}
                                                style={{
                                                    backgroundColor: '#2196F3',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '12px',
                                                    fontSize: '15px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    flex: '1',
                                                    borderRadius: '0 0 16px 0'
                                                }}
                                            >
                                                <span>🗺️</span>
                                                <span>Directions</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button
                onClick={() => navigate('/')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '32px',
                    marginBottom: '40px',
                    padding: '12px 20px',
                    backgroundColor: 'transparent',
                    border: '1px solid #4A00E0',
                    borderRadius: '8px',
                    color: '#4A00E0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: '500'
                }}
            >
                <span>←</span>
                Back to Home
            </button>

            {/* CSS animation for loading spinner */}
            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .nearby-places-page button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0,0,0,0.15);
        }
        
        .place-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
      `}</style>
        </div>
    );
};

export default PlacesNearMe;