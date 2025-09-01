import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SmartNotifications from '../../components/Common/SmartNotifications';
import './driver.modern.css';

const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [driverInfo, setDriverInfo] = useState({
    name: '',
    id: '',
    license: '',
    experience: '',
    currentBus: '',
    currentRoute: ''
  });
  const [tripData, setTripData] = useState({
    currentTrip: null,
    completedTrips: 0,
    totalDistance: 0,
    todayEarnings: 0,
    rating: 0
  });
  const [systemHealth, setSystemHealth] = useState({
    gps: 'connected',
    engine: 'normal',
    fuel: 'sufficient'
  });
  const [lastUpdated, setLastUpdated] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('driverToken');
      localStorage.removeItem('driverUser');
      navigate('/login');
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const fetchDriverInfo = async () => {
    try {
      const token = localStorage.getItem('driverToken') || localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/driver/info', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Driver info received:', data);
        
        const updatedDriverInfo = {
          name: data.name || data.driverName || user?.name || 'Driver',
          id: data.id || data.driverId || 'DR001',
          license: data.license || data.licenseNumber || 'DL123456789',
          experience: data.experience || '5 years',
          currentBus: data.currentBus || data.busNumber || 'BUS-001',
          currentRoute: data.currentRoute || data.routeName || 'Route 101'
        };
        
        setDriverInfo(updatedDriverInfo);
        localStorage.setItem('driverInfo', JSON.stringify(updatedDriverInfo));
      }
    } catch (error) {
      console.error('Error fetching driver info:', error);
    }
  };

  const fetchTripData = async () => {
    try {
      const token = localStorage.getItem('driverToken') || localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/driver/trips', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Trip data received:', data);
        
        setTripData({
          currentTrip: data.currentTrip || null,
          completedTrips: data.completedTrips || 0,
          totalDistance: data.totalDistance || 0,
          todayEarnings: data.todayEarnings || 0,
          rating: data.rating || 4.5
        });
      }
    } catch (error) {
      console.error('Error fetching trip data:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await fetchDriverInfo();
      await fetchTripData();
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (error) {
      console.error('Refresh failed:', error);
      setLoading(false);
    }
  };

  const startTrip = async () => {
    try {
      const token = localStorage.getItem('driverToken') || localStorage.getItem('token');
      const response = await fetch('/api/driver/start-trip', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchTripData();
        alert('Trip started successfully!');
      }
    } catch (error) {
      console.error('Error starting trip:', error);
      alert('Failed to start trip');
    }
  };

  const endTrip = async () => {
    try {
      const token = localStorage.getItem('driverToken') || localStorage.getItem('token');
      const response = await fetch('/api/driver/end-trip', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchTripData();
        alert('Trip ended successfully!');
      }
    } catch (error) {
      console.error('Error ending trip:', error);
      alert('Failed to end trip');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!user) return;

        // Load stored driver info
        const storedDriverInfo = localStorage.getItem('driverInfo');
        if (storedDriverInfo) {
          try {
            const parsedDriverInfo = JSON.parse(storedDriverInfo);
            setDriverInfo(parsedDriverInfo);
          } catch (e) {
            console.log('Failed to parse stored driver info');
          }
        }

        await fetchDriverInfo();
        await fetchTripData();
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(async () => {
      setLastUpdated(new Date().toLocaleTimeString());
      await fetchTripData();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="driver-loading">
        <div className="loading-spinner"></div>
        <h3>Loading Driver Dashboard...</h3>
      </div>
    );
  }

  return (
    <div className="driver-dashboard">
      {/* Sidebar */}
      <div className={`driver-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>Driver Panel</h2>
          <div className="driver-info">
            <div className="driver-name">{driverInfo.name}</div>
            <div className="driver-id">ID: {driverInfo.id}</div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <ul className="nav-menu">
            <li 
              className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveSection('dashboard')}
            >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>Dashboard</span>
            </li>
            <li 
              className={`nav-item ${activeSection === 'trips' ? 'active' : ''}`}
              onClick={() => setActiveSection('trips')}
            >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>Trip Management</span>
            </li>
            <li 
              className={`nav-item ${activeSection === 'routes' ? 'active' : ''}`}
              onClick={() => setActiveSection('routes')}
            >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>Route Info</span>
            </li>
            <li 
              className={`nav-item ${activeSection === 'earnings' ? 'active' : ''}`}
              onClick={() => setActiveSection('earnings')}
            >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span>Earnings</span>
            </li>
            <li 
              className={`nav-item ${activeSection === 'maintenance' ? 'active' : ''}`}
              onClick={() => setActiveSection('maintenance')}
            >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span>Maintenance</span>
            </li>
            <li 
              className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveSection('reports')}
            >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <span>Reports</span>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {driverInfo.name?.charAt(0) || 'D'}
            </div>
            <div className="user-info">
              <div className="user-name">{driverInfo.name}</div>
              <div className="user-role">Driver</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <svg className="logout-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="search-section">
            <svg className="search-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input type="text" className="search-input" placeholder="Search routes, stops..." />
          </div>

          <div className="status-section">
            <div className="status-indicators">
              <div className="status-item">
                <div className={`status-dot ${systemHealth.gps === 'connected' ? 'green' : 'red'}`}></div>
                <span>GPS</span>
              </div>
              <div className="status-item">
                <div className={`status-dot ${systemHealth.engine === 'normal' ? 'green' : 'red'}`}></div>
                <span>Engine</span>
              </div>
              <div className="status-item">
                <div className={`status-dot ${systemHealth.fuel === 'sufficient' ? 'green' : 'red'}`}></div>
                <span>Fuel</span>
              </div>
            </div>

            <div className="user-section">
              <SmartNotifications />
              <div className="user-profile-top">
                <div className="user-avatar-top">
                  {driverInfo.name?.charAt(0) || 'D'}
                </div>
                <div className="user-info-top">
                  <div className="user-name-top">{driverInfo.name}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {activeSection === 'dashboard' && (
            <>
              {/* Dashboard Header */}
              <div className="dashboard-header">
                <div className="header-left">
                  <h1>Driver Dashboard</h1>
                  <p>Welcome back, {driverInfo.name}!</p>
                </div>
                <div className="header-actions">
                  <button className="action-btn blue" onClick={startTrip}>
                    <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Start Trip
              </button>
                  <button className="action-btn red" onClick={endTrip}>
                    <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                    End Trip
              </button>
                  <button className="action-btn green" onClick={handleRefresh}>
                    <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Refresh
              </button>
            </div>
          </div>

              {/* Welcome Section */}
              <div className="welcome-section">
                <div className="welcome-left">
                  <h2>Driver Control Center</h2>
                  <p>Current Status: {tripData.currentTrip ? 'On Trip' : 'Available'}</p>
                </div>
                <div className="welcome-right">
                  <div className="last-updated">Last updated: {lastUpdated}</div>
        </div>
          </div>

              {/* Current Trip Status */}
              {tripData.currentTrip && (
                <div className="current-trip-section">
                  <div className="section-header">
                    <div className="section-left">
                      <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <h3>Current Trip</h3>
                    </div>
                  </div>
                  <div className="trip-info">
                    <div className="trip-details">
                      <div className="trip-item">
                        <span className="label">Route:</span>
                        <span className="value">{tripData.currentTrip.route}</span>
                            </div>
                      <div className="trip-item">
                        <span className="label">Bus:</span>
                        <span className="value">{tripData.currentTrip.bus}</span>
                              </div>
                      <div className="trip-item">
                        <span className="label">Start Time:</span>
                        <span className="value">{tripData.currentTrip.startTime}</span>
                              </div>
                      <div className="trip-item">
                        <span className="label">Status:</span>
                        <span className="value status-active">Active</span>
                              </div>
                              </div>
                            </div>
                          </div>
              )}

              {/* Driver Stats */}
              <div className="stats-section">
                <div className="section-header">
                  <div className="section-left">
                    <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    <h3>Driver Statistics</h3>
                  </div>
                          </div>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-content">
                      <div className="stat-header">
                        <h3>{tripData.completedTrips}</h3>
                        <div className="stat-trend">
                          <svg className="trend-icon up" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                          </svg>
                          <span>+12%</span>
                        </div>
                      </div>
                      <p className="stat-label">Completed Trips</p>
                    </div>
                    <div className="stat-icon blue">
                      <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-content">
                      <div className="stat-header">
                        <h3>{tripData.totalDistance}km</h3>
                        <div className="stat-trend">
                          <svg className="trend-icon up" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                          </svg>
                          <span>+8%</span>
                      </div>
                      </div>
                      <p className="stat-label">Total Distance</p>
                      </div>
                    <div className="stat-icon green">
                      <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-content">
                      <div className="stat-header">
                        <h3>₹{tripData.todayEarnings}</h3>
                        <div className="stat-trend">
                          <svg className="trend-icon up" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                          </svg>
                          <span>+15%</span>
                      </div>
                      </div>
                      <p className="stat-label">Today's Earnings</p>
                      </div>
                    <div className="stat-icon yellow">
                      <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-content">
                      <div className="stat-header">
                        <h3>{tripData.rating}★</h3>
                        <div className="stat-trend">
                          <svg className="trend-icon up" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                          </svg>
                          <span>+5%</span>
                        </div>
                      </div>
                      <p className="stat-label">Rating</p>
                          </div>
                    <div className="stat-icon purple">
                      <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                    </div>
                  </div>

              {/* Vehicle Info */}
              <div className="vehicle-section">
                <div className="section-header">
                  <div className="section-left">
                    <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    <h3>Vehicle Information</h3>
                  </div>
                </div>
                <div className="vehicle-info">
                  <div className="vehicle-details">
                    <div className="vehicle-item">
                      <span className="label">Bus Number:</span>
                      <span className="value">{driverInfo.currentBus}</span>
                    </div>
                    <div className="vehicle-item">
                      <span className="label">License:</span>
                      <span className="value">{driverInfo.license}</span>
                    </div>
                    <div className="vehicle-item">
                      <span className="label">Experience:</span>
                      <span className="value">{driverInfo.experience}</span>
                    </div>
                    <div className="vehicle-item">
                      <span className="label">Current Route:</span>
                      <span className="value">{driverInfo.currentRoute}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'trips' && (
            <div className="trips-section">
              <h2>Trip Management</h2>
              <p>Trip management functionality will be implemented here.</p>
            </div>
          )}

          {activeSection === 'routes' && (
            <div className="routes-section">
              <h2>Route Information</h2>
              <p>Route information will be displayed here.</p>
            </div>
          )}

          {activeSection === 'earnings' && (
            <div className="earnings-section">
              <h2>Earnings Dashboard</h2>
              <p>Earnings and financial information will be shown here.</p>
            </div>
          )}

          {activeSection === 'maintenance' && (
            <div className="maintenance-section">
              <h2>Vehicle Maintenance</h2>
              <p>Maintenance schedules and reports will be displayed here.</p>
              </div>
            )}

          {activeSection === 'reports' && (
            <div className="reports-section">
              <h2>Driver Reports</h2>
              <p>Performance reports and analytics will be shown here.</p>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;



