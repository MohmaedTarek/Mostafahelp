import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Assets
import GuidlyLogo from './GuidlyLogo1.png';
import PyramidsImage from './pyramids.jpeg';

// API
import { getFirstImagesPerLocation, getPlaces, validateApiResponse } from '../../utils/api';
import { useRecommendations } from '../../utils/useRecommendations';

// Auth - FIXED: Use AuthContext instead of authutils directly
import { useAuth } from '../auth/AuthContext';

// Components
import ChatbotComponent from '../common/Chatbot';

// Styles
import '../styles/Home.css';

const Home = () => {
    const navigate = useNavigate();

    // FIXED: Use AuthContext hook instead of direct authutils calls
    const { user, isAuthenticated, isLoading, logout } = useAuth();

    // User dropdown state
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const userDropdownRef = useRef(null);

    // Core state
    const [allPlaces, setAllPlaces] = useState([]);
    const [displayedPlaces, setDisplayedPlaces] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [firstImages, setFirstImages] = useState([]);
    const [showChatbot, setShowChatbot] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [loading, setLoading] = useState(true);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [scrolled, setScrolled] = useState(false);

    // Top Rated state
    const [showTopRated, setShowTopRated] = useState(false);
    const [topRatedLoading, setTopRatedLoading] = useState(false);
    const [topRatedData, setTopRatedData] = useState([]);

    // Modal state
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Error handling
    const [imageLoadErrors, setImageLoadErrors] = useState(new Set());

    const { getTopRated } = useRecommendations();
    const categoryTabsRef = useRef(null);
    const heroSectionRef = useRef(null);

    // ADDED: Debug logging to see auth state
    useEffect(() => {
        console.log('Auth State Debug:', {
            isAuthenticated,
            isLoading,
            user,
            userExists: !!user,
            userEmail: user?.email,
            userFullName: user?.fullName,
            userName: user?.userName
        });

        if (user) {
            console.log('Name Display Test:', {
                fullUserName: getFullUserName(),
                firstName: getFirstName(),
                displayName: getUserDisplayName()
            });
        }
    }, [isAuthenticated, isLoading, user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
                setShowUserDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Window resize handler
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // FIXED: Get user display name - prioritize full name over first name extraction
    const getUserDisplayName = () => {
        if (!user) return 'Guest';

        // Always return full name if available
        if (user.fullName) {
            return user.fullName;
        }

        // Fallback to username
        if (user.userName) {
            return user.userName;
        }

        // Last resort - extract from email
        if (user.email) {
            return user.email.split('@')[0];
        }

        return 'User';
    };

    // Get full name specifically for display
    const getFullUserName = () => {
        return user?.fullName || user?.userName || user?.name || user?.unique_name || getUserDisplayName();
    };

    // Get first name for avatars
    const getFirstName = () => {
        if (!user) return 'G';

        if (user.fullName) {
            return user.fullName.split(' ')[0];
        }

        if (user.userName) {
            return user.userName;
        }

        if (user.email) {
            return user.email.split('@')[0];
        }

        return 'U';
    };

    // Fetch places data
    useEffect(() => {
        const fetchPlaces = async () => {
            setLoading(true);
            try {
                const res = await getPlaces();
                const validatedResponse = validateApiResponse(res);

                if (validatedResponse.success && Array.isArray(validatedResponse.data)) {
                    console.log('Fetched places:', validatedResponse.data.length);
                    setAllPlaces(validatedResponse.data);
                } else {
                    console.error('Error fetching places:', validatedResponse.message);
                    setAllPlaces([]);
                }
            } catch (error) {
                console.error('Unexpected error fetching places:', error);
                setAllPlaces([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPlaces();
    }, []);

    // Fetch first images
    useEffect(() => {
        const fetchFirstImages = async () => {
            try {
                const res = await getFirstImagesPerLocation();
                const validatedResponse = validateApiResponse(res);

                if (validatedResponse.success && Array.isArray(validatedResponse.data)) {
                    console.log('Fetched first images:', validatedResponse.data.length);
                    setFirstImages(validatedResponse.data);
                } else {
                    console.error('Failed to load images:', validatedResponse.message);
                    setFirstImages([]);
                }
            } catch (error) {
                console.error('Unexpected error fetching images:', error);
                setFirstImages([]);
            }
        };
        fetchFirstImages();
    }, []);

    // Handle scroll effects
    useEffect(() => {
        const handleScroll = () => {
            const offset = window.scrollY;
            setScrolled(offset > 60);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Group places by category for mixed display
    const groupPlacesByCategory = (places) => {
        const grouped = {
            restaurants: [],
            cafes: [],
            hotels: [],
            monuments: []
        };

        places.forEach(place => {
            const category = getCategoryName(place);
            if (grouped[category]) {
                grouped[category].push(place);
            }
        });

        return grouped;
    };

    // Create mixed rows for top rated display - each row has one from each category
    const createMixedRows = (groupedPlaces) => {
        const result = [];
        const categories = ['restaurants', 'cafes', 'hotels', 'monuments'];
        const itemsPerRow = windowWidth < 768 ? 2 : (windowWidth < 992 ? 3 : 4);

        // Find the maximum number of items we can create rows for
        const maxRows = Math.max(
            groupedPlaces.restaurants.length,
            groupedPlaces.cafes.length,
            groupedPlaces.hotels.length,
            groupedPlaces.monuments.length
        );

        // Create rows where each row contains one item from each category (if available)
        for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
            const currentRow = [];

            // Add one item from each category to this row
            categories.forEach(category => {
                if (groupedPlaces[category][rowIndex]) {
                    currentRow.push(groupedPlaces[category][rowIndex]);
                }
            });

            // Add the row items to result
            result.push(...currentRow);

            // Stop if we have enough items for display
            if (result.length >= itemsPerRow * 4) break; // Show up to 4 rows max
        }

        return result;
    };

    // Update displayed places when filters change
    useEffect(() => {
        if (showTopRated && topRatedData.length > 0) {
            filterTopRatedByCategory();
            return;
        }

        if (!Array.isArray(allPlaces) || allPlaces.length === 0) {
            setDisplayedPlaces([]);
            return;
        }

        let placesToShow = activeCategory === 'all'
            ? allPlaces
            : allPlaces.filter(place => getCategoryName(place) === activeCategory);

        const numToShow = windowWidth < 768 ? 6 : (windowWidth < 992 ? 8 : 12);
        const shuffledPlaces = [...placesToShow].sort(() => Math.random() - 0.5);
        setDisplayedPlaces(shuffledPlaces.slice(0, numToShow));
    }, [activeCategory, windowWidth, allPlaces, showTopRated, topRatedData]);

    // Filter top rated data by category
    const filterTopRatedByCategory = () => {
        if (!topRatedData.length) return;

        if (activeCategory === 'all') {
            const groupedPlaces = groupPlacesByCategory(topRatedData);
            const mixedPlaces = createMixedRows(groupedPlaces);
            const numToShow = windowWidth < 768 ? 8 : (windowWidth < 992 ? 12 : 16);
            setDisplayedPlaces(mixedPlaces.slice(0, numToShow));
        } else {
            const filteredPlaces = topRatedData.filter(place =>
                getCategoryName(place) === activeCategory
            );
            const numToShow = windowWidth < 768 ? 6 : (windowWidth < 992 ? 8 : 12);
            setDisplayedPlaces(filteredPlaces.slice(0, numToShow));
        }
    };

    // FIXED: Authentication handlers using AuthContext
    const handleLogout = async () => {
        try {
            await logout();
            setShowUserDropdown(false);
            setIsMenuOpen(false);
            console.log('User logged out successfully');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const handleAuthNavigation = (path) => {
        setIsMenuOpen(false);
        setShowUserDropdown(false);
        navigate(path);
    };

    // Handle image load errors
    const handleImageLoadError = (placeId) => {
        setImageLoadErrors(prev => new Set([...prev, placeId]));
    };

    // Get safe image URL with fallbacks
    const getSafeImageUrl = (place, placeId) => {
        if (imageLoadErrors.has(placeId)) return null;

        const possibleImages = [
            place.ImageURL,
            place.imageURL,
            place.image_1,
            place.image,
            place.imageUrl,
            place.Image,
            place.locationDetails?.imageURL,
            place.locationDetails?.ImageURL,
            place.LocationDetails?.imageURL,
            place.LocationDetails?.ImageURL
        ];

        for (let imageUrl of possibleImages) {
            if (imageUrl &&
                typeof imageUrl === 'string' &&
                imageUrl.trim() !== '' &&
                !imageUrl.includes('undefined') &&
                !imageUrl.includes('null') &&
                imageUrl !== 'null' &&
                imageUrl !== 'undefined') {
                return imageUrl;
            }
        }

        const category = getCategoryName(place);
        const fallbackImages = {
            'restaurants': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
            'cafes': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop',
            'hotels': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
            'monuments': 'https://images.unsplash.com/photo-1575021142674-4ab6b3050c56?w=400&h=300&fit=crop'
        };

        return fallbackImages[category] || fallbackImages['monuments'];
    };

    // Handle top rated button click
    const handleGetTopRated = async () => {
        setTopRatedLoading(true);
        setShowTopRated(true);

        try {
            const numToShow = 300;
            const topRatedPlaces = await getTopRated(numToShow);

            if (topRatedPlaces && topRatedPlaces.length > 0) {
                const processedPlaces = topRatedPlaces.map(place => {
                    const locationData = place.locationDetails || place.LocationDetails || place;

                    return {
                        LocationID: place.locationID || place.LocationID || locationData.locationID || locationData.LocationID,
                        Name: place.name || place.Name || locationData.name || locationData.Name,
                        Address: place.address || place.Address || locationData.address || locationData.Address,
                        Category: place.category || place.Category || locationData.category || locationData.Category,
                        Attributes: (place.rating || place.Rating || locationData.rating || locationData.Rating || '0').toString(),
                        Latitude: place.latitude || place.Latitude || locationData.latitude || locationData.Latitude,
                        Longitude: place.longitude || place.Longitude || locationData.longitude || locationData.Longitude,
                        ImageURL: place.imageURL || place.ImageURL || locationData.imageURL || locationData.ImageURL,
                        ShortDescription: place.shortDescription || place.ShortDescription || locationData.shortDescription || locationData.ShortDescription,
                        FullDescription: place.fullDescription || place.FullDescription || locationData.fullDescription || locationData.FullDescription,
                        GoogleMapsLink: place.googleMapsLink || place.GoogleMapsLink || locationData.googleMapsLink || locationData.GoogleMapsLink,
                        VisitingHours: place.visitingHours || place.VisitingHours || locationData.visitingHours || locationData.VisitingHours,
                        originalData: place
                    };
                });

                setTopRatedData(processedPlaces);
            } else {
                setTopRatedData([]);
                setDisplayedPlaces([]);
            }
        } catch (error) {
            console.error('Error getting top rated places:', error);
            setTopRatedData([]);
            setDisplayedPlaces([]);
        } finally {
            setTopRatedLoading(false);
        }
    };

    // Handle category change
    const handleCategoryChange = (category) => {
        setActiveCategory(category);

        setTimeout(() => {
            if (categoryTabsRef.current) {
                categoryTabsRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 100);
    };

    // Modal handlers
    const handlePlaceClick = (place) => {
        setSelectedPlace(place);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedPlace(null);
    };

    // Navigation handlers
    const handleGetDirections = (place) => {
        const placeName = getPlaceName(place);
        const address = place.Address || place.address || 'Cairo, Egypt';
        const googleLink = place.GoogleMapsLink || place.googleMapsLink;

        if (googleLink && googleLink.trim() !== '') {
            window.open(googleLink, '_blank');
        } else {
            const searchQuery = encodeURIComponent(`${placeName} ${address}`);
            const mapsUrl = `https://maps.google.com/maps?q=${searchQuery}`;
            window.open(mapsUrl, '_blank');
        }
    };

    const handleChatbotClick = () => {
        setShowChatbot(prev => !prev);
        if (isMenuOpen) setIsMenuOpen(false);
    };

    const handleExploreClick = () => {
        const route = activeCategory !== 'all' ? `/nearby?category=${activeCategory}` : '/nearby';
        navigate(route);
    };

    // Search handlers
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            if (isMenuOpen) setIsMenuOpen(false);
            const encodedQuery = encodeURIComponent(searchQuery.trim());
            navigate(`/search?query=${encodedQuery}`);
        }
    };

    const handleSearchInputChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Utility functions
    const getPlaceName = (place) => {
        return place.Name || place.name || place.hotel_name || 'Unnamed Place';
    };

    const getCategoryName = (place) => {
        const rawCategory = place.category || place.Category || '';
        const cat = rawCategory.toLowerCase();

        if (cat.includes('restaurant') || cat.includes('food')) return 'restaurants';
        if (cat.includes('cafe') || cat.includes('coffee')) return 'cafes';
        if (cat.includes('hotel') || cat.includes('accommodation')) return 'hotels';

        const name = place.Name?.toLowerCase() || place.name?.toLowerCase() || '';
        if (name.includes('hotel')) return 'hotels';

        return 'monuments';
    };

    const formatRating = (place) => {
        const rating = place.Attributes || place.rating || place.Rating;
        if (rating === undefined || rating === null) return 'N/A';
        const numRating = Number(rating);
        if (isNaN(numRating)) return 'N/A';
        return numRating % 1 === 0 ? numRating.toFixed(0) : numRating.toFixed(1);
    };

    const getSectionTitle = () => {
        if (showTopRated) return 'Top Rated Places in Cairo';
        return activeCategory === 'all'
            ? 'Discover Amazing Places in Cairo'
            : `Popular ${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} in Cairo`;
    };

    // Scroll category tabs to active tab
    useEffect(() => {
        if (categoryTabsRef.current) {
            const activeTab = categoryTabsRef.current.querySelector('.active');
            if (activeTab) {
                const container = categoryTabsRef.current;
                const scrollPosition = activeTab.offsetLeft - (container.clientWidth / 2) + (activeTab.clientWidth / 2);
                container.scrollLeft = scrollPosition;
            }
        }
    }, [activeCategory]);

    // Constants
    const showCompactFooter = windowWidth < 768;
    const categoryIcons = {
        all: '🏛️',
        restaurants: '🍽️',
        cafes: '☕',
        hotels: '🏨',
        monuments: '🏛️'
    };

    // FIXED: Loading state includes AuthContext isLoading
    if (loading || isLoading) {
        return (
            <div className="home-page">
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
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
                    <p style={{ margin: '0', fontWeight: '500' }}>Loading amazing places in Cairo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="home-page">
            {/* Header - Completely Rewritten */}
            <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
                <div className="header-content" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 24px',
                    height: '64px'
                }}>
                    {/* Left Section - Logo */}
                    <div className="left-section" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '32px',
                        flex: '0 0 auto'
                    }}>
                        <div className="logo-container">
                            <Link to="/">
                                <img src={GuidlyLogo} alt="Guidely" className="logo" style={{
                                    height: '40px',
                                    width: 'auto'
                                }} />
                            </Link>
                        </div>

                        {/* Desktop Search - Fixed */}
                        {windowWidth > 767 && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                width: '350px'
                            }}>
                                <form
                                    onSubmit={handleSearchSubmit}
                                    style={{
                                        display: 'flex',
                                        width: '100%',
                                        border: 'none',
                                        margin: 0,
                                        padding: 0
                                    }}
                                >
                                    <input
                                        type="text"
                                        placeholder="Search in Cairo..."
                                        value={searchQuery}
                                        onChange={handleSearchInputChange}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onBlur={() => setIsSearchFocused(false)}
                                        style={{
                                            flex: 1,
                                            padding: '12px 16px',
                                            border: 'none',
                                            outline: 'none',
                                            backgroundColor: 'transparent',
                                            fontSize: '14px',
                                            color: '#333'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '12px 16px',
                                            backgroundColor: '#D6B887',
                                            border: 'none',
                                            outline: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '16px'
                                        }}
                                    >
                                        🔍
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Center Section - Navigation */}
                    {windowWidth > 767 && (
                        <nav style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '32px',
                            flex: '1 1 auto',
                            justifyContent: 'center'
                        }}>
                            <Link to="/" style={{
                                textDecoration: 'none',
                                color: '#D6B887',
                                fontWeight: '600',
                                fontSize: '16px',
                                whiteSpace: 'nowrap'
                            }}>
                                Home
                            </Link>
                            <Link to="/nearby" style={{
                                textDecoration: 'none',
                                color: '#666',
                                fontWeight: '500',
                                fontSize: '16px',
                                whiteSpace: 'nowrap',
                                transition: 'color 0.3s ease'
                            }}>
                                Explore
                            </Link>
                            <Link to="/near-me" style={{
                                textDecoration: 'none',
                                color: '#666',
                                fontWeight: '500',
                                fontSize: '16px',
                                whiteSpace: 'nowrap',
                                transition: 'color 0.3s ease'
                            }}>
                                Places Near Me
                            </Link>
                            <button
                                onClick={handleChatbotClick}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#D6B887',
                                    fontWeight: '600',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'color 0.3s ease'
                                }}
                            >
                                AI Assistant
                            </button>
                        </nav>
                    )}

                    {/* Right Section - User Menu */}
                    <div className="right-section" style={{
                        display: 'flex',
                        alignItems: 'center',
                        flex: '0 0 auto'
                    }}>
                        {/* Desktop User Authentication */}
                        {windowWidth > 767 && (
                            <div className="auth-section">
                                {isAuthenticated ? (
                                    <div className="user-menu" ref={userDropdownRef} style={{
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <span style={{
                                            color: '#666',
                                            fontSize: '14px',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            Hello, {getFullUserName()}!
                                        </span>
                                        <button
                                            onClick={() => setShowUserDropdown(!showUserDropdown)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '4px'
                                            }}
                                        >
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #D6B887 0%, #FF6B35 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: '600',
                                                fontSize: '14px'
                                            }}>
                                                {getFirstName().charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontSize: '12px', color: '#666' }}>▼</span>
                                        </button>

                                        {/* User Dropdown */}
                                        {showUserDropdown && (
                                            <div className="user-dropdown">
                                                <div className="user-info">
                                                    <div className="user-avatar-large">
                                                        {getUserDisplayName().charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="user-details">
                                                        <p className="user-name">{user.fullName || user.userName || 'User'}</p>
                                                        <p className="user-email">{user.fullName || user.userName || user.email}</p>
                                                    </div>
                                                </div>

                                                <div className="dropdown-divider"></div>

                                                <div className="dropdown-menu-items">
                                                    <button className="dropdown-item" onClick={() => handleAuthNavigation('/profile')}>
                                                        <span className="item-icon">👤</span>
                                                        My Profile
                                                    </button>
                                                    <button className="dropdown-item" onClick={() => handleAuthNavigation('/favorites')}>
                                                        <span className="item-icon">❤️</span>
                                                        My Favorites
                                                    </button>
                                                    <button className="dropdown-item" onClick={() => handleAuthNavigation('/trip-planner')}>
                                                        <span className="item-icon">🗺️</span>
                                                        Trip Planner
                                                    </button>
                                                    <button className="dropdown-item" onClick={() => handleAuthNavigation('/settings')}>
                                                        <span className="item-icon">⚙️</span>
                                                        Settings
                                                    </button>

                                                    <div className="dropdown-divider"></div>

                                                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                                                        <span className="item-icon">🚪</span>
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px'
                                    }}>
                                        <Link to="/login" style={{
                                            textDecoration: 'none',
                                            color: '#D6B887',
                                            fontWeight: '500',
                                            fontSize: '16px'
                                        }}>
                                            Sign in
                                        </Link>
                                        <Link to="/register" style={{
                                            backgroundColor: '#D6B887',
                                            color: 'white',
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            textDecoration: 'none',
                                            fontWeight: '600',
                                            fontSize: '16px'
                                        }}>
                                            Register
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            className={`menu-button ${isMenuOpen ? 'open' : ''}`}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{
                                display: windowWidth <= 767 ? 'flex' : 'none',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '40px',
                                height: '40px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <span style={{
                                display: 'block',
                                width: '24px',
                                height: '2px',
                                backgroundColor: '#333',
                                margin: '4px 0',
                                transition: 'all 0.3s ease'
                            }}></span>
                            <span style={{
                                display: 'block',
                                width: '24px',
                                height: '2px',
                                backgroundColor: '#333',
                                margin: '4px 0',
                                transition: 'all 0.3s ease'
                            }}></span>
                            <span style={{
                                display: 'block',
                                width: '24px',
                                height: '2px',
                                backgroundColor: '#333',
                                margin: '4px 0',
                                transition: 'all 0.3s ease'
                            }}></span>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
                    <form onSubmit={handleSearchSubmit} className="mobile-search">
                        <input
                            type="text"
                            placeholder="Search places in Cairo..."
                            value={searchQuery}
                            onChange={handleSearchInputChange}
                        />
                        <button type="submit">Search</button>
                    </form>

                    <nav className="mobile-navigation">
                        <Link to="/" className="mobile-nav-link active">Home</Link>
                        <Link to="/nearby" className="mobile-nav-link">Explore</Link>
                        <Link to="/near-me" className="mobile-nav-link">Places Near Me</Link>
                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                setShowChatbot(true);
                            }}
                            className="mobile-nav-link chatbot-mobile-button"
                        >
                            GuideAI
                        </button>
                    </nav>

                    {/* UPDATED: Mobile User Section - Removed Favorites */}
                    <div className="mobile-auth">
                        {isAuthenticated ? (
                            <div className="mobile-user-section">
                                <div className="mobile-user-info">
                                    <div className="mobile-user-avatar">
                                        {getFirstName().charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="mobile-user-name">Hello, {getFullUserName()}!</p>
                                        <p className="mobile-user-email">{user.email}</p>
                                    </div>
                                </div>

                                <div className="mobile-user-actions">
                                    <Link to="/profile" className="mobile-user-link" onClick={() => setIsMenuOpen(false)}>
                                        <span>👤</span> Profile
                                    </Link>
                                    <Link to="/favorites" className="mobile-user-link" onClick={() => setIsMenuOpen(false)}>
                                        <span>❤️</span> Favorites
                                    </Link>
                                    <button onClick={handleLogout} className="mobile-logout-btn">
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="mobile-sign-in">Sign in</Link>
                                <Link to="/register" className="mobile-register">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section
                className="hero-section"
                ref={heroSectionRef}
                style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url(${PyramidsImage})`
                }}
            >
                <div className="overlay-gradient"></div>
                <div className="hero-container">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            {windowWidth < 576 ? "Discover Cairo with AI" : isAuthenticated ? `Your Cairo Adventure Awaits` : "Discover Cairo with AI Assistance"}
                        </h1>
                        <p className="hero-subtitle">
                            {isAuthenticated
                                ? `Ready to explore more amazing places in Cairo, ${getFullUserName()}? Let's discover something new together!`
                                : "Your personal guide to the best restaurants, hotels, cafes, and monuments in Cairo - powered by AI"
                            }
                        </p>
                        {/* UPDATED: Hero Buttons - Removed My Favorites Button from Hero Section */}
                        <div className="hero-buttons">
                            <button className="explore-button" onClick={() => navigate('/nearby')}>
                                <span>{isAuthenticated ? 'Continue Exploring' : 'Explore All'}</span>
                                <span className="button-icon">🔍</span>
                            </button>
                            <button className="nearby-button" onClick={() => navigate('/near-me')}>
                                <span>Places Near Me</span>
                                <span className="button-icon">📍</span>
                            </button>
                            <button className="ai-assistant-button" onClick={handleChatbotClick}>
                                <span>Ask AI Assistant</span>
                            </button>
                            {/* REMOVED: My Favorites button that was beside AI Assistant */}
                        </div>
                    </div>
                </div>
                <div className="hero-bottom-fade"></div>
            </section>

            {/* Category Tabs */}
            <div className={`category-tabs ${scrolled ? 'tabs-fixed' : ''}`}>
                <div className="category-tabs-container" ref={categoryTabsRef}>
                    {['all', 'restaurants', 'cafes', 'hotels', 'monuments'].map(category => (
                        <button
                            key={category}
                            className={`category-tab ${activeCategory === category ? 'active' : ''}`}
                            onClick={() => handleCategoryChange(category)}
                        >
                            <span className="category-tab-icon">{categoryIcons[category]}</span>
                            <span className="category-tab-text">
                                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Services Section */}
            <section className="services-section">
                <div className="section-container">
                    <div className="section-header">
                        <div className="section-badge">
                            <span className="section-badge-icon">🏛️</span>
                            <span>Featured Places</span>
                        </div>
                        <h2 className="section-title">{getSectionTitle()}</h2>
                        <p className="section-subtitle">
                            {showTopRated
                                ? 'Highest rated places based on user reviews and ratings'
                                : activeCategory === 'all'
                                    ? 'Explore a variety of amazing places Cairo has to offer'
                                    : `Discover popular ${activeCategory} in Cairo`}
                        </p>
                    </div>

                    {/* Top Rated Button */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                        <button
                            onClick={() => {
                                if (showTopRated) {
                                    setShowTopRated(false);
                                    setTopRatedData([]);
                                } else {
                                    handleGetTopRated();
                                }
                            }}
                            disabled={topRatedLoading}
                            style={{
                                padding: windowWidth < 768 ? '10px 20px' : '12px 24px',
                                background: topRatedLoading ? '#6c757d' : (showTopRated ? '#dc3545' : '#28a745'),
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: topRatedLoading ? 'not-allowed' : 'pointer',
                                opacity: topRatedLoading ? 0.6 : 1,
                                transition: 'all 0.3s ease',
                                fontSize: windowWidth < 768 ? '14px' : '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {topRatedLoading ? (
                                <>
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTop: '2px solid white',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }}></div>
                                    Loading...
                                </>
                            ) : (
                                <>
                                    {showTopRated ? '✕ Hide Top Rated' : '⭐ Show Top Rated Places'}
                                </>
                            )}
                        </button>
                    </div>

                    {/* Loading State */}
                    {topRatedLoading && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '40px 20px',
                            color: '#666'
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
                            <p style={{ margin: '0', fontWeight: '500' }}>Loading top rated places...</p>
                        </div>
                    )}

                    {/* Places Cards */}
                    {!topRatedLoading && (
                        <div className="service-cards" style={{
                            display: 'grid',
                            gridTemplateColumns: windowWidth < 768 ? '1fr' : windowWidth < 992 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                            gap: '20px',
                            marginBottom: '30px'
                        }}>
                            {displayedPlaces.map((place, index) => {
                                const placeId = place.LocationID || place.id || place.hotel_id || `place-${index}`;
                                const imageUrl = getSafeImageUrl(place, placeId);
                                const category = getCategoryName(place);

                                return (
                                    <div
                                        className="place-card"
                                        key={placeId}
                                        onClick={() => handlePlaceClick(place)}
                                        style={{
                                            background: 'white',
                                            borderRadius: '16px',
                                            overflow: 'hidden',
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                            border: '1px solid rgba(0,0,0,0.05)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={getPlaceName(place)}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        transition: 'transform 0.3s ease'
                                                    }}
                                                    loading="lazy"
                                                    onError={() => handleImageLoadError(placeId)}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '48px'
                                                }}>
                                                    {(() => {
                                                        const categoryEmojis = {
                                                            'restaurants': '🍽️',
                                                            'cafes': '☕',
                                                            'hotels': '🏨',
                                                            'monuments': '🏛️'
                                                        };
                                                        return categoryEmojis[category] || '🏛️';
                                                    })()}
                                                </div>
                                            )}

                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3))'
                                            }}></div>

                                            <div style={{
                                                position: 'absolute',
                                                top: '12px',
                                                left: '12px',
                                                background: '#4A00E0',
                                                color: 'white',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                textTransform: 'capitalize'
                                            }}>
                                                {category.replace('monuments', 'historical')}
                                            </div>

                                            {/* Favorite button for authenticated users */}
                                            {isAuthenticated && (
                                                <button
                                                    style={{
                                                        position: 'absolute',
                                                        top: '12px',
                                                        right: '12px',
                                                        background: 'rgba(255,255,255,0.9)',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '32px',
                                                        height: '32px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        fontSize: '16px',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Toggle favorite logic here
                                                    }}
                                                >
                                                    ❤️
                                                </button>
                                            )}

                                            {/* Only show rating for non-monuments */}
                                            {category !== 'monuments' && (
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '12px',
                                                    left: '12px',
                                                    background: 'rgba(0,0,0,0.7)',
                                                    color: 'white',
                                                    padding: '4px 8px',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <span style={{ color: '#FFD700' }}>★</span>
                                                    {formatRating(place)}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ padding: '16px' }}>
                                            <h3 style={{
                                                margin: '0 0 8px 0',
                                                fontSize: '1.1em',
                                                fontWeight: '600',
                                                color: '#333',
                                                lineHeight: '1.3',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {getPlaceName(place)}
                                            </h3>

                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                marginBottom: '16px',
                                                color: '#666',
                                                fontSize: '14px'
                                            }}>
                                                <span>📍</span>
                                                <span style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {place.Address || place.address || 'Cairo, Egypt'}
                                                </span>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleGetDirections(place);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    background: 'linear-gradient(45deg, #4A00E0, #667eea)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                <span>🧭</span>
                                                Get Directions
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* No Places Found Message */}
                    {!topRatedLoading && displayedPlaces.length === 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px 20px',
                            color: '#666',
                            background: '#f8f9fa',
                            borderRadius: '12px',
                            margin: '20px 0'
                        }}>
                            <div style={{ fontSize: '3em', marginBottom: '16px' }}>🏛️</div>
                            <h3 style={{ marginBottom: '12px', color: '#333' }}>No Places Found</h3>
                            <p style={{ marginBottom: '0' }}>
                                {showTopRated
                                    ? `No top rated ${activeCategory === 'all' ? 'places' : activeCategory} available at the moment.`
                                    : activeCategory === 'all'
                                        ? 'Loading amazing places in Cairo...'
                                        : `No ${activeCategory} found. Try a different category!`}
                            </p>
                        </div>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '30px' }}>
                        <button
                            onClick={handleExploreClick}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(45deg, #4A00E0, #667eea)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>Explore All Places</span>
                            <span>→</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-container">
                    <div className="section-header">
                        <div className="section-badge">
                            <span className="section-badge-icon">✨</span>
                            <span>Smart Features</span>
                        </div>
                        <h2 className="section-title">Explore Cairo Like a Local</h2>
                        <p className="section-subtitle">
                            Discover the best places with our AI-powered tourism platform designed to make your exploration seamless and memorable.
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: windowWidth < 768 ? '1fr' : windowWidth < 992 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                        gap: '24px',
                        marginTop: '40px'
                    }}>
                        {[
                            {
                                icon: '🎯',
                                title: 'Smart Recommendations',
                                description: isAuthenticated
                                    ? 'Get personalized suggestions based on your preferences and past visits.'
                                    : 'Our AI analyzes your preferences to suggest personalized places that match your unique taste and interests.'
                            },
                            {
                                icon: '🤖',
                                title: 'AI Assistant Chat',
                                description: 'Get instant answers, directions, and local insights with our intelligent chatbot available 24/7.'
                            },
                            {
                                icon: '🧭',
                                title: 'Reliable Navigation',
                                description: 'Get precise directions to any destination in Cairo with real-time updates and offline support.'
                            },
                            {
                                icon: '❤️',
                                title: isAuthenticated ? 'Your Favorites' : 'Save Favorites',
                                description: isAuthenticated
                                    ? 'Access your saved places and create custom lists for easy reference.'
                                    : 'Save your favorite places and create custom lists for future visits.'
                            },
                            {
                                icon: '🏛️',
                                title: 'Cultural Insights',
                                description: 'Learn about the rich history and cultural significance of each monument and landmark.'
                            },
                            {
                                icon: '📱',
                                title: 'Offline Mode',
                                description: 'Access your saved places and maps even without an internet connection during your travels.'
                            }
                        ].map((feature, index) => (
                            <div key={index} style={{
                                background: 'white',
                                padding: '24px',
                                borderRadius: '16px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                                textAlign: 'center',
                                transition: 'transform 0.3s ease'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{feature.icon}</div>
                                <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '1.2em' }}>{feature.title}</h3>
                                <p style={{ margin: '0', color: '#666', lineHeight: '1.5' }}>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                {!showCompactFooter ? (
                    <div className="footer-container">
                        <div className="footer-column">
                            <img src={GuidlyLogo} alt="Guidely Logo" className="footer-logo" />
                            <p className="footer-description">
                                Your AI-powered guide to exploring Cairo's best places, helping you discover the perfect spots tailored to your preferences.
                            </p>
                            <div className="social-links">
                                <a href="#" className="social-link">📱</a>
                                <a href="#" className="social-link">💬</a>
                                <a href="#" className="social-link">📧</a>
                            </div>
                        </div>

                        {/* UPDATED: Footer Quick Links - Re-added Favorites */}
                        <div className="footer-column">
                            <h4 className="footer-heading">Quick Links</h4>
                            <ul className="footer-links">
                                <li><Link to="/"><span className="footer-icon">→</span> Home</Link></li>
                                <li><Link to="/nearby"><span className="footer-icon">→</span> Nearby Places</Link></li>
                                <li><button onClick={handleChatbotClick} className="footer-button"><span className="footer-icon">→</span> GuideAI</button></li>
                                {isAuthenticated ? (
                                    <>
                                        <li><Link to="/profile"><span className="footer-icon">→</span> My Profile</Link></li>
                                        <li><Link to="/favorites"><span className="footer-icon">→</span> My Favorites</Link></li>
                                    </>
                                ) : (
                                    <>
                                        <li><Link to="/login"><span className="footer-icon">→</span> Sign In</Link></li>
                                        <li><Link to="/register"><span className="footer-icon">→</span> Register</Link></li>
                                    </>
                                )}
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h4 className="footer-heading">Categories</h4>
                            <ul className="footer-links">
                                <li><Link to="/nearby?category=restaurants"><span className="footer-icon">🍽️</span> Restaurants</Link></li>
                                <li><Link to="/nearby?category=cafes"><span className="footer-icon">☕</span> Cafes</Link></li>
                                <li><Link to="/nearby?category=hotels"><span className="footer-icon">🏨</span> Hotels</Link></li>
                                <li><Link to="/nearby?category=monuments"><span className="footer-icon">🏛️</span> Monuments</Link></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h4 className="footer-heading">Contact Us</h4>
                            <div className="contact-info">
                                <div className="contact-item">
                                    <span className="contact-icon">📍</span>
                                    <span>123 Main Street, Cairo, Egypt</span>
                                </div>
                                <div className="contact-item">
                                    <span className="contact-icon">📞</span>
                                    <span>+20 12 345 6789</span>
                                </div>
                                <div className="contact-item">
                                    <span className="contact-icon">📧</span>
                                    <span>contact@guidely.com</span>
                                </div>
                            </div>

                            <form className="newsletter-form">
                                <h4 className="newsletter-heading">Get Cairo Travel Tips</h4>
                                <div className="newsletter-input-group">
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="newsletter-input"
                                    />
                                    <button type="submit" className="newsletter-button">Subscribe</button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="mobile-footer-container">
                        <div className="mobile-footer-top">
                            <img src={GuidlyLogo} alt="Guidely Logo" className="footer-logo" />
                            <div className="mobile-social-links">
                                <a href="#" className="social-link">📱</a>
                                <a href="#" className="social-link">💬</a>
                                <a href="#" className="social-link">📧</a>
                            </div>
                        </div>

                        <div className="mobile-footer-links">
                            <div className="mobile-footer-column">
                                <h4 className="footer-heading">Quick Links</h4>
                                <ul className="footer-links">
                                    <li><Link to="/"><span className="footer-icon">→</span> Home</Link></li>
                                    <li><Link to="/nearby"><span className="footer-icon">→</span> Explore</Link></li>
                                    <li><button onClick={handleChatbotClick} className="footer-button"><span className="footer-icon">→</span> GuideAI</button></li>
                                </ul>
                            </div>

                            <div className="mobile-footer-column">
                                <h4 className="footer-heading">Categories</h4>
                                <ul className="footer-links">
                                    <li><Link to="/nearby?category=restaurants"><span className="footer-icon">🍽️</span> Restaurants</Link></li>
                                    <li><Link to="/nearby?category=cafes"><span className="footer-icon">☕</span> Cafes</Link></li>
                                    <li><Link to="/nearby?category=hotels"><span className="footer-icon">🏨</span> Hotels</Link></li>
                                </ul>
                            </div>
                        </div>

                        <form className="mobile-newsletter-form">
                            <h4 className="newsletter-heading">Get Cairo Travel Tips</h4>
                            <div className="newsletter-input-group">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="newsletter-input"
                                />
                                <button type="submit" className="newsletter-button">Subscribe</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="footer-bottom">
                    <p>© 2025 Guidely — Your AI-Powered Cairo Guide. All rights reserved.</p>
                </div>
            </footer>

            {/* Place Details Modal */}
            {showModal && selectedPlace && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{getPlaceName(selectedPlace)}</h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="modal-image-container">
                                {getSafeImageUrl(selectedPlace, selectedPlace.LocationID) ? (
                                    <img
                                        src={getSafeImageUrl(selectedPlace, selectedPlace.LocationID)}
                                        alt={getPlaceName(selectedPlace)}
                                        className="modal-image"
                                    />
                                ) : (
                                    <div className="modal-placeholder">
                                        <span className="modal-placeholder-icon">
                                            {(() => {
                                                const category = getCategoryName(selectedPlace);
                                                const categoryEmojis = {
                                                    'restaurants': '🍽️',
                                                    'cafes': '☕',
                                                    'hotels': '🏨',
                                                    'monuments': '🏛️'
                                                };
                                                return categoryEmojis[category] || '🏛️';
                                            })()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="modal-info">
                                <div className="modal-category">
                                    <span className="modal-category-badge">
                                        {getCategoryName(selectedPlace).replace('monuments', 'historical')}
                                    </span>
                                    {getCategoryName(selectedPlace) !== 'monuments' && (
                                        <span className="modal-rating">
                                            ⭐ {formatRating(selectedPlace)}
                                        </span>
                                    )}
                                </div>

                                <div className="modal-address">
                                    <span className="modal-icon">📍</span>
                                    <span>{selectedPlace.Address || selectedPlace.address || 'Cairo, Egypt'}</span>
                                </div>

                                {selectedPlace.VisitingHours && (
                                    <div className="modal-hours">
                                        <span className="modal-icon">🕐</span>
                                        <span>{selectedPlace.VisitingHours}</span>
                                    </div>
                                )}

                                {(selectedPlace.ShortDescription || selectedPlace.FullDescription) && (
                                    <div className="modal-description">
                                        <h3>About</h3>
                                        <p>{selectedPlace.ShortDescription || selectedPlace.FullDescription}</p>
                                    </div>
                                )}

                                {/* UPDATED: Modal Actions - Re-added Favorites Button */}
                                <div className="modal-actions">
                                    <button
                                        className="modal-directions-btn"
                                        onClick={() => handleGetDirections(selectedPlace)}
                                    >
                                        🧭 Get Directions
                                    </button>

                                    {isAuthenticated && (
                                        <button
                                            className="modal-favorite-btn"
                                            onClick={() => {
                                                // Add to favorites logic
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '14px 20px',
                                                background: 'linear-gradient(45deg, #ff6b6b, #ff8e53)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                marginTop: '12px',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            ❤️ Add to Favorites
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chatbot Icon - Exact Match with Animation */}
            <div
                className={`chatbot-icon ${showChatbot ? 'active' : ''}`}
                onClick={handleChatbotClick}
                title="Chat with Guidly Assistant"
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '60px',
                    height: '60px',
                    background: showChatbot ? '#dc3545' : '#D6B887',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(214, 184, 135, 0.3)',
                    transition: 'all 0.3s ease',
                    zIndex: 1000,
                    border: 'none',
                    animation: showChatbot ? 'none' : 'chatbotPulse 2s ease-in-out infinite'
                }}
            >
                {showChatbot ? (
                    <span style={{ fontSize: '24px', color: 'white' }}>×</span>
                ) : (
                    <div style={{
                        position: 'relative',
                        animation: 'chatbotBounce 3s ease-in-out infinite'
                    }}>
                        {/* Main speech bubble */}
                        <div style={{
                            width: '32px',
                            height: '24px',
                            background: 'white',
                            borderRadius: '16px',
                            position: 'relative'
                        }}></div>

                        {/* Speech bubble tail */}
                        <div style={{
                            position: 'absolute',
                            bottom: '-6px',
                            left: '4px',
                            width: '12px',
                            height: '12px',
                            background: 'white',
                            borderRadius: '0 12px 12px 12px',
                            transform: 'rotate(-45deg)',
                            transformOrigin: 'center'
                        }}></div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes chatbotPulse {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 4px 16px rgba(214, 184, 135, 0.3);
                    }
                    50% {
                        transform: scale(1.05);
                        box-shadow: 0 6px 20px rgba(214, 184, 135, 0.4);
                    }
                }
                
                @keyframes chatbotBounce {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-2px);
                    }
                }
            `}</style>

            {/* Chatbot Component */}
            <ChatbotComponent isOpen={showChatbot} setIsOpen={setShowChatbot} />
        </div>
    );
};

export default Home;