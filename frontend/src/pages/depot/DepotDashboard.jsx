import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';
import NotificationCenter from '../../components/Common/NotificationCenter';
import FleetManagement from './components/FleetManagement';
import RouteManagement from './components/RouteManagement';
import TripManagement from './components/TripManagement';
import BookingManagement from './components/BookingManagement';
import StaffManagement from './components/StaffManagement';
import BusScheduling from './components/BusScheduling';
import ReportsAnalytics from './components/ReportsAnalytics';
import { 
  fleetApiService, 
  routeApiService, 
  tripApiService, 
  bookingApiService, 
  staffApiService, 
  schedulingApiService, 
  reportsApiService, 
  depotApiService 
} from '../../services/depotApiService';
import './depot.modern.css';

const DepotDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'trip_assigned',
      title: 'New Trip Assigned',
      message: 'Trip TR-001 has been assigned to you. Route: Kochi to Thiruvananthapuram, Driver: Rajesh Kumar',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false,
      priority: 'high'
    },
    {
      id: 2,
      type: 'trip_update',
      title: 'Trip Updated',
      message: 'Trip TR-002 has been updated by admin. Driver: Manoj Pillai, Conductor: Anil Kumar',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      read: false,
      priority: 'medium'
    },
    {
      id: 3,
      type: 'message',
      title: 'System Message',
      message: 'Maintenance scheduled for bus KL-76-AB-5114 tomorrow at 10:00 AM',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: true,
      priority: 'low'
    }
  ]);
  const [unreadCount, setUnreadCount] = useState(2);
  const [socket, setSocket] = useState(null);

  // Data states for each management section
  const [fleetData, setFleetData] = useState([]);
  const [routesData, setRoutesData] = useState([]);
  const [tripsData, setTripsData] = useState([]);
  const [bookingsData, setBookingsData] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [schedulesData, setSchedulesData] = useState([]);
  const [reportsData, setReportsData] = useState({});
  const [depotData, setDepotData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
  const [activeSection, setActiveSection] = useState('dashboard');

  // API fetching functions for each management section
  const fetchFleetData = async () => {
    try {
      const response = await fleetApiService.getBuses();
      console.log('Fleet API response:', response); // Debug log
      
      // Handle different response structures
      let buses = [];
      if (response.success && response.data) {
        buses = Array.isArray(response.data) ? response.data : response.data.buses || [];
      } else if (Array.isArray(response)) {
        buses = response;
      } else if (response.buses) {
        buses = response.buses;
      }
      
      console.log('Parsed buses:', buses); // Debug log
      setFleetData(buses);
    } catch (error) {
      console.error('Error fetching fleet data:', error);
      setFleetData([]);
    }
  };

  const fetchRoutesData = async () => {
    try {
      const response = await routeApiService.getRoutes();
      console.log('Routes API response:', response); // Debug log
      
      // Handle different response structures
      let routes = [];
      if (response.success && response.data) {
        // If response has success: true and data field
        routes = Array.isArray(response.data) ? response.data : response.data.routes || [];
      } else if (Array.isArray(response)) {
        // If response is directly an array
        routes = response;
      } else if (response.routes) {
        // If response has routes field
        routes = response.routes;
      }
      
      console.log('Parsed routes:', routes); // Debug log
      
      // If no routes found, provide sample data for testing
      if (routes.length === 0) {
        console.log('No routes found, using sample data for testing');
        const sampleRoutes = [
          {
            _id: 'sample1',
            routeNumber: 'KL-001',
            routeName: 'Kochi to Thiruvananthapuram',
            startingPoint: 'Kochi',
            endingPoint: 'Thiruvananthapuram',
            totalDistance: 220,
            status: 'active'
          },
          {
            _id: 'sample2',
            routeNumber: 'KL-002',
            routeName: 'Kochi to Kozhikode',
            startingPoint: 'Kochi',
            endingPoint: 'Kozhikode',
            totalDistance: 185,
            status: 'active'
          },
          {
            _id: 'sample3',
            routeNumber: 'KL-003',
            routeName: 'Thiruvananthapuram to Kozhikode',
            startingPoint: 'Thiruvananthapuram',
            endingPoint: 'Kozhikode',
            totalDistance: 350,
            status: 'active'
          }
        ];
        setRoutesData(sampleRoutes);
      } else {
        setRoutesData(routes);
      }
    } catch (error) {
      console.error('Error fetching routes data:', error);
      // Provide sample data even on error
      const sampleRoutes = [
        {
          _id: 'sample1',
          routeNumber: 'KL-001',
          routeName: 'Kochi to Thiruvananthapuram',
          startingPoint: 'Kochi',
          endingPoint: 'Thiruvananthapuram',
          totalDistance: 220,
          status: 'active'
        },
        {
          _id: 'sample2',
          routeNumber: 'KL-002',
          routeName: 'Kochi to Kozhikode',
          startingPoint: 'Kochi',
          endingPoint: 'Kozhikode',
          totalDistance: 185,
          status: 'active'
        }
      ];
      setRoutesData(sampleRoutes);
    }
  };

  const fetchTripsData = async () => {
    try {
      const response = await tripApiService.getTrips();
      console.log('Trips API response:', response); // Debug log
      
      // Handle different response structures
      let trips = [];
      if (response.success && response.data) {
        trips = Array.isArray(response.data) ? response.data : response.data.trips || [];
      } else if (Array.isArray(response)) {
        trips = response;
      } else if (response.trips) {
        trips = response.trips;
      }
      
      console.log('Parsed trips:', trips); // Debug log
      setTripsData(trips);
    } catch (error) {
      console.error('Error fetching trips data:', error);
      setTripsData([]);
    }
  };

  const fetchBookingsData = async () => {
    try {
      const response = await bookingApiService.getBookings();
      console.log('Bookings API response:', response); // Debug log
      
      // Handle different response structures
      let bookings = [];
      if (response.success && response.data) {
        bookings = Array.isArray(response.data) ? response.data : response.data.bookings || [];
      } else if (Array.isArray(response)) {
        bookings = response;
      } else if (response.bookings) {
        bookings = response.bookings;
      }
      
      console.log('Parsed bookings:', bookings); // Debug log
      setBookingsData(bookings);
    } catch (error) {
      console.error('Error fetching bookings data:', error);
      setBookingsData([]);
    }
  };

  const fetchStaffData = async () => {
    try {
      const [driversResponse, conductorsResponse] = await Promise.all([
        staffApiService.getDrivers(),
        staffApiService.getConductors()
      ]);
      setStaffData({
        drivers: driversResponse.data || [],
        conductors: conductorsResponse.data || []
      });
    } catch (error) {
      console.error('Error fetching staff data:', error);
      setStaffData({ drivers: [], conductors: [] });
    }
  };

  const fetchSchedulesData = async () => {
    try {
      const response = await schedulingApiService.getBusSchedules();
      setSchedulesData(response.data || []);
    } catch (error) {
      console.error('Error fetching schedules data:', error);
      setSchedulesData([]);
    }
  };

  const fetchReportsData = async () => {
    try {
      const response = await reportsApiService.getDashboardData();
      setReportsData(response.data || {});
    } catch (error) {
      console.error('Error fetching reports data:', error);
      setReportsData({});
    }
  };

  const fetchDepotData = async () => {
    try {
      const response = await depotApiService.getDepotInfo();
      setDepotData(response.data || {});
    } catch (error) {
      console.error('Error fetching depot data:', error);
      setDepotData({});
    }
  };

  // Main data fetching function
  const fetchAllData = async () => {
      try {
        setLoading(true);
      
      // Fetch all data in parallel
      await Promise.all([
        fetchFleetData(),
        fetchRoutesData(),
        fetchTripsData(),
        fetchBookingsData(),
        fetchStaffData(),
        fetchSchedulesData(),
        fetchReportsData(),
        fetchDepotData()
      ]);

      // Update depot stats from API data
        setDepotStats({
        totalBuses: fleetData.length || 24,
        activeTrips: tripsData.filter(trip => trip.status === 'running').length || 8,
        todayRevenue: depotData.revenue || 12500,
        totalRoutes: routesData.length || 12,
        todayBookings: bookingsData.filter(booking => 
          new Date(booking.createdAt).toDateString() === new Date().toDateString()
        ).length || 45,
        totalBookings: bookingsData.length || 156
        });

        setSystemHealth({
          database: 'online',
          api: 'online',
          frontend: 'online'
        });

      // Update last updated time
        setLastUpdated(new Date().toLocaleTimeString());
      
        setLoading(false);
      } catch (error) {
      console.error('Error fetching all data:', error);
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Socket connection for real-time updates
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token: localStorage.getItem('depotToken') || localStorage.getItem('token'),
        userType: 'depot_manager'
      }
    });

    setSocket(newSocket);

    // Listen for trip updates from admin
    newSocket.on('tripUpdated', (data) => {
      console.log('Trip updated from admin:', data);
      
      // Update trips data
      setTripsData(prevTrips => {
        const updatedTrips = prevTrips.map(trip => 
          trip._id === data.tripId ? { ...trip, ...data.updates } : trip
        );
        return updatedTrips;
      });

      // Add notification
      const notification = {
        id: Date.now(),
        type: 'trip_update',
        title: 'Trip Updated',
        message: `Trip ${data.tripNumber} has been updated by admin. Driver: ${data.updates.driverId?.name || 'N/A'}, Conductor: ${data.updates.conductorId?.name || 'N/A'}`,
        timestamp: new Date(),
        read: false,
        priority: 'medium'
      };

      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Listen for new trip assignments
    newSocket.on('tripAssigned', (data) => {
      console.log('New trip assigned:', data);
      
      // Add new trip to trips data
      setTripsData(prevTrips => [data.trip, ...prevTrips]);

      // Add notification
      const notification = {
        id: Date.now(),
        type: 'trip_assigned',
        title: 'New Trip Assigned',
        message: `New trip ${data.trip.tripNumber} has been assigned to you. Route: ${data.trip.routeId?.routeName}, Driver: ${data.trip.driverId?.name}`,
        timestamp: new Date(),
        read: false,
        priority: 'high'
      };

      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Listen for general messages
    newSocket.on('message', (data) => {
      console.log('New message received:', data);
      
      const notification = {
        id: Date.now(),
        type: 'message',
        title: data.title || 'New Message',
        message: data.message,
        timestamp: new Date(),
        read: false,
        priority: data.priority || 'low'
      };

      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Listen for system alerts
    newSocket.on('systemAlert', (data) => {
      console.log('System alert received:', data);
      
      const notification = {
        id: Date.now(),
        type: 'system_alert',
        title: 'System Alert',
        message: data.message,
        timestamp: new Date(),
        read: false,
        priority: 'high'
      };

      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  // Handle section change and redirect to appropriate pages
  const handleSectionChange = async (section) => {
    setActiveSection(section);

    // Redirect to specific pages based on section
    switch (section) {
      case 'fleet':
        window.location.href = '/depot/fleet-management';
        break;
      case 'routes':
        window.location.href = '/depot/route-management';
        break;
      case 'trips':
        window.location.href = '/depot/trip-management';
        break;
      case 'bookings':
        window.location.href = '/depot/booking-management';
        break;
      case 'staff':
        window.location.href = '/depot/staff-management';
        break;
      case 'scheduling':
        window.location.href = '/depot/bus-scheduling';
        break;
      case 'reports':
        window.location.href = '/depot/reports-analytics';
        break;
      case 'dashboard':
        // Stay on dashboard
        break;
      default:
        break;
    }
  };

  // Refresh data function
  const refreshData = async () => {
    await fetchAllData();
  };

  // Function to determine current section based on pathname
  const getCurrentSection = () => {
    const pathname = location.pathname;
    if (pathname.includes('/fleet-management')) return 'fleet';
    if (pathname.includes('/route-management')) return 'routes';
    if (pathname.includes('/trip-management')) return 'trips';
    if (pathname.includes('/booking-management')) return 'bookings';
    if (pathname.includes('/staff-management')) return 'staff';
    if (pathname.includes('/bus-scheduling')) return 'scheduling';
    if (pathname.includes('/reports-analytics')) return 'reports';
    return 'dashboard';
  };

  // Function to render appropriate component based on current section
  const renderManagementComponent = () => {
    const currentSection = getCurrentSection();
    
    switch (currentSection) {
      case 'fleet':
        return <FleetManagement />;
      case 'routes':
        return <RouteManagement />;
      case 'trips':
        return <TripManagement />;
      case 'bookings':
        return <BookingManagement />;
      case 'staff':
        return <StaffManagement />;
      case 'scheduling':
        return <BusScheduling />;
      case 'reports':
        return <ReportsAnalytics />;
      default:
        return null;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.user-profile-top') && !event.target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

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
                <li className={`nav-item ${getCurrentSection() === 'dashboard' ? 'active' : ''}`} onClick={() => handleSectionChange('dashboard')}>
                  <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  <span>Dashboard</span>
                </li>
                <li className={`nav-item ${getCurrentSection() === 'fleet' ? 'active' : ''}`} onClick={() => handleSectionChange('fleet')}>
                  <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <span>Fleet Management</span>
                </li>
                <li className={`nav-item ${getCurrentSection() === 'routes' ? 'active' : ''}`} onClick={() => handleSectionChange('routes')}>
                  <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>Route Management</span>
                </li>
                <li className={`nav-item ${getCurrentSection() === 'trips' ? 'active' : ''}`} onClick={() => handleSectionChange('trips')}>
                  <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>Trip Management</span>
                </li>
                <li className={`nav-item ${getCurrentSection() === 'bookings' ? 'active' : ''}`} onClick={() => handleSectionChange('bookings')}>
                  <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span>Booking Management</span>
                </li>
                <li className={`nav-item ${getCurrentSection() === 'staff' ? 'active' : ''}`} onClick={() => handleSectionChange('staff')}>
                  <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span>Staff Management</span>
                </li>
                <li className={`nav-item ${getCurrentSection() === 'scheduling' ? 'active' : ''}`} onClick={() => handleSectionChange('scheduling')}>
                  <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>Bus Scheduling</span>
                </li>
                <li className={`nav-item ${getCurrentSection() === 'reports' ? 'active' : ''}`} onClick={() => handleSectionChange('reports')}>
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
              <div className="footer-actions">
                <button 
                  className="notification-btn" 
                  onClick={() => setShowNotificationCenter(true)}
                >
                  <svg className="notification-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>
              <button className="logout-btn" onClick={handleLogout}>
                <svg className="logout-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                  <span>Logout</span>
              </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="main-content">
            {/* Render appropriate component based on current route */}
            {getCurrentSection() === 'dashboard' ? (
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
                      <button className="action-btn blue" onClick={refreshData}>
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

                {/* Recent Activities & Today's Performance */}
                <div className="charts-row">
                  <div className="chart-card">
                    <h4>Recent Activities</h4>
                    <div className="activities-list">
                      <div className="activity-item">
                        <div className="activity-icon bus">
                          <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                    </div>
                        <div className="activity-content">
                          <div className="activity-title">Bus KL-01-AB-1234 departed</div>
                          <div className="activity-time">2 minutes ago</div>
                        </div>
                        <div className="activity-status success">On Time</div>
                      </div>
                      
                      <div className="activity-item">
                        <div className="activity-icon booking">
                          <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="activity-content">
                          <div className="activity-title">New booking received</div>
                          <div className="activity-time">5 minutes ago</div>
                        </div>
                        <div className="activity-status info">₹450</div>
                      </div>
                      
                      <div className="activity-item">
                        <div className="activity-icon maintenance">
                          <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="activity-content">
                          <div className="activity-title">Maintenance completed</div>
                          <div className="activity-time">15 minutes ago</div>
                        </div>
                        <div className="activity-status success">Complete</div>
                      </div>
                      
                      <div className="activity-item">
                        <div className="activity-icon route">
                          <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="activity-content">
                          <div className="activity-title">Route updated</div>
                          <div className="activity-time">1 hour ago</div>
                        </div>
                        <div className="activity-status info">Route 101</div>
                    </div>
                    </div>
                  </div>

                  <div className="chart-card">
                    <h4>Today's Performance</h4>
                    <div className="performance-metrics">
                      <div className="performance-item">
                        <div className="performance-label">On-Time Departures</div>
                        <div className="performance-value">
                          <span className="value">92%</span>
                          <span className="trend up">+3%</span>
                    </div>
                        <div className="performance-bar">
                          <div className="bar-fill" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                      
                      <div className="performance-item">
                        <div className="performance-label">Customer Satisfaction</div>
                        <div className="performance-value">
                          <span className="value">4.7/5</span>
                          <span className="trend up">+0.2</span>
                        </div>
                        <div className="performance-bar">
                          <div className="bar-fill" style={{ width: '94%' }}></div>
                        </div>
                      </div>
                      
                      <div className="performance-item">
                        <div className="performance-label">Fuel Efficiency</div>
                        <div className="performance-value">
                          <span className="value">8.2 km/L</span>
                          <span className="trend down">-0.1</span>
                        </div>
                        <div className="performance-bar">
                          <div className="bar-fill" style={{ width: '82%' }}></div>
                        </div>
                      </div>
                      
                      <div className="performance-item">
                        <div className="performance-label">Seat Occupancy</div>
                        <div className="performance-value">
                          <span className="value">78%</span>
                          <span className="trend up">+5%</span>
                        </div>
                        <div className="performance-bar">
                          <div className="bar-fill" style={{ width: '78%' }}></div>
                        </div>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Render management component for other routes
              renderManagementComponent()
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
                  <div className="dropdown-item" onClick={() => {setShowProfileDropdown(false); /* Add profile view functionality */}}>
                    <svg className="dropdown-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    View Profile
                  </div>
                  <div className="dropdown-item" onClick={() => {setShowProfileDropdown(false); /* Add edit profile functionality */}}>
                    <svg className="dropdown-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" clipRule="evenodd" />
                    </svg>
                    Edit Profile
                  </div>
                  <div className="dropdown-item" onClick={() => {setShowProfileDropdown(false); /* Add account settings functionality */}}>
                    <svg className="dropdown-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Account Settings
                  </div>
                  <div className="dropdown-item" onClick={() => {setShowProfileDropdown(false); /* Add preferences functionality */}}>
                    <svg className="dropdown-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Preferences
                  </div>
                  <div className="dropdown-item" onClick={() => {setShowProfileDropdown(false); /* Add help functionality */}}>
                    <svg className="dropdown-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    Help & Support
                  </div>
                  <div className="dropdown-divider"></div>
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
              <NotificationCenter 
                notifications={notifications}
                unreadCount={unreadCount}
                onClose={() => setShowNotificationCenter(false)}
                onMarkAsRead={(notificationId) => {
                  setNotifications(prev => 
                    prev.map(notif => 
                      notif.id === notificationId ? { ...notif, read: true } : notif
                    )
                  );
                  setUnreadCount(prev => Math.max(0, prev - 1));
                }}
                onMarkAllAsRead={() => {
                  setNotifications(prev => 
                    prev.map(notif => ({ ...notif, read: true }))
                  );
                  setUnreadCount(0);
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DepotDashboard;
