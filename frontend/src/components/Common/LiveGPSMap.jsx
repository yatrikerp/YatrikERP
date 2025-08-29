import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Radio, Settings, Play, Pause, Maximize2, Minimize2, Layers, Filter } from 'lucide-react';
import './LiveGPSMap.css';

// India major cities and transport hubs with coordinates
const INDIA_CITIES = {
  'Mumbai': { lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  'Delhi': { lat: 28.7041, lng: 77.1025, state: 'Delhi' },
  'Bangalore': { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  'Hyderabad': { lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  'Chennai': { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  'Kolkata': { lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  'Pune': { lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
  'Jaipur': { lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
  'Surat': { lat: 21.1702, lng: 72.8311, state: 'Gujarat' },
  'Lucknow': { lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh' },
  'Kanpur': { lat: 26.4499, lng: 80.3319, state: 'Uttar Pradesh' },
  'Nagpur': { lat: 21.1458, lng: 79.0882, state: 'Maharashtra' },
  'Indore': { lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh' },
  'Thane': { lat: 19.2183, lng: 72.9781, state: 'Maharashtra' },
  'Bhopal': { lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh' },
  'Visakhapatnam': { lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh' },
  'Pimpri-Chinchwad': { lat: 18.6298, lng: 73.7997, state: 'Maharashtra' },
  'Patna': { lat: 25.5941, lng: 85.1376, state: 'Bihar' },
  'Vadodara': { lat: 22.3072, lng: 73.1812, state: 'Gujarat' }
};

// Sample route data for demonstration
const SAMPLE_ROUTES = [
  {
    id: 'R001',
    name: 'Mumbai - Pune Express',
    from: 'Mumbai',
    to: 'Pune',
    distance: '148 km',
    duration: '3h 30m',
    status: 'active',
    busNumber: 'MH-01-AB-1234',
    driver: 'Rajesh Kumar',
    conductor: 'Amit Patel',
    currentLocation: { lat: 19.0760, lng: 72.8777 },
    progress: 0,
    speed: 45,
    eta: '2h 15m',
    stops: ['Mumbai Central', 'Thane', 'Kalyan', 'Lonavala', 'Pune']
  },
  {
    id: 'R002',
    name: 'Delhi - Jaipur Highway',
    from: 'Delhi',
    to: 'Jaipur',
    distance: '280 km',
    duration: '5h 45m',
    status: 'active',
    busNumber: 'DL-02-CD-5678',
    driver: 'Suresh Singh',
    conductor: 'Vikram Mehta',
    currentLocation: { lat: 28.7041, lng: 77.1025 },
    progress: 25,
    speed: 52,
    eta: '4h 20m',
    stops: ['Delhi ISBT', 'Gurgaon', 'Rewari', 'Bhiwadi', 'Jaipur']
  },
  {
    id: 'R003',
    name: 'Bangalore - Chennai Route',
    from: 'Bangalore',
    to: 'Chennai',
    distance: '350 km',
    duration: '7h 15m',
    status: 'active',
    busNumber: 'KA-03-EF-9012',
    driver: 'Krishna Reddy',
    conductor: 'Srinivas Rao',
    currentLocation: { lat: 12.9716, lng: 77.5946 },
    progress: 15,
    speed: 48,
    eta: '6h 45m',
    stops: ['Bangalore Central', 'Hosur', 'Krishnagiri', 'Vellore', 'Chennai']
  }
];

const LiveGPSMap = ({ isFullScreen, onToggleFullScreen }) => {
  console.log('LiveGPSMap component rendered'); // Debug log
  
  const [activeRoutes, setActiveRoutes] = useState(SAMPLE_ROUTES);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const [mapView, setMapView] = useState('satellite'); // satellite, terrain, street
  const [showSettings, setShowSettings] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const mapRef = useRef(null);
  const intervalRef = useRef(null);

  // Simulate real-time GPS updates
  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(() => {
        setActiveRoutes(prevRoutes => 
          prevRoutes.map(route => {
            if (route.status === 'active') {
              // Simulate movement along route
              const progress = Math.min(route.progress + Math.random() * 2, 100);
              const newLat = route.currentLocation.lat + (Math.random() - 0.5) * 0.01;
              const newLng = route.currentLocation.lng + (Math.random() - 0.5) * 0.01;
              
              return {
                ...route,
                progress,
                currentLocation: { lat: newLat, lng: newLng },
                speed: Math.max(35, Math.min(65, route.speed + (Math.random() - 0.5) * 10)),
                eta: calculateETA(progress, route.duration)
              };
            }
            return route;
          })
        );
      }, refreshInterval);

      return () => clearInterval(intervalRef.current);
    }
  }, [isLive, refreshInterval]);

  const calculateETA = (progress, duration) => {
    const remaining = (100 - progress) / 100;
    const totalMinutes = parseFloat(duration.replace('h', '')) * 60;
    const remainingMinutes = Math.round(remaining * totalMinutes);
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const toggleLiveUpdates = () => {
    setIsLive(!isLive);
  };

  const handleRouteSelect = (route) => {
    setSelectedRoute(selectedRoute?.id === route.id ? null : route);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#00A86B';
      case 'delayed': return '#FFB300';
      case 'maintenance': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getProgressColor = (progress) => {
    if (progress < 30) return '#F44336';
    if (progress < 70) return '#FFB300';
    return '#00A86B';
  };

  return (
    <div className={`live-gps-container ${isFullScreen ? 'fullscreen' : ''}`}>
      {/* Header Controls */}
      <div className="gps-header">
        <div className="gps-title">
          <Navigation className="gps-title-icon" />
          <h2>Live Route Monitoring</h2>
          <span className={`live-indicator ${isLive ? 'active' : ''}`}>
            <Radio className="live-icon" />
            {isLive ? 'LIVE' : 'PAUSED'}
          </span>
        </div>
        
        <div className="gps-controls">
          <button 
            className={`control-btn ${isLive ? 'active' : ''}`}
            onClick={toggleLiveUpdates}
            title={isLive ? 'Pause Updates' : 'Resume Updates'}
          >
            {isLive ? <Pause className="control-icon" /> : <Play className="control-icon" />}
          </button>
          
          <button 
            className="control-btn"
            onClick={() => setMapView(mapView === 'satellite' ? 'terrain' : mapView === 'terrain' ? 'street' : 'satellite')}
            title="Change Map View"
          >
            <Layers className="control-icon" />
          </button>
          
          <button 
            className="control-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings className="control-icon" />
          </button>
          
          <button 
            className="control-btn"
            onClick={onToggleFullScreen}
            title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullScreen ? <Minimize2 className="control-icon" /> : <Maximize2 className="control-icon" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="gps-main">
        {/* Map Area */}
        <div className="gps-map-area">
          <div className="map-container" ref={mapRef}>
            <div className="map-overlay">
              <div className="map-type-indicator">
                {mapView.charAt(0).toUpperCase() + mapView.slice(1)} View
              </div>
              
              {/* India Map Outline */}
              <div className="india-outline">
                <svg viewBox="0 0 1000 1000" className="india-svg">
                  <path 
                    d="M 200 300 Q 250 250 300 300 Q 350 350 400 300 Q 450 250 500 300 Q 550 350 600 300 Q 650 250 700 300 Q 750 350 800 300 L 800 400 Q 750 450 700 400 Q 650 350 600 400 Q 550 450 500 400 Q 450 350 400 400 Q 350 450 300 400 Q 250 350 200 400 Z" 
                    fill="rgba(233, 30, 99, 0.1)" 
                    stroke="rgba(233, 30, 99, 0.3)" 
                    strokeWidth="2"
                  />
                </svg>
              </div>

              {/* Route Markers */}
              {activeRoutes.map((route) => (
                <div 
                  key={route.id}
                  className={`route-marker ${selectedRoute?.id === route.id ? 'selected' : ''}`}
                  style={{
                    left: `${50 + (route.currentLocation.lng - 70) * 100}%`,
                    top: `${50 - (route.currentLocation.lat - 20) * 100}%`
                  }}
                  onClick={() => handleRouteSelect(route)}
                >
                  <div className="marker-pulse"></div>
                  <div className="marker-icon">
                    <MapPin className="marker-pin" />
                  </div>
                  <div className="marker-info">
                    <div className="marker-bus">{route.busNumber}</div>
                    <div className="marker-speed">{route.speed} km/h</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Route Information Panel */}
        <div className="gps-sidebar">
          <div className="sidebar-header">
            <h3>Active Routes</h3>
            <div className="route-filter">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Routes</option>
                <option value="active">Active</option>
                <option value="delayed">Delayed</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="routes-list">
            {activeRoutes
              .filter(route => filterStatus === 'all' || route.status === filterStatus)
              .map((route) => (
                <div 
                  key={route.id}
                  className={`route-card ${selectedRoute?.id === route.id ? 'selected' : ''}`}
                  onClick={() => handleRouteSelect(route)}
                >
                  <div className="route-header">
                    <div className="route-name">{route.name}</div>
                    <div 
                      className="route-status"
                      style={{ backgroundColor: getStatusColor(route.status) }}
                    >
                      {route.status}
                    </div>
                  </div>
                  
                  <div className="route-details">
                    <div className="route-info">
                      <span className="route-from">{route.from}</span>
                      <span className="route-arrow">→</span>
                      <span className="route-to">{route.to}</span>
                    </div>
                    
                    <div className="route-stats">
                      <div className="stat-item">
                        <span className="stat-label">Distance:</span>
                        <span className="stat-value">{route.distance}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Speed:</span>
                        <span className="stat-value">{route.speed} km/h</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">ETA:</span>
                        <span className="stat-value">{route.eta}</span>
                      </div>
                    </div>
                    
                    <div className="route-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${route.progress}%`,
                            backgroundColor: getProgressColor(route.progress)
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">{Math.round(route.progress)}% Complete</span>
                    </div>
                    
                    <div className="route-crew">
                      <div className="crew-info">
                        <span className="crew-label">Driver:</span>
                        <span className="crew-name">{route.driver}</span>
                      </div>
                      <div className="crew-info">
                        <span className="crew-name">
                          <span className="crew-label">Conductor:</span>
                          {route.conductor}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="gps-settings">
          <div className="settings-header">
            <h3>GPS Settings</h3>
            <button 
              className="close-btn"
              onClick={() => setShowSettings(false)}
            >
              ×
            </button>
          </div>
          
          <div className="settings-content">
            <div className="setting-group">
              <label>Refresh Interval</label>
              <select 
                value={refreshInterval} 
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="setting-select"
              >
                <option value={2000}>2 seconds</option>
                <option value={5000}>5 seconds</option>
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
              </select>
            </div>
            
            <div className="setting-group">
              <label>Map View</label>
              <select 
                value={mapView} 
                onChange={(e) => setMapView(e.target.value)}
                className="setting-select"
              >
                <option value="satellite">Satellite</option>
                <option value="terrain">Terrain</option>
                <option value="street">Street</option>
              </select>
            </div>
            
            <div className="setting-group">
              <label>Show Route Details</label>
              <input type="checkbox" defaultChecked className="setting-checkbox" />
            </div>
            
            <div className="setting-group">
              <label>Enable Alerts</label>
              <input type="checkbox" defaultChecked className="setting-checkbox" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveGPSMap;
