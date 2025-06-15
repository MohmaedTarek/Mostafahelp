import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getUserProfile, updateUserProfile, getUserStats } from '../../utils/api';
import GuidlyLogo from '../pages/GuidlyLogo1.png';
import '../styles/Home.css';

const Profile = () => {
    const { user, isAuthenticated, logout, updateUser } = useAuth();
    const navigate = useNavigate();

    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(true);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        bio: '',
        location: '',
        interests: '',
        travelStyle: ''
    });

    const [stats, setStats] = useState({
        placesVisited: 0,
        favorites: 0,
        reviews: 0,
        photosShared: 0
    });

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        loadUserProfile();
        loadUserStats();
    }, [isAuthenticated, navigate]);

    const loadUserProfile = async () => {
        try {
            setProfileLoading(true);
            const response = await getUserProfile();

            if (response.success && response.data) {
                const profileData = response.data;
                setFormData({
                    fullName: profileData.fullName || user?.fullName || '',
                    email: profileData.email || user?.email || '',
                    bio: profileData.bio || '',
                    location: profileData.location || 'Cairo, Egypt',
                    interests: profileData.interests || '',
                    travelStyle: profileData.travelStyle || ''
                });
            } else {
                // Fallback to user data from auth context
                setFormData({
                    fullName: user?.fullName || '',
                    email: user?.email || '',
                    bio: user?.bio || '',
                    location: user?.location || 'Cairo, Egypt',
                    interests: user?.interests || '',
                    travelStyle: user?.travelStyle || ''
                });
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            // Fallback to user data from auth context
            setFormData({
                fullName: user?.fullName || '',
                email: user?.email || '',
                bio: user?.bio || '',
                location: user?.location || 'Cairo, Egypt',
                interests: user?.interests || '',
                travelStyle: user?.travelStyle || ''
            });
        } finally {
            setProfileLoading(false);
        }
    };

    const loadUserStats = async () => {
        try {
            setStatsLoading(true);
            const response = await getUserStats();

            if (response.success && response.data) {
                setStats({
                    placesVisited: response.data.placesVisited || response.data.visitedPlaces || 0,
                    favorites: response.data.favorites || response.data.favoriteCount || 0,
                    reviews: response.data.reviews || response.data.reviewCount || 0,
                    photosShared: response.data.photosShared || response.data.photoCount || 0
                });
            }
        } catch (error) {
            console.error('Error loading user stats:', error);
            // Keep default stats on error
        } finally {
            setStatsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSave = async () => {
        setLoading(true);
        setSaveSuccess(false);

        try {
            const response = await updateUserProfile(formData);

            if (response.success) {
                // Update auth context with new user data
                if (updateUser && typeof updateUser === 'function') {
                    updateUser({ ...user, ...formData });
                }

                setEditing(false);
                setSaveSuccess(true);

                // Hide success message after 3 seconds
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                alert(response.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getUserInitials = () => {
        const name = formData.fullName || user?.fullName || 'User';
        return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
    };

    const travelStyles = [
        { value: 'budget', label: 'Budget Traveler', icon: '💰' },
        { value: 'luxury', label: 'Luxury Explorer', icon: '✨' },
        { value: 'adventure', label: 'Adventure Seeker', icon: '🏔️' },
        { value: 'cultural', label: 'Cultural Enthusiast', icon: '🏛️' },
        { value: 'foodie', label: 'Food Explorer', icon: '🍽️' },
        { value: 'family', label: 'Family Traveler', icon: '👨‍👩‍👧‍👦' }
    ];

    if (!isAuthenticated) {
        return <div>Loading...</div>;
    }

    return (
        <div className="home-page">
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <div className="left-section">
                        <div className="logo-container">
                            <Link to="/">
                                <img src={GuidlyLogo} alt="Guidely" className="logo" />
                            </Link>
                        </div>
                    </div>
                    <div className="right-section">
                        <nav className="navigation">
                            <Link to="/" className="nav-link">Home</Link>
                            <Link to="/nearby" className="nav-link">Explore</Link>
                            <Link to="/profile" className="nav-link active">Profile</Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Profile Content */}
            <div style={{ marginTop: '80px', padding: '40px 20px', minHeight: '100vh', background: '#f8f9fa' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                    {/* Success Message */}
                    {saveSuccess && (
                        <div style={{
                            background: '#28a745',
                            color: 'white',
                            padding: '12px 20px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            textAlign: 'center',
                            fontWeight: '500'
                        }}>
                            ✓ Profile updated successfully!
                        </div>
                    )}

                    {/* Profile Header */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '40px',
                        marginBottom: '30px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }}>
                        {profileLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <div style={{
                                    border: '3px solid rgba(0, 0, 0, 0.1)',
                                    borderRadius: '50%',
                                    borderTop: '3px solid #D6B887',
                                    width: '40px',
                                    height: '40px',
                                    animation: 'spin 1s linear infinite',
                                    margin: '0 auto 16px'
                                }}></div>
                                <p>Loading profile...</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '30px' }}>
                                    <div style={{
                                        width: '120px',
                                        height: '120px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #D6B887 0%, #FF5722 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '48px',
                                        fontWeight: '700',
                                        border: '4px solid white',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                                    }}>
                                        {getUserInitials()}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '10px' }}>
                                            <h1 style={{ margin: 0, fontSize: '36px', fontWeight: '700', color: '#333' }}>
                                                {formData.fullName || 'Cairo Explorer'}
                                            </h1>
                                            <button
                                                onClick={() => setEditing(!editing)}
                                                disabled={profileLoading}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: editing ? '#dc3545' : '#D6B887',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: profileLoading ? 'not-allowed' : 'pointer',
                                                    fontWeight: '500',
                                                    opacity: profileLoading ? 0.6 : 1
                                                }}
                                            >
                                                {editing ? '✕ Cancel' : '✏️ Edit Profile'}
                                            </button>
                                        </div>
                                        <p style={{ color: '#666', fontSize: '18px', margin: '0 0 15px 0' }}>
                                            📧 {formData.email}
                                        </p>
                                        <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
                                            📍 {formData.location}
                                        </p>
                                    </div>
                                </div>

                                {/* Travel Stats */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '20px',
                                    marginTop: '30px'
                                }}>
                                    {statsLoading ? (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                                            <p style={{ color: '#666' }}>Loading statistics...</p>
                                        </div>
                                    ) : (
                                        [
                                            { label: 'Places Visited', value: stats.placesVisited, icon: '📍' },
                                            { label: 'Favorites', value: stats.favorites, icon: '❤️' },
                                            { label: 'Reviews Written', value: stats.reviews, icon: '⭐' },
                                            { label: 'Photos Shared', value: stats.photosShared, icon: '📸' }
                                        ].map((stat, index) => (
                                            <div key={index} style={{
                                                background: 'linear-gradient(135deg, #D6B887 0%, #FF5722 100%)',
                                                color: 'white',
                                                padding: '20px',
                                                borderRadius: '12px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
                                                <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>
                                                    {stat.value}
                                                </div>
                                                <div style={{ fontSize: '14px', opacity: 0.9 }}>{stat.label}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Profile Details */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '40px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{ marginBottom: '30px', color: '#333', fontSize: '24px' }}>
                            {editing ? 'Edit Your Travel Profile' : 'Travel Profile'}
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            {/* Left Column */}
                            <div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                        Full Name
                                    </label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                fontSize: '16px'
                                            }}
                                        />
                                    ) : (
                                        <p style={{ margin: 0, padding: '12px 0', fontSize: '16px', color: '#666' }}>
                                            {formData.fullName || 'Not provided'}
                                        </p>
                                    )}
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                        Email
                                    </label>
                                    <p style={{ margin: 0, padding: '12px 0', fontSize: '16px', color: '#666' }}>
                                        {formData.email}
                                    </p>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                        Location
                                    </label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                fontSize: '16px'
                                            }}
                                        />
                                    ) : (
                                        <p style={{ margin: 0, padding: '12px 0', fontSize: '16px', color: '#666' }}>
                                            {formData.location || 'Not provided'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Right Column */}
                            <div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                        Travel Style
                                    </label>
                                    {editing ? (
                                        <select
                                            name="travelStyle"
                                            value={formData.travelStyle}
                                            onChange={handleInputChange}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                fontSize: '16px'
                                            }}
                                        >
                                            <option value="">Select your travel style</option>
                                            {travelStyles.map(style => (
                                                <option key={style.value} value={style.value}>
                                                    {style.icon} {style.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p style={{ margin: 0, padding: '12px 0', fontSize: '16px', color: '#666' }}>
                                            {formData.travelStyle ?
                                                travelStyles.find(s => s.value === formData.travelStyle)?.label || formData.travelStyle
                                                : 'Not provided'}
                                        </p>
                                    )}
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                        Interests
                                    </label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            name="interests"
                                            value={formData.interests}
                                            onChange={handleInputChange}
                                            placeholder="e.g., History, Food, Architecture, Art"
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                fontSize: '16px'
                                            }}
                                        />
                                    ) : (
                                        <p style={{ margin: 0, padding: '12px 0', fontSize: '16px', color: '#666' }}>
                                            {formData.interests || 'Not provided'}
                                        </p>
                                    )}
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                        Bio
                                    </label>
                                    {editing ? (
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleInputChange}
                                            placeholder="Tell us about yourself and your travel experiences..."
                                            rows={4}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                fontSize: '16px',
                                                resize: 'vertical'
                                            }}
                                        />
                                    ) : (
                                        <p style={{ margin: 0, padding: '12px 0', fontSize: '16px', color: '#666', lineHeight: 1.6 }}>
                                            {formData.bio || 'No bio provided yet. Add some information about yourself!'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {editing && (
                            <div style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setEditing(false)}
                                    disabled={loading}
                                    style={{
                                        padding: '12px 24px',
                                        background: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        fontWeight: '500',
                                        opacity: loading ? 0.6 : 1
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'linear-gradient(45deg, #D6B887, #FF5722)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        fontWeight: '500',
                                        opacity: loading ? 0.6 : 1
                                    }}
                                >
                                    {loading ? 'Saving...' : '💾 Save Changes'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '30px',
                        marginTop: '30px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ marginBottom: '20px', color: '#333' }}>Quick Actions</h3>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <Link
                                to="/favorites"
                                style={{
                                    padding: '12px 20px',
                                    background: 'linear-gradient(45deg, #D6B887, #FF5722)',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                ❤️ View Favorites
                            </Link>
                            <Link
                                to="/trip-planner"
                                style={{
                                    padding: '12px 20px',
                                    background: 'linear-gradient(45deg, #D6B887, #FF5722)',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                🗺️ Plan Trip
                            </Link>
                            <Link
                                to="/settings"
                                style={{
                                    padding: '12px 20px',
                                    background: '#6c757d',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                ⚙️ Settings
                            </Link>
                            <button
                                onClick={logout}
                                style={{
                                    padding: '12px 20px',
                                    background: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                🚪 Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Profile;