import { useState, useEffect } from 'react';
import { FaMapMarkedAlt, FaRoute, FaClock, FaMoneyBillWave, FaBus, FaLocationArrow, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './PublicDashboard.css';

const PublicDashboard = () => {
  const [showMap, setShowMap] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [liveBuses, setLiveBuses] = useState([
    { id: 1, name: 'KSRTC-001', lat: 10.8505, lng: 76.2711, route: 'Kochi → Trivandrum' },
    { id: 2, name: 'KSRTC-002', lat: 11.2588, lng: 75.7804, route: 'Kozhikode → Kochi' },
    { id: 3, name: 'KSRTC-003', lat: 10.5276, lng: 76.2144, route: 'Thrissur → Kozhikode' },
    { id: 4, name: 'KSRTC-004', lat: 11.8745, lng: 75.3704, route: 'Kannur → Trivandrum' }
  ]);

  useEffect(() => {
    // Load Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
    script.async = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleMapToggle = () => {
    setShowMap(!showMap);
  };

  const initializeMap = (mapRef) => {
    if (!mapLoaded || !mapRef) return;

    const map = new window.google.maps.Map(mapRef, {
      center: { lat: 10.8505, lng: 76.2711 }, // Kerala center
      zoom: 8,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Add live bus markers
    liveBuses.forEach(bus => {
      const marker = new window.google.maps.Marker({
        position: { lat: bus.lat, lng: bus.lng },
        map: map,
        title: bus.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#ff6b35"/>
              <path d="M8 8h8v8H8z" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(24, 24)
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #ff6b35;">${bus.name}</h3>
            <p style="margin: 0; font-size: 12px;">${bus.route}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });
  };

  return (
    <div className="public-dashboard">
      <nav className="nav-container">
        <div className="nav-content">
          <div className="logo-section">
            <div className="big-y-logo">Y</div>
            <div className="logo-text">
              <span className="logo-title">YATRIK</span>
              <span className="logo-subtitle">Smart Bus Booking</span>
            </div>
          </div>
          <div className="nav-links">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </div>
        </div>
      </nav>
      
      <div className="main-content">
        <div className="hero-section">
          <h1 className="hero-title">Welcome to YATRIK</h1>
          <p className="hero-subtitle">Your smart way to travel across Kerala</p>
        </div>
        
        <div className="dashboard-grid">
          {/* Live Bus Map */}
          <div className="dashboard-card map-card">
            <div className="card-header">
              <div className="card-icon">
                <FaMapMarkedAlt />
              </div>
              <div className="card-title">Live Bus Tracker</div>
              <div className="card-subtitle">Real-time bus locations across Kerala</div>
              <button 
                className="map-toggle-btn"
                onClick={handleMapToggle}
              >
                {showMap ? <FaEyeSlash /> : <FaEye />}
                {showMap ? ' Hide Map' : ' Show Map'}
              </button>
            </div>
            
            {showMap && (
              <div className="map-container">
                <div 
                  ref={initializeMap}
                  className="google-map"
                  style={{ width: '100%', height: '400px' }}
                />
                <div className="map-legend">
                  <div className="legend-item">
                    <div className="legend-dot active"></div>
                    <span>Live Buses</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot route"></div>
                    <span>Bus Routes</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="map-stats">
              <div className="stat-item">
                <span className="stat-label">Live Buses</span>
                <span className="stat-value blue">{liveBuses.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Active Routes</span>
                <span className="stat-value green">156</span>
              </div>
            </div>
          </div>

          {/* Route Planner */}
          <div className="dashboard-card">
            <div className="card-icon">
              <FaRoute />
            </div>
            <div className="card-title">Plan Your Journey</div>
            <div className="card-subtitle">Find the best route and book your ticket</div>
            <div className="route-form">
              <div className="input-group">
                <FaLocationArrow className="input-icon" />
                <input type="text" placeholder="From: Kochi" className="form-input" />
              </div>
              <div className="input-group">
                <FaLocationArrow className="input-icon" />
                <input type="text" placeholder="To: Trivandrum" className="form-input" />
              </div>
              <button className="find-route-btn">Find Route</button>
              <div className="route-info">
                <div className="info-card">
                  <div className="info-header">
                    <FaClock className="info-icon" />
                    <span className="info-label">Duration</span>
                  </div>
                  <span className="info-value time">2h 15m</span>
                </div>
                <div className="info-card">
                  <div className="info-header">
                    <FaMoneyBillWave className="info-icon" />
                    <span className="info-label">Fare</span>
                  </div>
                  <span className="info-value price">₹85</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="features-section">
          <h2 className="features-title">Why Choose YATRIK?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <FaBus className="feature-icon" />
              <h3>Real-time Tracking</h3>
              <p>Track your bus in real-time with live GPS updates</p>
            </div>
            <div className="feature-card">
              <FaClock className="feature-icon" />
              <h3>Instant Booking</h3>
              <p>Book tickets instantly with secure payment options</p>
            </div>
            <div className="feature-card">
              <FaRoute className="feature-icon" />
              <h3>Smart Routes</h3>
              <p>Get optimized routes with multiple transport options</p>
            </div>
          </div>
        </div>

        <div className="book-ticket-section">
          <Link to="/register" className="book-ticket-btn">Start Your Journey</Link>
        </div>
      </div>
    </div>
  );
};

export default PublicDashboard;