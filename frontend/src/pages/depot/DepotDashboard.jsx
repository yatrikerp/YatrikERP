import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// Notifications removed per request
import NotificationCenter from '../../components/Common/NotificationCenter';
import BusScheduling from '../../components/Common/BusScheduling';
import BookingSystem from '../../components/Common/BookingSystem';
import BookingManagement from '../../components/Common/BookingManagement';
import FleetManagement from './components/FleetManagement';
import RouteNetwork from './components/RouteNetwork';
import TripManagement from './components/TripManagement';
import StaffManagement from './components/StaffManagement';
import './depot.modern.css';

const DepotDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [depotStats, setDepotStats] = useState({
    totalBuses: 0,
    activeTrips: 0,
    todayRevenue: 0,
    totalRoutes: 0
  });
  const [depotInfo, setDepotInfo] = useState({
    name: '',
    location: '',
    manager: ''
  });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [recentTrips, setRecentTrips] = useState([]);
  const [liveTrackingData, setLiveTrackingData] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    database: 'unknown',
    api: 'unknown',
    frontend: 'unknown'
  });
  const [lastUpdated, setLastUpdated] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/depot/trips') || path.includes('/depot/trip-management')) {
      setActiveSection('trips');
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
    await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear storage manually and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('depotToken');
      localStorage.removeItem('depotUser');
      localStorage.removeItem('depotInfo');
      navigate('/login');
    }
  };

  const handleProfileView = () => {
    setShowProfileDropdown(false);
    // TODO: Navigate to profile view or show profile modal
    console.log('View Profile clicked');
  };

  const handleChangeDepotName = () => {
    setShowProfileDropdown(false);
    const newName = prompt('Enter new depot name:', depotInfo.name);
    if (newName && newName.trim() !== '') {
      // Update depot name
      const updatedDepotInfo = { ...depotInfo, name: newName.trim() };
      setDepotInfo(updatedDepotInfo);
      localStorage.setItem('depotInfo', JSON.stringify(updatedDepotInfo));
      
      // Notify admin about the change
      console.log('Depot name changed to:', newName);
      // TODO: Send notification to admin
    }
  };

  const handleChangePassword = () => {
    setShowProfileDropdown(false);
    // TODO: Show change password modal
    console.log('Change Password clicked');
  };

  const handleDepotSettings = () => {
    setShowProfileDropdown(false);
    // TODO: Navigate to depot settings
    console.log('Depot Settings clicked');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const fetchDepotInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem('depotToken') || localStorage.getItem('token');
      if (!token) return;

      // Try to fetch depot info from a dedicated endpoint
      const depotResponse = await fetch('/api/depot/info', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (depotResponse.ok) {
        const depotData = await depotResponse.json();
        console.log('Depot info received:', depotData);
        
        const updatedDepotInfo = {
          name: depotData.name || depotData.depotName || 'Yatrik Depot',
          location: depotData.location || depotData.address || 'Kerala, India',
          manager: depotData.manager || depotData.managerName || user?.name || 'Depot Manager'
        };
        
        setDepotInfo(updatedDepotInfo);
        localStorage.setItem('depotInfo', JSON.stringify(updatedDepotInfo));
      }
    } catch (error) {
      console.error('Error fetching depot info:', error);
    }
  }, [user]);

  const fetchData = useCallback(async () => {
      try {
        setLoading(true);
        if (!user) return;

      // First, try to get depot information from localStorage
      const storedDepotInfo = localStorage.getItem('depotInfo');
      if (storedDepotInfo) {
        try {
          const parsedDepotInfo = JSON.parse(storedDepotInfo);
          setDepotInfo(parsedDepotInfo);
        } catch (e) {
          console.log('Failed to parse stored depot info');
        }
      }

      // Fetch dashboard data
      const depotToken = localStorage.getItem('depotToken');
      const token = localStorage.getItem('token');
      const authToken = depotToken || token;
      
      console.log('DepotDashboard - Authentication check:', {
        depotToken: !!depotToken,
        token: !!token,
        authToken: !!authToken,
        user: user,
        userRole: user?.role
      });
      
      if (!authToken) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }

        const response = await fetch('/api/depot/dashboard', {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
        });

        console.log('DepotDashboard - API Response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Dashboard data received:', data);
        
        // Update depot stats with proper fallbacks
        setDepotStats(prev => ({
          ...prev,
          totalBuses: data.data?.stats?.totalBuses || 0,
          activeBuses: data.data?.stats?.activeBuses || 0,
          totalRoutes: data.data?.stats?.totalRoutes || 0,
          activeRoutes: data.data?.stats?.activeRoutes || 0,
          totalDrivers: data.data?.stats?.totalDrivers || 0,
          activeDrivers: data.data?.stats?.activeDrivers || 0,
          todayRevenue: data.data?.stats?.todayRevenue || 0
        }));

        // Update recent trips with proper fallbacks
        setRecentTrips(data.data?.recentTrips || []);

        // Update live tracking data with proper fallbacks
        setLiveTrackingData(data.data?.liveTracking || []);
          
        // Update depot info with better fallbacks
        const depotData = data.data?.depot || {};
        const updatedDepotInfo = {
          name: depotData.name || 'Yatrik Depot',
          location: depotData.location || 'Kerala, India',
          manager: depotData.manager || user?.name || 'Depot Manager'
        };
        
        setDepotInfo(updatedDepotInfo);
        
        // Store depot info in localStorage for persistence
        localStorage.setItem('depotInfo', JSON.stringify(updatedDepotInfo));
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch dashboard data:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        // Set default depot info if API fails
        const defaultDepotInfo = {
          name: 'Yatrik Depot',
          location: 'Kerala, India',
          manager: user?.name || 'Depot Manager'
        };
        setDepotInfo(defaultDepotInfo);
        localStorage.setItem('depotInfo', JSON.stringify(defaultDepotInfo));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default depot info on error
      const defaultDepotInfo = {
        name: 'Yatrik Depot',
        location: 'Kerala, India',
        manager: user?.name || 'Depot Manager'
      };
      setDepotInfo(defaultDepotInfo);
      localStorage.setItem('depotInfo', JSON.stringify(defaultDepotInfo));
      setLoading(false);
    }
  }, [user]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await fetchData();
      await fetchDepotInfo();
      setLastUpdated(new Date().toLocaleTimeString());
        setLoading(false);
      } catch (error) {
      console.error('Refresh failed:', error);
        setLoading(false);
      }
  };

  const handleBookingComplete = (bookingData) => {
    console.log('Booking completed:', bookingData);
    // You can add additional logic here like showing a success message
    // or refreshing the booking management section
  };

  const createSampleBookings = async () => {
    try {
      const token = localStorage.getItem('depotToken') || localStorage.getItem('token');
      const response = await fetch('/api/booking/create-sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ depotId: user?.depotId })
      });

      const result = await response.json();
      if (result.success) {
        alert(`Sample bookings created successfully! Created ${result.data.count} bookings.`);
        // Refresh the page to show the new bookings
        window.location.reload();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error creating sample bookings:', error);
      alert('Error creating sample bookings. Please try again.');
    }
  };

  useEffect(() => {

    fetchData();
    fetchDepotInfo(); // Fetch depot info separately

    const interval = setInterval(async () => {
      setLastUpdated(new Date().toLocaleTimeString());

      try {
        const healthResponse = await fetch('/api/health');
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          setSystemHealth({
            database: healthData.database || 'unknown',
            api: healthData.api || 'unknown',
            frontend: healthData.frontend || 'unknown'
          });
        }
      } catch (error) {
        setSystemHealth({ database: 'disconnected', api: 'error', frontend: 'unknown' });
      }

      if (user) {
        try {
          const token = localStorage.getItem('depotToken') || localStorage.getItem('token');
          const trackingResponse = await fetch('/api/depot/dashboard', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (trackingResponse.ok) {
            const trackingData = await trackingResponse.json();
            setLiveTrackingData(trackingData.data?.liveTracking || []);
            setDepotStats(prev => ({
              ...prev,
              ...(trackingData.data?.stats || {}),
              todayRevenue: trackingData.data?.stats?.todayRevenue || prev.todayRevenue || 0
            }));
            
            // Update depot info if available
            if (trackingData.data?.depot) {
              const depotData = trackingData.data.depot;
              const updatedDepotInfo = {
                name: depotData.name || depotInfo.name,
                location: depotData.location || depotInfo.location,
                manager: depotData.manager || depotInfo.manager
              };
              setDepotInfo(updatedDepotInfo);
              localStorage.setItem('depotInfo', JSON.stringify(updatedDepotInfo));
            }
          }
        } catch (error) {
          console.log('Tracking refresh failed:', error);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchData, fetchDepotInfo]);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <h3>Loading Depot Dashboard...</h3>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Dark Sidebar */}
      <div className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>Depot Panel</h2>
          <div className="depot-info">
            <div className="depot-name">{depotInfo.name || 'Yatrik Depot'}</div>
            <div className="depot-location">📍 {depotInfo.location || 'Kerala, India'}</div>
            <div className="depot-manager">👤 {depotInfo.manager || user?.name || 'Depot Manager'}</div>
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
              className={`nav-item ${activeSection === 'buses' ? 'active' : ''}`}
                  onClick={() => setActiveSection('buses')}
                >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
              <span>Fleet Management</span>
                </li>
            
                <li 
              className={`nav-item ${activeSection === 'routes' ? 'active' : ''}`}
                  onClick={() => setActiveSection('routes')}
                >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
              <span>Route Network</span>
                </li>
            
                <li 
              className={`nav-item ${activeSection === 'trips' ? 'active' : ''}`}
                  onClick={() => { setActiveSection('trips'); navigate('/depot/trips'); }}
                >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
              <span>Trip Management</span>
                </li>
            
                <li 
              className={`nav-item ${activeSection === 'crew' ? 'active' : ''}`}
                  onClick={() => setActiveSection('crew')}
                >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
              <span>Staff Management</span>
                </li>

                <li 
              className={`nav-item ${activeSection === 'scheduling' ? 'active' : ''}`}
                  onClick={() => setActiveSection('scheduling')}
                >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
              <span>Bus Scheduling</span>
                </li>

                <li 
              className={`nav-item ${activeSection === 'booking-system' ? 'active' : ''}`}
                  onClick={() => setActiveSection('booking-system')}
                >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                  </svg>
              <span>New Booking</span>
                </li>

                <li 
              className={`nav-item ${activeSection === 'booking-management' ? 'active' : ''}`}
                  onClick={() => setActiveSection('booking-management')}
                >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
              <span>Booking Management</span>
                </li>

                <li 
              className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
                  onClick={() => setActiveSection('reports')}
                >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
              <span>Reports</span>
                </li>
            
                <li 
              className={`nav-item ${activeSection === 'monitoring' ? 'active' : ''}`}
                  onClick={() => setActiveSection('monitoring')}
                >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
              <span>Live Monitoring</span>
                </li>
              </ul>
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user?.name?.charAt(0) || 'D'}
            </div>
                      <div className="user-info">
            <div className="user-name">{depotInfo.manager || user?.name || 'Depot Manager'}</div>
            <div className="user-role">Manager</div>
          </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <svg className="logout-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Top Header */}
        <div className="top-header">
          {/* Left Section - Search Bar */}
          <div className="header-left">
            <div className="search-container">
              <svg className="search-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414L10.89 9.89A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search users, trips, routes..." 
              />
            </div>
          </div>

          {/* Center Section - System Status Indicators */}
          <div className="header-center">
            <div className="status-indicators">
              <div className="status-item status-online">
                <svg className="status-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                <span>Database</span>
                <div className="status-dot dot-green"></div>
              </div>
              
              <div className="status-item status-online">
                <svg className="status-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                </svg>
                <span>API Server</span>
                <div className="status-dot dot-green"></div>
              </div>
              
              <div className="status-item status-online">
                <svg className="status-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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
          </div>

        </div>

        {/* Main Content */}
      <div className="main-content">

        {/* Dashboard Content */}
        <div className="dashboard-content">
            {activeSection === 'dashboard' && (
              <>
                {/* Dashboard Header with Quick Actions */}
                <div className="dashboard-header">
                  <div className="header-left">
                    <h1>{depotInfo.name || 'Yatrik Depot'} Dashboard</h1>
                    <p className="welcome-text">Welcome back, <span className="welcome-name">{depotInfo.manager || user?.name || 'Depot Manager'}</span>.</p>
                  </div>
                  <div className="header-right"></div>
                  <div className="quick-actions-grid">
                    <button className="quick-action blue" onClick={() => setActiveSection('buses')}>
                      <span className="qa-title">Add Bus</span>
                    </button>
                    <button className="quick-action green" onClick={() => setActiveSection('scheduling')}>
                      <span className="qa-title">Schedule Trip</span>
                    </button>
                    <button className="quick-action purple" onClick={() => setActiveSection('reports')}>
                      <span className="qa-title">View Reports</span>
                    </button>
                    <button className="quick-action orange qa-bottom-left" onClick={() => setActiveSection('dashboard')}>
                      <span className="qa-title">System Status</span>
                    </button>
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
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                          </svg>
                          <span>12% from last month</span>
                        </div>
                      </div>
                      <p className="kpi-label">Total Buses</p>
                    </div>
                  <div className="kpi-icon blue">
                    <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-content">
                      <div className="kpi-header">
                        <h3>{depotStats.activeTrips}</h3>
                        <div className="kpi-trend">
                          <svg className="trend-icon up" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                          </svg>
                          <span>8% from last month</span>
                        </div>
                      </div>
                      <p className="kpi-label">Running Trips</p>
                    </div>
                  <div className="kpi-icon green">
                    <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-content">
                      <div className="kpi-header">
                        <h3>₹{Number(depotStats.todayRevenue || 0).toLocaleString()}</h3>
                        <div className="kpi-trend">
                          <svg className="trend-icon up" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                          </svg>
                          <span>15% from last month</span>
                        </div>
                      </div>
                      <p className="kpi-label">Today's Revenue</p>
                    </div>
                  <div className="kpi-icon yellow">
                    <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                    </svg>
                    </div>
                  </div>

                  <div className="kpi-card">
                  <div className="kpi-content">
                      <div className="kpi-header">
                    <h3>{depotStats.totalRoutes}</h3>
                        <div className="kpi-trend">
                          <svg className="trend-icon down" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                          </svg>
                          <span>5% from last month</span>
                        </div>
                      </div>
                    <p className="kpi-label">Total Routes</p>
                  </div>
                  <div className="kpi-icon red">
                    <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Tracking */}
            <div className="live-tracking-section">
                <div className="section-header">
                  <h3>Live Tracking</h3>
              <div className="live-indicator">
                    <div className="live-dot"></div>
                    <span>Live</span>
                  </div>
              </div>
              <div className="live-tracking-container">
                <div className="map-area">
                  <div className="map-container">
                    <div className="map-overlay">
                      <div className="map-type-indicator">Basic Map View</div>
                      <div className="map-background"></div>
                      {liveTrackingData.map((trip, index) => (
                        <div
                          key={trip._id || index}
                          className="trip-marker"
                          style={{
                            left: `${20 + (index * 15) % 80}%`,
                            top: `${30 + (index * 20) % 60}%`
                          }}
                        >
                          <div className="marker-pulse"></div>
                          <div className={`marker-icon ${trip.status === 'running' ? 'bg-green-500' : trip.status === 'completed' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                            {trip.busId?.busNumber?.charAt(0) || 'B'}
                          </div>
                          <div className="marker-info">
                            <div className="marker-bus">{trip.busId?.busNumber || 'N/A'}</div>
                            <div className="marker-status">{trip.status || 'unknown'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="trip-info-panel">
                  <div className="panel-header">
                    <h4>Active Trips</h4>
                    <div className="trip-count">{liveTrackingData.length}</div>
                  </div>
                  <div className="trips-list">
                    {liveTrackingData.slice(0, 5).map((trip, index) => (
                      <div key={trip._id || index} className="trip-card">
                        <div className="trip-header">
                          <div className="trip-id">Trip {trip._id?.slice(-6) || index + 1}</div>
                          <div className={`trip-status-badge ${trip.status === 'running' ? 'bg-green-500' : trip.status === 'completed' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                            {trip.status || 'unknown'}
                          </div>
                        </div>
                        <div className="trip-details">
                          <div className="trip-info">
                            <span className="info-label">Route:</span>
                            <span className="info-value">{trip.routeId?.name || 'N/A'}</span>
                          </div>
                          <div className="trip-info">
                            <span className="info-label">Bus:</span>
                            <span className="info-value">{trip.busId?.busNumber || 'N/A'}</span>
                          </div>
                          <div className="trip-info">
                            <span className="info-label">Driver:</span>
                            <span className="info-value">{trip.driver || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Reports Section */}
            <div className="reports-section">
                <div className="section-header">
                  <h3>Recent Trips</h3>
              <div className="reports-filter">
                <select className="filter-select">
                  <option>All Trips</option>
                  <option>Today's Trips</option>
                  <option>This Week</option>
                  <option>This Month</option>
                </select>
                  </div>
              </div>
              <div className="reports-table">
                <table className="trips-table">
                  <thead>
                    <tr>
                      <th>Trip ID</th>
                      <th>Route</th>
                      <th>Bus</th>
                      <th>Crew</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrips.map((trip, index) => (
                      <tr key={trip._id || index}>
                        <td>Trip {trip._id?.slice(-6) || index + 1}</td>
                        <td>
                          <div className="route-info">
                            <div className="route-name">{trip.routeId?.name || 'N/A'}</div>
                            <div className="route-code">{trip.routeId?.code || 'N/A'}</div>
                          </div>
                        </td>
                        <td>
                          <div className="bus-info">
                            <div className="bus-number">{trip.busId?.busNumber || 'N/A'}</div>
                            <div className="bus-type">{trip.busId?.type || 'N/A'}</div>
                          </div>
                        </td>
                        <td>
                          <div className="crew-info">
                            <div className="crew-driver">{trip.driver || 'N/A'}</div>
                            <div className="crew-conductor">{trip.conductor || 'N/A'}</div>
                          </div>
                        </td>
                        <td>
                          <div className={`status-badge ${trip.status === 'running' ? 'bg-green-500' : trip.status === 'completed' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                            {trip.status || 'unknown'}
                          </div>
                        </td>
                        <td>
                            <button className="action-btn-small">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
              </>
            )}

            {/* Fleet Management Section */}
            {activeSection === 'buses' && (
              <div className="module-container fleet-module">
                <FleetManagement />
              </div>
            )}

            {/* Route Network Section */}
            {activeSection === 'routes' && (
              <div className="module-container route-module">
                <RouteNetwork />
              </div>
            )}

            {/* Trip Management Section */}
            {activeSection === 'trips' && (
              <div className="module-container trip-module">
                <TripManagement />
              </div>
            )}

            {/* Staff Management Section */}
            {activeSection === 'crew' && (
              <div className="module-container staff-module">
                <StaffManagement />
              </div>
            )}

            {/* Bus Scheduling Section */}
            {activeSection === 'scheduling' && (
              <div className="module-container scheduling-module">
                <BusScheduling depotId={user?.depotId} />
              </div>
            )}

            {/* New Booking Section */}
            {activeSection === 'booking-system' && (
              <div className="module-container new-booking-module">
                <BookingSystem user={user} onBookingComplete={handleBookingComplete} />
              </div>
            )}

            {/* Booking Management Section */}
            {activeSection === 'booking-management' && (
              <div className="module-container booking-mgmt-module">
                <BookingManagement depotId={user?.depotId} user={user} />
              </div>
            )}
        </div>
      </div>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />
    </div>
  );
};

export default DepotDashboard;
