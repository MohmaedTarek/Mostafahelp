import React, { useState, useEffect } from 'react';
import { useRecommendations } from '../../utils/useRecommendations';

const RecommendationForm = ({ onRecommendationsReceived }) => {
    const [formData, setFormData] = useState({
        userLatitude: '',
        userLongitude: '',
        topN: 10,
        keyword: '',
        category: '',
        placeName: '',
        minRating: 0
    });
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState('');

    const { getSmartRecommendations, loading, error } = useRecommendations();

    useEffect(() => {
        // Get user's current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ latitude, longitude });
                    setFormData(prev => ({
                        ...prev,
                        userLatitude: latitude,
                        userLongitude: longitude
                    }));
                    setLocationError('');
                },
                (error) => {
                    console.error('Error getting location:', error);
                    setLocationError('Unable to get your location. Using default Cairo location.');
                    // Use default Cairo coordinates
                    setFormData(prev => ({
                        ...prev,
                        userLatitude: 30.0444,
                        userLongitude: 31.2357
                    }));
                }
            );
        } else {
            setLocationError('Geolocation not supported. Using default Cairo location.');
            setFormData(prev => ({
                ...prev,
                userLatitude: 30.0444,
                userLongitude: 31.2357
            }));
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Ensure we have coordinates
        if (!formData.userLatitude || !formData.userLongitude) {
            alert('Please allow location access or wait for location to be detected.');
            return;
        }

        const result = await getSmartRecommendations(formData);
        onRecommendationsReceived(result);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="recommendation-form-container" style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            marginBottom: '20px',
            border: '1px solid #eee'
        }}>
            <h3 style={{
                margin: '0 0 20px 0',
                color: '#333',
                fontSize: '20px',
                fontWeight: '600',
                textAlign: 'center'
            }}>
                Smart Recommendation Search
            </h3>

            <form onSubmit={handleSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                {/* Search Keyword */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>
                        Search Keyword:
                    </label>
                    <input
                        type="text"
                        value={formData.keyword}
                        onChange={(e) => handleInputChange('keyword', e.target.value)}
                        placeholder="e.g., restaurant, mosque, hotel, museum..."
                        style={{
                            padding: '12px',
                            border: '2px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            transition: 'border-color 0.3s ease',
                            outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4A00E0'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                </div>

                {/* Category - Using same categories as your Home component */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>
                        Category:
                    </label>
                    <select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        style={{
                            padding: '12px',
                            border: '2px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            transition: 'border-color 0.3s ease',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4A00E0'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    >
                        <option value="">All Categories</option>
                        <option value="Restaurant">Restaurants</option>
                        <option value="Hotel">Hotels</option>
                        <option value="Mosque">Mosques</option>
                        <option value="Museum">Museums</option>
                        <option value="Cafe">Cafes</option>
                        <option value="Market">Markets</option>
                        <option value="Church">Churches</option>
                        <option value="Historical">Historical Sites</option>
                        <option value="Palace">Palaces</option>
                        <option value="Fortress">Fortresses</option>
                    </select>
                </div>

                {/* Place Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>
                        Specific Place Name:
                    </label>
                    <input
                        type="text"
                        value={formData.placeName}
                        onChange={(e) => handleInputChange('placeName', e.target.value)}
                        placeholder="Search by specific place name..."
                        style={{
                            padding: '12px',
                            border: '2px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            transition: 'border-color 0.3s ease',
                            outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4A00E0'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                </div>

                {/* Minimum Rating */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>
                        Minimum Rating: {formData.minRating}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.1"
                            value={formData.minRating}
                            onChange={(e) => handleInputChange('minRating', parseFloat(e.target.value))}
                            style={{
                                flex: 1,
                                height: '6px',
                                borderRadius: '3px',
                                background: `linear-gradient(to right, #4A00E0 0%, #4A00E0 ${(formData.minRating / 5) * 100}%, #e0e0e0 ${(formData.minRating / 5) * 100}%, #e0e0e0 100%)`,
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        />
                        <span style={{
                            background: '#4A00E0',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            minWidth: '35px',
                            textAlign: 'center'
                        }}>
                            {formData.minRating}
                        </span>
                    </div>
                </div>

                {/* Number of Results */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>
                        Number of Results:
                    </label>
                    <select
                        value={formData.topN}
                        onChange={(e) => handleInputChange('topN', parseInt(e.target.value))}
                        style={{
                            padding: '12px',
                            border: '2px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            transition: 'border-color 0.3s ease',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4A00E0'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    >
                        <option value={5}>5 Results</option>
                        <option value={10}>10 Results</option>
                        <option value={15}>15 Results</option>
                        <option value={20}>20 Results</option>
                    </select>
                </div>

                {/* Location Status */}
                {userLocation ? (
                    <div style={{
                        background: '#e8f5e8',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#2d5a2d',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>✓</span>
                        <span>Using your current location for personalized recommendations</span>
                    </div>
                ) : locationError ? (
                    <div style={{
                        background: '#fff3cd',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#856404',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>⚠</span>
                        <span>{locationError}</span>
                    </div>
                ) : (
                    <div style={{
                        background: '#e3f2fd',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1565c0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>📍</span>
                        <span>Detecting your location...</span>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || (!formData.userLatitude && !formData.userLongitude)}
                    style={{
                        padding: '15px',
                        background: loading ? '#6c757d' : 'linear-gradient(135deg, #4A00E0 0%, #8E2DE2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        opacity: loading ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (!loading) {
                            e.target.style.background = 'linear-gradient(135deg, #3d00b8 0%, #7a25d1 100%)';
                            e.target.style.transform = 'translateY(-2px)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!loading) {
                            e.target.style.background = 'linear-gradient(135deg, #4A00E0 0%, #8E2DE2 100%)';
                            e.target.style.transform = 'translateY(0)';
                        }
                    }}
                >
                    {loading ? 'Getting Recommendations...' : 'Get Smart Recommendations'}
                </button>

                {/* Error Message */}
                {error && (
                    <div style={{
                        color: '#dc3545',
                        background: '#f8d7da',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #f5c6cb',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}
            </form>
        </div>
    );
};

export default RecommendationForm;