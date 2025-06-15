import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';
import { logout } from '../../utils/authutils';


const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [places, setPlaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newPlace, setNewPlace] = useState({
    name: '',
    category: 'restaurants',
    priceLevel: 2,
    rating: 4.0,
    address: '',
    image: '',
    description: ''
  });

  // Tabs
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'places', label: 'Places', icon: '📍' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  // Categories with icons
  const categories = [
    { id: 'all', label: 'All Places', color: '#4A00E0' },
    { id: 'restaurants', label: 'Restaurants', color: '#FF5722', icon: '🍽️' },
    { id: 'cafes', label: 'Cafes', color: '#795548', icon: '☕' },
    { id: 'hotels', label: 'Hotels', color: '#2196F3', icon: '🏨' },
    { id: 'monuments', label: 'Monuments', color: '#607D8B', icon: '🏛️' }
  ];

  // Mock data
  const mockPlaces = [
    {
      id: 1,
      name: 'Khan El-Khalili',
      category: 'monuments',
      priceLevel: 1,
      rating: 4.7,
      visits: 1243,
      address: 'El-Gamaleya, Cairo',
      image: 'https://source.unsplash.com/300x200/?cairo,bazaar',
      status: 'active',
      featured: true,
      description: 'Historic bazaar and souq in Historic Cairo',
      dateAdded: '2023-05-15'
    },
    {
      id: 2,
      name: 'Naguib Mahfouz Cafe',
      category: 'cafes',
      priceLevel: 2,
      rating: 4.3,
      visits: 890,
      address: 'El Hussein Square, Cairo',
      image: 'https://source.unsplash.com/300x200/?cafe,cairo',
      status: 'active',
      featured: false,
      description: 'Traditional Egyptian cafe named after Nobel laureate',
      dateAdded: '2023-06-22'
    },
    {
      id: 3,
      name: 'Cairo Marriott Hotel',
      category: 'hotels',
      priceLevel: 4,
      rating: 4.5,
      visits: 1567,
      address: 'Zamalek, Cairo',
      image: 'https://source.unsplash.com/300x200/?hotel,cairo',
      status: 'active',
      featured: true,
      description: 'Luxury hotel in a 19th-century palace',
      dateAdded: '2023-04-10'
    },
    {
      id: 4,
      name: 'Koshary Abou Tarek',
      category: 'restaurants',
      priceLevel: 1,
      rating: 4.6,
      visits: 2134,
      address: 'Downtown, Cairo',
      image: 'https://source.unsplash.com/300x200/?egyptian,food',
      status: 'active',
      featured: true,
      description: 'Famous restaurant serving Egypt\'s national dish',
      dateAdded: '2023-07-05'
    },
    {
      id: 5,
      name: 'Egyptian Museum',
      category: 'monuments',
      priceLevel: 2,
      rating: 4.8,
      visits: 3250,
      address: 'Tahrir Square, Cairo',
      image: 'https://source.unsplash.com/300x200/?museum,egypt',
      status: 'active',
      featured: true,
      description: 'Museum of ancient Egyptian antiquities',
      dateAdded: '2023-03-18'
    },
    {
      id: 6,
      name: 'Sequoia',
      category: 'restaurants',
      priceLevel: 3,
      rating: 4.4,
      visits: 1523,
      address: 'Zamalek, Cairo',
      image: 'https://source.unsplash.com/300x200/?restaurant,nile',
      status: 'active',
      featured: false,
      description: 'Upscale restaurant with Nile views',
      dateAdded: '2023-08-12'
    }
  ];

  const mockUsers = [
    { id: 1, name: 'Ahmed Mohamed', email: 'ahmed@example.com', status: 'active', role: 'user', lastActive: '2023-12-20', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
    { id: 2, name: 'Sara Ali', email: 'sara@example.com', status: 'active', role: 'admin', lastActive: '2023-12-21', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
    { id: 3, name: 'Omar Hassan', email: 'omar@example.com', status: 'inactive', role: 'user', lastActive: '2023-11-30', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
    { id: 4, name: 'Nour El-Sayed', email: 'nour@example.com', status: 'active', role: 'user', lastActive: '2023-12-19', avatar: 'https://randomuser.me/api/portraits/women/4.jpg' }
  ];

  // Load mock data
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setPlaces(mockPlaces);
      setUsers(mockUsers);
      setIsLoading(false);
    }, 800);
  }, []);

  // Filter places by category
  const filteredPlaces = places.filter(place => {
    if (selectedCategory !== 'all' && place.category !== selectedCategory) {
      return false;
    }
    if (searchTerm && !place.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Handle new place form change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPlace({
      ...newPlace,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const newId = places.length > 0 ? Math.max(...places.map(place => place.id)) + 1 : 1;
    
    const placeToAdd = {
      ...newPlace,
      id: newId,
      visits: 0,
      status: 'active',
      featured: false,
      dateAdded: new Date().toISOString().slice(0, 10)
    };
    
    setPlaces([...places, placeToAdd]);
    setShowForm(false);
    setNewPlace({
      name: '',
      category: 'restaurants',
      priceLevel: 2,
      rating: 4.0,
      address: '',
      image: '',
      description: ''
    });
  };

  // Delete a place
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this place?')) {
      setPlaces(places.filter(place => place.id !== id));
    }
  };

  // Toggle featured status
  const toggleFeatured = (id) => {
    setPlaces(places.map(place => 
      place.id === id ? { ...place, featured: !place.featured } : place
    ));
  };

  // Function to get price level label
  const getPriceLevelLabel = (level) => {
    const labels = {
      0: 'Free',
      1: 'Budget',
      2: 'Moderate',
      3: 'Expensive',
      4: 'Premium'
    };
    return labels[level] || 'Unknown';
  };

  // Stats for overview
  const stats = [
    { 
      label: 'Total Places', 
      value: places.length, 
      icon: '📍', 
      color: '#4A00E0', 
      change: '+5%' 
    },
    { 
      label: 'Total Users', 
      value: users.length, 
      icon: '👥', 
      color: '#2196F3', 
      change: '+12%' 
    },
    { 
      label: 'Featured Places', 
      value: places.filter(p => p.featured).length, 
      icon: '⭐', 
      color: '#FF9800', 
      change: '+2%' 
    },
    { 
      label: 'Total Visits', 
      value: places.reduce((sum, place) => sum + place.visits, 0).toLocaleString(), 
      icon: '👁️', 
      color: '#4CAF50', 
      change: '+8%' 
    }
  ];

  // Category distribution for overview
  const categoryStats = categories.slice(1).map(category => {
    const count = places.filter(place => place.category === category.id).length;
    const percentage = places.length > 0 ? Math.round((count / places.length) * 100) : 0;
    
    return {
      ...category,
      count,
      percentage
    };
  });

  // Back button hover handlers
  const handleMouseOver = (e) => {
    e.currentTarget.classList.add('back-button-hover');
  };
  
  const handleMouseOut = (e) => {
    e.currentTarget.classList.remove('back-button-hover');
  };

  return (
    <div className="admin-dashboard">
      {/* Header with nav back button */}
      <div className="admin-header">
        <button
          className="back-button"
          onClick={() => navigate('/')}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
        >
          <span className="back-icon">←</span>
          Back to Home
        </button>
        
        <div className="admin-user-panel">
  <button className="notification-button">
    <span>🔔</span>
    <span>Notifications</span>
  </button>
  
  <div className="admin-user-info">
    <img 
      src="https://randomuser.me/api/portraits/women/2.jpg" 
      alt="Admin" 
      className="admin-avatar"
    />
    <div>
      <p className="admin-name">Sara Ali</p>
      <p className="admin-role">Admin</p>
    </div>
  </div>
  
  <button 
    className="logout-button"
    onClick={() => {
      logout();
      navigate('/admin/login');
    }}
    style={{
      marginLeft: '15px',
      padding: '8px 16px',
      backgroundColor: '#f8f0ff',
      color: '#4A00E0',
      border: '1px solid #4A00E0',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}
  >
    <span>🚪</span>
    <span>Logout</span>
  </button>
</div>
      </div>
      
      {/* Main dashboard layout */}
      <div className="admin-layout">
        {/* Sidebar navigation */}
        <aside className="admin-sidebar">
          <div className="sidebar-header">
            <div className="app-logo">C</div>
            <div>
              <h2 className="app-name">Cairo Guide</h2>
              <p className="app-description">Admin Dashboard</p>
            </div>
          </div>
          
          <nav className="sidebar-nav">
            <ul>
              {tabs.map(tab => (
                <li key={tab.id}>
                  <button
                    className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="tab-icon">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="sidebar-help">
            <h3>Need Help?</h3>
            <p>
              Contact support for assistance with dashboard functions.
            </p>
            <button className="support-button">
              Contact Support
            </button>
          </div>
        </aside>
        
        {/* Main content area */}
        <main className="admin-main">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading dashboard data...</p>
            </div>
          ) : (
            <>
              {/* Overview tab */}
              {activeTab === 'overview' && (
                <div className="overview-tab">
                  <h1 className="section-title">Dashboard Overview</h1>
                  
                  {/* Stats cards */}
                  <div className="stats-grid">
                    {stats.map((stat, index) => (
                      <div key={index} className="stat-card" style={{
                        '--stat-color': stat.color
                      }}>
                        <div className="stat-header">
                          <h3>{stat.label}</h3>
                          <span className="stat-icon" style={{ backgroundColor: `${stat.color}15` }}>
                            {stat.icon}
                          </span>
                        </div>
                        
                        <div className="stat-value">
                          <h2>{stat.value}</h2>
                          <span className={`stat-change ${stat.change.includes('+') ? 'positive' : 'negative'}`}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Category distribution and Recent activity */}
                  <div className="data-grid">
                    <div className="data-card">
                      <h3 className="card-title">
                        Place Distribution by Category
                      </h3>
                      
                      <div className="category-stats">
                        {categoryStats.map(cat => (
                          <div key={cat.id} className="category-stat">
                            <span className="category-icon" style={{ 
                              backgroundColor: `${cat.color}15`,
                              color: cat.color
                            }}>
                              {cat.icon}
                            </span>
                            
                            <div className="category-data">
                              <div className="category-info">
                                <span className="category-name">{cat.label}</span>
                                <span className="category-count">{cat.count} places</span>
                              </div>
                              <div className="category-bar">
                                <div className="category-progress" style={{ 
                                  width: `${cat.percentage}%`,
                                  backgroundColor: cat.color
                                }}></div>
                              </div>
                            </div>
                            
                            <span className="category-percentage">{cat.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Recent activity */}
                    <div className="data-card">
                      <h3 className="card-title">
                        Recent Activity
                      </h3>
                      
                      <div className="activity-feed">
                        <div className="activity-item">
                          <div className="activity-icon user-icon">👤</div>
                          <div>
                            <p className="activity-title">
                              New user registered
                            </p>
                            <p className="activity-time">
                              1 hour ago
                            </p>
                          </div>
                        </div>
                        
                        <div className="activity-item">
                          <div className="activity-icon review-icon">⭐</div>
                          <div>
                            <p className="activity-title">
                              New review for Khan El-Khalili
                            </p>
                            <p className="activity-time">
                              3 hours ago
                            </p>
                          </div>
                        </div>
                        
                        <div className="activity-item">
                          <div className="activity-icon place-icon">📍</div>
                          <div>
                            <p className="activity-title">
                              New place added: Sequoia
                            </p>
                            <p className="activity-time">
                              5 hours ago
                            </p>
                          </div>
                        </div>
                        
                        <div className="activity-item">
                          <div className="activity-icon alert-icon">🔔</div>
                          <div>
                            <p className="activity-title">
                              System alert: Database backup completed
                            </p>
                            <p className="activity-time">
                              8 hours ago
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recent places */}
                  <div className="data-card table-card">
                    <h3 className="card-title">
                      Recently Added Places
                    </h3>
                    
                    <div className="table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Place</th>
                            <th>Category</th>
                            <th>Rating</th>
                            <th>Price Level</th>
                            <th>Date Added</th>
                          </tr>
                        </thead>
                        <tbody>
                          {places.slice(0, 5).map(place => {
                            const categoryInfo = categories.find(c => c.id === place.category);
                            
                            return (
                              <tr key={place.id}>
                                <td className="place-cell">
                                  <img 
                                    src={place.image} 
                                    alt={place.name}
                                    className="place-image"
                                  />
                                  <span className="place-name">{place.name}</span>
                                </td>
                                <td>
                                  <span className="category-badge" style={{
                                    backgroundColor: categoryInfo ? `${categoryInfo.color}15` : '#f0f0f0',
                                    color: categoryInfo ? categoryInfo.color : '#666'
                                  }}>
                                    {categoryInfo && categoryInfo.icon} {categoryInfo ? categoryInfo.label : place.category}
                                  </span>
                                </td>
                                <td>
                                  <div className="rating">
                                    <span className="star-icon">⭐</span>
                                    <span>{place.rating}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className="price-badge" style={{
                                    backgroundColor: place.priceLevel > 2 ? '#f5f0ff' : '#e8f5e9',
                                    color: place.priceLevel > 2 ? '#4A00E0' : '#4CAF50'
                                  }}>
                                    {getPriceLevelLabel(place.priceLevel)}
                                  </span>
                                </td>
                                <td className="date-cell">
                                  {place.dateAdded}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Places tab */}
              {activeTab === 'places' && (
                <div className="places-tab">
                  <div className="tab-header">
                    <h1 className="section-title">Manage Places</h1>
                    
                    <button
                      className="add-button"
                      onClick={() => setShowForm(true)}
                    >
                      <span>+</span>
                      <span>Add New Place</span>
                    </button>
                  </div>
                  
                  {/* Search and filter controls */}
                  <div className="filter-controls">
                    <div className="search-container">
                      <input
                        type="text"
                        placeholder="Search places..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                      />
                      <span className="search-icon">🔍</span>
                    </div>
                    
                    <div className="category-filters">
                      {categories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`category-filter ${selectedCategory === category.id ? 'active' : ''}`}
                          style={{
                            '--category-color': category.color
                          }}
                        >
                          {category.icon && <span>{category.icon}</span>}
                          <span>{category.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Add New Place Form */}
                  {showForm && (
                    <div className="place-form-container">
                      <div className="form-header">
                        <h2>Add New Place</h2>
                        <button
                          className="close-form"
                          onClick={() => setShowForm(false)}
                        >
                          ×
                        </button>
                      </div>
                      
                      <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                          <div className="form-group">
                            <label>Place Name *</label>
                            <input
                              type="text"
                              name="name"
                              value={newPlace.name}
                              onChange={handleInputChange}
                              required
                              className="form-input"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Category *</label>
                            <select
                              name="category"
                              value={newPlace.category}
                              onChange={handleInputChange}
                              required
                              className="form-select"
                            >
                              {categories.slice(1).map(category => (
                                <option key={category.id} value={category.id}>
                                  {category.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="form-group">
                            <label>Price Level *</label>
                            <select
                              name="priceLevel"
                              value={newPlace.priceLevel}
                              onChange={handleInputChange}
                              required
                              className="form-select"
                            >
                              <option value={1}>Budget</option>
                              <option value={2}>Moderate</option>
                              <option value={3}>Expensive</option>
                              <option value={4}>Premium</option>
                            </select>
                          </div>
                          
                          <div className="form-group">
                            <label>Rating *</label>
                            <input
                              type="number"
                              name="rating"
                              value={newPlace.rating}
                              onChange={handleInputChange}
                              min="1"
                              max="5"
                              step="0.1"
                              required
                              className="form-input"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Address *</label>
                            <input
                              type="text"
                              name="address"
                              value={newPlace.address}
                              onChange={handleInputChange}
                              required
                              className="form-input"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Image URL</label>
                            <input
                              type="text"
                              name="image"
                              value={newPlace.image}
                              onChange={handleInputChange}
                              placeholder="https://example.com/image.jpg"
                              className="form-input"
                            />
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label>Description</label>
                          <textarea
                            name="description"
                            value={newPlace.description}
                            onChange={handleInputChange}
                            rows="3"
                            className="form-textarea"
                          ></textarea>
                        </div>
                        
                        <div className="form-actions">
                          <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="cancel-button"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="submit-button"
                          >
                            Add Place
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                  
                  {/* Places list */}
                  {filteredPlaces.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">🔍</span>
                      <h3>No places found</h3>
                      <p>Try adjusting your search or filter criteria</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Place</th>
                            <th>Category</th>
                            <th>Rating</th>
                            <th>Price</th>
                            <th>Visits</th>
                            <th>Status</th>
                            <th className="centered">Featured</th>
                            <th className="centered">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPlaces.map(place => {
                            const categoryInfo = categories.find(c => c.id === place.category);
                            
                            return (
                              <tr key={place.id}>
                                <td className="id-cell">{place.id}</td>
                                <td className="place-cell">
                                  <img 
                                    src={place.image} 
                                    alt={place.name}
                                    className="place-image"
                                  />
                                  <div>
                                    <div className="place-name">{place.name}</div>
                                    <div className="place-address">{place.address}</div>
                                  </div>
                                </td>
                                <td>
                                  <span className="category-badge" style={{
                                    backgroundColor: categoryInfo ? `${categoryInfo.color}15` : '#f0f0f0',
                                    color: categoryInfo ? categoryInfo.color : '#666'
                                  }}>
                                    {categoryInfo && categoryInfo.icon} {categoryInfo ? categoryInfo.label : place.category}
                                  </span>
                                </td>
                                <td>
                                  <div className="rating">
                                    <span className="star-icon">⭐</span>
                                    <span>{place.rating}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className="price-badge" style={{
                                    backgroundColor: place.priceLevel > 2 ? '#f5f0ff' : '#e8f5e9',
                                    color: place.priceLevel > 2 ? '#4A00E0' : '#4CAF50'
                                  }}>
                                    {getPriceLevelLabel(place.priceLevel)}
                                  </span>
                                </td>
                                <td>
                                  <span>{place.visits.toLocaleString()}</span>
                                </td>
                                <td>
                                  <span className={`status-badge ${place.status === 'active' ? 'active' : 'inactive'}`}>
                                    {place.status === 'active' ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="centered">
                                  <button
                                    onClick={() => toggleFeatured(place.id)}
                                    className={`featured-toggle ${place.featured ? 'active' : ''}`}
                                  >
                                    ⭐
                                  </button>
                                </td>
                                <td className="centered">
                                  <div className="action-buttons">
                                    <button className="edit-button" title="Edit">
                                      ✏️
                                    </button>
                                    <button 
                                      className="delete-button" 
                                      title="Delete"
                                      onClick={() => handleDelete(place.id)}
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {/* Users tab */}
              {activeTab === 'users' && (
                <div className="users-tab">
                  <h1 className="section-title">Manage Users</h1>
                  
                  <div className="table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>User</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Last Active</th>
                          <th className="centered">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => (
                          <tr key={user.id}>
                            <td className="id-cell">{user.id}</td>
                            <td className="user-cell">
                              <img 
                                src={user.avatar} 
                                alt={user.name}
                                className="user-avatar"
                              />
                              <div>
                                <div className="user-name">{user.name}</div>
                                <div className="user-email">{user.email}</div>
                              </div>
                            </td>
                            <td>
                              <span className={`role-badge ${user.role}`}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${user.status === 'active' ? 'active' : 'inactive'}`}>
                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                              </span>
                            </td>
                            <td className="date-cell">
                              {user.lastActive}
                            </td>
                            <td className="centered">
                              <div className="action-buttons">
                                <button className="edit-button" title="Edit">
                                  ✏️
                                </button>
                                <button className="delete-button" title="Delete">
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Settings tab */}
              {activeTab === 'settings' && (
                <div className="settings-tab">
                  <h1 className="section-title">Application Settings</h1>
                  
                  <div className="settings-grid">
                    {/* General Settings */}
                    <div className="settings-card">
                      <h2 className="settings-title">
                        General Settings
                      </h2>
                      
                      <div className="form-group">
                        <label>Application Name</label>
                        <input
                          type="text"
                          defaultValue="Cairo Guide"
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Default Currency</label>
                        <select className="form-select">
                          <option value="EGP">Egyptian Pound (EGP)</option>
                          <option value="USD">US Dollar (USD)</option>
                          <option value="EUR">Euro (EUR)</option>
                          <option value="GBP">British Pound (GBP)</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Language</label>
                        <select className="form-select">
                          <option value="en">English</option>
                          <option value="ar">Arabic</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>Distance Unit</label>
                          <select className="form-select">
                            <option value="km">Kilometers</option>
                            <option value="mi">Miles</option>
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label>Date Format</label>
                          <select className="form-select">
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          </select>
                        </div>
                      </div>
                      
                      <button className="settings-button">
                        Save General Settings
                      </button>
                    </div>
                    
                    {/* Notification Settings */}
                    <div className="settings-card">
                      <h2 className="settings-title">
                        Notification Settings
                      </h2>
                      
                      <div className="notification-settings">
                        <div className="notification-item">
                          <div>
                            <h4>Email Notifications</h4>
                            <p>Receive emails about new reviews and bookings</p>
                          </div>
                          
                          <label className="switch">
                            <input type="checkbox" defaultChecked />
                            <span className="slider"></span>
                          </label>
                        </div>
                        
                        <div className="notification-item">
                          <div>
                            <h4>Push Notifications</h4>
                            <p>Get notified in app about user activity</p>
                          </div>
                          
                          <label className="switch">
                            <input type="checkbox" defaultChecked />
                            <span className="slider"></span>
                          </label>
                        </div>
                        
                        <div className="notification-item">
                          <div>
                            <h4>Marketing Emails</h4>
                            <p>Receive promotional emails and newsletters</p>
                          </div>
                          
                          <label className="switch">
                            <input type="checkbox" />
                            <span className="slider"></span>
                          </label>
                        </div>
                      </div>
                      
                      <button className="settings-button">
                        Save Notification Settings
                      </button>
                    </div>
                    
                    {/* API Settings */}
                    <div className="settings-card">
                      <h2 className="settings-title">
                        API Integration
                      </h2>
                      
                      <div className="form-group">
                        <label>Google Maps API Key</label>
                        <div className="password-input">
                          <input
                            type="password"
                            defaultValue="AIzaSy************************"
                            className="form-input"
                          />
                          <button className="show-password">
                            Show
                          </button>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Weather API Key</label>
                        <div className="password-input">
                          <input
                            type="password"
                            defaultValue="84c9b************************"
                            className="form-input"
                          />
                          <button className="show-password">
                            Show
                          </button>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input type="checkbox" defaultChecked />
                          <span>Enable API Rate Limiting</span>
                        </label>
                      </div>
                      
                      <button className="settings-button">
                        Save API Settings
                      </button>
                    </div>
                    
                    {/* Backup Settings */}
                    <div className="settings-card">
                      <h2 className="settings-title">
                        Backup & Security
                      </h2>
                      
                      <div className="backup-status success">
                        <span>✅</span>
                        <div>
                          <p className="status-title">Latest Backup: Successful</p>
                          <p className="status-time">May 1, 2025 at 02:30 AM</p>
                        </div>
                      </div>
                      
                      <div className="backup-actions">
                        <button className="backup-button run">
                          <span>🔄</span>
                          <span>Run Backup Now</span>
                        </button>
                        
                        <button className="backup-button download">
                          <span>📥</span>
                          <span>Download Backup</span>
                        </button>
                      </div>
                      
                      <div className="form-group">
                        <h4>Backup Frequency</h4>
                        
                        <div className="button-group">
                          <button className="frequency-button active">
                            Daily
                          </button>
                          
                          <button className="frequency-button">
                            Weekly
                          </button>
                          
                          <button className="frequency-button">
                            Monthly
                          </button>
                        </div>
                      </div>
                      
                      <button className="settings-button">
                        Save Backup Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;