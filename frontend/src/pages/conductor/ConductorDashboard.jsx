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
  RefreshCw,
  Fuel,
  AlertTriangle,
  Bus,
  Bell,
  Wrench,
  AlertCircle,
  Users,
  QrCode,
  Settings
} from 'lucide-react';

const ConductorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // State management
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dutyStatus, setDutyStatus] = useState('assigned'); // not_assigned, assigned, active, completed
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications] = useState(3);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Refresh dashboard data
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
    <div className="conductor-dashboard">
      {/* Compact Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <div className="logo-icon">
              <Bus size={14} />
            </div>
            <div className="logo-text">
              <h1>YATRIK ERP</h1>
            </div>
        </div>
      </div>

        <div className="header-center">
          <div className="current-time">
            {currentTime.toLocaleTimeString()}
            </div>
          <div className="duty-status-indicator">
            <div className={`duty-status-dot ${dutyStatus}`}></div>
            <span className="duty-status-text">
              {dutyStatus === 'not_assigned' ? 'Off' : 
               dutyStatus === 'assigned' ? 'Ready' :
               dutyStatus === 'active' ? 'Active' : 'Done'}
              </span>
              </div>
            </div>
            
        <div className="header-right">
          <button className="notification-btn">
            <Bell size={14} />
            {notifications > 0 && (
              <span className="notification-badge">{notifications}</span>
            )}
              </button>
          <button className="logout-btn-header" onClick={handleLogout}>
            <LogOut size={12} />
          </button>
        </div>
      </div>


      {/* 3-Column Main Layout */}
      <div className="dashboard-content">
        
        {/* Conditional Content Based on Active Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Left Sidebar - Profile & Controls */}
            <div className="left-sidebar">
          {/* Conductor Profile */}
          <div className="compact-card profile-card">
            <div className="card-header">
              <h3>Conductor Profile</h3>
            </div>
            <div className="card-content">
              <div className="profile-info">
                <h4>{user?.name || 'Joel'}</h4>
                <p>ID: {user?.id?.slice(-8) || '88c8'}</p>
                <div className="status-badge">
                  <div className={`status-dot ${dutyStatus}`}></div>
                  <span>{dutyStatus === 'active' ? 'On Duty' : 'Ready'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Vehicle Status & Duty Controls */}
          <div className="compact-card vehicle-controls-card">
            <div className="card-header">
              <h3>Vehicle & Controls</h3>
                </div>
            <div className="card-content">
              <div className="status-grid-compact">
                <div className="status-item-compact">
                  <CheckCircle size={14} />
                  <span>Engine: Normal</span>
                </div>
                <div className="status-item-compact">
                  <MapPin size={14} />
                  <span>GPS: Active</span>
                </div>
                <div className="status-item-compact">
                  <Fuel size={14} />
                  <span>Fuel: 85%</span>
                </div>
                <div className="status-item-compact">
                  <Activity size={14} />
                  <span>Speed: 0 km/h</span>
                </div>
              </div>
              <div className="duty-controls">
                      <button 
                  className="duty-btn primary"
                onClick={() => {
                  if (dutyStatus === 'assigned') {
                    setDutyStatus('active');
                  } else if (dutyStatus === 'active') {
                    setDutyStatus('completed');
                  }
                }}
                disabled={dutyStatus === 'not_assigned'}
              >
                  <Play size={16} />
                {dutyStatus === 'assigned' ? 'Start Duty' : 
                   dutyStatus === 'active' ? 'End Duty' : 'No Duty'}
                      </button>
                      <button 
                  className="duty-btn secondary"
                onClick={refreshDashboard}
                disabled={isRefreshing}
                      >
                  <RefreshCw size={14} className={isRefreshing ? 'spinning' : ''} />
                  Refresh
                      </button>
              </div>
            </div>
          </div>

          {/* ETA Controls */}
          <div className="compact-card eta-card">
            <div className="card-header">
              <h3>ETA Management</h3>
            </div>
            <div className="card-content">
              <div className="eta-buttons">
                <button className="eta-btn on-time">On Time</button>
                <button className="eta-btn delay">+10min</button>
                <button className="eta-btn delay">+20min</button>
                <button className="eta-btn major-delay">+30min</button>
              </div>
            </div>
                      </div>
                      </div>

        {/* Center Content - Trip Status & Performance */}
        <div className="center-content">
          {/* Trip Status Header */}
          <div className="trip-status-header">
            <h2>Current Trip Status</h2>
            <p>Kochi → Alappuzha • KL-07-CD-5678</p>
                    </div>
                    
          {/* Performance Summary - 2x2 Grid */}
          <div className="compact-card performance-card">
            <div className="card-header">
              <h3>Performance Summary</h3>
            </div>
            <div className="card-content">
              <div className="performance-grid">
                <div className="perf-item">
                  <div className="perf-icon" style={{background: '#00A86B'}}>
                    <CheckCircle size={16} />
                  </div>
                  <div className="perf-data">
                    <div className="perf-value">98%</div>
                    <div className="perf-label">On-Time</div>
                  </div>
                </div>
                <div className="perf-item">
                  <div className="perf-icon" style={{background: '#1976D2'}}>
                    <Users size={16} />
                  </div>
                  <div className="perf-data">
                    <div className="perf-value">47</div>
                    <div className="perf-label">Passengers</div>
                  </div>
                </div>
                <div className="perf-item">
                  <div className="perf-icon" style={{background: '#FFB300'}}>
                    <Fuel size={16} />
                  </div>
                  <div className="perf-data">
                    <div className="perf-value">12.5L</div>
                    <div className="perf-label">Fuel Used</div>
                  </div>
                      </div>
                <div className="perf-item">
                  <div className="perf-icon" style={{background: '#E91E63'}}>
                    <Activity size={16} />
                    </div>
                  <div className="perf-data">
                    <div className="perf-value">45</div>
                    <div className="perf-label">Avg Speed</div>
          </div>
          </div>
                      </div>
                      </div>
                    </div>
                    
          {/* Live Bus Status - Half Height */}
          <div className="compact-card bus-status-card">
          <div className="card-header">
              <h3>Live Bus Status</h3>
          </div>
          <div className="card-content">
              <div className="status-info-grid">
                <div className="info-row">
                  <span className="info-label">Location:</span>
                  <span className="info-value">Cherthala Junction</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Next Stop:</span>
                  <span className="info-value">2.3 km (5 min)</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Passengers:</span>
                  <span className="info-value">23/45 seats</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Progress:</span>
                  <span className="info-value">60% Complete</span>
                </div>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>

          {/* Trip Progress */}
          <div className="compact-card trip-progress-card">
            <div className="card-header">
              <h3>Route Timeline</h3>
            </div>
            <div className="card-content">
              <div className="timeline-compact">
                <div className="timeline-stop completed">
                  <div className="stop-dot"></div>
                  <div className="stop-info">
                    <span className="stop-name">Kochi Central</span>
                    <span className="stop-time">09:00</span>
                  </div>
                </div>
                <div className="timeline-stop completed">
                  <div className="stop-dot"></div>
                  <div className="stop-info">
                    <span className="stop-name">Edappally</span>
                    <span className="stop-time">09:15</span>
                  </div>
                </div>
                <div className="timeline-stop current">
                  <div className="stop-dot"></div>
                  <div className="stop-info">
                    <span className="stop-name">Cherthala</span>
                    <span className="stop-time">09:30</span>
              </div>
                </div>
                <div className="timeline-stop pending">
                  <div className="stop-dot"></div>
                  <div className="stop-info">
                    <span className="stop-name">Alappuzha</span>
                    <span className="stop-time">09:45</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Passengers & Maintenance */}
        <div className="right-sidebar">
          {/* Recent Passengers */}
          <div className="compact-card passengers-card">
          <div className="card-header">
              <h3>Recent Passengers</h3>
          </div>
          <div className="card-content">
              <div className="passengers-list">
                <div className="passenger-item">
                  <div className="passenger-info">
                    <span className="passenger-name">Rajesh Kumar</span>
                    <span className="passenger-details">A12 • ₹45</span>
                  </div>
                </div>
                <div className="passenger-item">
                  <div className="passenger-info">
                    <span className="passenger-name">Priya Menon</span>
                    <span className="passenger-details">B08 • ₹25</span>
                  </div>
                </div>
                <div className="passenger-item">
                  <div className="passenger-info">
                    <span className="passenger-name">Suresh Nair</span>
                    <span className="passenger-details">C15 • ₹35</span>
                  </div>
                </div>
                <div className="passenger-item">
                  <div className="passenger-info">
                    <span className="passenger-name">Anita Raj</span>
                    <span className="passenger-details">A05 • ₹40</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance Alerts */}
          <div className="compact-card maintenance-card">
            <div className="card-header">
              <h3>Maintenance Alerts</h3>
            </div>
            <div className="card-content">
              <div className="alerts-list">
                <div className="alert-item warning">
                  <div className="alert-icon">
                    <Wrench size={12} />
                  </div>
                  <div className="alert-info">
                    <span className="alert-title">Oil Change Due</span>
                    <span className="alert-time">500 km remaining</span>
                  </div>
                </div>
                <div className="alert-item info">
                  <div className="alert-icon">
                    <CheckCircle size={12} />
                  </div>
                  <div className="alert-info">
                    <span className="alert-title">Tire Pressure OK</span>
                    <span className="alert-time">All normal</span>
                  </div>
                </div>
                <div className="alert-item critical">
                  <div className="alert-icon">
                    <AlertCircle size={12} />
              </div>
                  <div className="alert-info">
                    <span className="alert-title">Engine Check</span>
                    <span className="alert-time">Minor vibration</span>
              </div>
              </div>
            </div>
          </div>
        </div>

          {/* Today's Summary */}
          <div className="compact-card summary-card">
          <div className="card-header">
              <h3>Today's Summary</h3>
          </div>
          <div className="card-content">
              <div className="summary-stats">
                <div className="summary-item">
                  <span className="summary-label">Distance</span>
                  <span className="summary-value">125km</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Earnings</span>
                  <span className="summary-value">₹1,850</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Trips</span>
                  <span className="summary-value">3</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Fuel</span>
                  <span className="summary-value">85%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        {/* GPS Tracking Tab */}
        {activeTab === 'gps' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>GPS Tracking</h2>
              <p>Real-time vehicle location and route tracking</p>
                      </div>
            <div className="compact-card">
              <div className="card-header">
                <h3>Current Location</h3>
                      </div>
              <div className="card-content">
                <div className="location-info">
                  <div className="info-row">
                    <span className="info-label">Current Position:</span>
                    <span className="info-value">Cherthala Junction</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Speed:</span>
                    <span className="info-value">45 km/h</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Direction:</span>
                    <span className="info-value">North-East</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fuel Monitor Tab */}
        {activeTab === 'fuel' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Fuel Monitor</h2>
              <p>Vehicle fuel consumption and efficiency tracking</p>
            </div>
            <div className="compact-card">
              <div className="card-header">
                <h3>Fuel Status</h3>
                </div>
              <div className="card-content">
                <div className="fuel-info">
                  <div className="fuel-gauge">
                    <div className="fuel-level" style={{width: '85%'}}></div>
                      </div>
                  <div className="fuel-stats">
                    <div className="stat-item">
                      <span className="stat-label">Current Level:</span>
                      <span className="stat-value">85%</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Consumption:</span>
                      <span className="stat-value">12.5L/100km</span>
                </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Maintenance</h2>
              <p>Vehicle maintenance schedule and alerts</p>
            </div>
            <div className="compact-card">
              <div className="card-header">
                <h3>Maintenance Schedule</h3>
              </div>
              <div className="card-content">
                <div className="maintenance-list">
                  <div className="maintenance-item urgent">
                    <Wrench size={16} />
                    <div className="maintenance-info">
                      <span className="maintenance-title">Oil Change Due</span>
                      <span className="maintenance-desc">500 km remaining</span>
                    </div>
                  </div>
                  <div className="maintenance-item normal">
                    <CheckCircle size={16} />
                    <div className="maintenance-info">
                      <span className="maintenance-title">Tire Check</span>
                      <span className="maintenance-desc">All normal</span>
                    </div>
                  </div>
                </div>
                        </div>
            </div>
          </div>
        )}

        {/* Ticket Scan Tab */}
        {activeTab === 'tickets' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Ticket Scanning</h2>
              <p>QR code scanning and ticket validation</p>
        </div>
            <div className="compact-card">
            <div className="card-header">
                <h3>QR Scanner</h3>
              </div>
            <div className="card-content">
                <div className="scanner-area">
                  <div className="qr-scanner-placeholder">
                    <QrCode size={48} />
                    <p>Position QR code within the frame</p>
                    <button className="scan-btn">Start Scanning</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Passengers Tab */}
        {activeTab === 'passengers' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Passenger Management</h2>
              <p>Current passengers and seat management</p>
            </div>
            <div className="compact-card">
              <div className="card-header">
                <h3>Current Passengers</h3>
            </div>
              <div className="card-content">
                <div className="passenger-summary">
                  <div className="summary-stat">
                    <span className="stat-number">23</span>
                    <span className="stat-label">Current Passengers</span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-number">45</span>
                    <span className="stat-label">Total Seats</span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-number">22</span>
                    <span className="stat-label">Available Seats</span>
            </div>
          </div>
            </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Settings</h2>
              <p>Application preferences and configurations</p>
            </div>
            <div className="compact-card">
              <div className="card-header">
                <h3>Preferences</h3>
              </div>
              <div className="card-content">
                <div className="settings-list">
                  <div className="setting-item">
                    <span className="setting-label">Notifications</span>
                    <button className="toggle-btn active">ON</button>
          </div>
                  <div className="setting-item">
                    <span className="setting-label">Auto Refresh</span>
                    <button className="toggle-btn active">ON</button>
        </div>
                  <div className="setting-item">
                    <span className="setting-label">Sound Alerts</span>
                    <button className="toggle-btn">OFF</button>
                  </div>
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
