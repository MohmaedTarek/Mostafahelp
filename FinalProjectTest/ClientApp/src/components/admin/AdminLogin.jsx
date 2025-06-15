import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../utils/authutils'; // Updated import path
import GuidlyLogo from '../auth/GuidlyLogo1.png'; // Adjust the path as necessary

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Reset error state
    setError('');
    
    // Simple validation that fields aren't empty
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    // Show loading state
    setLoading(true);
    
    // Use the loginAdmin function from authUtils
    const success = loginAdmin(username, password);
    
    if (success) {
      // Redirect to admin dashboard after a brief delay
      setTimeout(() => {
        navigate('/AdminDashboard');
      }, 500);
    } else {
      setError('Invalid admin credentials');
      setLoading(false);
    }
  };

  // Custom styles to match your application aesthetic
  const styles = {
    loginPage: {
      backgroundColor: '#f5f6fa',
      minHeight: '100vh',
      color: '#333',
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      backgroundColor: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      padding: '15px 40px',
      display: 'flex',
      alignItems: 'center'
    },
    logo: {
      height: '40px'
    },
    mainSection: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      flex: '1'
    },
    formContainer: {
      maxWidth: '450px',
      width: '100%',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      padding: '30px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '20px',
      color: '#4A00E0',
      textAlign: 'center'
    },
    subtitle: {
      fontSize: '16px',
      color: '#70757a',
      marginBottom: '30px',
      textAlign: 'center'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: '#333'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px',
      transition: 'border-color 0.3s',
      outline: 'none',
      backgroundColor: '#f8f9fa',
      color: '#333'
    },
    errorMessage: {
      color: '#e53935',
      marginBottom: '15px',
      textAlign: 'center',
      fontSize: '14px'
    },
    backLink: {
      color: '#1a73e8',
      textDecoration: 'none',
      display: 'inline-block',
      marginTop: '5px'
    },
    submitBtn: {
      backgroundColor: '#4A00E0',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
      width: '100%',
      fontSize: '16px',
      marginTop: '10px',
      transition: 'background-color 0.2s'
    }
  };

  return (
    <div style={styles.loginPage}>
      {/* Header */}
      <header style={styles.header}>
        <Link to="/">
          <img src={GuidlyLogo} alt="Guidely Logo" style={styles.logo} />
        </Link>
      </header>

      {/* Main Section */}
      <main style={styles.mainSection}>
        <div style={styles.formContainer}>
          <h1 style={styles.title}>Admin Login</h1>
          <p style={styles.subtitle}>Enter your admin credentials to access the dashboard</p>
          
          {error && <div style={styles.errorMessage}>{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                placeholder="Admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
            </div>
            
            <button
              type="submit"
              style={{
                ...styles.submitBtn,
                backgroundColor: loading ? '#7e57c2' : '#4A00E0',
                cursor: loading ? 'default' : 'pointer'
              }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in as Admin'}
            </button>
            
            <div style={{textAlign: 'center', marginTop: '20px'}}>
              <Link to="/" style={styles.backLink}>Back to Home</Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;