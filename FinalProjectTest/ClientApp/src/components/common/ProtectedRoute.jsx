import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import '../styles/protected-route.css';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const isAdmin = localStorage.getItem('userRole') === 'admin';
  
  // If user is not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route requires admin access but user is not admin
  if (location.pathname.includes('/admin') && !isAdmin) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You don't have admin permissions to access this page.</p>
        <a href="/" className="back-link">Go to Homepage</a>
      </div>
    );
  }

  // If authenticated and authorized, render the protected component
  return children;
};

export default ProtectedRoute;