import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../utils/authutils';
import { useAuth } from '../auth/AuthContext'; // ADDED: Import AuthContext
import GuidlyLogo from './GuidlyLogo1.png';
import '../styles/register.css';

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
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

        if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Call the authutils registerUser function
            const result = await registerUser(
                formData.fullName,
                formData.email,
                formData.password,
                formData.confirmPassword
            );
            console.log('AuthUtils register result:', result); // Debug log

            if (result.success) {
                console.log('Registration successful:', result.user); // Debug log

                // CRITICAL FIX: Update AuthContext state after successful registration
                if (result.token && result.user) {
                    // Prepare user data for AuthContext
                    const userData = {
                        id: result.user.id || result.user.nameid,
                        email: result.user.email || formData.email,
                        fullName: result.user.fullName || formData.fullName || result.user.name,
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
                    setError('Registration successful but missing authentication data');
                }
            } else {
                if (result.errors && result.errors.length > 0) {
                    setError(result.errors.join(', '));
                } else {
                    setError(result.message || 'Registration failed');
                }
            }
        } catch (error) {
            setError('An unexpected error occurred. Please try again.');
            console.error('Registration error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <header className="register-header">
                <Link to="/">
                    <img src={GuidlyLogo} alt="Guidely Logo" className="register-logo" />
                </Link>
            </header>

            <main className="register-main">
                <div className="register-form-container">
                    <h1 className="register-title">Create Account</h1>
                    <p className="register-subtitle">Join Guidely and start your Cairo adventure</p>

                    {error && (
                        <div className="register-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="register-form-group">
                            <label className="register-label">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                placeholder="Enter your full name"
                                value={formData.fullName}
                                onChange={handleChange}
                                className={`register-input ${error ? 'register-input-error' : ''}`}
                                disabled={loading}
                            />
                        </div>

                        <div className="register-form-group">
                            <label className="register-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`register-input ${error ? 'register-input-error' : ''}`}
                                disabled={loading}
                            />
                        </div>

                        <div className="register-form-group">
                            <label className="register-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`register-input ${error ? 'register-input-error' : ''}`}
                                disabled={loading}
                            />
                        </div>

                        <div className="register-form-group">
                            <label className="register-label">Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Re-enter your password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`register-input ${error ? 'register-input-error' : ''}`}
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="register-submit"
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>

                        <div className="register-login-link">
                            Already have an account? <Link to="/login">Sign in</Link>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Register;