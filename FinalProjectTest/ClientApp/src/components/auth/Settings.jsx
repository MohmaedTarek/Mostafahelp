import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getUserPreferences, updateUserPreferences } from '../../utils/api';
import GuidlyLogo from '../pages/GuidlyLogo1.png';
import '../styles/Home.css';

const Settings = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const [settings, setSettings] = useState({
        emailNotifications: true,
        pushNotifications: false,
        locationSharing: true,
        profileVisibility: 'public',
        showEmail: false,
        showLocation: true,
        language: 'en',
        currency: 'EGP',
        distanceUnit: 'km',
        theme: 'light',
        aiRecommendations: true,
        personalizedContent: true,
        dataCollection: true,
        defaultRadius: '5',
        favoriteCategories: ['restaurants', 'monuments'],
        budgetRange: 'medium',
        travelStyle: 'cultural'
    });

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        loadUserPreferences();
    }, [isAuthenticated, navigate]);

    const loadUserPreferences = async () => {
        try {
            setInitialLoading(true);
            const response = await getUserPreferences();

            if (response.success && response.data) {
                // Parse the preferences data from backend
                const preferences = response.data;

                setSettings({
                    // Notification settings
                    emailNotifications: preferences.emailNotifications ?? true,
                    pushNotifications: preferences.pushNotifications ?? false,
                    locationSharing: preferences.locationSharing ?? true,

                    // Privacy settings
                    profileVisibility: preferences.profileVisibility || 'public',
                    showEmail: preferences.showEmail ?? false,
                    showLocation: preferences.showLocation ?? true,

                    // App preferences
                    language: preferences.language || 'en',
                    currency: preferences.currency || 'EGP',
                    distanceUnit: preferences.distanceUnit || 'km',
                    theme: preferences.theme || 'light',

                    // AI settings
                    aiRecommendations: preferences.aiRecommendations ?? true,
                    personalizedContent: preferences.personalizedContent ?? true,
                    dataCollection: preferences.dataCollection ?? true,

                    // Tourism preferences
                    defaultRadius: preferences.defaultRadius || '5',
                    favoriteCategories: preferences.favoriteCategories || ['restaurants', 'monuments'],
                    budgetRange: preferences.budgetRange || 'medium',
                    travelStyle: preferences.travelStyle || 'cultural'
                });
            }
        } catch (error) {
            console.error('Error loading user preferences:', error);
            // Keep default settings on error
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSettingChange = (category, setting, value) => {
        setSettings(prev => ({
            ...prev,
            [setting]: value
        }));
    };

    const handleArrayToggle = (setting, value) => {
        setSettings(prev => ({
            ...prev,
            [setting]: prev[setting].includes(value)
                ? prev[setting].filter(item => item !== value)
                : [...prev[setting], value]
        }));
    };

    const handleSaveSettings = async () => {
        setLoading(true);
        setSaved(false);

        try {
            const response = await updateUserPreferences(settings);

            if (response.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                alert(response.message || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                // Call delete account API endpoint here
                // For now, just logout
                await logout();
                navigate('/');
            } catch (error) {
                console.error('Error deleting account:', error);
                alert('Failed to delete account. Please try again.');
            }
        }
    };

    const categories = [
        { value: 'restaurants', label: 'Restaurants', icon: '🍽️' },
        { value: 'cafes', label: 'Cafes', icon: '☕' },
        { value: 'hotels', label: 'Hotels', icon: '🏨' },
        { value: 'monuments', label: 'Monuments', icon: '🏛️' },
        { value: 'shopping', label: 'Shopping', icon: '🛍️' },
        { value: 'nightlife', label: 'Nightlife', icon: '🌙' }
    ];

    // Style objects
    const containerStyle = {
        marginTop: '80px',
        padding: '40px 20px',
        minHeight: '100vh',
        background: '#f8f9fa'
    };

    const cardStyle = {
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
    };

    const selectStyle = {
        width: '100%',
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '16px'
    };

    const toggleStyle = (isActive) => ({
        position: 'relative',
        display: 'inline-block',
        width: '60px',
        height: '34px'
    });

    const toggleSliderStyle = (isActive) => ({
        position: 'absolute',
        cursor: 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isActive ? '#D6B887' : '#ccc',
        transition: '0.4s',
        borderRadius: '34px'
    });

    const toggleButtonStyle = (isActive) => ({
        position: 'absolute',
        content: '',
        height: '26px',
        width: '26px',
        left: isActive ? '30px' : '4px',
        bottom: '4px',
        background: 'white',
        transition: '0.4s',
        borderRadius: '50%'
    });

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
                            <Link to="/profile" className="nav-link">Profile</Link>
                            <Link to="/settings" className="nav-link active">Settings</Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Settings Content */}
            <div style={containerStyle}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>

                    {/* Success Message */}
                    {saved && (
                        <div style={{
                            background: '#28a745',
                            color: 'white',
                            padding: '12px 20px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            textAlign: 'center',
                            fontWeight: '500'
                        }}>
                            ✓ Settings saved successfully!
                        </div>
                    )}

                    {/* Page Header */}
                    <div style={{ ...cardStyle, padding: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div>
                                <h1 style={{ margin: '0 0 10px 0', fontSize: '36px', fontWeight: '700', color: '#333' }}>
                                    ⚙️ Settings
                                </h1>
                                <p style={{ margin: 0, color: '#666', fontSize: '18px' }}>
                                    Customize your Cairo exploration experience
                                </p>
                            </div>
                            {initialLoading && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: '#666'
                                }}>
                                    <div style={{
                                        border: '2px solid rgba(0, 0, 0, 0.1)',
                                        borderRadius: '50%',
                                        borderTop: '2px solid #D6B887',
                                        width: '20px',
                                        height: '20px',
                                        animation: 'spin 1s linear infinite'
                                    }}></div>
                                    Loading settings...
                                </div>
                            )}
                        </div>
                    </div>

                    {initialLoading ? (
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '60px',
                            textAlign: 'center',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{
                                border: '3px solid rgba(0, 0, 0, 0.1)',
                                borderRadius: '50%',
                                borderTop: '3px solid #D6B887',
                                width: '40px',
                                height: '40px',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 16px'
                            }}></div>
                            <p style={{ margin: 0, color: '#666' }}>Loading your settings...</p>
                        </div>
                    ) : (
                        <>
                            {/* Notification Settings */}
                            <div style={cardStyle}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#333' }}>
                                    🔔 Notifications
                                </h3>

                                <div style={{ display: 'grid', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>Email Notifications</div>
                                            <div style={{ fontSize: '14px', color: '#666' }}>Receive recommendations and updates via email</div>
                                        </div>
                                        <label style={toggleStyle(settings.emailNotifications)}>
                                            <input
                                                type="checkbox"
                                                checked={settings.emailNotifications}
                                                onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                                                style={{ opacity: 0, width: 0, height: 0 }}
                                            />
                                            <span style={toggleSliderStyle(settings.emailNotifications)}>
                                                <span style={toggleButtonStyle(settings.emailNotifications)}></span>
                                            </span>
                                        </label>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>Push Notifications</div>
                                            <div style={{ fontSize: '14px', color: '#666' }}>Get notified about nearby places and events</div>
                                        </div>
                                        <label style={toggleStyle(settings.pushNotifications)}>
                                            <input
                                                type="checkbox"
                                                checked={settings.pushNotifications}
                                                onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                                                style={{ opacity: 0, width: 0, height: 0 }}
                                            />
                                            <span style={toggleSliderStyle(settings.pushNotifications)}>
                                                <span style={toggleButtonStyle(settings.pushNotifications)}></span>
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Privacy Settings */}
                            <div style={cardStyle}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#333' }}>
                                    🔐 Privacy & Security
                                </h3>

                                <div style={{ display: 'grid', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                            Profile Visibility
                                        </label>
                                        <select
                                            value={settings.profileVisibility}
                                            onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                                            style={{
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                fontSize: '16px',
                                                width: '200px'
                                            }}
                                        >
                                            <option value="public">🌍 Public</option>
                                            <option value="friends">👥 Friends Only</option>
                                            <option value="private">🔒 Private</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>Location Sharing</div>
                                            <div style={{ fontSize: '14px', color: '#666' }}>Allow others to see your location</div>
                                        </div>
                                        <label style={toggleStyle(settings.locationSharing)}>
                                            <input
                                                type="checkbox"
                                                checked={settings.locationSharing}
                                                onChange={(e) => handleSettingChange('privacy', 'locationSharing', e.target.checked)}
                                                style={{ opacity: 0, width: 0, height: 0 }}
                                            />
                                            <span style={toggleSliderStyle(settings.locationSharing)}>
                                                <span style={toggleButtonStyle(settings.locationSharing)}></span>
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* App Preferences */}
                            <div style={cardStyle}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#333' }}>
                                    🎨 App Preferences
                                </h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                            Language
                                        </label>
                                        <select
                                            value={settings.language}
                                            onChange={(e) => handleSettingChange('app', 'language', e.target.value)}
                                            style={selectStyle}
                                        >
                                            <option value="en">🇺🇸 English</option>
                                            <option value="ar">🇪🇬 العربية</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                            Currency
                                        </label>
                                        <select
                                            value={settings.currency}
                                            onChange={(e) => handleSettingChange('app', 'currency', e.target.value)}
                                            style={selectStyle}
                                        >
                                            <option value="EGP">EGP - Egyptian Pound</option>
                                            <option value="USD">USD - US Dollar</option>
                                            <option value="EUR">EUR - Euro</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                            Distance Unit
                                        </label>
                                        <select
                                            value={settings.distanceUnit}
                                            onChange={(e) => handleSettingChange('app', 'distanceUnit', e.target.value)}
                                            style={selectStyle}
                                        >
                                            <option value="km">Kilometers</option>
                                            <option value="miles">Miles</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                            Default Search Radius
                                        </label>
                                        <select
                                            value={settings.defaultRadius}
                                            onChange={(e) => handleSettingChange('app', 'defaultRadius', e.target.value)}
                                            style={selectStyle}
                                        >
                                            <option value="1">1 km</option>
                                            <option value="5">5 km</option>
                                            <option value="10">10 km</option>
                                            <option value="25">25 km</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Tourism Preferences */}
                            <div style={cardStyle}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#333' }}>
                                    🏛️ Tourism Preferences
                                </h3>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500' }}>
                                        Favorite Categories
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                                        {categories.map(category => (
                                            <button
                                                key={category.value}
                                                onClick={() => handleArrayToggle('favoriteCategories', category.value)}
                                                style={{
                                                    padding: '12px',
                                                    border: `2px solid ${settings.favoriteCategories.includes(category.value) ? '#D6B887' : '#ddd'}`,
                                                    background: settings.favoriteCategories.includes(category.value) ? '#D6B887' : 'white',
                                                    color: settings.favoriteCategories.includes(category.value) ? 'white' : '#333',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {category.icon} {category.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                            Budget Range
                                        </label>
                                        <select
                                            value={settings.budgetRange}
                                            onChange={(e) => handleSettingChange('tourism', 'budgetRange', e.target.value)}
                                            style={selectStyle}
                                        >
                                            <option value="budget">💰 Budget (&lt; 200 EGP)</option>
                                            <option value="medium">💳 Medium (200-500 EGP)</option>
                                            <option value="luxury">✨ Luxury (&gt; 500 EGP)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                            Travel Style
                                        </label>
                                        <select
                                            value={settings.travelStyle}
                                            onChange={(e) => handleSettingChange('tourism', 'travelStyle', e.target.value)}
                                            style={selectStyle}
                                        >
                                            <option value="cultural">🏛️ Cultural Explorer</option>
                                            <option value="foodie">🍽️ Food Enthusiast</option>
                                            <option value="adventure">🏔️ Adventure Seeker</option>
                                            <option value="relaxed">😌 Relaxed Tourist</option>
                                            <option value="family">👨‍👩‍👧‍👦 Family Friendly</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* AI Assistant Settings */}
                            <div style={cardStyle}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#333' }}>
                                    🤖 AI Assistant
                                </h3>

                                <div style={{ display: 'grid', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>AI Recommendations</div>
                                            <div style={{ fontSize: '14px', color: '#666' }}>Get personalized place recommendations</div>
                                        </div>
                                        <label style={toggleStyle(settings.aiRecommendations)}>
                                            <input
                                                type="checkbox"
                                                checked={settings.aiRecommendations}
                                                onChange={(e) => handleSettingChange('ai', 'aiRecommendations', e.target.checked)}
                                                style={{ opacity: 0, width: 0, height: 0 }}
                                            />
                                            <span style={toggleSliderStyle(settings.aiRecommendations)}>
                                                <span style={toggleButtonStyle(settings.aiRecommendations)}></span>
                                            </span>
                                        </label>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>Personalized Content</div>
                                            <div style={{ fontSize: '14px', color: '#666' }}>Customize content based on your preferences</div>
                                        </div>
                                        <label style={toggleStyle(settings.personalizedContent)}>
                                            <input
                                                type="checkbox"
                                                checked={settings.personalizedContent}
                                                onChange={(e) => handleSettingChange('ai', 'personalizedContent', e.target.checked)}
                                                style={{ opacity: 0, width: 0, height: 0 }}
                                            />
                                            <span style={toggleSliderStyle(settings.personalizedContent)}>
                                                <span style={toggleButtonStyle(settings.personalizedContent)}></span>
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={loading}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'linear-gradient(45deg, #D6B887, #FF5722)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.6 : 1,
                                        fontSize: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {loading ? 'Saving...' : '💾 Save Settings'}
                                </button>

                                <button
                                    onClick={() => setShowDeleteAccount(true)}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'transparent',
                                        color: '#dc3545',
                                        border: '1px solid #dc3545',
                                        borderRadius: '8px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Delete Account
                                </button>
                            </div>

                            {/* Delete Account Modal */}
                            {showDeleteAccount && (
                                <div style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(0,0,0,0.8)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 1000,
                                    padding: '20px'
                                }}>
                                    <div style={{
                                        background: 'white',
                                        borderRadius: '16px',
                                        padding: '30px',
                                        maxWidth: '400px',
                                        width: '100%',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                                        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Delete Account</h3>
                                        <p style={{ margin: '0 0 25px 0', color: '#666', lineHeight: 1.5 }}>
                                            This will permanently delete your account and all associated data. This action cannot be undone.
                                        </p>
                                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => setShowDeleteAccount(false)}
                                                style={{
                                                    padding: '10px 20px',
                                                    background: '#6c757d',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDeleteAccount}
                                                style={{
                                                    padding: '10px 20px',
                                                    background: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Delete Account
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
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

export default Settings;