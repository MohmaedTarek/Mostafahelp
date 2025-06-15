/**
 * API service functions for backend communication
 * Updated to work with ChatBot integration, Recommendations, and JWT Authentication
 */
const API_BASE_URL = 'http://localhost:5207'; // FIXED: Changed from HTTPS to HTTP for local development

/**
 * ========= JWT TOKEN MANAGEMENT =========
 */
const TokenManager = {
    getToken: () => {
        const token = localStorage.getItem('authToken');
        if (!token) return null;

        // Check if token is expired
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            if (payload.exp < currentTime) {
                // Token expired, clear storage
                TokenManager.clearToken();
                return null;
            }
        } catch (error) {
            console.error('Error parsing token:', error);
            return null;
        }

        return token;
    },

    clearToken: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userRole');
        localStorage.removeItem('token'); // Clear old token field too
    },

    isAuthenticated: () => {
        return !!TokenManager.getToken();
    }
};

/**
 * Enhanced generic API call function with JWT authentication and error handling
 */
const apiCall = async (endpoint, options = {}) => {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        console.log(`API Call: ${url}`);

        // Get authentication headers
        const authHeaders = {};
        const token = TokenManager.getToken();
        if (token && options.includeAuth !== false) {
            authHeaders.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            mode: 'cors', // Add CORS mode
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json', // ADDED: Better content negotiation
                ...authHeaders,
                ...options.headers,
            },
            ...options,
        });

        // Handle authentication errors
        if (response.status === 401) {
            console.warn('Authentication failed, clearing token'); // ADDED: Better logging
            TokenManager.clearToken();

            // Redirect to login if not already there
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/admin/login')) {
                console.log('Redirecting to login page'); // ADDED: Better logging
                window.location.href = '/login';
            }

            throw new Error('Authentication expired');
        }

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;

            try {
                // IMPROVED: Better error handling for different content types
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.title || errorData.error || errorMessage;
                } else {
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                }
            } catch (parseError) {
                console.warn('Could not parse error response:', parseError); // ADDED: Better error logging
                // Use the original error message if parsing fails
            }

            throw new Error(errorMessage);
        }

        // IMPROVED: Validate response content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }

        const data = await response.json();
        console.log(`API Response for ${endpoint}:`, data);

        // Handle both formats: direct data array or wrapped in success/data
        if (Array.isArray(data)) {
            return { success: true, data };
        } else if (data.success !== undefined) {
            return data; // Already in correct format
        } else {
            return { success: true, data };
        }
    } catch (error) {
        console.error(`API Error for ${endpoint}:`, error);
        
        // IMPROVED: Better error categorization and messages
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return {
                success: false,
                message: 'Network error: Could not connect to server. Please check if the backend is running on http://localhost:5207',
                data: [],
                errorType: 'network'
            };
        }

        return {
            success: false,
            message: error.message,
            data: [],
            errorType: 'api'
        };
    }
};

/**
 * ========= AUTHENTICATION SERVICES (ENHANCED) =========
 */

// Login user with JWT
export const loginUser = async (email, password) => {
    try {
        console.log('Attempting JWT login for:', email);
        const response = await apiCall('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            includeAuth: false // Don't include auth header for login
        });

        console.log('Login response:', response);

        if (response.success && response.token) {
            // Store authentication data
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('isAuthenticated', 'true');

            // Set user role based on token or default to 'user'
            const userRole = response.user?.roles?.includes('Admin') ? 'admin' : 'user';
            localStorage.setItem('userRole', userRole);

            return {
                success: true,
                user: response.user,
                message: response.message,
                token: response.token
            };
        }

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return { 
            success: false, 
            message: 'Connection error. Please check if the server is running and try again.' // IMPROVED: Better error message
        };
    }
};

// Register user with JWT
export const registerUser = async (fullName, email, password, confirmPassword) => {
    try {
        console.log('Attempting JWT registration for:', email);
        const response = await apiCall('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ fullName, email, password, confirmPassword }),
            includeAuth: false // Don't include auth header for registration
        });

        console.log('Registration response:', response);

        if (response.success && response.token) {
            // Store authentication data
            localStorage.setItem('authToken', response.token);
            const userData = { ...response.user, fullName: fullName };
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('isAuthenticated', 'true');

            // Set user role based on token or default to 'user'
            const userRole = response.user?.roles?.includes('Admin') ? 'admin' : 'user';
            localStorage.setItem('userRole', userRole);

            return {
                success: true,
                user: userData,
                message: response.message,
                token: response.token
            };
        }

        return response;
    } catch (error) {
        console.error('Registration error:', error);
        return { 
            success: false, 
            message: 'Connection error. Please check if the server is running and try again.' // IMPROVED: Better error message
        };
    }
};

