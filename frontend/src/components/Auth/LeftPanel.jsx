import React from 'react';
import loginImage from '../../assets/login.png';
import './LeftPanel.css';

const LeftPanel = () => {
  return (
    <div className="left-panel">
      <div className="content-area">
        <div className="text-center relative">
          {/* Background Image */}
          <img 
            src={loginImage} 
            alt="Yatrik ERP Smart Transport Network" 
            className="w-96 h-96 rounded-full shadow-xl object-cover"
            onError={(e) => {
              console.error('Image failed to load:', e.target.src);
              e.target.style.display = 'none';
            }}
            onLoad={() => console.log('Image loaded successfully')}
          />
          
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
                r="250" 
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
              
              {/* Route Direction Arrows - Enhanced brand colors - OUTSIDE the image */}
              <g className="direction-arrows">
                {/* Arrow 1 - Right */}
                <path 
                  d="M 560 300 L 545 285 L 545 315 Z"
                  fill="#E91E63"
                  className="direction-arrow"
                />
                
                {/* Arrow 2 - Top */}
                <path 
                  d="M 300 50 L 285 65 L 315 65 Z"
                  fill="#E91E63"
                  className="direction-arrow"
                />
                
                {/* Arrow 3 - Left */}
                <path 
                  d="M 40 300 L 55 285 L 55 315 Z"
                  fill="#E91E63"
                  className="direction-arrow"
                />
                
                {/* Arrow 4 - Bottom */}
                <path 
                  d="M 300 550 L 285 535 L 315 535 Z"
                  fill="#E91E63"
                  className="direction-arrow"
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
