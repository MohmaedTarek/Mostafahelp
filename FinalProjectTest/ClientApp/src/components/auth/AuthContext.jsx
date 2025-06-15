import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the Auth Context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// JWT Token utility functions
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

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(null);

    // Initialize auth state on app load
    useEffect(() => {
        const initializeAuth = () => {
            try {
                const storedToken = localStorage.getItem('authToken');

                if (storedToken && !TokenService.isTokenExpired(storedToken)) {
                    // Token is valid
                    const userFromToken = TokenService.getUserFromToken(storedToken);
                    const storedUser = localStorage.getItem('user');

                    let userData = userFromToken;
                    if (storedUser) {
                        try {
                            const parsedUser = JSON.parse(storedUser);
                            userData = { ...userFromToken, ...parsedUser };
                        } catch (error) {
                            console.error('Error parsing stored user:', error);
                        }
                    }

                    setToken(storedToken);
                    setUser(userData);
                    setIsAuthenticated(true);
                } else {
                    // Token is expired or doesn't exist
                    clearAuth();
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                clearAuth();
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []); // Empty dependency array

    const login = (authToken, userData) => {
        try {
            // Store token and user data
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('user', JSON.stringify(userData));

            // For backward compatibility with existing admin logic
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userRole', userData.roles?.includes('Admin') ? 'admin' : 'user');

            setToken(authToken);
            setUser(userData);
            setIsAuthenticated(true);

            return true;
        } catch (error) {
            console.error('Error during login:', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            // Optional: Call backend logout endpoint
            if (token) {
                try {
                    await fetch('https://localhost:5207/api/auth/logout', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                } catch (error) {
                    console.error('Backend logout error:', error);
                    // Continue with client-side logout even if backend fails
                }
            }
        } finally {
            clearAuth();
        }
    };

    const clearAuth = () => {
        // Clear all stored data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userRole');

        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    // Check if user has specific role
    const hasRole = (role) => {
        if (!user || !user.roles) return false;
        return Array.isArray(user.roles)
            ? user.roles.includes(role)
            : user.roles === role;
    };

    // Check if user is admin (for backward compatibility)
    const isAdmin = () => {
        return hasRole('Admin') || localStorage.getItem('userRole') === 'admin';
    };

    // Get current token (useful for API calls)
    const getToken = () => {
        const currentToken = token || localStorage.getItem('authToken');
        if (currentToken && TokenService.isTokenExpired(currentToken)) {
            clearAuth();
            return null;
        }
        return currentToken;
    };

    // Update user profile
    const updateUser = (updatedUserData) => {
        const newUser = { ...user, ...updatedUserData };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    // FIXED: Remove the conflicting isAuthenticated function
    const value = {
        // State
        user,
        isAuthenticated, // This is the boolean state, not a function
        isLoading,
        token,

        // Actions
        login,
        logout,
        updateUser,

        // Utilities
        hasRole,
        isAdmin,
        getToken,

        // For backward compatibility
        getCurrentUser: () => user,
        // Removed conflicting isAuthenticated function
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};