// Logout user
export const logout = async () => {
    try {
        // Call backend logout endpoint if authenticated
        if (TokenManager.isAuthenticated()) {
            await apiCall('/api/auth/logout', { method: 'POST' });
        }
    } catch (error) {
        console.error('Logout error:', error);
        // IMPROVED: Continue with local logout even if backend call fails
    } finally {
        TokenManager.clearToken();
    }
};

// Enhanced Login admin (JWT + fallback to hardcoded)
export const loginAdmin = async (username, password) => {
    // First try to login through regular JWT auth
    try {
        const result = await loginUser(username, password);
        if (result.success && (result.user?.roles?.includes('Admin') || localStorage.getItem('userRole') === 'admin')) {
            return result;
        }
    } catch (error) {
        console.log('JWT admin login failed, trying hardcoded credentials');
    }

    // Fallback to hardcoded admin credentials
    if (username === 'admin' && password === 'admin123') {
        const token = 'mock-jwt-token-xyz123';
        const adminUser = {
            id: 'admin',
            email: 'admin@guidely.com',
            userName: 'admin',
            fullName: 'System Administrator',
            roles: ['Admin']
        };

        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token); // Store in both places for compatibility
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('user', JSON.stringify(adminUser));

        return { success: true, token, user: adminUser, message: 'Admin login successful' };
    }

    return { success: false, message: 'Invalid admin credentials' };
};

export const logoutAdmin = async () => {
    await logout();
    localStorage.removeItem('token'); // Remove old token field too
    return { success: true };
};

