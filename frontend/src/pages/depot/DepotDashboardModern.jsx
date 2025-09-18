import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './depot.modern.css';

const DepotDashboardModern = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [depotStats, setDepotStats] = useState({
    totalBuses: 0,
    activeTrips: 0,
    todayRevenue: 0,
    totalRoutes: 0,
    todayBookings: 0,
    totalBookings: 0
  });
  const [depotInfo, setDepotInfo] = useState({
    name: 'Yatrik Depot',
    location: 'Kerala, India',
    manager: 'Depot Manager'
  });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [systemHealth, setSystemHealth] = useState({
    database: 'online',
    api: 'online',
    frontend: 'online'
  });
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for demonstration
        setDepotStats({
          totalBuses: 24,
          activeTrips: 8,
          todayRevenue: 12500,
          totalRoutes: 12,
          todayBookings: 45,
          totalBookings: 156
        });

        setSystemHealth({
          database: 'online',
          api: 'online',
          frontend: 'online'
        });

        setLastUpdated(new Date().toLocaleTimeString());
        setLoading(false);
      } catch (error) {
        console.error('Error fetching depot data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('depotToken');
      localStorage.removeItem('depotUser');
      localStorage.removeItem('depotInfo');
      navigate('/login');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="admin-dashboard">
      {loading ? (
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <h3>Loading Depot Dashboard...</h3>
        </div>
      ) : (
        <>
          {/* Top Navigation Bar */}
          <div className="top-navigation">
            <div className="nav-left">
              <div className="depot-name-card">
                <div className="depot-icon">
                  <svg className="depot-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="depot-info">
                  <div className="depot-name">{depotInfo.name}</div>
                  <div className="depot-location">{depotInfo.location}</div>
                  <div className="depot-status">
                    <div className="status-indicator active"></div>
                    <span className="status-text">Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="nav-center">
              <div className="search-section">
                <svg className="search-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search buses, trips, routes..." 
                />
              </div>
            </div>

            <div className="nav-right">
              <div className="status-indicators">
                <div className="status-item status-online">
                  <svg className="status-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Database</span>
                  <div className="status-dot dot-green"></div>
                </div>
                <div className="status-item status-online">
                  <svg className="status-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  <span>API Server</span>
                  <div className="status-dot dot-green"></div>
                </div>
                <div className="status-item status-online">
                  <svg className="status-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Frontend</span>
                  <div className="status-dot dot-green"></div>
                </div>
                <div className="status-item status-online">
                  <svg className="status-icon mobile-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <span>Mobile App</span>
                  <div className="status-dot dot-green"></div>
                </div>
              </div>

              <button 
                className="notification-btn"
                onClick={() => setShowNotificationCenter(!showNotificationCenter)}
              >
                <svg className="notification-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </button>

              <div className="user-profile-top" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                <div className="user-avatar-top">
                  {user?.name?.charAt(0)?.toUpperCase() || 'D'}
                </div>
                <div className="user-info-top">
                  <div className="user-name-top">{user?.name || 'Depot Manager'}</div>
                </div>
                <svg className="dropdown-arrow" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Side Menu */}
          <div className="side-menu">
            <div className="sidebar-header">
              <h2>Depot Panel</h2>
              <div className="depot-info">
                <div className="depot-name">{depotInfo.name}</div>
                <div className="depot-location">{depotInfo.location}</div>
                <div className="depot-manager">Manager: {depotInfo.manager}</div>
              </div>
            </div>

            <div className="sidebar-nav">
              <ul className="nav-menu">
                <li className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveSection('dashboard')}>
                  <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  <span>Dashboard</span>
                </li>
                <li className={`nav-item ${activeSection === 'fleet' ? 'active' : ''}`} onClick={() => setActiveSection('fleet')}>
                  <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <span>Fleet Management</span>
                </li>
                <li className={`nav-item ${activeSection === 'routes' ? 'active' : ''}`} onClick={() => setActiveSection('routes')}>
                  <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>Route Management</span>
                </li>
                <li className={`nav-item ${activeSection === 'trips' ? 'active' : ''}`} onClick={() => setActiveSection('trips')}>
                  <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>Trip Management</span>
                </li>
                <li className={`nav-item ${activeSection === 'bookings' ? 'active' : ''}`} onClick={() => setActiveSection('bookings')}>
                  <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span>Booking Management</span>
                </li>
                <li className={`nav-item ${activeSection === 'staff' ? 'active' : ''}`} onClick={() => setActiveSection('staff')}>
                  <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span>Staff Management</span>
                </li>
                <li className={`nav-item ${activeSection === 'scheduling' ? 'active' : ''}`} onClick={() => setActiveSection('scheduling')}>
                  <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>Bus Scheduling</span>
                </li>
                <li className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`} onClick={() => setActiveSection('reports')}>
                  <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Reports & Analytics</span>
                </li>
              </ul>
            </div>

            <div className="sidebar-footer">
              <div className="user-profile">
                <div className="user-avatar">
                  {user?.name?.charAt(0)?.toUpperCase() || 'D'}
                </div>
                <div className="user-info">
                  <div className="user-name">{user?.name || 'Depot Manager'}</div>
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
            {activeSection === 'dashboard' && (
              <div className="dashboard-content">
                {/* Dashboard Header */}
                <div className="dashboard-header">
                  <div className="header-left">
                    <h1>Yatrik Depot Dashboard</h1>
                    <p className="welcome-text">Welcome back! Here's what's happening with your depot today.</p>
                  </div>
                  <div className="quick-actions-grid">
                    <button className="quick-action blue">
                      <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                      <span className="qa-title">Add Staff</span>
                    </button>
                    <button className="quick-action green">
                      <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span className="qa-title">Schedule Trip</span>
                    </button>
                    <button className="quick-action purple">
                      <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="qa-title">View Reports</span>
                    </button>
                    <button className="quick-action orange">
                      <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="qa-title">System Status</span>
                    </button>
                  </div>
                </div>

                {/* System Health */}
                <div className="system-health">
                  <div className="section-header">
                    <div className="section-left">
                      <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <h3>System Health</h3>
                    </div>
                    <div className="section-right">
                      <button className="action-btn purple">
                        <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Test Activities
                      </button>
                      <button className="action-btn blue">
                        <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        Refresh
                      </button>
                    </div>
                  </div>
                  <div className="health-indicators">
                    <div className="health-item">
                      <div className="health-dot green"></div>
                      <span>Database</span>
                    </div>
                    <div className="health-item">
                      <div className="health-dot green"></div>
                      <span>API</span>
                    </div>
                    <div className="health-item">
                      <div className="health-dot green"></div>
                      <span>Frontend</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
                    Last updated: {lastUpdated}
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="kpi-section">
                  <div className="kpi-grid">
                    <div className="kpi-card">
                      <div className="kpi-content">
                        <div className="kpi-header">
                          <h3>{depotStats.totalBuses}</h3>
                          <div className="kpi-trend">
                            <svg className="trend-icon up" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>24 active, 0 new today</span>
                          </div>
                        </div>
                        <p className="kpi-label">Total Buses</p>
                      </div>
                      <div className="kpi-icon blue">
                        <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-content">
                        <div className="kpi-header">
                          <h3>{depotStats.activeTrips}</h3>
                          <div className="kpi-trend">
                            <svg className="trend-icon up" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>8 today, 0 completed</span>
                          </div>
                        </div>
                        <p className="kpi-label">Running Trips</p>
                      </div>
                      <div className="kpi-icon green">
                        <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-content">
                        <div className="kpi-header">
                          <h3>{formatCurrency(depotStats.todayRevenue)}</h3>
                          <div className="kpi-trend">
                            <svg className="trend-icon up" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>₹12,500 this week</span>
                          </div>
                        </div>
                        <p className="kpi-label">Today's Revenue</p>
                      </div>
                      <div className="kpi-icon yellow">
                        <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-content">
                        <div className="kpi-header">
                          <h3>{depotStats.todayBookings}</h3>
                          <div className="kpi-trend">
                            <svg className="trend-icon up" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>45 bookings today</span>
                          </div>
                        </div>
                        <p className="kpi-label">Pending Bookings</p>
                      </div>
                      <div className="kpi-icon red">
                        <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="charts-row">
                  <div className="chart-card">
                    <h4>Revenue Overview</h4>
                    <div className="chart-placeholder">
                      <div className="chart-bar" style={{ height: '80%' }}></div>
                      <div className="chart-bar" style={{ height: '60%' }}></div>
                      <div className="chart-bar" style={{ height: '90%' }}></div>
                      <div className="chart-bar" style={{ height: '70%' }}></div>
                      <div className="chart-bar" style={{ height: '85%' }}></div>
                      <div className="chart-bar" style={{ height: '95%' }}></div>
                      <div className="chart-bar" style={{ height: '75%' }}></div>
                    </div>
                    <div className="chart-info">
                      <span>Last 7 days</span>
                      <span className="trend-up">+12.5% from last week</span>
                    </div>
                  </div>

                  <div className="chart-card">
                    <h4>User Activity</h4>
                    <div className="chart-placeholder">
                      <div className="chart-bar" style={{ height: '60%' }}></div>
                      <div className="chart-bar" style={{ height: '80%' }}></div>
                      <div className="chart-bar" style={{ height: '45%' }}></div>
                      <div className="chart-bar" style={{ height: '90%' }}></div>
                      <div className="chart-bar" style={{ height: '70%' }}></div>
                      <div className="chart-bar" style={{ height: '85%' }}></div>
                      <div className="chart-bar" style={{ height: '95%' }}></div>
                    </div>
                    <div className="chart-info">
                      <span>Real-time</span>
                      <span className="trend-up">+8.2% from yesterday</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-avatar">
                    {user?.name?.charAt(0)?.toUpperCase() || 'D'}
                  </div>
                  <div className="dropdown-user-info">
                    <div className="dropdown-name">{user?.name || 'Depot Manager'}</div>
                    <div className="dropdown-role">Depot Manager</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-menu">
                  <div className="dropdown-item">
                    <svg className="dropdown-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    View Profile
                  </div>
                  <div className="dropdown-item">
                    <svg className="dropdown-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Settings
                  </div>
                  <div className="dropdown-item logout-item" onClick={handleLogout}>
                    <svg className="dropdown-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                    Logout
                  </div>
                </div>
              </div>
            )}

            {/* Notification Center */}
            {showNotificationCenter && (
              <NotificationCenter onClose={() => setShowNotificationCenter(false)} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DepotDashboardModern;
