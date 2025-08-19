import React from 'react';
import './LeftPanel.css';
import loginImg from '../../assets/login.png';

const LeftPanel = () => {
  // All numbers are now constant/static
  return (
    <div className="left-panel">
      <div className="lp-hero-container">
        {/* Main hero circle with gradient background */}
        <div className="lp-hero-circle">
          {/* Background image inside circle */}
          <div className="lp-circle-image">
            <img src={loginImg} alt="Transport illustration" className="lp-img" />
            <div className="lp-img-overlay"></div>
          </div>
          
          <div className="lp-hero-bg"></div>
          
          {/* Central YATRIK logo */}
          <div className="lp-logo-container">
            <div className="lp-logo-text">YATRIK</div>
            <div className="lp-logo-subtitle">ERP</div>
          </div>
          
          {/* Animated route network */}
          <svg className="lp-route-network" viewBox="0 0 400 400" aria-hidden="true">
            {/* Central hub */}
            <circle cx="200" cy="200" r="8" className="lp-hub" fill="#E91E63"/>
            
            {/* Route lines radiating from center */}
            <line x1="200" y1="200" x2="80" y2="120" className="lp-route-line" stroke="#22C55E" strokeWidth="3"/>
            <line x1="200" y1="200" x2="320" y2="120" className="lp-route-line" stroke="#22C55E" strokeWidth="3"/>
            <line x1="200" y1="200" x2="320" y2="280" className="lp-route-line" stroke="#22C55E" strokeWidth="3"/>
            <line x1="200" y1="200" x2="80" y2="280" className="lp-route-line" stroke="#22C55E" strokeWidth="3"/>
            
            {/* Diagonal routes */}
            <line x1="200" y1="200" x2="140" y2="140" className="lp-route-line lp-route-diag" stroke="#16A34A" strokeWidth="2"/>
            <line x1="200" y1="200" x2="260" y2="140" className="lp-route-line lp-route-diag" stroke="#16A34A" strokeWidth="2"/>
            <line x1="200" y1="200" x2="260" y2="260" className="lp-route-line lp-route-diag" stroke="#16A34A" strokeWidth="2"/>
            <line x1="200" y1="200" x2="140" y2="260" className="lp-route-line lp-route-diag" stroke="#16A34A" strokeWidth="2"/>
          </svg>
          
          {/* Moving bus icons along routes */}
          <div className="lp-bus lp-bus-1">
            <svg viewBox="0 0 24 24" className="lp-bus-icon">
              <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14S9 14.67 9 15.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="#E91E63"/>
            </svg>
          </div>
          
          <div className="lp-bus lp-bus-2">
            <svg viewBox="0 0 24 24" className="lp-bus-icon">
              <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14S9 14.67 9 15.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="#FF6B35"/>
            </svg>
          </div>
          
          {/* Floating data points */}
          <div className="lp-data-point lp-data-1">
            <div className="lp-data-icon">🚌</div>
            <div className="lp-data-value">24</div>
            <div className="lp-data-label">Buses</div>
          </div>
          
          <div className="lp-data-point lp-data-2">
            <div className="lp-data-icon">📍</div>
            <div className="lp-data-value">0</div>
            <div className="lp-data-label">Routes</div>
          </div>
          
          <div className="lp-data-point lp-data-3">
            <div className="lp-data-icon">👥</div>
            <div className="lp-data-value">0</div>
            <div className="lp-data-label">Users</div>
          </div>
          
          {/* Animated connection dots */}
          <div className="lp-connection-dot lp-dot-1"></div>
          <div className="lp-connection-dot lp-dot-2"></div>
          <div className="lp-connection-dot lp-dot-3"></div>
          <div className="lp-connection-dot lp-dot-4"></div>
        </div>
        
        {/* Background decorative elements */}
        <div className="lp-bg-elements">
          <div className="lp-bg-circle lp-bg-circle-1"></div>
          <div className="lp-bg-circle lp-bg-circle-2"></div>
          <div className="lp-bg-circle lp-bg-circle-3"></div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;


