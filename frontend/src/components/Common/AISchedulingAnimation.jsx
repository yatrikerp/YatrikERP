import React, { useEffect, useRef } from 'react';
import './AISchedulingAnimation.css';

const AISchedulingAnimation = () => {
  const svgRef = useRef(null);

  useEffect(() => {
    const startAnimations = () => {
      const svg = svgRef.current;
      if (!svg) return;

      // Staggered animation sequence for professional feel
      const animationSequence = [
        { selector: '.ai-brain', animation: 'brainGlow 3s ease-in-out infinite' },
        { selector: '.ai-circuit', animation: 'circuitFlow 4s linear infinite' },
        { selector: '.calendar-clock', animation: 'calendarTick 2s ease-in-out infinite' },
        { selector: '.route-path', animation: 'routeDraw 6s ease-in-out infinite' },
        { selector: '.moving-bus', animation: 'busMove 8s ease-in-out infinite' },
        { selector: '.depot-radar', animation: 'radarPulse 5s ease-in-out infinite' },
        { selector: '.connection-lines', animation: 'connectionFlow 7s ease-in-out infinite' },
        { selector: '.data-particles', animation: 'particleFloat 6s ease-in-out infinite' }
      ];

      animationSequence.forEach((item, index) => {
        const element = svg.querySelector(item.selector);
        if (element) {
          setTimeout(() => {
            element.style.animation = item.animation;
          }, index * 300);
        }
      });
    };

    const timer = setTimeout(startAnimations, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="ai-scheduling-animation">
      <svg
        ref={svgRef}
        viewBox="0 0 800 600"
        className="ai-scheduling-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Premium Gradients */}
        <defs>
          {/* AI Brain Gradient */}
          <radialGradient id="aiBrainGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4CAF50" />
            <stop offset="50%" stopColor="#2E7D32" />
            <stop offset="100%" stopColor="#1B5E20" />
          </radialGradient>
          
          {/* Circuit Gradient */}
          <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4CAF50" />
            <stop offset="100%" stopColor="#81C784" />
          </linearGradient>
          
          {/* Calendar Gradient */}
          <linearGradient id="calendarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E91E63" />
            <stop offset="100%" stopColor="#FF4081" />
          </linearGradient>
          
          {/* Route Path Gradient */}
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E91E63" />
            <stop offset="50%" stopColor="#FF4081" />
            <stop offset="100%" stopColor="#E91E63" />
          </linearGradient>
          
          {/* Bus Gradient */}
          <linearGradient id="busGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#212121" />
            <stop offset="100%" stopColor="#424242" />
          </linearGradient>
          
          {/* Depot Gradient */}
          <linearGradient id="depotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E91E63" />
            <stop offset="100%" stopColor="#FF4081" />
          </linearGradient>
          
          {/* Radar Pulse Gradient */}
          <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#4CAF50" stopOpacity="0" />
          </radialGradient>

          {/* Premium Filters */}
          <filter id="aiGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="premiumShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.15"/>
          </filter>
        </defs>

        {/* Clean Background */}
        <rect width="100%" height="100%" fill="#F5F5F5"/>
        
        {/* AI Brain - Top Left */}
        <g className="ai-brain" filter="url(#aiGlow)">
          {/* Brain Structure */}
          <ellipse cx="120" cy="120" rx="45" ry="35" fill="url(#aiBrainGradient)" opacity="0.9"/>
          <ellipse cx="120" cy="120" rx="35" ry="25" fill="url(#aiBrainGradient)" opacity="0.7"/>
          
          {/* Neural Network Lines */}
          <g className="ai-circuit">
            <path d="M80 100 Q120 80 160 100" stroke="url(#circuitGradient)" strokeWidth="2" fill="none" opacity="0.8"/>
            <path d="M85 110 Q120 90 155 110" stroke="url(#circuitGradient)" strokeWidth="2" fill="none" opacity="0.6"/>
            <path d="M90 120 Q120 100 150 120" stroke="url(#circuitGradient)" strokeWidth="2" fill="none" opacity="0.7"/>
            
            {/* Circuit Nodes */}
            <circle cx="80" cy="100" r="3" fill="url(#circuitGradient)"/>
            <circle cx="120" cy="80" r="3" fill="url(#circuitGradient)"/>
            <circle cx="160" cy="100" r="3" fill="url(#circuitGradient)"/>
            <circle cx="85" cy="110" r="2" fill="url(#circuitGradient)"/>
            <circle cx="120" cy="90" r="2" fill="url(#circuitGradient)"/>
            <circle cx="155" cy="110" r="2" fill="url(#circuitGradient)"/>
          </g>
          
          {/* AI Text */}
          <text x="120" y="180" textAnchor="middle" fill="#212121" fontSize="14" fontWeight="700" fontFamily="'Segoe UI', sans-serif">
            AI BRAIN
          </text>
        </g>

        {/* Smart Calendar with Clock - Top Center */}
        <g className="calendar-clock" filter="url(#premiumShadow)">
          {/* Calendar Base */}
          <rect x="280" y="80" width="120" height="80" rx="8" fill="url(#calendarGradient)" opacity="0.9"/>
          <rect x="280" y="80" width="120" height="20" rx="8" fill="white" opacity="0.9"/>
          
          {/* Calendar Details */}
          <rect x="290" y="85" width="15" height="10" rx="2" fill="#E91E63"/>
          <rect x="310" y="85" width="15" height="10" rx="2" fill="#E91E63"/>
          <rect x="330" y="85" width="15" height="10" rx="2" fill="#E91E63"/>
          <rect x="350" y="85" width="15" height="10" rx="2" fill="#E91E63"/>
          
          {/* Clock Face */}
          <circle cx="340" cy="130" r="25" fill="white" opacity="0.9"/>
          <circle cx="340" cy="130" r="2" fill="#212121"/>
          
          {/* Clock Hands */}
          <line x1="340" y1="130" x2="340" y2="115" stroke="#212121" strokeWidth="2" strokeLinecap="round"/>
          <line x1="340" y1="130" x2="350" y2="130" stroke="#212121" strokeWidth="2" strokeLinecap="round"/>
          
          {/* Calendar Text */}
          <text x="340" y="175" textAnchor="middle" fill="#212121" fontSize="12" fontWeight="600" fontFamily="'Segoe UI', sans-serif">
            SMART SCHEDULE
          </text>
        </g>

        {/* Auto-Drawing Route Path */}
        <g className="route-path">
          {/* Main Route */}
          <path 
            d="M150 300 Q400 250 650 300" 
            stroke="url(#routeGradient)" 
            strokeWidth="6" 
            fill="none" 
            strokeDasharray="20,10" 
            strokeLinecap="round"
            opacity="0.9"
          />
          
          {/* Secondary Route */}
          <path 
            d="M150 300 Q400 350 650 300" 
            stroke="url(#routeGradient)" 
            strokeWidth="3" 
            fill="none" 
            strokeDasharray="15,8" 
            opacity="0.6" 
            strokeLinecap="round"
          />
          
          {/* Route Nodes */}
          <circle cx="150" cy="300" r="8" fill="url(#routeGradient)" opacity="0.8"/>
          <circle cx="400" cy="250" r="6" fill="url(#routeGradient)" opacity="0.8"/>
          <circle cx="650" cy="300" r="8" fill="url(#routeGradient)" opacity="0.8"/>
        </g>

        {/* Moving Bus */}
        <g className="moving-bus" filter="url(#premiumShadow)">
          {/* Bus Body */}
          <rect x="300" y="280" width="180" height="70" rx="15" fill="url(#busGradient)" stroke="#212121" strokeWidth="2"/>
          
          {/* Windows */}
          <rect x="310" y="290" width="160" height="20" rx="8" fill="white" opacity="0.9"/>
          <rect x="310" y="315" width="160" height="20" rx="8" fill="url(#calendarGradient)" opacity="0.8"/>
          
          {/* Wheels */}
          <circle cx="340" cy="350" r="18" fill="#212121"/>
          <circle cx="440" cy="350" r="18" fill="#212121"/>
          
          {/* YATRIK ERP Text */}
          <text x="390" y="305" textAnchor="middle" fill="#E91E63" fontSize="14" fontWeight="700" fontFamily="'Segoe UI', sans-serif">
            YATRIK ERP
          </text>
          
          {/* AI Indicator */}
          <circle cx="370" cy="325" r="4" fill="url(#aiBrainGradient)"/>
          <text x="375" y="330" fill="#4CAF50" fontSize="8" fontWeight="700" fontFamily="'Segoe UI', sans-serif">AI</text>
        </g>

        {/* Depot with Radar Pulse - Right Side */}
        <g className="depot-radar" filter="url(#premiumShadow)">
          {/* Depot Building */}
          <rect x="600" y="380" width="120" height="80" rx="10" fill="url(#depotGradient)" opacity="0.9"/>
          <rect x="610" y="390" width="100" height="15" rx="5" fill="white" opacity="0.9"/>
          <rect x="610" y="410" width="100" height="15" rx="5" fill="white" opacity="0.9"/>
          <rect x="610" y="430" width="100" height="15" rx="5" fill="white" opacity="0.9"/>
          
          {/* Radar Dish */}
          <ellipse cx="660" cy="350" rx="25" ry="15" fill="url(#depotGradient)" opacity="0.8"/>
          <ellipse cx="660" cy="350" rx="20" ry="12" fill="white" opacity="0.9"/>
          
          {/* Radar Pulse Waves */}
          <circle cx="660" cy="350" r="30" fill="url(#radarGradient)" className="radar-pulse-1"/>
          <circle cx="660" cy="350" r="45" fill="url(#radarGradient)" className="radar-pulse-2"/>
          <circle cx="660" cy="350" r="60" fill="url(#radarGradient)" className="radar-pulse-3"/>
          
          {/* Depot Text */}
          <text x="660" y="480" textAnchor="middle" fill="#212121" fontSize="16" fontWeight="700" fontFamily="'Segoe UI', sans-serif">
            SMART DEPOT
          </text>
        </g>

        {/* Animated Connection Lines */}
        <g className="connection-lines">
          {/* AI → Calendar */}
          <path d="M165 120 Q220 100 280 120" stroke="url(#circuitGradient)" strokeWidth="3" fill="none" opacity="0.7" strokeDasharray="8,4"/>
          
          {/* Calendar → Bus */}
          <path d="M400 120 Q450 200 300 280" stroke="url(#calendarGradient)" strokeWidth="3" fill="none" opacity="0.7" strokeDasharray="8,4"/>
          
          {/* Bus → Depot */}
          <path d="M480 300 Q540 320 600 350" stroke="url(#routeGradient)" strokeWidth="3" fill="none" opacity="0.7" strokeDasharray="8,4"/>
          
          {/* Connection Nodes */}
          <circle cx="220" cy="100" r="4" fill="url(#circuitGradient)" opacity="0.8"/>
          <circle cx="450" cy="200" r="4" fill="url(#calendarGradient)" opacity="0.8"/>
          <circle cx="540" cy="320" r="4" fill="url(#routeGradient)" opacity="0.8"/>
        </g>

        {/* Floating Data Particles */}
        <g className="data-particles">
          <circle cx="200" cy="200" r="3" fill="url(#aiBrainGradient)" opacity="0.6"/>
          <circle cx="350" cy="180" r="2" fill="url(#calendarGradient)" opacity="0.6"/>
          <circle cx="500" cy="280" r="3" fill="url(#routeGradient)" opacity="0.6"/>
          <circle cx="650" cy="320" r="2" fill="url(#depotGradient)" opacity="0.6"/>
          <circle cx="250" cy="250" r="2" fill="url(#circuitGradient)" opacity="0.6"/>
          <circle cx="450" cy="320" r="3" fill="url(#aiBrainGradient)" opacity="0.6"/>
        </g>

        {/* Main Title */}
        <g>
          <text x="400" y="530" textAnchor="middle" fill="#212121" fontSize="36" fontWeight="800" fontFamily="'Segoe UI', sans-serif">
            YATRIK ERP
          </text>
          <text x="400" y="560" textAnchor="middle" fill="url(#routeGradient)" fontSize="20" fontWeight="600" fontFamily="'Segoe UI', sans-serif">
            AI-Powered Transportation Management
          </text>
        </g>
      </svg>
    </div>
  );
};

export default AISchedulingAnimation;
