import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getUserTrips, createTrip, updateTrip, deleteTrip } from '../../utils/api';
import GuidlyLogo from '../pages/GuidlyLogo1.png';
import '../styles/Home.css';

const TripPlanner = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [trips, setTrips] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [newTrip, setNewTrip] = useState({
        name: '',
        startDate: '',
        endDate: '',
        budget: '',
        travelers: 1,
        interests: [],
        description: ''
    });

    const interestOptions = [
        { value: "history", label: "History", icon: "🏛️" },
        { value: "culture", label: "Culture", icon: "🎭" },
        { value: "food", label: "Food", icon: "🍽️" },
        { value: "shopping", label: "Shopping", icon: "🛍️" },
        { value: "modern", label: "Modern", icon: "🏙️" },
        { value: "nature", label: "Nature", icon: "🌳" },
        { value: "nightlife", label: "Nightlife", icon: "🌙" },
        { value: "art", label: "Art", icon: "🎨" }
    ];

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        loadTrips();
    }, [isAuthenticated, navigate]);

    const loadTrips = async () => {
        try {
            setLoading(true);
            const response = await getUserTrips();

            if (response.success) {
                setTrips(response.data || []);
            } else {
                console.error('Failed to load trips:', response.message);
                setTrips([]);
            }
        } catch (error) {
            console.error('Error loading trips:', error);
            setTrips([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTrip(prev => ({
            ...prev,
            [name]: name === 'travelers' ? parseInt(value) : value
        }));
    };

    const handleInterestToggle = (interest) => {
        setNewTrip(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const handleCreateTrip = async () => {
        if (!newTrip.name || !newTrip.startDate || !newTrip.endDate) {
            alert('Please fill in required fields (Name, Start Date, End Date)');
            return;
        }

        if (new Date(newTrip.startDate) >= new Date(newTrip.endDate)) {
            alert('End date must be after start date');
            return;
        }

        try {
            setActionLoading(prev => ({ ...prev, create: true }));

            const tripData = {
                ...newTrip,
                budget: newTrip.budget ? parseFloat(newTrip.budget) : null,
                travelers: parseInt(newTrip.travelers),
                interests: newTrip.interests.join(','), // Convert array to string for backend
                status: 'planning'
            };

            const response = await createTrip(tripData);

            if (response.success) {
                await loadTrips(); // Reload trips to get the new one with ID
                setShowCreateForm(false);
                resetForm();
                alert('Trip created successfully!');
            } else {
                alert(response.message || 'Failed to create trip');
            }
        } catch (error) {
            console.error('Error creating trip:', error);
            alert('Failed to create trip. Please try again.');
        } finally {
            setActionLoading(prev => ({ ...prev, create: false }));
        }
    };

    const handleDeleteTrip = async (tripId) => {
        if (window.confirm('Are you sure you want to delete this trip?')) {
            try {
                setActionLoading(prev => ({ ...prev, [tripId]: 'deleting' }));

                const response = await deleteTrip(tripId);

                if (response.success) {
                    setTrips(trips.filter(trip => trip.id !== tripId));
                } else {
                    alert(response.message || 'Failed to delete trip');
                }
            } catch (error) {
                console.error('Error deleting trip:', error);
                alert('Failed to delete trip. Please try again.');
            } finally {
                setActionLoading(prev => ({ ...prev, [tripId]: null }));
            }
        }
    };

    const handleUpdateTripStatus = async (tripId, newStatus) => {
        try {
            setActionLoading(prev => ({ ...prev, [tripId]: 'updating' }));

            const trip = trips.find(t => t.id === tripId);
            const response = await updateTrip(tripId, { ...trip, status: newStatus });

            if (response.success) {
                setTrips(trips.map(t => t.id === tripId ? { ...t, status: newStatus } : t));
            } else {
                alert(response.message || 'Failed to update trip');
            }
        } catch (error) {
            console.error('Error updating trip:', error);
            alert('Failed to update trip. Please try again.');
        } finally {
            setActionLoading(prev => ({ ...prev, [tripId]: null }));
        }
    };

    const resetForm = () => {
        setNewTrip({
            name: '',
            startDate: '',
            endDate: '',
            budget: '',
            travelers: 1,
            interests: [],
            description: ''
        });
    };

    const getTripDuration = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const getStatusColor = (status) => {
        const colors = {
            planning: '#FFC107',
            upcoming: '#28A745',
            active: '#007BFF',
            completed: '#6C757D'
        };
        return colors[status] || '#6C757D';
    };

    const getStatusLabel = (status) => {
        const labels = {
            planning: '📝 Planning',
            upcoming: '📅 Upcoming',
            active: '✈️ Active',
            completed: '✅ Completed'
        };
        return labels[status] || status;
    };

    const getStatusOptions = (currentStatus) => {
        const allStatuses = ['planning', 'upcoming', 'active', 'completed'];
        return allStatuses.filter(status => status !== currentStatus);
    };

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
                            <Link to="/trip-planner" className="nav-link active">Trip Planner</Link>
                            <Link to="/profile" className="nav-link">Profile</Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Trip Planner Content */}
            <div style={{ marginTop: '80px', padding: '40px 20px', minHeight: '100vh', background: '#f8f9fa' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {/* Page Header */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '40px',
                        marginBottom: '30px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div>
                                <h1 style={{ margin: '0 0 10px 0', fontSize: '36px', fontWeight: '700', color: '#333' }}>
                                    🗺️ Trip Planner
                                </h1>
                                <p style={{ margin: 0, color: '#666', fontSize: '18px' }}>
                                    Plan your perfect Cairo adventure with AI assistance
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={loadTrips}
                                    disabled={loading}
                                    style={{
                                        padding: '10px 16px',
                                        background: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '500',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.6 : 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    🔄 Refresh
                                </button>
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'linear-gradient(45deg, #D6B887, #FF5722)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '16px'
                                    }}
                                >
                                    ✚ Create New Trip
                                </button>
                            </div>
                        </div>

                        {/* Trip Stats */}
                        {!loading && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '20px',
                                marginTop: '30px'
                            }}>
                                {[
                                    { label: 'Total Trips', value: trips.length, icon: '🗺️' },
                                    { label: 'Planning', value: trips.filter(t => t.status === 'planning').length, icon: '📝' },
                                    { label: 'Upcoming', value: trips.filter(t => t.status === 'upcoming').length, icon: '📅' },
                                    { label: 'Completed', value: trips.filter(t => t.status === 'completed').length, icon: '✅' }
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
                                }
                            </div>
                        )}
                    </div>

                    {/* Create Trip Form Modal */}
                    {showCreateForm && (
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
                                padding: '40px',
                                maxWidth: '600px',
                                width: '100%',
                                maxHeight: '90vh',
                                overflowY: 'auto'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#333' }}>
                                        Create New Trip
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowCreateForm(false);
                                            resetForm();
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            fontSize: '24px',
                                            cursor: 'pointer',
                                            color: '#666'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                            Trip Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={newTrip.name}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Weekend in Islamic Cairo"
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                fontSize: '16px'
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                                Start Date *
                                            </label>
                                            <input
                                                type="date"
                                                name="startDate"
                                                value={newTrip.startDate}
                                                onChange={handleInputChange}
                                                min={new Date().toISOString().split('T')[0]}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '8px',
                                                    fontSize: '16px'
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                                End Date *
                                            </label>
                                            <input
                                                type="date"
                                                name="endDate"
                                                value={newTrip.endDate}
                                                onChange={handleInputChange}
                                                min={newTrip.startDate || new Date().toISOString().split('T')[0]}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '8px',
                                                    fontSize: '16px'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                                Budget (EGP)
                                            </label>
                                            <input
                                                type="number"
                                                name="budget"
                                                value={newTrip.budget}
                                                onChange={handleInputChange}
                                                placeholder="1000"
                                                min="0"
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '8px',
                                                    fontSize: '16px'
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                                Travelers
                                            </label>
                                            <select
                                                name="travelers"
                                                value={newTrip.travelers}
                                                onChange={handleInputChange}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '8px',
                                                    fontSize: '16px'
                                                }}
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                                    <option key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#333' }}>
                                            Interests
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                                            {interestOptions.map(interest => (
                                                <button
                                                    key={interest.value}
                                                    type="button"
                                                    onClick={() => handleInterestToggle(interest.value)}
                                                    style={{
                                                        padding: '10px 12px',
                                                        border: `2px solid ${newTrip.interests.includes(interest.value) ? '#D6B887' : '#ddd'}`,
                                                        background: newTrip.interests.includes(interest.value) ? '#D6B887' : 'white',
                                                        color: newTrip.interests.includes(interest.value) ? 'white' : '#333',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: '500',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    {interest.icon} {interest.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={newTrip.description}
                                            onChange={handleInputChange}
                                            placeholder="Describe your trip plans..."
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
                                    </div>

                                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                        <button
                                            onClick={() => {
                                                setShowCreateForm(false);
                                                resetForm();
                                            }}
                                            disabled={actionLoading.create}
                                            style={{
                                                padding: '12px 24px',
                                                background: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: actionLoading.create ? 'not-allowed' : 'pointer',
                                                fontWeight: '500',
                                                opacity: actionLoading.create ? 0.6 : 1
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCreateTrip}
                                            disabled={actionLoading.create}
                                            style={{
                                                padding: '12px 24px',
                                                background: 'linear-gradient(45deg, #D6B887, #FF5722)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: actionLoading.create ? 'not-allowed' : 'pointer',
                                                fontWeight: '500',
                                                opacity: actionLoading.create ? 0.6 : 1
                                            }}
                                        >
                                            {actionLoading.create ? 'Creating...' : '✚ Create Trip'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Trips List */}
                    {loading ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '60px 20px',
                            color: '#666'
                        }}>
                            <div style={{
                                border: '3px solid rgba(0, 0, 0, 0.1)',
                                borderRadius: '50%',
                                borderTop: '3px solid #D6B887',
                                width: '40px',
                                height: '40px',
                                animation: 'spin 1s linear infinite',
                                marginBottom: '16px'
                            }}></div>
                            <p style={{ margin: '0', fontWeight: '500' }}>Loading your trips...</p>
                        </div>
                    ) : trips.length === 0 ? (
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '60px',
                            textAlign: 'center',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🗺️</div>
                            <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '24px' }}>
                                No trips planned yet!
                            </h3>
                            <p style={{ margin: '0 0 30px 0', color: '#666', fontSize: '16px' }}>
                                Start planning your Cairo adventure with our AI-powered trip planner
                            </p>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                style={{
                                    padding: '12px 24px',
                                    background: 'linear-gradient(45deg, #D6B887, #FF5722)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                ✚ Create Your First Trip
                            </button>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                            gap: '24px'
                        }}>
                            {trips.map((trip) => (
                                <div
                                    key={trip.id}
                                    style={{
                                        background: 'white',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        opacity: actionLoading[trip.id] ? 0.7 : 1
                                    }}
                                >
                                    {/* Trip Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#333' }}>
                                                {trip.name}
                                            </h3>
                                            <div style={{
                                                background: getStatusColor(trip.status),
                                                color: 'white',
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                display: 'inline-block'
                                            }}>
                                                {getStatusLabel(trip.status)}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDeleteTrip(trip.id)}
                                            disabled={actionLoading[trip.id] === 'deleting'}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid #dc3545',
                                                color: '#dc3545',
                                                borderRadius: '6px',
                                                padding: '6px 12px',
                                                fontSize: '12px',
                                                cursor: actionLoading[trip.id] === 'deleting' ? 'not-allowed' : 'pointer',
                                                opacity: actionLoading[trip.id] === 'deleting' ? 0.6 : 1
                                            }}
                                        >
                                            {actionLoading[trip.id] === 'deleting' ? 'Deleting...' : '🗑️ Delete'}
                                        </button>
                                    </div>

                                    {/* Trip Details */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#666' }}>
                                            <span>📅</span>
                                            <span>{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</span>
                                            <span style={{ color: '#D6B887', fontWeight: '600' }}>
                                                ({getTripDuration(trip.startDate, trip.endDate)} days)
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#666' }}>
                                            <span>👥</span>
                                            <span>{trip.travelers} {trip.travelers === 1 ? 'traveler' : 'travelers'}</span>
                                        </div>

                                        {trip.budget && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#666' }}>
                                                <span>💰</span>
                                                <span>{trip.budget} EGP budget</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Interests */}
                                    {trip.interests && (
                                        <div style={{ marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {(typeof trip.interests === 'string' ? trip.interests.split(',') : trip.interests).map(interest => {
                                                    const interestObj = interestOptions.find(i => i.value === interest.trim());
                                                    return (
                                                        <span
                                                            key={interest}
                                                            style={{
                                                                background: '#f8f9fa',
                                                                color: '#666',
                                                                padding: '4px 8px',
                                                                borderRadius: '12px',
                                                                fontSize: '12px',
                                                                fontWeight: '500'
                                                            }}
                                                        >
                                                            {interestObj?.icon} {interestObj?.label || interest}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Description */}
                                    {trip.description && (
                                        <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
                                            {trip.description}
                                        </p>
                                    )}

                                    {/* Status Update Actions */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                                            Update Status:
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {getStatusOptions(trip.status).map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleUpdateTripStatus(trip.id, status)}
                                                    disabled={actionLoading[trip.id] === 'updating'}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: getStatusColor(status),
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        fontWeight: '500',
                                                        cursor: actionLoading[trip.id] === 'updating' ? 'not-allowed' : 'pointer',
                                                        opacity: actionLoading[trip.id] === 'updating' ? 0.6 : 1
                                                    }}
                                                >
                                                    {getStatusLabel(status)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Created Date */}
                                    <div style={{
                                        paddingTop: '16px',
                                        borderTop: '1px solid #f0f0f0',
                                        fontSize: '12px',
                                        color: '#999'
                                    }}>
                                        Created {trip.createdAt ? new Date(trip.createdAt).toLocaleDateString() : 'Recently'}
                                    </div>
                                </div>
                            ))}
                        </div>
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

export default TripPlanner;