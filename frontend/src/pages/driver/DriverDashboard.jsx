import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SmartNotifications from '../../components/Common/SmartNotifications';
import './driver.modern.css';
import { apiFetch } from '../../utils/api';
import QuickActions from '../../components/driver/QuickActions.jsx';
import TripCard from '../../components/driver/TripCard.jsx';
import GPSPanel from '../../components/driver/GPSPanel.jsx';
import PassengerTable from '../../components/driver/PassengerTable.jsx';

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
  const locationIntervalRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const primaryTeal = '#0088A9';
  const accentCoral = '#FF6B35';

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

      const res = await apiFetch('/api/driver/profile', { method: 'GET' });
      if (res.ok) {
        const data = res.data || {};
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

      const res = await apiFetch('/api/driver/duties/current', { method: 'GET' });
      if (res.ok) {
        const data = res.data || {};
        console.log('Trip data received:', data);
        setTripData({
          currentTrip: data || null,
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

  const reportDelay = async () => {
    const dutyId = tripData.currentTrip?._id;
    if (!dutyId) return;
    const res = await apiFetch(`/api/driver/duties/${dutyId}/delay`, { method: 'POST', body: JSON.stringify({}) });
    if (res.ok) await fetchTripData();
  };

  const reportBreakdown = async () => {
    const dutyId = tripData.currentTrip?._id;
    if (!dutyId) return;
    const res = await apiFetch(`/api/driver/duties/${dutyId}/incident`, { method: 'POST', body: JSON.stringify({ type: 'breakdown' }) });
    if (res.ok) await fetchTripData();
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
      const dutyId = tripData.currentTrip?._id;
      if (!dutyId) return;
      const res = await apiFetch(`/api/driver/duties/${dutyId}/start`, { method: 'POST', body: JSON.stringify({}) });
      if (res.ok) {
        await fetchTripData();
        beginLocationStreaming();
      }
    } catch (error) {
      console.error('Error starting trip:', error);
    }
  };

  const endTrip = async () => {
    try {
      const dutyId = tripData.currentTrip?._id;
      if (!dutyId) return;
      const res = await apiFetch(`/api/driver/duties/${dutyId}/end`, { method: 'POST', body: JSON.stringify({}) });
      if (res.ok) {
        await fetchTripData();
        stopLocationStreaming();
      }
    } catch (error) {
      console.error('Error ending trip:', error);
    }
  };

  const sendLocation = async (coords) => {
    const payload = { lat: coords.latitude, lng: coords.longitude, timestamp: Date.now() };
    const dutyId = tripData.currentTrip?._id;
    if (!dutyId) return;
    await apiFetch(`/api/duty/${dutyId}/location`, { method: 'POST', body: JSON.stringify({ latitude: payload.lat, longitude: payload.lng, timestamp: payload.timestamp }) });
  };

  const beginLocationStreaming = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      sendLocation(pos.coords);
    });
    locationIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        sendLocation(pos.coords);
      });
    }, 30000);
  };

  const stopLocationStreaming = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
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

  useEffect(() => {
    if (tripData.currentTrip) {
      beginLocationStreaming();
    } else {
      stopLocationStreaming();
    }
  }, [tripData.currentTrip]);

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
                  <button className="action-btn" style={{ background: `linear-gradient(90deg, ${primaryTeal}, ${accentCoral})`, color: '#fff' }} onClick={reportDelay}>Report Delay</button>
                  <button className="action-btn" style={{ background: `linear-gradient(90deg, ${accentCoral}, #ff9966)`, color: '#fff' }} onClick={reportBreakdown}>Report Breakdown</button>
            </div>
          </div>

                {/* ERP Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-3">
                    <div className="rounded-2xl backdrop-blur bg-white/60 shadow-sm border border-white/40 p-4 flex items-center justify-between">
                      <div>
                        <div className="text-slate-500 text-sm">Welcome</div>
                        <div className="text-xl font-semibold">{driverInfo.name} <span className="ml-2 text-xs px-2 py-1 rounded-full text-white" style={{ background: primaryTeal }}>Driver</span></div>
                      </div>
                      <QuickActions dutyId={tripData.currentTrip?._id} onAfterAction={handleRefresh} colors={{ primary: primaryTeal, accent: accentCoral }} />
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <TripCard trip={tripData.currentTrip} colors={{ primary: primaryTeal }} />
                  </div>
                  <div className="lg:col-span-1">
                    <div className="rounded-2xl backdrop-blur bg-white/60 shadow-sm border border-white/40 p-4">
                      <div className="text-slate-500 text-sm">Status</div>
                      <div className="text-lg font-semibold">{tripData.currentTrip ? 'On Trip' : 'Off Duty'}</div>
                      <div className="text-xs text-slate-500 mt-2">Last updated {lastUpdated || '-'}</div>
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <GPSPanel dutyId={tripData.currentTrip?._id} colors={{ primary: primaryTeal }} />
                  </div>
                  <div className="lg:col-span-1">
                    <PassengerTable passengers={tripData.currentTrip?.passengers || []} colors={{ primary: primaryTeal, accent: accentCoral }} />
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



