// Enhanced Authentication Service - Integrated with api.js
import {
    loginUser as apiLoginUser,
    registerUser as apiRegisterUser,
    loginAdmin as apiLoginAdmin,
    logout as apiLogout,
    getCurrentUser as apiGetCurrentUser,
    isAuthenticated as apiIsAuthenticated,
    isAdmin as apiIsAdmin,
    getToken as apiGetToken,
    TokenManager,
    authenticatedFetch as apiAuthenticatedFetch,
    getFavorites as apiGetFavorites,
    addToFavorites as apiAddToFavorites,
    removeFromFavorites as apiRemoveFromFavorites,
    recordInteraction as apiRecordInteraction
} from './api.js';

const API_BASE_URL = 'https://localhost:5207'; // Your backend URL

// JWT Token utility functions (enhanced from your existing TokenService)
const TokenService = {
    // Decode JWT token without verification (for client-side info only)
    decodeToken: (token) => {
        try {
            if (!token) return null;
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    },

    // Check if token is expired
    isTokenExpired: (token) => {
        try {
            const decoded = TokenService.decodeToken(token);
            if (!decoded || !decoded.exp) return true;
            const currentTime = Date.now() / 1000;
            return decoded.exp < currentTime;
        } catch (error) {
            return true;
        }
    },

    // Get user info from token
    getUserFromToken: (token) => {
        try {
            const decoded = TokenService.decodeToken(token);
            if (!decoded) return null;

            return {
                id: decoded.nameid || decoded.sub,
                email: decoded.email,
                userName: decoded.unique_name || decoded.name,
                roles: decoded.role || []
            };
        } catch (error) {
            console.error('Error getting user from token:', error);
            return null;
        }
    }
};

// ========= PRIMARY AUTH FUNCTIONS (Use api.js functions) =========

// Log out current user
export const logout = async () => {
    console.log('AuthUtils: Logging out user');
    return await apiLogout();
};

// Check if user is authenticated
export const isAuthenticated = () => {
    return apiIsAuthenticated();
};

// Check if user is an admin
export const isAdmin = () => {
    return apiIsAdmin();
};

// Get current user data
export const getCurrentUser = () => {
    return apiGetCurrentUser();
};

// Get auth token
export const getToken = () => {
    return apiGetToken();
};

// Login as regular user
export const loginUser = async (email, password) => {
    console.log('AuthUtils: Attempting user login');
    return await apiLoginUser(email, password);
};

// Register new user
export const registerUser = async (fullName, email, password, confirmPassword) => {
    console.log('AuthUtils: Attempting user registration');
    return await apiRegisterUser(fullName, email, password, confirmPassword);
};

// Login as admin
export const loginAdmin = async (username, password) => {
    console.log('AuthUtils: Attempting admin login');
    return await apiLoginAdmin(username, password);
};

// ========= USER INTERACTION FUNCTIONS =========

// Get user profile from backend
export const getUserProfile = async () => {
    try {
        const response = await authenticatedFetch('/api/user/profile');
        return await response.json();
    } catch (error) {
        console.error('Get profile error:', error);
        return { success: false, message: 'Failed to get user profile' };
    }
};

// Get user favorites from backend
export const getFavorites = async () => {
    console.log('AuthUtils: Getting user favorites');
    return await apiGetFavorites();
};

// Add location to favorites
export const addToFavorites = async (locationId) => {
    console.log('AuthUtils: Adding to favorites:', locationId);
    return await apiAddToFavorites(locationId);
};

// Remove location from favorites
export const removeFromFavorites = async (locationId) => {
    console.log('AuthUtils: Removing from favorites:', locationId);
    return await apiRemoveFromFavorites(locationId);
};

// Record user interaction
export const recordInteraction = async (locationId, type) => {
    console.log('AuthUtils: Recording interaction:', locationId, type);
    return await apiRecordInteraction(locationId, type);
};

// ========= ADDITIONAL UTILITY FUNCTIONS =========

// Helper function for authenticated API calls
export const authenticatedFetch = async (endpoint, options = {}) => {
    return await apiAuthenticatedFetch(endpoint, options);
};

// Validate current session
export const validateSession = async () => {
    try {
        const token = getToken();
        if (!token) return false;

        // Check if token is expired first
        if (TokenService.isTokenExpired(token)) {
            console.log('Token expired, clearing session');
            await logout();
            return false;
        }

        // Optional: Call backend to validate token
        try {
            const response = await authenticatedFetch('/api/auth/validate');
            const data = await response.json();
            return data.success;
        } catch (error) {
            // If validation endpoint doesn't exist, just check token expiry
            console.log('Token validation endpoint not available, using token expiry check');
            return true;
        }
    } catch (error) {
        console.error('Session validation error:', error);
        return false;
    }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
    try {
        const response = await authenticatedFetch('/api/user/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
        return await response.json();
    } catch (error) {
        console.error('Update profile error:', error);
        return { success: false, message: 'Failed to update profile' };
    }
};

// Change user password
export const changePassword = async (currentPassword, newPassword) => {
    try {
        const response = await authenticatedFetch('/api/user/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        return await response.json();
    } catch (error) {
        console.error('Change password error:', error);
        return { success: false, message: 'Failed to change password' };
    }
};

// Get user recommendations
export const getUserRecommendations = async () => {
    try {
        const user = getCurrentUser();
        if (!user) {
            return { success: false, message: 'User not authenticated', data: [] };
        }

        const response = await authenticatedFetch(`/api/recommendations/user/${user.id}`);
        return await response.json();
    } catch (error) {
        console.error('Get recommendations error:', error);
        return { success: false, message: 'Failed to get recommendations', data: [] };
    }
};

// Submit feedback for a location
export const submitFeedback = async (locationId, rating, comment) => {
    try {
        const response = await authenticatedFetch('/api/feedback', {
            method: 'POST',
            body: JSON.stringify({
                locationID: locationId,
                rating,
                comment
            }),
        });
        return await response.json();
    } catch (error) {
        console.error('Submit feedback error:', error);
        return { success: false, message: 'Failed to submit feedback' };
    }
};

// Get user's feedback history
export const getUserFeedback = async () => {
    try {
        const response = await authenticatedFetch('/api/user/feedback');
        return await response.json();
    } catch (error) {
        console.error('Get user feedback error:', error);
        return { success: false, message: 'Failed to get feedback history', data: [] };
    }
};

// ========= ADMIN FUNCTIONS =========

// Check if current user has admin privileges
export const hasAdminAccess = () => {
    const user = getCurrentUser();
    return isAdmin() && user && (user.roles?.includes('Admin') || user.roles?.includes('admin'));
};

// ========= SESSION MANAGEMENT =========

// Initialize auth state (call this on app startup)
export const initializeAuth = async () => {
    try {
        const token = getToken();
        if (!token) {
            console.log('No token found, user not authenticated');
            return false;
        }

        // Validate session
        const isValid = await validateSession();
        if (!isValid) {
            console.log('Session invalid, clearing auth state');
            await logout();
            return false;
        }

        console.log('User authenticated successfully');
        return true;
    } catch (error) {
        console.error('Error initializing auth:', error);
        await logout();
        return false;
    }
};

// Check authentication status periodically
export const startAuthCheck = (intervalMs = 300000) => { // Check every 5 minutes
    return setInterval(async () => {
        const isValid = await validateSession();
        if (!isValid) {
            console.log('Session expired, redirecting to login');
            window.location.href = '/login';
        }
    }, intervalMs);
};

// ========= UTILITY FUNCTIONS =========

// Format user display name
export const getUserDisplayName = () => {
    const user = getCurrentUser();
    if (!user) return 'Guest';
    return user.fullName || user.userName || user.email || 'User';
};

// Check if user has specific role
export const hasRole = (role) => {
    const user = getCurrentUser();
    if (!user || !user.roles) return false;

    const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
    return roles.includes(role);
};

// Get user permissions based on role
export const getUserPermissions = () => {
    const user = getCurrentUser();
    if (!user) return [];

    const permissions = ['read'];

    if (hasRole('Admin')) {
        permissions.push('write', 'delete', 'admin');
    } else if (hasRole('User')) {
        permissions.push('comment', 'favorite');
    }

    return permissions;
};

// ========= BACKWARD COMPATIBILITY =========

// Legacy function names for backward compatibility
export const logoutAdmin = logout;

// Export TokenService and TokenManager for external use
export { TokenService, TokenManager };

// Default export with all functions
export default {
    // Auth functions
    loginUser,
    registerUser,
    loginAdmin,
    logout,
    isAuthenticated,
    isAdmin,
    getCurrentUser,
    getToken,

    // User functions
    getUserProfile,
    updateUserProfile,
    changePassword,
    getFavorites,
    addToFavorites,
    removeFromFavorites,
    recordInteraction,
    getUserRecommendations,
    submitFeedback,
    getUserFeedback,

    // Session management
    validateSession,
    initializeAuth,
    startAuthCheck,

    // Utility functions
    hasAdminAccess,
    getUserDisplayName,
    hasRole,
    getUserPermissions,
    authenticatedFetch,

    // Services
    TokenService,
    TokenManager
};