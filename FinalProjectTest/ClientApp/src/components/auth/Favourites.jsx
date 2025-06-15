import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getFavoritesWithDetails, removeFromFavorites, markFavoriteVisited } from '../../utils/api';
import GuidlyLogo from '../pages/GuidlyLogo1.png';
import '../styles/Home.css';

const Favorites = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [actionLoading, setActionLoading] = useState({});

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        loadFavorites();
    }, [isAuthenticated, navigate]);

    const loadFavorites = async () => {
        try {
            setLoading(true);
            const response = await getFavoritesWithDetails();

            if (response.success) {
                setFavorites(response.data || []);
            } else {
                console.error('Failed to load favorites:', response.message);
                setFavorites([]);
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
            setFavorites([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFavorite = async (id) => {
        if (window.confirm('Are you sure you want to remove this from your favorites?')) {
            try {
                setActionLoading(prev => ({ ...prev, [id]: 'removing' }));

                const response = await removeFromFavorites(id);

                if (response.success) {
                    setFavorites(favorites.filter(fav => fav.id !== id));
                } else {
                    alert(response.message || 'Failed to remove favorite');
                }
            } catch (error) {
                console.error('Error removing favorite:', error);
                alert('Failed to remove favorite. Please try again.');
            } finally {
                setActionLoading(prev => ({ ...prev, [id]: null }));
            }
        }
    };

    const handleMarkVisited = async (id) => {
        const favorite = favorites.find(fav => fav.id === id);
        if (!favorite) return;

        try {
            setActionLoading(prev => ({ ...prev, [id]: 'visiting' }));

            const response = await markFavoriteVisited(id, !favorite.visited);

            if (response.success) {
                setFavorites(favorites.map(fav =>
                    fav.id === id ? { ...fav, visited: !fav.visited } : fav
                ));
            } else {
                alert(response.message || 'Failed to update visited status');
            }
        } catch (error) {
            console.error('Error updating visited status:', error);
            alert('Failed to update visited status. Please try again.');
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: null }));
        }
    };

    const handleGetDirections = (place) => {
        const searchQuery = encodeURIComponent(`${place.name} ${place.address}`);
        const mapsUrl = `https://maps.google.com/maps?q=${searchQuery}`;
        window.open(mapsUrl, '_blank');
    };

    const getFilteredFavorites = () => {
        let filtered = filter === 'all' ? favorites : favorites.filter(fav => fav.category === filter);

        // Sort
        switch (sortBy) {
            case 'recent':
                filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
                break;
            case 'rating':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            default:
                break;
        }

        return filtered;
    };

    const getCategoryIcon = (category) => {
        const icons = {
            restaurants: '🍽️',
            cafes: '☕',
            hotels: '🏨',
            monuments: '🏛️'
        };
        return icons[category] || '📍';
    };

    const getCategoryColor = (category) => {
        const colors = {
            restaurants: '#FF5722',
            cafes: '#795548',
            hotels: '#2196F3',
            monuments: '#607D8B'
        };
        return colors[category] || '#666';
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
                            <Link to="/favorites" className="nav-link active">Favorites</Link>
                            <Link to="/profile" className="nav-link">Profile</Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Favorites Content */}
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
                                    ❤️ My Favorites
                                </h1>
                                <p style={{ margin: 0, color: '#666', fontSize: '18px' }}>
                                    {loading ? 'Loading favorites...' :
                                        `${favorites.length} saved places • ${favorites.filter(f => f.visited).length} visited`
                                    }
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={loadFavorites}
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
                                <Link
                                    to="/nearby"
                                    style={{
                                        padding: '12px 24px',
                                        background: 'linear-gradient(45deg, #D6B887, #FF5722)',
                                        color: 'white',
                                        textDecoration: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    🔍 Discover More Places
                                </Link>
                            </div>
                        </div>

                        {/* Filter and Sort Controls */}
                        {!loading && favorites.length > 0 && (
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                        Filter by Category:
                                    </label>
                                    <select
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <option value="all">All Categories</option>
                                        <option value="restaurants">🍽️ Restaurants</option>
                                        <option value="cafes">☕ Cafes</option>
                                        <option value="hotels">🏨 Hotels</option>
                                        <option value="monuments">🏛️ Monuments</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                                        Sort by:
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <option value="recent">Recently Added</option>
                                        <option value="rating">Highest Rated</option>
                                        <option value="name">Name (A-Z)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Favorites Grid */}
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
                            <p style={{ margin: '0', fontWeight: '500' }}>Loading your favorites...</p>
                        </div>
                    ) : getFilteredFavorites().length === 0 ? (
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '60px',
                            textAlign: 'center',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ fontSize: '64px', marginBottom: '20px' }}>❤️</div>
                            <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '24px' }}>
                                {filter === 'all' ? 'No favorites yet!' : 'No favorites in this category'}
                            </h3>
                            <p style={{ margin: '0 0 30px 0', color: '#666', fontSize: '16px' }}>
                                Start exploring Cairo and save your favorite places
                            </p>
                            <Link
                                to="/nearby"
                                style={{
                                    padding: '12px 24px',
                                    background: 'linear-gradient(45deg, #D6B887, #FF5722)',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                🔍 Explore Places
                            </Link>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                            gap: '24px'
                        }}>
                            {getFilteredFavorites().map((place) => (
                                <div
                                    key={place.id}
                                    style={{
                                        background: 'white',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        opacity: actionLoading[place.id] ? 0.7 : 1
                                    }}
                                >
                                    {/* Image */}
                                    <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                                        <img
                                            src={place.image || `https://images.unsplash.com/photo-1575021142674-4ab6b3050c56?w=400&h=300&fit=crop`}
                                            alt={place.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                            onError={(e) => {
                                                e.target.src = `https://images.unsplash.com/photo-1575021142674-4ab6b3050c56?w=400&h=300&fit=crop`;
                                            }}
                                        />

                                        {/* Overlay */}
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3))'
                                        }}></div>

                                        {/* Category Badge */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '12px',
                                            left: '12px',
                                            background: getCategoryColor(place.category),
                                            color: 'white',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            {getCategoryIcon(place.category)}
                                            {place.category?.charAt(0).toUpperCase() + place.category?.slice(1)}
                                        </div>

                                        {/* Visited Badge */}
                                        {place.visited && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '12px',
                                                right: '12px',
                                                background: '#28a745',
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>
                                                ✓ Visited
                                            </div>
                                        )}

                                        {/* Rating */}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '12px',
                                            left: '12px',
                                            background: 'rgba(0,0,0,0.7)',
                                            color: 'white',
                                            padding: '4px 8px',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <span style={{ color: '#FFD700' }}>★</span>
                                            {place.rating?.toFixed(1) || '4.0'}
                                        </div>

                                        {/* Remove Favorite Button */}
                                        <button
                                            onClick={() => handleRemoveFavorite(place.id)}
                                            disabled={actionLoading[place.id] === 'removing'}
                                            style={{
                                                position: 'absolute',
                                                bottom: '12px',
                                                right: '12px',
                                                background: 'rgba(220, 53, 69, 0.9)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '32px',
                                                height: '32px',
                                                cursor: actionLoading[place.id] === 'removing' ? 'not-allowed' : 'pointer',
                                                fontSize: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: actionLoading[place.id] === 'removing' ? 0.6 : 1
                                            }}
                                            title="Remove from favorites"
                                        >
                                            {actionLoading[place.id] === 'removing' ? '...' : '×'}
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div style={{ padding: '20px' }}>
                                        <h3 style={{
                                            margin: '0 0 8px 0',
                                            fontSize: '20px',
                                            fontWeight: '600',
                                            color: '#333',
                                            lineHeight: '1.3'
                                        }}>
                                            {place.name}
                                        </h3>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            marginBottom: '12px',
                                            color: '#666',
                                            fontSize: '14px'
                                        }}>
                                            <span>📍</span>
                                            <span>{place.address}</span>
                                        </div>

                                        <p style={{
                                            margin: '0 0 20px 0',
                                            color: '#666',
                                            fontSize: '14px',
                                            lineHeight: '1.5'
                                        }}>
                                            {place.description || 'No description available'}
                                        </p>

                                        <div style={{
                                            display: 'flex',
                                            gap: '10px',
                                            marginBottom: '15px'
                                        }}>
                                            <button
                                                onClick={() => handleGetDirections(place)}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px',
                                                    background: 'linear-gradient(45deg, #D6B887, #FF5722)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                🧭 Directions
                                            </button>

                                            <button
                                                onClick={() => handleMarkVisited(place.id)}
                                                disabled={actionLoading[place.id] === 'visiting'}
                                                style={{
                                                    padding: '10px 15px',
                                                    background: place.visited ? '#28a745' : '#6c757d',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    cursor: actionLoading[place.id] === 'visiting' ? 'not-allowed' : 'pointer',
                                                    opacity: actionLoading[place.id] === 'visiting' ? 0.6 : 1
                                                }}
                                                title={place.visited ? "Mark as not visited" : "Mark as visited"}
                                            >
                                                {actionLoading[place.id] === 'visiting' ? '...' : (place.visited ? '✓' : '○')}
                                            </button>
                                        </div>

                                        <div style={{
                                            fontSize: '12px',
                                            color: '#999',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span>
                                                Added {place.dateAdded ? new Date(place.dateAdded).toLocaleDateString() : 'Recently'}
                                            </span>
                                        </div>
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

export default Favorites;