// Get current user
export const getCurrentUser = () => {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

// Check if user is authenticated
export const isAuthenticated = () => {
    return TokenManager.isAuthenticated() || localStorage.getItem('isAuthenticated') === 'true';
};

// Check if user is admin
export const isAdmin = () => {
    const user = getCurrentUser();
    return user?.roles?.includes('Admin') || localStorage.getItem('userRole') === 'admin';
};

// Get auth token (backward compatibility)
export const getToken = () => {
    return TokenManager.getToken() || localStorage.getItem('token');
};

/**
 * ========= RECOMMENDATION SERVICES =========
 */

// Get top rated places
export const getTopRatedPlaces = async (topN = 10) => {
    const response = await apiCall(`/api/recommendation/top-rated?topN=${topN}`);

    // Transform LocationDto format to match frontend expectations
    if (response.success && response.data) {
        const transformedData = response.data.map(place => ({
            // Keep both formats for compatibility
            LocationID: place.locationID || place.LocationID,
            locationID: place.locationID || place.LocationID,

            Name: place.name || place.Name,
            name: place.name || place.Name,

            Address: place.address || place.Address,
            address: place.address || place.Address,

            Category: place.category || place.Category,
            category: place.category || place.Category,

            // Rating as both string (Attributes) and number (rating)
            Attributes: place.rating?.toString() || place.Rating?.toString() || '4.0',
            rating: parseFloat(place.rating || place.Rating || 4.0),
            Rating: parseFloat(place.rating || place.Rating || 4.0),

            // Images
            ImageURL: place.imageURL || place.ImageURL || getDefaultPlaceImage(mapCategoryToFrontend(place.category || place.Category)),
            imageURL: place.imageURL || place.ImageURL || getDefaultPlaceImage(mapCategoryToFrontend(place.category || place.Category)),

            // Coordinates
            Latitude: place.latitude || place.Latitude || getDefaultLatitude(),
            latitude: place.latitude || place.Latitude || getDefaultLatitude(),
            Longitude: place.longitude || place.Longitude || getDefaultLongitude(),
            longitude: place.longitude || place.Longitude || getDefaultLongitude(),

            // Additional fields
            GoogleMapsLink: place.googleMapsLink || place.GoogleMapsLink,
            googleMapsLink: place.googleMapsLink || place.GoogleMapsLink,
            ShortDescription: place.shortDescription || place.ShortDescription,
            shortDescription: place.shortDescription || place.ShortDescription,
            FullDescription: place.fullDescription || place.FullDescription,
            fullDescription: place.fullDescription || place.FullDescription,
            VisitingHours: place.visitingHours || place.VisitingHours,
            visitingHours: place.visitingHours || place.VisitingHours
        }));

        return { success: true, data: transformedData };
    }

    return response;
};

// Get smart recommendations
export const getSmartRecommendations = async (requestData) => {
    const response = await apiCall('/api/recommendation/smart-recommendations', {
        method: 'POST',
        body: JSON.stringify(requestData)
    });

    // Transform RecommendationResponse format
    if (response.success && response.data) {
        const transformedData = response.data.map(rec => ({
            // Basic info
            name: rec.name || rec.Name,
            Name: rec.name || rec.Name,
            category: rec.category || rec.Category,
            Category: rec.category || rec.Category,

            // Recommendation specific fields
            distanceKM: rec.distanceKM || rec.DistanceKM,
            DistanceKM: rec.distanceKM || rec.DistanceKM,
            rating: rec.rating || rec.Rating,
            Rating: rec.rating || rec.Rating,
            score: rec.score || rec.Score,
            Score: rec.score || rec.Score,
            googleMapsLink: rec.googleMapsLink || rec.GoogleMapsLink,
            GoogleMapsLink: rec.googleMapsLink || rec.GoogleMapsLink,

            // Location details
            locationDetails: rec.locationDetails || rec.LocationDetails,
            LocationDetails: rec.locationDetails || rec.LocationDetails,

            // Add compatibility fields
            LocationID: rec.locationDetails?.locationID || rec.LocationDetails?.LocationID,
            locationID: rec.locationDetails?.locationID || rec.LocationDetails?.LocationID,
            Address: rec.locationDetails?.address || rec.LocationDetails?.Address,
            address: rec.locationDetails?.address || rec.LocationDetails?.Address,
            ImageURL: rec.locationDetails?.imageURL || rec.LocationDetails?.ImageURL || getDefaultPlaceImage(mapCategoryToFrontend(rec.category || rec.Category)),
            imageURL: rec.locationDetails?.imageURL || rec.LocationDetails?.ImageURL || getDefaultPlaceImage(mapCategoryToFrontend(rec.category || rec.Category))
        }));

        return { success: true, data: transformedData };
    }

    return response;
};

// Get nearby places
export const getNearbyPlaces = async (lat, lon, topN = 10) => {
    const response = await apiCall(`/api/recommendation/nearby?lat=${lat}&lon=${lon}&topN=${topN}`);

    // Transform LocationDto format
    if (response.success && response.data) {
        const transformedData = response.data.map(place => ({
            LocationID: place.locationID || place.LocationID,
            locationID: place.locationID || place.LocationID,
            Name: place.name || place.Name,
            name: place.name || place.Name,
            Address: place.address || place.Address,
            address: place.address || place.Address,
            Category: place.category || place.Category,
            category: place.category || place.Category,
            Attributes: place.rating?.toString() || place.Rating?.toString() || '4.0',
            rating: parseFloat(place.rating || place.Rating || 4.0),
            Rating: parseFloat(place.rating || place.Rating || 4.0),
            ImageURL: place.imageURL || place.ImageURL || getDefaultPlaceImage(mapCategoryToFrontend(place.category || place.Category)),
            imageURL: place.imageURL || place.ImageURL || getDefaultPlaceImage(mapCategoryToFrontend(place.category || place.Category)),
            Latitude: place.latitude || place.Latitude || getDefaultLatitude(),
            latitude: place.latitude || place.Latitude || getDefaultLatitude(),
            Longitude: place.longitude || place.Longitude || getDefaultLongitude(),
            longitude: place.longitude || place.Longitude || getDefaultLongitude(),
            GoogleMapsLink: place.googleMapsLink || place.GoogleMapsLink,
            googleMapsLink: place.googleMapsLink || place.GoogleMapsLink
        }));

        return { success: true, data: transformedData };
    }

    return response;
};

/**
 * ========= CHATBOT AI SERVICES (ENHANCED WITH JWT) =========
 */

// Send message to AI chatbot
export const sendChatMessage = async (question) => {
    try {
        const authHeaders = {};
        const token = TokenManager.getToken() || localStorage.getItem('token');
        if (token) {
            authHeaders.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/AI/Ask`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json', // ADDED: Better content negotiation
                ...authHeaders
            },
            body: JSON.stringify({
                question: question
            })
        });

        if (response.status === 401) {
            TokenManager.clearToken();
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
            throw new Error('Authentication expired');
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI Service error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return {
            success: true,
            answer: data.answer || 'I apologize, I couldn\'t generate a response.',
            places: data.places || [], // NEW: Include places from database
            timestamp: new Date()
        };
    } catch (error) {
        console.error('Error sending chat message:', error);
        return {
            success: false,
            answer: 'I\'m experiencing some technical difficulties. Please try again later.',
            places: [],
            error: error.message
        };
    }
};

// Rate a chatbot interaction
export const rateChatInteraction = async (interactionId, rating) => {
    try {
        const authHeaders = {};
        const token = TokenManager.getToken() || localStorage.getItem('token');
        if (token) {
            authHeaders.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/AI/RateInteraction`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json', // ADDED: Better content negotiation
                ...authHeaders
            },
            body: JSON.stringify({
                interactionId: interactionId,
                rating: rating
            })
        });

        if (response.status === 401) {
            TokenManager.clearToken();
            throw new Error('Authentication expired');
        }

        if (!response.ok) {
            throw new Error(`Rating error: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: data.success || true,
            message: data.message || 'Rating saved successfully'
        };
    } catch (error) {
        console.error('Error rating interaction:', error);
        return {
            success: false,
            message: 'Failed to save rating'
        };
    }
};

/**
 * ADDITIONAL USER PROFILE & MANAGEMENT API FUNCTIONS
 * Add these functions to your existing api.js file
 */

/**
 * ========= USER PROFILE SERVICES =========
 */

// Get user profile
export const getUserProfile = async () => {
    if (!TokenManager.isAuthenticated()) {
        return { success: false, message: 'Not authenticated', data: null };
    }
    return await apiCall('/api/user/profile');
};

// Update user profile
export const updateUserProfile = async (profileData) => {
    if (!TokenManager.isAuthenticated()) {
        return { success: false, message: 'Not authenticated' };
    }
    return await apiCall('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
    });
};

// Get user statistics
export const getUserStats = async () => {
    if (!TokenManager.isAuthenticated()) {
        return {
            success: false,
            message: 'Not authenticated',
            data: {
                placesVisited: 0,
                favorites: 0,
                reviews: 0,
                photosShared: 0
            }
        };
    }
    return await apiCall('/api/user/stats');
};

/**
 * ========= USER PREFERENCES/SETTINGS SERVICES =========
 */

// Get user preferences/settings
export const getUserPreferences = async () => {
    if (!TokenManager.isAuthenticated()) {
        return { success: false, message: 'Not authenticated', data: null };
    }
    return await apiCall('/api/user/preferences');
};

// Update user preferences/settings
export const updateUserPreferences = async (preferences) => {
    if (!TokenManager.isAuthenticated()) {
        return { success: false, message: 'Not authenticated' };
    }
    return await apiCall('/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences)
    });
};

/**
 * ========= TRIP PLANNER SERVICES =========
 */

// Get user trips
export const getUserTrips = async () => {
    if (!TokenManager.isAuthenticated()) {
        return { success: false, message: 'Not authenticated', data: [] };
    }
    return await apiCall('/api/user/trips');
};

// Create new trip
export const createTrip = async (tripData) => {
    if (!TokenManager.isAuthenticated()) {
        return { success: false, message: 'Not authenticated' };
    }
    return await apiCall('/api/user/trips', {
        method: 'POST',
        body: JSON.stringify(tripData)
    });
};

// Update trip
export const updateTrip = async (tripId, tripData) => {
    if (!TokenManager.isAuthenticated()) {
        return { success: false, message: 'Not authenticated' };
    }
    return await apiCall(`/api/user/trips/${tripId}`, {
        method: 'PUT',
        body: JSON.stringify(tripData)
    });
};

// Delete trip
export const deleteTrip = async (tripId) => {
    if (!TokenManager.isAuthenticated()) {
        return { success: false, message: 'Not authenticated' };
    }
    return await apiCall(`/api/user/trips/${tripId}`, {
        method: 'DELETE'
    });
};

// Get trip details
export const getTripById = async (tripId) => {
    if (!TokenManager.isAuthenticated()) {
        return { success: false, message: 'Not authenticated', data: null };
    }
    return await apiCall(`/api/user/trips/${tripId}`);
};

/**
 * ========= ENHANCED FAVORITES SERVICES =========
 */

// Get user favorites with full location details
export const getFavoritesWithDetails = async () => {
    if (!TokenManager.isAuthenticated()) {
        return { success: false, message: 'Not authenticated', data: [] };
    }

    const response = await apiCall('/api/user/favorites/details');

    // Transform favorites data to match frontend expectations
    if (response.success && response.data) {
        const transformedData = response.data.map(fav => ({
            id: fav.locationID || fav.location?.locationID,
            name: fav.location?.name || fav.name,
            category: mapCategoryToFrontend(fav.location?.category || fav.category),
            rating: parseFloat(fav.location?.rating || fav.rating || 4.0),
            address: fav.location?.address || fav.address || 'Cairo, Egypt',
            image: getImageUrl(fav.location || fav),
            dateAdded: fav.dateAdded || fav.createdAt,
            description: fav.location?.description || fav.description || '',
            visited: fav.visited || false
        }));

        return { success: true, data: transformedData };
    }

    return response;
};

// Mark favorite as visited
export const markFavoriteVisited = async (locationId, visited = true) => {
    if (!TokenManager.isAuthenticated()) {
        return { success: false, message: 'Not authenticated' };
    }
    return await apiCall(`/api/user/favorites/${locationId}/visited`, {
        method: 'PUT',
        body: JSON.stringify({ visited })
    });
};

/**
 * Add these to your existing export default object at the bottom of api.js:
 */

// Add these to the existing export default object:
/*
    // User Profile functions
    getUserProfile,
    updateUserProfile,
    getUserStats,
    
    // User Preferences functions
    getUserPreferences,
    updateUserPreferences,
    
    // Trip Planner functions
    getUserTrips,
    createTrip,
    updateTrip,
    deleteTrip,
    getTripById,
    
    // Enhanced Favorites functions
    getFavoritesWithDetails,
    markFavoriteVisited,
*/

// Get user's chat interaction history
export const getUserChatHistory = async () => {
    try {
        const authHeaders = {};
        const token = TokenManager.getToken() || localStorage.getItem('token');
        if (token) {
            authHeaders.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/AI/GetUserInteractions`, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json', // ADDED: Better content negotiation
                ...authHeaders
            }
        });

        if (response.status === 401) {
            TokenManager.clearToken();
            throw new Error('Authentication expired');
        }

        if (!response.ok) {
            throw new Error(`History error: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: true,
            data: data || []
        };
    } catch (error) {
        console.error('Error getting chat history:', error);
        return {
            success: false,
            data: [],
            message: error.message
        };
    }
};

// Get chatbot interaction statistics
export const getChatbotStats = async () => {
    try {
        const authHeaders = {};
        const token = TokenManager.getToken() || localStorage.getItem('token');
        if (token) {
            authHeaders.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/AI/GetInteractionStats`, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json', // ADDED: Better content negotiation
                ...authHeaders
            }
        });

        if (response.status === 401) {
            TokenManager.clearToken();
            throw new Error('Authentication expired');
        }

        if (!response.ok) {
            throw new Error(`Stats error: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: true,
            data: data || {
                totalInteractions: 0,
                averageRating: 0,
                interactionsToday: 0,
                interactionsThisWeek: 0
            }
        };
    } catch (error) {
        console.error('Error getting chatbot stats:', error);
        return {
            success: false,
            data: {
                totalInteractions: 0,
                averageRating: 0,
                interactionsToday: 0,
                interactionsThisWeek: 0
            },
            message: error.message
        };
    }
};

/**
 * ========= PLACES SERVICES =========
 */
export const getPlaces = async () => {
    const response = await apiCall('/api/locations');

    // Transform data to match frontend expectations
    if (response.success && response.data) {
        const transformedData = response.data.map(location => ({
            id: location.locationID || location.LocationID || location.id,
            LocationID: location.locationID || location.LocationID || location.id,
            name: location.name || location.Name,
            Name: location.name || location.Name,
            category: mapCategoryToFrontend(location.category || location.Category),
            Category: location.category || location.Category,
            address: location.address || location.Address || 'Cairo, Egypt',
            Address: location.address || location.Address || 'Cairo, Egypt',
            description: location.description || location.Description,

            // Rating/Attributes mapping - FIXED for proper display
            Attributes: location.rating?.toString() || location.Rating?.toString() || location.attributes?.toString() || location.Attributes?.toString() || '4.0',
            rating: parseFloat(location.rating || location.Rating || location.attributes || location.Attributes || 4.0),

            // Price level
            priceLevel: location.priceLevel || location.PriceLevel || getPriceLevel(location.category || location.Category),

            // Images - handle different image field names with proper fallbacks
            ImageURL: getImageUrl(location),
            imageURL: getImageUrl(location),
            image_1: getImageUrl(location),
            image: getImageUrl(location),
            imageUrl: getImageUrl(location),

            // Status
            openStatus: location.openStatus || location.OpenStatus || 'Open Now',

            // Google Maps Links
            GoogleMapsLink: location.googleMapsLink || location.GoogleMapsLink,
            googleMapsLink: location.googleMapsLink || location.GoogleMapsLink,

            // Hotel-specific fields
            hotel_name: isHotelCategory(location.category || location.Category) ? (location.name || location.Name) : null,
            hotel_id: isHotelCategory(location.category || location.Category) ? (location.locationID || location.LocationID || location.id) : null,
            price_per_night: location.pricePerNight || location.PricePerNight || location.price_per_night,
            currency: location.currency || 'EGP',
            review_count: location.reviewCount || location.ReviewCount || location.review_count || 0,
            reviewCount: location.reviewCount || location.ReviewCount || location.review_count || 0,
            booking_link: location.bookingLink || location.BookingLink || location.booking_link,

            // Coordinates
            latitude: location.latitude || location.Latitude || getDefaultLatitude(),
            Latitude: location.latitude || location.Latitude || getDefaultLatitude(),
            longitude: location.longitude || location.Longitude || getDefaultLongitude(),
            Longitude: location.longitude || location.Longitude || getDefaultLongitude()
        }));

        return { success: true, data: transformedData };
    }

    return response;
};

export const getPlacesByCategory = async (category) => {
    if (!category) {
        return await getPlaces();
    }

    // Use specific category endpoints that match your backend
    const categoryEndpoint = getCategoryEndpoint(category);
    const response = await apiCall(categoryEndpoint);

    // Transform data to match frontend expectations
    if (response.success && response.data) {
        const transformedData = response.data.map(location => ({
            id: location.locationID || location.LocationID || location.id,
            LocationID: location.locationID || location.LocationID || location.id,
            name: location.name || location.Name,
            Name: location.name || location.Name,
            category: category, // Use the requested frontend category
            Category: location.category || location.Category,
            address: location.address || location.Address || 'Cairo, Egypt',
            Address: location.address || location.Address || 'Cairo, Egypt',
            description: location.description || location.Description,

            // Rating/Attributes mapping
            Attributes: location.rating?.toString() || location.Rating?.toString() || location.attributes?.toString() || location.Attributes?.toString() || '4.0',
            rating: parseFloat(location.rating || location.Rating || location.attributes || location.Attributes || 4.0),

            // Price level
            priceLevel: location.priceLevel || location.PriceLevel || getPriceLevel(location.category || location.Category),

            // Images
            ImageURL: getImageUrl(location),
            imageURL: getImageUrl(location),
            image_1: getImageUrl(location),
            image: getImageUrl(location),
            imageUrl: getImageUrl(location),

            // Status
            openStatus: location.openStatus || location.OpenStatus || 'Open Now',

            // Google Maps
            GoogleMapsLink: location.googleMapsLink || location.GoogleMapsLink,
            googleMapsLink: location.googleMapsLink || location.GoogleMapsLink,

            // Hotel-specific fields
            hotel_name: category === 'hotels' ? (location.name || location.Name) : null,
            hotel_id: category === 'hotels' ? (location.locationID || location.LocationID || location.id) : null,
            price_per_night: location.pricePerNight || location.PricePerNight || location.price_per_night,
            currency: location.currency || 'EGP',
            review_count: location.reviewCount || location.ReviewCount || location.review_count || 0,
            reviewCount: location.reviewCount || location.ReviewCount || location.review_count || 0,
            booking_link: location.bookingLink || location.BookingLink || location.booking_link,

            // Coordinates
            latitude: location.latitude || location.Latitude || getDefaultLatitude(),
            Latitude: location.latitude || location.Latitude || getDefaultLatitude(),
            longitude: location.longitude || location.Longitude || getDefaultLongitude(),
            Longitude: location.longitude || location.Longitude || getDefaultLongitude()
        }));

        return { success: true, data: transformedData };
    }

    return response;
};

export const getPlaceById = async (placeId) => {
    const response = await apiCall(`/api/locations/${placeId}`);

    // Transform single location data
    if (response.success && response.data) {
        const location = response.data;
        const transformedData = {
            id: location.locationID || location.LocationID || location.id,
            LocationID: location.locationID || location.LocationID || location.id,
            name: location.name || location.Name,
            Name: location.name || location.Name,
            category: mapCategoryToFrontend(location.category || location.Category),
            Category: location.category || location.Category,
            address: location.address || location.Address || 'Cairo, Egypt',
            Address: location.address || location.Address || 'Cairo, Egypt',
            description: location.description || location.Description,

            Attributes: location.rating?.toString() || location.Rating?.toString() || location.attributes?.toString() || location.Attributes?.toString() || '4.0',
            rating: parseFloat(location.rating || location.Rating || location.attributes || location.Attributes || 4.0),
            priceLevel: location.priceLevel || location.PriceLevel || getPriceLevel(location.category || location.Category),

            ImageURL: getImageUrl(location),
            imageURL: getImageUrl(location),
            image_1: getImageUrl(location),
            image: getImageUrl(location),
            imageUrl: getImageUrl(location),

            openStatus: location.openStatus || location.OpenStatus || 'Open Now',

            GoogleMapsLink: location.googleMapsLink || location.GoogleMapsLink,
            googleMapsLink: location.googleMapsLink || location.GoogleMapsLink,

            hotel_name: isHotelCategory(location.category || location.Category) ? (location.name || location.Name) : null,
            hotel_id: isHotelCategory(location.category || location.Category) ? (location.locationID || location.LocationID || location.id) : null,
            price_per_night: location.pricePerNight || location.PricePerNight || location.price_per_night,
            currency: location.currency || 'EGP',
            review_count: location.reviewCount || location.ReviewCount || location.review_count || 0,
            reviewCount: location.reviewCount || location.ReviewCount || location.review_count || 0,
            booking_link: location.bookingLink || location.BookingLink || location.booking_link,

            latitude: location.latitude || location.Latitude || getDefaultLatitude(),
            Latitude: location.latitude || location.Latitude || getDefaultLatitude(),
            longitude: location.longitude || location.Longitude || getDefaultLongitude(),
            Longitude: location.longitude || location.Longitude || getDefaultLongitude()
        };

        return { success: true, data: transformedData };
    }

    return response;
};

export const getFirstImagesPerLocation = async () => {
    return await apiCall('/api/images/first');
};

/**
 * ========= USER FAVORITES & INTERACTIONS (NEW) =========
 */

// Get user favorites
export const getFavorites = async () => {
    if (!TokenManager.isAuthenticated()) {
        return { success: false, message: 'Not authenticated', data: [] };
    }
    return await apiCall('/api/user/favorites');
};

// Add to favorites
export const addToFavorites = async (locationId) => {
    if (!TokenManager.isAuthenticated()) {
        return { success: false, message: 'Not authenticated' };
    }
    return await apiCall(`/api/user/favorites/${locationId}`, { method: 'POST' });
};

// Remove from favorites
export const removeFromFavorites = async (locationId) => {
    if (!TokenManager.isAuthenticated()) {
        return { success: false, message: 'Not authenticated' };
    }
    return await apiCall(`/api/user/favorites/${locationId}`, { method: 'DELETE' });
};

// Record user interaction
export const recordInteraction = async (locationId, type) => {
    if (!TokenManager.isAuthenticated()) {
        return { success: false, message: 'Not authenticated' };
    }
    return await apiCall('/api/user/interactions', {
        method: 'POST',
        body: JSON.stringify({ locationID: locationId, type })
    });
};

/**
 * ========= HELPER FUNCTIONS =========
 */

// Map backend categories to frontend categories
const mapCategoryToFrontend = (backendCategory) => {
    if (!backendCategory) return 'monuments';

    const normalized = backendCategory.charAt(0).toUpperCase() + backendCategory.slice(1).toLowerCase();

    const categoryMap = {
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

    return categoryMap[normalized] || 'monuments';
};

// Get category endpoint for API calls
const getCategoryEndpoint = (frontendCategory) => {
    const endpointMap = {
        'restaurants': '/api/locations?category=Restaurant',
        'cafes': '/api/locations?category=Cafe',
        'hotels': '/api/locations?category=Hotel',
        'monuments': '/api/locations' // Get all and filter monuments client-side
    };

    return endpointMap[frontendCategory] || '/api/locations';
};

// Check if category is hotel-related
const isHotelCategory = (category) => {
    return category && (category.toLowerCase() === 'hotel' || category.toLowerCase() === 'hotels');
};

// Get price level based on category
const getPriceLevel = (category) => {
    if (!category) return 2;

    const priceLevelMap = {
        'Hotel': 3,
        'Restaurant': 2,
        'Cafe': 1,
        'Historical': 1,
        'Museum': 1,
        'Church': 1,
        'Mosque': 1,
        'Palace': 2,
        'Fortress': 1
    };

    return priceLevelMap[category] || 2;
};

// Get image URL from location object
const getImageUrl = (location) => {
    // Check multiple possible image field names
    if (location.images && location.images.length > 0) {
        return location.images[0].imageURL || location.images[0].ImageURL;
    }

    // Check for direct image fields
    const imageFields = ['imageURL', 'ImageURL', 'image_1', 'image', 'imageUrl'];
    for (const field of imageFields) {
        if (location[field] && location[field].trim() !== '') {
            return location[field];
        }
    }

    // Fallback to default image
    const category = location.category || location.Category || 'place';
    return getDefaultPlaceImage(mapCategoryToFrontend(category));
};

// Get default place image based on category
const getDefaultPlaceImage = (category = 'place') => {
    const defaultImages = {
        'restaurants': 'https://source.unsplash.com/400x300/?restaurant,food,cairo',
        'cafes': 'https://source.unsplash.com/400x300/?cafe,coffee,cairo',
        'hotels': 'https://source.unsplash.com/400x300/?hotel,bedroom,cairo',
        'monuments': 'https://source.unsplash.com/400x300/?monument,historical,cairo'
    };

    return defaultImages[category] || `https://source.unsplash.com/400x300/?${category},cairo`;
};

// Default coordinates (Cairo center)
const getDefaultLatitude = () => 30.0444;
const getDefaultLongitude = () => 31.2357;

/**
 * ========= ANALYTICS SERVICES (Mock) =========
 */
export const getDashboardAnalytics = async () => {
    return {
        success: true,
        data: {
            totalVisits: 0,
            newUsers: 0,
            activeUsers: 0
        }
    };
};

/**
 * ========= ADDITIONAL HELPER EXPORTS =========
 */
export const validateApiResponse = (response) => {
    if (!response) {
        return { success: false, data: [], message: 'No response received' };
    }

    if (!response.success) {
        return { success: false, data: [], message: response.message || 'API call failed' };
    }

    if (!Array.isArray(response.data)) {
        console.warn('API response data is not an array:', response.data);
        return { success: true, data: [], message: 'Invalid data format' };
    }

    return response;
};

// Helper function for authenticated API calls (backward compatibility)
export const authenticatedFetch = async (endpoint, options = {}) => {
    const token = TokenManager.getToken() || localStorage.getItem('token');
    if (!token) {
        throw new Error('Not authenticated');
    }

    return await apiCall(endpoint, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });
};

// Export Token Manager for external use
export { TokenManager };

// Export all functions as default
export default {
    // Authentication functions (NEW)
    loginUser,
    registerUser,
    logout,
    loginAdmin,
    logoutAdmin,
    getCurrentUser,
    isAuthenticated,
    isAdmin,
    getToken,

    // ChatBot functions
    sendChatMessage,
    rateChatInteraction,
    getUserChatHistory,
    getChatbotStats,

    // Places functions
    getPlaces,
    getPlacesByCategory,
    getPlaceById,
    getFirstImagesPerLocation,

    // Recommendation functions
    getTopRatedPlaces,
    getSmartRecommendations,
    getNearbyPlaces,

    // User functions (NEW)
    getFavorites,
    addToFavorites,
    removeFromFavorites,
    recordInteraction,

    // Helper functions
    validateApiResponse,
    mapCategoryToFrontend,
    getDefaultPlaceImage,
    TokenManager,
    authenticatedFetch
};