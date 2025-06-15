import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Loading component
const AuthLoadingSpinner = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
    }}>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #007bff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }}></div>
            <span>Loading...</span>
        </div>
        <style>
            {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}
        </style>
    </div>
);

// Enhanced ProtectedRoute component
const ProtectedRoute = ({
    children,
    requireAdmin = false,
    fallbackPath = null,
    showLoading = true
}) => {
    const { isAuthenticated, isLoading, isAdmin, user } = useAuth();

    // Show loading while auth state is being determined
    if (isLoading && showLoading) {
        return <AuthLoadingSpinner />;
    }

    // Not authenticated at all - redirect to appropriate login
    if (!isAuthenticated) {
        if (fallbackPath) {
            return <Navigate to={fallbackPath} replace />;
        }
        return requireAdmin
            ? <Navigate to="/admin/login" replace />
            : <Navigate to="/login" replace />;
    }

    // Authenticated but not admin, trying to access admin route
    if (requireAdmin && !isAdmin()) {
        return <Navigate to="/admin/login" replace />;
    }

    // All checks passed, render the protected component
    return children;
};

// Public route wrapper (redirects if already authenticated)
export const PublicRoute = ({
    children,
    redirectTo = "/",
    redirectAdminTo = "/admin",
    showLoading = true
}) => {
    const { isAuthenticated, isLoading, isAdmin } = useAuth();

    if (isLoading && showLoading) {
        return <AuthLoadingSpinner />;
    }

    if (isAuthenticated) {
        // Redirect admin users to admin dashboard, regular users to home
        const destination = isAdmin() ? redirectAdminTo : redirectTo;
        return <Navigate to={destination} replace />;
    }

    return children;
};

// Role-based route protection
export const RoleBasedRoute = ({
    children,
    allowedRoles = [],
    fallbackPath = "/",
    showLoading = true
}) => {
    const { isAuthenticated, isLoading, user, hasRole } = useAuth();

    if (isLoading && showLoading) {
        return <AuthLoadingSpinner />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check if user has any of the allowed roles
    const hasRequiredRole = allowedRoles.length === 0 ||
        allowedRoles.some(role => hasRole(role));

    if (!hasRequiredRole) {
        return <Navigate to={fallbackPath} replace />;
    }

    return children;
};

// Conditional route wrapper
export const ConditionalRoute = ({
    children,
    condition,
    fallbackPath = "/",
    showLoading = true
}) => {
    const { isLoading } = useAuth();

    if (isLoading && showLoading) {
        return <AuthLoadingSpinner />;
    }

    if (!condition) {
        return <Navigate to={fallbackPath} replace />;
    }

    return children;
};

export default ProtectedRoute;