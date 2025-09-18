import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './conductor.modern.css';
import { 
  MapPin, 
  CheckCircle, 
  Play, 
  LogOut,
  Activity,
  AlertTriangle,
  Bus,
  Bell,
  AlertCircle,
  Users,
  QrCode,
  Camera,
  Route,
  Building,
  Ticket,
  Plus,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Monitor,
  Smartphone,
  Menu,
  X,
  Clock,
  XCircle,
  Search,
  ArrowUpDown
} from 'lucide-react';

const ConductorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Core State Management - Updated v2
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications] = useState(3);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Responsive View Mode State
  const [viewMode, setViewMode] = useState('desktop'); // desktop, mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Duty Workflow State
  const [dutyStatus, setDutyStatus] = useState('assigned'); // not_assigned, assigned, active, completed
  const [currentDuty, setCurrentDuty] = useState(null);
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, passengers, scanning
  
  // Trip Information
  const [tripInfo, setTripInfo] = useState({
    routeName: 'Kochi → Alappuzha',
    routeNumber: 'KL-07-CD-5678',
    depotName: 'Kochi Depot',
    dutyId: 'DUTY-2024-001',
    busNumber: 'KL-07-CD-5678',
    startTime: '09:00',
    endTime: '10:30',
    totalSeats: 45,
    currentStop: 'Cherthala Junction',
    nextStop: 'Alappuzha Central',
    progress: 60
  });
  
  // Passenger Management
  const [passengers, setPassengers] = useState([
    { id: 1, name: 'John Doe', seat: 'A1', boardingStop: 'Kochi Central', destination: 'Alappuzha', status: 'boarded', pnr: 'PNR123456' },
    { id: 2, name: 'Jane Smith', seat: 'A2', boardingStop: 'Edappally', destination: 'Alappuzha', status: 'boarded', pnr: 'PNR123457' },
    { id: 3, name: 'Bob Wilson', seat: 'B1', boardingStop: 'Cherthala', destination: 'Alappuzha', status: 'expected', pnr: 'PNR123458' },
    { id: 4, name: 'Alice Johnson', seat: 'B2', boardingStop: 'Kochi Central', destination: 'Alappuzha', status: 'expected', pnr: 'PNR123459' },
    { id: 5, name: 'Charlie Brown', seat: 'C1', boardingStop: 'Edappally', destination: 'Alappuzha', status: 'no_show', pnr: 'PNR123460' },
    { id: 6, name: 'Diana Prince', seat: 'C2', boardingStop: 'Cherthala', destination: 'Alappuzha', status: 'boarded', pnr: 'PNR123461' }
  ]);
  const [passengerFilter, setPassengerFilter] = useState('all'); // all, boarded, expected, no_show
  const [sortBy, setSortBy] = useState('seat'); // seat, name, stop, status, pnr
  const [searchQuery, setSearchQuery] = useState(''); // Search passengers by name, PNR, or seat
  
  // QR Scanning
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  
  // Vacant Seat Booking
  const [showVacantBooking, setShowVacantBooking] = useState(false);
  const [availableSeats, setAvailableSeats] = useState(['A3', 'A4', 'B2', 'B3', 'C1', 'C2']);
  
  // Alerts and Notifications
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'warning', message: 'Invalid ticket scanned', time: '2 min ago' },
    { id: 2, type: 'error', message: 'Duplicate ticket detected', time: '5 min ago' },
    { id: 3, type: 'info', message: 'Passenger request: Seat change', time: '8 min ago' }
  ]);

  // Helper Functions
  const playSound = useCallback((type) => {
    if (!soundEnabled) return;
    // Add actual sound implementation here
    console.log(`Playing ${type} sound`);
  }, [soundEnabled]);

  // Toggle View Mode Function
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'desktop' ? 'mobile' : 'desktop');
    playSound('toggle');
  }, [playSound]);

  // Toggle Mobile Menu Function
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
    playSound('menu');
  }, [playSound]);

  // Workflow Functions
  const startDuty = useCallback(() => {
    setDutyStatus('active');
    setCurrentDuty({
      id: tripInfo.dutyId,
      startTime: new Date(),
      route: tripInfo.routeName,
      bus: tripInfo.busNumber
    });
    playSound('success');
  }, [tripInfo, playSound]);

  const endDuty = useCallback(() => {
    setDutyStatus('completed');
    playSound('success');
  }, [playSound]);

  const startQRScan = useCallback(() => {
    setIsScanning(true);
    setScanResult(null);
    // Simulate QR scan
    setTimeout(() => {
      const mockResult = {
        success: Math.random() > 0.2, // 80% success rate
        pnr: 'PNR' + Math.random().toString().substr(2, 8),
        passenger: 'Sample Passenger',
        seat: 'A' + Math.floor(Math.random() * 5 + 1)
      };
      setScanResult(mockResult);
      setIsScanning(false);
      setScanHistory(prev => [mockResult, ...prev.slice(0, 9)]);
      playSound(mockResult.success ? 'success' : 'error');
    }, 2000);
  }, [playSound]);

  const refreshDashboard = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Add refresh logic here
      console.log('Refreshing dashboard data...');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize dashboard
  useEffect(() => {
    refreshDashboard();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(refreshDashboard, 30000);
    setRefreshInterval(interval);
    
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (timeInterval) {
        clearInterval(timeInterval);
      }
    };
  }, [refreshDashboard]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  if (!user) {
    return (
      <div className="loading-container">
        <h3>Loading Conductor Dashboard...</h3>
      </div>
    );
  }

  return (
    <div className={`conductor-dashboard ${viewMode === 'mobile' ? 'mobile-view' : 'desktop-view'}`}>
      {/* Browser Top Bar */}
      <div className="browser-top-bar">
        <div className="browser-controls">
          <div className="browser-info">
            <span className="page-title">YATRIK ERP - Smart Bus Travel Management</span>
          </div>
          <div className="browser-right">
            <button className="notification-btn-browser" title="Notifications">
              <Bell size={14} />
              {notifications > 0 && (
                <span className="notification-badge-browser">{notifications}</span>
              )}
            </button>
            <div className="browser-time">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <button 
              className={`view-mode-btn-browser ${viewMode === 'mobile' ? 'mobile-active' : 'desktop-active'}`}
              onClick={toggleViewMode}
              title={`Currently in ${viewMode === 'desktop' ? 'Desktop' : 'Mobile'} View - Click to switch to ${viewMode === 'desktop' ? 'Mobile' : 'Desktop'} View`}
            >
              {viewMode === 'desktop' ? 'DESKTOP' : 'MOBILE'}
            </button>
          </div>
        </div>
      </div>

      {/* Header Section - Efficient Layout */}
      <div className="dashboard-header">
        {/* Left: Branding */}
        <div className="header-left">
          {viewMode === 'mobile' && (
            <button 
              className="mobile-menu-btn"
              onClick={toggleMobileMenu}
              title="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
          <div className="logo-section">
            <div className="logo-icon">
              <Bus size={18} />
            </div>
            <div className="logo-text">
              <h1>CONDUCTOR DASHBOARD</h1>
            </div>
          </div>
        </div>

        {/* Center: Conductor Info & Time */}
        <div className="header-center">
          <div className="conductor-profile">
            <div className="conductor-details">
              <span className="conductor-name">{user?.name || 'Joel'}</span>
              <span className="conductor-id">ID: {user?.id?.slice(-8) || '2ff588c8'}</span>
            </div>
            <div className="connection-status">
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
            
        {/* Right: Controls */}
        <div className="header-right">
          <button 
            className={`sound-btn ${soundEnabled ? 'active' : ''}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Sound On' : 'Sound Off'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button className="logout-btn-header" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Trip Context Bar */}
      <div className="trip-context-bar">
        <div className="trip-info-main">
          <div className="route-info">
            <Route size={16} />
            <span className="route-name">{tripInfo.routeName}</span>
            <span className="route-number">{tripInfo.routeNumber}</span>
          </div>
          <div className="depot-info">
            <Building size={16} />
            <span>{tripInfo.depotName}</span>
          </div>
          <div className="duty-info">
            <span className="duty-id">Duty: {tripInfo.dutyId}</span>
            <span className="bus-number">Bus: {tripInfo.busNumber}</span>
          </div>
        </div>
        
        <div className="trip-status">
          <div className="current-stop">
            <MapPin size={14} />
            <span>Now: {tripInfo.currentStop}</span>
          </div>
          <div className="next-stop">
            <span>Next: {tripInfo.nextStop}</span>
            </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${tripInfo.progress}%` }}></div>
                </div>
              </div>
        
        <div className="duty-status-indicator">
          <div className={`duty-status-dot ${dutyStatus}`}></div>
          <span className="duty-status-text">
            {dutyStatus === 'not_assigned' ? 'No Duty' : 
             dutyStatus === 'assigned' ? 'Ready' :
             dutyStatus === 'active' ? 'On Duty' : 'Completed'}
          </span>
            </div>
          </div>
          
      {/* Navigation Tabs */}
      <div className={`dashboard-nav ${viewMode === 'mobile' ? 'mobile-nav' : ''}`}>
        <button 
          className={`nav-tab ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('dashboard');
            if (viewMode === 'mobile') setIsMobileMenuOpen(false);
          }}
        >
          <Activity size={16} />
          <span>Dashboard</span>
        </button>
        <button 
          className={`nav-tab ${activeView === 'passengers' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('passengers');
            if (viewMode === 'mobile') setIsMobileMenuOpen(false);
          }}
        >
          <Users size={16} />
          <span>Passengers</span>
        </button>
        <button 
          className={`nav-tab ${activeView === 'scanning' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('scanning');
            if (viewMode === 'mobile') setIsMobileMenuOpen(false);
          }}
        >
          <QrCode size={16} />
          <span>Scan Tickets</span>
        </button>
                </div>

      {/* Mobile Menu Overlay */}
      {viewMode === 'mobile' && isMobileMenuOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu-content">
            <div className="mobile-menu-header">
              <h3>Menu</h3>
              <button 
                className="close-menu-btn"
                onClick={toggleMobileMenu}
              >
                <X size={20} />
              </button>
                </div>
            <div className="mobile-menu-items">
              <button 
                className={`mobile-menu-item ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={() => {
                  setActiveView('dashboard');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Activity size={20} />
                <span>Dashboard</span>
              </button>
                      <button 
                className={`mobile-menu-item ${activeView === 'passengers' ? 'active' : ''}`}
                onClick={() => {
                  setActiveView('passengers');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Users size={20} />
                <span>Passengers</span>
                      </button>
                      <button 
                className={`mobile-menu-item ${activeView === 'scanning' ? 'active' : ''}`}
                onClick={() => {
                  setActiveView('scanning');
                  setIsMobileMenuOpen(false);
                }}
              >
                <QrCode size={20} />
                <span>Scan Tickets</span>
                      </button>
            </div>
          </div>
            </div>
      )}

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="dashboard-view">
            {/* Quick Actions */}
            <div className="quick-actions">
              <button 
                className={`quick-action-btn ${dutyStatus === 'active' ? 'end-duty' : 'start-duty'}`}
                onClick={dutyStatus === 'active' ? endDuty : startDuty}
              >
                <div className="action-icon">
                  {dutyStatus === 'active' ? <CheckCircle size={24} /> : <Play size={24} />}
              </div>
                <div className="action-text">
                  <span className="action-title">
                    {dutyStatus === 'active' ? 'End Duty' : 'Start Duty'}
                  </span>
                  <span className="action-subtitle">
                    {dutyStatus === 'active' ? 'Complete your duty' : 'Begin ticket scanning'}
                  </span>
            </div>
              </button>

              <button 
                className="quick-action-btn scan-tickets"
                onClick={() => setActiveView('scanning')}
              >
                <div className="action-icon">
                  <QrCode size={24} />
                </div>
                <div className="action-text">
                  <span className="action-title">Scan Tickets</span>
                  <span className="action-subtitle">QR code validation</span>
                </div>
              </button>

              <button 
                className="quick-action-btn passenger-list"
                onClick={() => setActiveView('passengers')}
              >
                <div className="action-icon">
                  <Users size={24} />
                </div>
                <div className="action-text">
                  <span className="action-title">Passenger List</span>
                  <span className="action-subtitle">Manage passengers</span>
                </div>
              </button>

              <button 
                className="quick-action-btn vacant-seats"
                onClick={() => setShowVacantBooking(true)}
              >
                <div className="action-icon">
                  <Plus size={24} />
                </div>
                <div className="action-text">
                  <span className="action-title">Vacant Seats</span>
                  <span className="action-subtitle">Sell available seats</span>
                </div>
              </button>
          </div>

            {/* Live Status Widgets */}
            <div className="status-widgets">
              <div className="status-widget">
                <div className="widget-header">
                  <Users size={16} />
                  <span>Passengers</span>
            </div>
                <div className="widget-content">
                  <div className="stat-row">
                    <span className="stat-label">Boarded:</span>
                    <span className="stat-value boarded">{passengers.filter(p => p.status === 'boarded').length}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Expected:</span>
                    <span className="stat-value expected">{passengers.filter(p => p.status === 'expected').length}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Total Seats:</span>
                    <span className="stat-value total">{tripInfo.totalSeats}</span>
            </div>
          </div>
        </div>

              <div className="status-widget">
                <div className="widget-header">
                  <MapPin size={16} />
                  <span>Route Status</span>
                </div>
                <div className="widget-content">
                  <div className="stat-row">
                    <span className="stat-label">Current:</span>
                    <span className="stat-value current">{tripInfo.currentStop}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Next:</span>
                    <span className="stat-value next">{tripInfo.nextStop}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Progress:</span>
                    <span className="stat-value progress">{tripInfo.progress}%</span>
              </div>
            </div>
          </div>

              <div className="status-widget">
                <div className="widget-header">
                  <Ticket size={16} />
                  <span>Tickets Scanned</span>
            </div>
                <div className="widget-content">
                  <div className="stat-row">
                    <span className="stat-label">Today:</span>
                    <span className="stat-value scanned">{scanHistory.filter(s => s.success).length}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Failed:</span>
                    <span className="stat-value failed">{scanHistory.filter(s => !s.success).length}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Success Rate:</span>
                    <span className="stat-value success">
                      {scanHistory.length > 0 ? Math.round((scanHistory.filter(s => s.success).length / scanHistory.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trip Progress Indicator */}
            <div className="trip-progress">
              <div className="progress-header">
                <h3>Trip Progress</h3>
                <span className="progress-percentage">{tripInfo.progress}% Complete</span>
              </div>
              <div className="progress-bar-large">
                <div className="progress-fill-large" style={{ width: `${tripInfo.progress}%` }}></div>
              </div>
              <div className="progress-stops">
                <div className="stop-item completed">
                  <div className="stop-dot"></div>
                  <span>Kochi Central</span>
                </div>
                <div className="stop-item completed">
                  <div className="stop-dot"></div>
                  <span>Edappally</span>
                </div>
                <div className="stop-item current">
                  <div className="stop-dot"></div>
                  <span>Cherthala</span>
                </div>
                <div className="stop-item pending">
                  <div className="stop-dot"></div>
                  <span>Alappuzha</span>
                </div>
              </div>
            </div>

            {/* Alerts/Notifications */}
            {alerts.length > 0 && (
              <div className="alerts-section">
                <div className="alerts-header">
                  <AlertTriangle size={16} />
                  <span>Recent Alerts</span>
          </div>
                <div className="alerts-list">
                  {alerts.slice(0, 3).map(alert => (
                    <div key={alert.id} className={`alert-item ${alert.type}`}>
                      <div className="alert-icon">
                        {alert.type === 'error' ? <AlertCircle size={14} /> :
                         alert.type === 'warning' ? <AlertTriangle size={14} /> :
                         <Bell size={14} />}
                      </div>
                      <div className="alert-content">
                        <span className="alert-message">{alert.message}</span>
                        <span className="alert-time">{alert.time}</span>
                      </div>
                  </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Passengers View */}
        {activeView === 'passengers' && (
          <div className="passengers-view">
            <div className="view-header">
              <h2>Passenger Management</h2>
              <p>Manage current passengers and seat assignments</p>
            </div>
            
            <div className="passenger-management">
              <div className="passenger-controls">
                <div className="filter-controls">
                  <button 
                    className={`filter-btn ${passengerFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setPassengerFilter('all')}
                  >
                    <Users size={16} />
                    <span>All</span>
                    <span className="filter-count">{passengers.length}</span>
                  </button>
                  <button 
                    className={`filter-btn ${passengerFilter === 'boarded' ? 'active' : ''}`}
                    onClick={() => setPassengerFilter('boarded')}
                  >
                    <CheckCircle size={16} />
                    <span>Boarded</span>
                    <span className="filter-count">{passengers.filter(p => p.status === 'boarded').length}</span>
                  </button>
                  <button 
                    className={`filter-btn ${passengerFilter === 'expected' ? 'active' : ''}`}
                    onClick={() => setPassengerFilter('expected')}
                  >
                    <Clock size={16} />
                    <span>Expected</span>
                    <span className="filter-count">{passengers.filter(p => p.status === 'expected').length}</span>
                  </button>
                  <button 
                    className={`filter-btn ${passengerFilter === 'no_show' ? 'active' : ''}`}
                    onClick={() => setPassengerFilter('no_show')}
                  >
                    <XCircle size={16} />
                    <span>No Show</span>
                    <span className="filter-count">{passengers.filter(p => p.status === 'no_show').length}</span>
                  </button>
                </div>
                
                <div className="search-sort-controls">
                  <div className="search-control">
                    <Search size={16} />
                    <input 
                      type="text"
                      placeholder="Search passengers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  
                  <div className="sort-control">
                    <ArrowUpDown size={16} />
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      className="sort-select"
                    >
                      <option value="seat">Sort by Seat</option>
                      <option value="name">Sort by Name</option>
                      <option value="stop">Sort by Stop</option>
                      <option value="status">Sort by Status</option>
                      <option value="pnr">Sort by PNR</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="passenger-list">
                {passengers
                  .filter(p => {
                    // Status filter
                    const statusMatch = passengerFilter === 'all' || p.status === passengerFilter;
                    
                    // Search filter
                    const searchMatch = !searchQuery || 
                      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.pnr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.seat.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.boardingStop.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.destination.toLowerCase().includes(searchQuery.toLowerCase());
                    
                    return statusMatch && searchMatch;
                  })
                  .sort((a, b) => {
                    switch(sortBy) {
                      case 'seat': return a.seat.localeCompare(b.seat);
                      case 'name': return a.name.localeCompare(b.name);
                      case 'stop': return a.boardingStop.localeCompare(b.boardingStop);
                      case 'status': return a.status.localeCompare(b.status);
                      case 'pnr': return a.pnr.localeCompare(b.pnr);
                      default: return 0;
                    }
                  })
                  .map(passenger => (
                    <div key={passenger.id} className={`passenger-item ${passenger.status}`}>
                      <div className="passenger-info">
                        <div className="passenger-name">{passenger.name}</div>
                        <div className="passenger-details">
                          <span className="seat">Seat: {passenger.seat}</span>
                          <span className="pnr">PNR: {passenger.pnr}</span>
                        </div>
                        <div className="passenger-route">
                          {passenger.boardingStop} → {passenger.destination}
                        </div>
                      </div>
                      <div className="passenger-status">
                        <span className={`status-badge ${passenger.status}`}>
                          {passenger.status === 'boarded' ? '✓ Boarded' : 
                           passenger.status === 'expected' ? '⏳ Expected' : '❌ No Show'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Scanning View */}
        {activeView === 'scanning' && (
          <div className="scanning-view">
            <div className="view-header">
              <h2>QR Ticket Scanning</h2>
              <p>Scan passenger tickets for validation</p>
            </div>
            
            <div className="qr-scanning-section">
              <div className="scan-area">
                <div className={`scan-camera ${isScanning ? 'scanning' : ''}`}>
                  <Camera size={48} />
                  {isScanning ? (
                    <div className="scanning-overlay">
                      <div className="scan-line"></div>
                      <p>Scanning...</p>
                    </div>
                  ) : (
                    <p>Tap to start scanning</p>
                  )}
                </div>
                
                <button 
                  className={`scan-btn ${isScanning ? 'scanning' : ''}`}
                  onClick={startQRScan}
                  disabled={isScanning}
                >
                  {isScanning ? 'Scanning...' : 'Start QR Scan'}
                </button>
              </div>
              
              {scanResult && (
                <div className={`scan-result ${scanResult.success ? 'success' : 'error'}`}>
                  <div className="result-icon">
                    {scanResult.success ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                  </div>
                  <div className="result-details">
                    <h4>{scanResult.success ? 'Ticket Validated!' : 'Scan Failed'}</h4>
                    {scanResult.success ? (
                      <div className="ticket-info">
                        <p><strong>PNR:</strong> {scanResult.pnr}</p>
                        <p><strong>Passenger:</strong> {scanResult.passenger}</p>
                        <p><strong>Seat:</strong> {scanResult.seat}</p>
                </div>
                    ) : (
                      <p>Invalid or duplicate ticket. Please try again.</p>
                    )}
            </div>
          </div>
        )}

              <div className="scan-history">
                <h4>Recent Scans</h4>
                <div className="history-list">
                  {scanHistory.slice(0, 5).map((scan, index) => (
                    <div key={index} className={`history-item ${scan.success ? 'success' : 'error'}`}>
                      <span className="scan-time">{new Date().toLocaleTimeString()}</span>
                      <span className="scan-pnr">{scan.pnr}</span>
                      <span className="scan-status">{scan.success ? '✓' : '✗'}</span>
            </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConductorDashboard;