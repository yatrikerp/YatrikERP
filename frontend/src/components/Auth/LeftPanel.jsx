import React from 'react';
import loginImage from '../../assets/login.png';
import './LeftPanel.css';

const LeftPanel = () => {
  return (
    <div className="left-panel">
      <div className="content-area">
        <div className="text-center relative">
          {/* Background Image (enhanced) */}
          <div className="hero-image-wrap">
            <img 
              src={loginImage} 
              alt="Yatrik ERP Smart Transport Network" 
              className="login-hero-img"
              onError={(e) => {
                console.error('Image failed to load:', e.target.src);
                e.target.style.display = 'none';
              }}
              onLoad={() => console.log('Image loaded successfully')}
            />
          </div>
          
          {/* Animated Route Overlay */}
          <div className="route-overlay">
            <svg 
              viewBox="0 0 600 600" 
              className="route-svg"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Route Definitions */}
              <defs>
                {/* Route Gradient - Light pink/red from image */}
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFC0CB" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#FFB6C1" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#FFC0CB" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              
              {/* Main Circular Route - Enhanced brand colors - OUTSIDE the image */}
              <circle 
                cx="300" 
                cy="300" 
                r="280" 
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="6"
                strokeDasharray="25,20"
                className="main-route"
              />
              
              {/* Location Pins Inside Image - Enhanced teal/cyan */}
              <g className="location-pins-inside">
                {/* Pin 1 - Top Center */}
                <g className="location-pin-inside" transform="translate(300, 108)">
                  <circle cx="0" cy="0" r="10" fill="#00BCD4"/>
                  <circle cx="0" cy="0" r="5" fill="#FFFFFF"/>
                  <path d="M 0 -10 L -7 0 L 7 0 Z" fill="#00BCD4"/>
                </g>
                
                {/* Pin 2 - Right Center */}
                <g className="location-pin-inside" transform="translate(492, 300)">
                  <circle cx="0" cy="0" r="10" fill="#00BCD4"/>
                  <circle cx="0" cy="0" r="5" fill="#FFFFFF"/>
                  <path d="M 0 -10 L -7 0 L 7 0 Z" fill="#00BCD4"/>
                </g>
                
                {/* Pin 3 - Bottom Center */}
                <g className="location-pin-inside" transform="translate(300, 492)">
                  <circle cx="0" cy="0" r="10" fill="#00BCD4"/>
                  <circle cx="0" cy="0" r="5" fill="#FFFFFF"/>
                  <path d="M 0 -10 L -7 0 L 7 0 Z" fill="#00BCD4"/>
                </g>
                
                {/* Pin 4 - Left Center */}
                <g className="location-pin-inside" transform="translate(108, 300)">
                  <circle cx="0" cy="0" r="10" fill="#00BCD4"/>
                  <circle cx="0" cy="0" r="5" fill="#FFFFFF"/>
                  <path d="M 0 -10 L -7 0 L 7 0 Z" fill="#00BCD4"/>
                </g>
                
                {/* Pin 5 - Top Right */}
                <g className="location-pin-inside" transform="translate(420, 180)">
                  <circle cx="0" cy="0" r="10" fill="#00BCD4"/>
                  <circle cx="0" cy="0" r="5" fill="#FFFFFF"/>
                  <path d="M 0 -10 L -7 0 L 7 0 Z" fill="#00BCD4"/>
                </g>
                
                {/* Pin 6 - Bottom Left */}
                <g className="location-pin-inside" transform="translate(180, 420)">
                  <circle cx="0" cy="0" r="10" fill="#00BCD4"/>
                  <circle cx="0" cy="0" r="5" fill="#FFFFFF"/>
                  <path d="M 0 -10 L -7 0 L 7 0 Z" fill="#00BCD4"/>
                </g>
                
                {/* Pin 7 - Top Left */}
                <g className="location-pin-inside" transform="translate(180, 180)">
                  <circle cx="0" cy="0" r="10" fill="#00BCD4"/>
                  <circle cx="0" cy="0" r="5" fill="#FFFFFF"/>
                  <path d="M 0 -10 L -7 0 L 7 0 Z" fill="#00BCD4"/>
                </g>
                
                {/* Pin 8 - Bottom Right */}
                <g className="location-pin-inside" transform="translate(420, 420)">
                  <circle cx="0" cy="0" r="10" fill="#00BCD4"/>
                  <circle cx="0" cy="0" r="5" fill="#FFFFFF"/>
                  <path d="M 0 -10 L -7 0 L 7 0 Z" fill="#00BCD4"/>
                </g>
              </g>
              
              {/* Outer markers just outside the rotating arc */}
              <g className="outer-markers">
                {/* Right marker (points inward) */}
                <g transform="translate(630,300)">
                  <polygon points="-10,0 8,-7 8,7" className="outer-marker" />
                </g>
                {/* Left marker */}
                <g transform="translate(-30,300) rotate(180)">
                  <polygon points="-10,0 8,-7 8,7" className="outer-marker" />
                </g>
                {/* Top marker */}
                <g transform="translate(300,-30) rotate(90)">
                  <polygon points="-10,0 8,-7 8,7" className="outer-marker" />
                </g>
                {/* Bottom marker */}
                <g transform="translate(300,630) rotate(270)">
                  <polygon points="-10,0 8,-7 8,7" className="outer-marker" />
                </g>
              </g>
              
              {/* Signin Button Color Arc with Rotation */}
              <g className="outer-arc">
                {/* Main outer arc - signin button color with rotation */}
                <circle 
                  cx="300" 
                  cy="300" 
                  r="290" 
                  fill="none"
                  stroke="#E91E63"
                  strokeWidth="5"
                  strokeDasharray="25,20"
                  className="outer-arc-main"
                />
              </g>

            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
