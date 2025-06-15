import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../utils/authutils';
import { useAuth } from '../auth/AuthContext'; // ADDED: Import AuthContext
import GuidlyLogo from './GuidlyLogo1.png';
import '../styles/login.css';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { login } = useAuth(); // ADDED: Get login function from AuthContext

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Call the authutils loginUser function
            const result = await loginUser(formData.email, formData.password);
            console.log('AuthUtils login result:', result); // Debug log

            if (result.success) {
                console.log('AuthUtils login successful:', result.user); // Debug log

                // CRITICAL FIX: Update AuthContext state after successful login
                if (result.token && result.user) {
                    // Prepare user data for AuthContext
                    const userData = {
                        id: result.user.id || result.user.nameid,
                        email: result.user.email || formData.email,
                        fullName: result.user.fullName || result.user.name || result.user.unique_name,
                        userName: result.user.userName || result.user.username || result.user.unique_name,
                        roles: result.user.roles || result.user.role || ['User']
                    };

                    console.log('Updating AuthContext with:', { token: result.token, userData }); // Debug log

                    // Update AuthContext state - THIS IS THE CRITICAL PART!
                    const contextUpdateSuccess = login(result.token, userData);

                    if (contextUpdateSuccess) {
                        console.log('AuthContext updated successfully, navigating home'); // Debug log
                        navigate('/');
                    } else {
                        console.error('Failed to update AuthContext'); // Debug log
                        setError('Authentication state update failed');
                    }
                } else {
                    console.error('Missing token or user data:', { token: result.token, user: result.user }); // Debug log
                    setError('Login successful but missing authentication data');
                }
            } else {
                console.error('AuthUtils login failed:', result.message); // Debug log
                setError(result.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error); // Debug log
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <header className="login-header">
                <Link to="/">
                    <img src={GuidlyLogo} alt="Guidely Logo" className="login-logo" />
                </Link>
            </header>

            <main className="login-main">
                <div className="login-form-container">
                    <h1 className="login-title">Sign in to Guidely</h1>
                    <p className="login-subtitle">Enter your credentials to access your account</p>

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="login-form-group">
                            <label className="login-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`login-input ${error ? 'login-input-error' : ''}`}
                                disabled={loading}
                            />
                        </div>

                        <div className="login-form-group">
                            <label className="login-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`login-input ${error ? 'login-input-error' : ''}`}
                                disabled={loading}
                            />
                        </div>

                        <div className="login-forgot">
                            <Link to="/forgot-password" className="login-forgot-link">Forgot Password?</Link>
                        </div>

                        <button
                            type="submit"
                            className="login-submit"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>

                        <div className="login-register-link">
                            Don't have an account? <Link to="/register">Register</Link>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Login;