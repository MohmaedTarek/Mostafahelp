import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import Home from './components/pages/Home';
import Register from './components/auth/register';
import Login from './components/auth/login';
import AdminLogin from './components/admin/AdminLogin';
import SearchPage from './components/pages/searchpage';
import NearbyPlaces from './components/pages/nearbyme';
import PlacesNearMe from './components/pages/placesNearMe';
import AdminDashboard from './components/admin/AdminDashboard.jsx';

// Import new user pages
import Profile from './components/auth/Profile';
import Favorites from './components/auth/Favourites';  // Fixed this line
import TripPlanner from './components/auth/TripPlanner';
import Settings from './components/auth/Settings';

// Import styles
import './components/styles/AdminDashboard.css';

// Loading component for authentication state
const AuthLoadingSpinner = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
    }}>
        Loading...
    </div>
);

// Enhanced ProtectedRoute component with JWT authentication
const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { isAuthenticated, isLoading, isAdmin, user } = useAuth();

    // Show loading while auth state is being determined
    if (isLoading) {
        return <AuthLoadingSpinner />;
    }

    // Not authenticated at all - redirect to appropriate login
    if (!isAuthenticated) {
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

// Public route wrapper (redirects to home if already authenticated)
const PublicRoute = ({ children, redirectTo = "/" }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <AuthLoadingSpinner />;
    }

    if (isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    return children;
};

// Main App component
function AppContent() {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />

            {/* Auth routes - redirect to home if already logged in */}
            <Route path="/register" element={
                <PublicRoute>
                    <Register />
                </PublicRoute>
            } />

            <Route path="/login" element={
                <PublicRoute>
                    <Login />
                </PublicRoute>
            } />

            <Route path="/admin/login" element={
                <PublicRoute redirectTo="/admin">
                    <AdminLogin />
                </PublicRoute>
            } />

            {/* Public pages that work better with authentication but don't require it */}
            <Route path="/nearby" element={<NearbyPlaces />} />
            <Route path="/near-me" element={<PlacesNearMe />} />
            <Route path="/search" element={<SearchPage />} />

            {/* Protected routes - require authentication */}
            <Route path="/chatbot" element={
                <ProtectedRoute>
                    <div>Chatbot Page</div>
                </ProtectedRoute>
            } />

            {/* User Profile Pages - require authentication */}
            <Route path="/profile" element={
                <ProtectedRoute>
                    <Profile />
                </ProtectedRoute>
            } />

            <Route path="/favorites" element={
                <ProtectedRoute>
                    <Favorites />
                </ProtectedRoute>
            } />

            <Route path="/trip-planner" element={
                <ProtectedRoute>
                    <TripPlanner />
                </ProtectedRoute>
            } />

            <Route path="/settings" element={
                <ProtectedRoute>
                    <Settings />
                </ProtectedRoute>
            } />

            {/* Admin Dashboard Routes - require admin authentication */}
            <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />

            <Route path="/Admin" element={
                <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />

            <Route path="/AdminDashboard" element={
                <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />

            {/* Catch misspelled variant */}
            <Route path="/AdminDashoboard" element={
                <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />

            {/* Catch-all route for 404s */}
            <Route path="*" element={
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    flexDirection: 'column'
                }}>
                    <h1>404 - Page Not Found</h1>
                    <p>The page you're looking for doesn't exist.</p>
                    <a href="/" style={{ marginTop: '20px', color: '#007bff' }}>Go Home</a>
                </div>
            } />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

export default App;