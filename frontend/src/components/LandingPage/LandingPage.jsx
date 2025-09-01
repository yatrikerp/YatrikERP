import React from 'react';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Top Support Bar */}
      <div className="support-bar">
        <div className="support-item">
          <span className="support-icon">📞</span>
          <span className="support-text">+1 (555) 123-4567</span>
        </div>
        <div className="support-item">
          <span className="support-icon">✉️</span>
          <span className="support-text">support@yatrik.com</span>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="nav-bar">
        <div className="nav-logo">
          <span className="logo-text">YATRIK</span>
          <span className="logo-subtitle">ERP</span>
        </div>
        <div className="nav-links">
          <a href="#home" className="nav-link active">Home</a>
          <a href="#features" className="nav-link">Features</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#contact" className="nav-link">Contact</a>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Smart Bus Travel Management
          </h1>
          <p className="hero-subtitle">
            Streamline your transportation operations with intelligent route optimization, 
            real-time tracking, and comprehensive fleet management.
          </p>
          
          {/* CTA Buttons */}
          <div className="hero-buttons">
            <button className="btn btn-primary">Sign Up</button>
            <button className="btn btn-primary">Book Now</button>
          </div>

          {/* Search Section */}
          <div className="search-section">
            <div className="search-container">
              <div className="search-input-group">
                <input 
                  type="text" 
                  placeholder="Enter destination..." 
                  className="search-input"
                />
                <button className="search-btn">Search</button>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="hero-visual">
          <div className="scenic-background">
            <div className="hills-container">
              <div className="hill hill-1"></div>
              <div className="hill hill-2"></div>
              <div className="hill hill-3"></div>
            </div>
            
            {/* Modern Buses */}
            <div className="bus-container">
              <div className="bus bus-1">
                <div className="bus-body"></div>
                <div className="bus-windows"></div>
                <div className="bus-lights"></div>
              </div>
              <div className="bus bus-2">
                <div className="bus-body"></div>
                <div className="bus-windows"></div>
                <div className="bus-lights"></div>
              </div>
            </div>

            {/* Route Lines and Pins */}
            <div className="route-network">
              <div className="route-line route-1"></div>
              <div className="route-line route-2"></div>
              <div className="route-line route-3"></div>
              
              <div className="location-pin pin-1">
                <div className="pin-icon">📍</div>
                <div className="pin-label">Station A</div>
              </div>
              <div className="location-pin pin-2">
                <div className="pin-icon">📍</div>
                <div className="pin-label">Station B</div>
              </div>
              <div className="location-pin pin-3">
                <div className="pin-icon">📍</div>
                <div className="pin-label">Station C</div>
              </div>
            </div>

            {/* Glowing Dots */}
            <div className="glow-dots">
              <div className="glow-dot dot-1"></div>
              <div className="glow-dot dot-2"></div>
              <div className="glow-dot dot-3"></div>
              <div className="glow-dot dot-4"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="features-section">
        <div className="feature-card">
          <div className="feature-icon">🚌</div>
          <h3 className="feature-title">Route Optimization</h3>
          <p className="feature-description">
            AI-powered route planning for maximum efficiency and cost savings.
          </p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">📱</div>
          <h3 className="feature-title">Real-time Tracking</h3>
          <p className="feature-description">
            Monitor your fleet in real-time with GPS tracking and live updates.
          </p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3 className="feature-title">Analytics Dashboard</h3>
          <p className="feature-description">
            Comprehensive insights and reports for data-driven decisions.
          </p>
        </div>
      </div>

      {/* Additional Sections */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-number">500+</div>
          <div className="stat-label">Buses Managed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">50+</div>
          <div className="stat-label">Routes Optimized</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">10K+</div>
          <div className="stat-label">Happy Customers</div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <h2 className="cta-title">Ready to Transform Your Transportation?</h2>
        <p className="cta-subtitle">Join thousands of companies already using Yatrik ERP</p>
        <div className="cta-buttons">
          <button className="btn btn-primary">Get Started Free</button>
          <button className="btn btn-secondary">Schedule Demo</button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
