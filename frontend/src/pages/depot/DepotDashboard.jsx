import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// Notifications removed per request
import NotificationCenter from '../../components/Common/NotificationCenter';
import BookingManagement from '../../components/Common/BookingManagement';
import DepotBookingDashboard from '../../components/depot/DepotBookingDashboard';
import DepotSchedulingDashboard from '../../components/depot/DepotSchedulingDashboard';
import FleetManagement from './components/FleetManagement';
import RouteNetwork from './components/RouteNetwork';
import TripManagement from './components/TripManagement';
import StaffManagement from './components/StaffManagement';
import BusScheduling from '../../components/depot/BusScheduling';
import BusSchedulingTest from '../../components/depot/BusSchedulingTest';
import './depot.modern.css';

const DepotDashboard = () => {
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
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sideMenuOpen, setSideMenuOpen] = useState(true); // Always open
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

  const fetchBookingStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('depotToken') || localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/depot/bookings/stats?period=today', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDepotStats(prev => ({
            ...prev,
            todayBookings: data.data.summary.totalBookings,
            totalBookings: data.data.summary.totalBookings
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching booking stats:', error);
    }
  }, []);

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
    fetchBookingStats(); // Fetch booking stats

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
  }, [user, fetchData, fetchDepotInfo, fetchBookingStats]);

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
      {/* Top Navigation Bar */}
      <div className="top-navigation">
        <div className="nav-left">
          {/* Clean header - no depot branding */}
        </div>

        <div className="nav-center">
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

        <div className="nav-right">
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

          <div className="user-profile">
            <div className="user-avatar">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="user-info">
              <div className="user-name">{depotInfo.manager || user?.name || 'Admin Yatrik'}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <svg className="logout-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>


      {/* Side Menu */}
      <div className={`side-menu ${sideMenuOpen ? 'open' : ''}`}>
        <div className="side-menu-content">
          <div className="menu-section">
            <h4>Management</h4>
            <div className="menu-items">
              <div className="menu-item" onClick={() => { setActiveSection('routes'); setSideMenuOpen(false); }}>
                <svg className="menu-item-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span>Route Management</span>
              </div>
              <div className="menu-item" onClick={() => { setActiveSection('trips'); setSideMenuOpen(false); }}>
                <svg className="menu-item-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Trip Management</span>
              </div>
              <div className="menu-item" onClick={() => { setActiveSection('crew'); setSideMenuOpen(false); }}>
                <svg className="menu-item-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
                <span>Staff Management</span>
              </div>
            </div>
          </div>

          <div className="menu-section">
            <h4>Operations</h4>
            <div className="menu-items">
              <div className="menu-item" onClick={() => { setActiveSection('scheduling'); setSideMenuOpen(false); }}>
                <svg className="menu-item-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span>Bus Scheduling</span>
              </div>
              <div className="menu-item" onClick={() => { setActiveSection('fares'); setSideMenuOpen(false); }}>
                <svg className="menu-item-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                </svg>
                <span>Fare Management</span>
              </div>
              <div className="menu-item" onClick={() => { setActiveSection('reports'); setSideMenuOpen(false); }}>
                <svg className="menu-item-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 14.414l2.293 2.293a1 1 0 001.414-1.414L12.414 14H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Reports & Analytics</span>
              </div>
            </div>
          </div>

          <div className="menu-section">
            <h4>Quick Actions</h4>
            <div className="menu-items">
              <div className="menu-item" onClick={() => { setActiveSection('dashboard'); setSideMenuOpen(false); }}>
                <svg className="menu-item-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span>Dashboard Overview</span>
              </div>
              <div className="menu-item" onClick={() => { setActiveSection('routes'); setSideMenuOpen(false); }}>
                <svg className="menu-item-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>Add New Route</span>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Main Content */}
      <div className={`main-content ${sideMenuOpen ? 'with-side-menu' : ''}`}>

        {/* Dashboard Content */}
        <div className="dashboard-content">
            {activeSection === 'dashboard' && (
              <>
                {/* Clean Dashboard Header */}
                <div className="dashboard-header">
                  <div className="dashboard-title-section">
                    <h1 className="dashboard-title">Dashboard</h1>
                    <p className="dashboard-subtitle">Dashboard</p>
                  </div>
                  <div className="quick-actions-section">
                    <button className="quick-action-btn add-user" onClick={() => setActiveSection('crew')}>
                      <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                      <span>Add User</span>
                    </button>
                    <button className="quick-action-btn schedule-trip" onClick={() => setActiveSection('scheduling')}>
                      <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span>Schedule Trip</span>
                    </button>
                    <button className="quick-action-btn view-reports" onClick={() => setActiveSection('reports')}>
                      <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                      <span>View Reports</span>
                    </button>
                    <button className="quick-action-btn system-status" onClick={() => setActiveSection('status')}>
                      <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>System Status</span>
                    </button>
                  </div>
                </div>

                {/* New Grid Layout Dashboard */}
                <div className="dashboard-grid">
                  {/* Top Row: 4 Statistic Cards */}
                  <div className="stats-row">
                    <div className="stat-card">
                      <div className="stat-icon buses">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">{depotStats.totalBuses}</div>
                        <div className="stat-label">Total Buses</div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon trips">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">{depotStats.activeTrips}</div>
                        <div className="stat-label">Active Trips</div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon revenue">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                        </svg>
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">₹{Number(depotStats.todayRevenue || 0).toLocaleString()}</div>
                        <div className="stat-label">Revenue Today</div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon crew">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                        </svg>
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">{depotStats.totalDrivers || 0}</div>
                        <div className="stat-label">Crew on Duty</div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Row: Live Tracking Map + Quick Actions */}
                  <div className="main-content-row">
                    <div className="live-tracking-map">
                      <div className="map-header">
                        <h3>Live Tracking</h3>
                        <div className="live-indicator">
                          <div className="live-dot"></div>
                          <span>Live</span>
                        </div>
                      </div>
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

                    <div className="quick-actions-panel">
                      <h3>Quick Actions</h3>
                      <div className="action-cards">
                        <div className="action-card" onClick={() => setActiveSection('routes')}>
                          <div className="action-icon add-route">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="action-content">
                            <div className="action-title">Add Route</div>
                            <div className="action-description">Create new bus route</div>
                          </div>
                        </div>

                        <div className="action-card" onClick={() => setActiveSection('crew')}>
                          <div className="action-icon assign-crew">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                            </svg>
                          </div>
                          <div className="action-content">
                            <div className="action-title">Assign Crew</div>
                            <div className="action-description">Manage staff assignments</div>
                          </div>
                        </div>

                        <div className="action-card" onClick={() => setActiveSection('fares')}>
                          <div className="action-icon approve-passes">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="action-content">
                            <div className="action-title">Approve Passes</div>
                            <div className="action-description">Review fare approvals</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Charts/Reports */}
                  <div className="charts-row">
                    <div className="chart-card fuel-usage">
                      <h4>Fuel Usage</h4>
                      <div className="chart-placeholder">
                        <div className="chart-bar" style={{height: '60%'}}></div>
                        <div className="chart-bar" style={{height: '80%'}}></div>
                        <div className="chart-bar" style={{height: '45%'}}></div>
                        <div className="chart-bar" style={{height: '90%'}}></div>
                        <div className="chart-bar" style={{height: '70%'}}></div>
                      </div>
                      <div className="chart-info">
                        <span>This Week: 1,250L</span>
                        <span className="trend-up">+12%</span>
                      </div>
                    </div>

                    <div className="chart-card trip-stats">
                      <h4>Trip Statistics</h4>
                      <div className="stats-grid">
                        <div className="mini-stat">
                          <div className="mini-value">89%</div>
                          <div className="mini-label">On Time</div>
                        </div>
                        <div className="mini-stat">
                          <div className="mini-value">156</div>
                          <div className="mini-label">Completed</div>
                        </div>
                        <div className="mini-stat">
                          <div className="mini-value">12</div>
                          <div className="mini-label">Delayed</div>
                        </div>
                        <div className="mini-stat">
                          <div className="mini-value">2</div>
                          <div className="mini-label">Cancelled</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Routes Section */}
            {activeSection === 'routes' && (
              <div className="module-container route-module">
                <RouteNetwork />
              </div>
            )}

            {/* Trips Section */}
            {activeSection === 'trips' && (
              <div className="module-container trip-module">
                <TripManagement />
              </div>
            )}

            {/* Crew Section */}
            {activeSection === 'crew' && (
              <div className="module-container staff-module">
                <StaffManagement />
              </div>
            )}

            {/* Fares Section */}
            {activeSection === 'fares' && (
              <div className="module-container fares-module">
                <div className="section-placeholder">
                  <h3>Fares Management</h3>
                  <p>Fare management functionality will be implemented here.</p>
                </div>
              </div>
            )}

            {/* Scheduling Section */}
            {activeSection === 'scheduling' && (
              <div className="module-container scheduling-module">
                <BusScheduling />
                <div style={{ marginTop: '40px', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                  <h3>API Test (Development Only)</h3>
                  <BusSchedulingTest />
                </div>
              </div>
            )}

            {/* Reports Section */}
            {activeSection === 'reports' && (
              <div className="module-container reports-module">
                <div className="section-placeholder">
                  <h3>Reports & Analytics</h3>
                  <p>Comprehensive reporting dashboard will be implemented here.</p>
                </div>
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
