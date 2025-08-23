import React, { useRef, useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import './LeftPanel.css';

const LeftPanel = () => {
  const svgRef = useRef(null);
  const [busPosition, setBusPosition] = useState(0);
  const [tireRotation, setTireRotation] = useState(0);
  const [routePulse, setRoutePulse] = useState(0);
  const [mapIconPulse, setMapIconPulse] = useState(0);
  
  // Sophisticated animations for ERP theme
  useEffect(() => {
    const interval = setInterval(() => {
      setBusPosition(prev => (prev + 1) % 200);
      setTireRotation(prev => (prev + 4) % 360);
      setRoutePulse(prev => (prev + 2) % 100);
      setMapIconPulse(prev => (prev + 3) % 100);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="left-panel"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 1000 700"
        className="hero-illustration"
        shapeRendering="geometricPrecision"
        textRendering="optimizeLegibility"
        role="img"
        aria-label="Professional ERP transport system with live tracking and modern branding"
      >
        <defs>
          {/* ERP Color Palette */}
          <linearGradient id="erpPinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E91E63" />
            <stop offset="100%" stopColor="#C2185B" />
          </linearGradient>

          <linearGradient id="erpDarkGreyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#333333" />
            <stop offset="100%" stopColor="#212121" />
          </linearGradient>

          {/* Sophisticated skyline gradients */}
          <linearGradient id="skylineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8F9FA" />
          </linearGradient>

          <linearGradient id="distantSkylineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F1F3F4" />
            <stop offset="100%" stopColor="#E8EAED" />
          </linearGradient>

          {/* Road surface with ERP pink glow */}
          <linearGradient id="smartRoadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#424242" />
            <stop offset="100%" stopColor="#2D2D2D" />
          </linearGradient>

          {/* Bus gradients */}
          <linearGradient id="busBodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8F9FA" />
          </linearGradient>

          <linearGradient id="busAccentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E91E63" />
            <stop offset="100%" stopColor="#C2185B" />
          </linearGradient>

          {/* Glass and metal effects */}
          <linearGradient id="premiumGlassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E3F2FD" />
          </linearGradient>

          {/* Route line glow effects */}
          <filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#E91E63" floodOpacity="0.4" />
            <feComposite in2="blur" operator="in" />
            <feMerge> 
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Map icon glow */}
          <filter id="mapIconGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor="#E91E63" floodOpacity="0.3" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Professional shadows */}
          <filter id="premiumShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feOffset in="blur" dx="0" dy="3" />
            <feFlood floodColor="#000000" floodOpacity="0.08" />
            <feComposite in2="blur" operator="in" />
            <feMerge> 
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Floating wheel shadow */}
          <filter id="floatingShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feOffset in="blur" dx="0" dy="4" />
            <feFlood floodColor="#000000" floodOpacity="0.15" />
            <feComposite in2="blur" operator="in" />
            <feMerge> 
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Premium background */}
        <rect width="100%" height="100%" fill="url(#skylineGradient)" />

        {/* Distant blurred skyline for depth */}
        <g className="distant-skyline" filter="url(#premiumShadow)">
          <rect x="50" y="250" width="60" height="200" fill="url(#distantSkylineGradient)" opacity="0.6" />
          <rect x="150" y="220" width="70" height="230" fill="url(#distantSkylineGradient)" opacity="0.6" />
          <rect x="250" y="240" width="65" height="210" fill="url(#distantSkylineGradient)" opacity="0.6" />
          <rect x="350" y="260" width="75" height="190" fill="url(#distantSkylineGradient)" opacity="0.6" />
          <rect x="500" y="230" width="80" height="220" fill="url(#distantSkylineGradient)" opacity="0.6" />
          <rect x="650" y="250" width="70" height="200" fill="url(#distantSkylineGradient)" opacity="0.6" />
          <rect x="750" y="240" width="75" height="210" fill="url(#distantSkylineGradient)" opacity="0.6" />
          <rect x="850" y="260" width="65" height="190" fill="url(#distantSkylineGradient)" opacity="0.6" />
        </g>

        {/* Sharp foreground skyline */}
        <g className="foreground-skyline" filter="url(#premiumShadow)">
          <rect x="80" y="200" width="70" height="250" fill="url(#skylineGradient)" />
          <rect x="85" y="205" width="16" height="16" fill="url(#premiumGlassGradient)" />
          <rect x="106" y="205" width="16" height="16" fill="url(#premiumGlassGradient)" />
          <rect x="127" y="205" width="16" height="16" fill="url(#premiumGlassGradient)" />
          <rect x="85" y="226" width="16" height="16" fill="url(#premiumGlassGradient)" />
          <rect x="106" y="226" width="16" height="16" fill="url(#premiumGlassGradient)" />
          <rect x="127" y="226" width="16" height="16" fill="url(#premiumGlassGradient)" />
          
          <rect x="200" y="180" width="85" height="270" fill="url(#skylineGradient)" />
          <rect x="210" y="185" width="18" height="18" fill="url(#premiumGlassGradient)" />
          <rect x="233" y="185" width="18" height="18" fill="url(#premiumGlassGradient)" />
          <rect x="256" y="185" width="18" height="18" fill="url(#premiumGlassGradient)" />
          <rect x="279" y="185" width="18" height="18" fill="url(#premiumGlassGradient)" />
          <rect x="210" y="208" width="18" height="18" fill="url(#premiumGlassGradient)" />
          <rect x="233" y="208" width="18" height="18" fill="url(#premiumGlassGradient)" />
          <rect x="256" y="208" width="18" height="18" fill="url(#premiumGlassGradient)" />
          <rect x="279" y="208" width="18" height="18" fill="url(#premiumGlassGradient)" />
          
          <rect x="340" y="220" width="80" height="230" fill="url(#skylineGradient)" />
          <rect x="350" y="225" width="18" height="18" fill="url(#premiumGlassGradient)" />
          <rect x="373" y="225" width="18" height="18" fill="url(#premiumGlassGradient)" />
          <rect x="396" y="225" width="18" height="18" fill="url(#premiumGlassGradient)" />
          <rect x="350" y="248" width="18" height="18" fill="url(#premiumGlassGradient)" />
          <rect x="373" y="248" width="18" height="18" fill="url(#premiumGlassGradient)" />
          <rect x="396" y="248" width="18" height="18" fill="url(#premiumGlassGradient)" />
          
          <rect x="470" y="240" width="75" height="210" fill="url(#skylineGradient)" />
          <rect x="480" y="245" width="18" height="18" fill="url(#premiumGlassGradient)" />
          <rect x="503" y="245" width="18" height="18" fill="url(#premiumGlassGradient)" />
          <rect x="480" y="268" width="18" height="18" fill="url(#premiumGlassGradient)" />
          <rect x="503" y="268" width="18" height="18" fill="url(#premiumGlassGradient)" />
          
          <rect x="600" y="260" width="70" height="190" fill="url(#skylineGradient)" />
          <rect x="610" y="265" width="16" height="16" fill="url(#premiumGlassGradient)" />
          <rect x="631" y="265" width="16" height="16" fill="url(#premiumGlassGradient)" />
          <rect x="652" y="265" width="16" height="16" fill="url(#premiumGlassGradient)" />
          <rect x="610" y="286" width="16" height="16" fill="url(#premiumGlassGradient)" />
          <rect x="631" y="286" width="16" height="16" fill="url(#premiumGlassGradient)" />
          <rect x="652" y="286" width="16" height="16" fill="url(#premiumGlassGradient)" />
        </g>

        {/* Smart road with ERP pink glow */}
        <g className="smart-roadway">
          <rect x="200" y="500" width="600" height="100" fill="url(#smartRoadGradient)" />
          
          {/* ERP pink glowing lane markers */}
          <path d="M200 530 L800 530" stroke="url(#erpPinkGradient)" strokeWidth="4" strokeDasharray="40,30" opacity="0.8" filter="url(#routeGlow)" />
          <path d="M200 570 L800 570" stroke="url(#erpPinkGradient)" strokeWidth="4" strokeDasharray="40,30" opacity="0.8" filter="url(#routeGlow)" />
          
          {/* Center divider with ERP pink */}
          <rect x="200" y="548" width="600" height="4" fill="url(#erpPinkGradient)" opacity="0.9" />
          
          {/* Edge lines */}
          <path d="M200 510 L800 510" stroke="#FFFFFF" strokeWidth="3" opacity="0.8" />
          <path d="M200 590 L800 590" stroke="#FFFFFF" strokeWidth="3" opacity="0.8" />
        </g>

        {/* Map route lines with GPS tracking */}
        <g className="map-routes" filter="url(#routeGlow)">
          {/* Horizontal route line */}
          <path d="M150 400 L850 400" stroke="url(#erpPinkGradient)" strokeWidth="3" strokeDasharray="15,10" opacity="0.7" />
          
          {/* Vertical route line */}
          <path d="M500 200 L500 450" stroke="url(#erpPinkGradient)" strokeWidth="3" strokeDasharray="15,10" opacity="0.7" />
          
          {/* Diagonal route line */}
          <path d="M200 300 L800 500" stroke="url(#erpPinkGradient)" strokeWidth="2" strokeDasharray="10,8" opacity="0.6" />
          
          {/* Moving GPS dots along routes */}
          <circle cx={150 + (routePulse * 7)} cy="400" r="4" fill="url(#erpPinkGradient)" opacity="0.8" />
          <circle cx="500" cy={200 + (routePulse * 2.5)} r="4" fill="url(#erpPinkGradient)" opacity="0.8" />
          <circle cx={200 + (routePulse * 6)} cy={300 + (routePulse * 2)} r="3" fill="url(#erpPinkGradient)" opacity="0.7" />
        </g>

        {/* Map icons at route endpoints */}
        <g className="map-icons" filter="url(#mapIconGlow)">
          {/* Depot icon */}
          <g transform="translate(150, 400)">
            <rect x="-8" y="-8" width="16" height="16" rx="3" fill="url(#erpPinkGradient)" />
            <text x="0" y="2" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="600">🅿</text>
          </g>
          
          {/* Bus stop icon */}
          <g transform="translate(500, 200)">
            <rect x="-8" y="-8" width="16" height="16" rx="3" fill="url(#erpPinkGradient)" />
            <text x="0" y="2" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="600">🚌</text>
          </g>
          
          {/* Destination icon */}
          <g transform="translate(800, 500)">
            <rect x="-8" y="-8" width="16" height="16" rx="3" fill="url(#erpPinkGradient)" />
            <text x="0" y="2" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="600">🎯</text>
          </g>
        </g>

        {/* Modern flat bus with ERP pink highlights */}
        <g className="modern-bus" transform={`translate(${480 + busPosition}, 0)`} filter="url(#premiumShadow)">
          {/* Main bus body - flat modern style */}
          <rect
            x="0"
            y="440"
            width="120"
            height="55"
            rx="12"
            fill="url(#busBodyGradient)"
            stroke="url(#erpDarkGreyGradient)"
            strokeWidth="2"
          />
          
          {/* ERP pink accent stripe */}
          <rect x="2" y="425" width="116" height="8" rx="4" fill="url(#busAccentGradient)" />
          
          {/* Front windshield with ERP pink frame */}
          <rect x="2" y="440" width="25" height="35" rx="6" fill="url(#premiumGlassGradient)" stroke="url(#erpPinkGradient)" strokeWidth="1.5" />
          
          {/* Side windows with ERP pink accents */}
          <rect x="30" y="445" width="18" height="25" rx="4" fill="url(#premiumGlassGradient)" stroke="url(#erpPinkGradient)" strokeWidth="1" />
          <rect x="52" y="445" width="18" height="25" rx="4" fill="url(#premiumGlassGradient)" stroke="url(#erpPinkGradient)" strokeWidth="1" />
          <rect x="74" y="445" width="18" height="25" rx="4" fill="url(#premiumGlassGradient)" stroke="url(#erpPinkGradient)" strokeWidth="1" />
          <rect x="96" y="445" width="18" height="25" rx="4" fill="url(#premiumGlassGradient)" stroke="url(#erpPinkGradient)" strokeWidth="1" />
          
          {/* Entry door with ERP pink */}
          <rect x="65" y="460" width="16" height="30" rx="5" fill="url(#busAccentGradient)" stroke="url(#erpDarkGreyGradient)" strokeWidth="1" />
          <rect x="68" y="465" width="10" height="20" fill="url(#premiumGlassGradient)" />
          
          {/* Floating wheels with shadow blur */}
          <g className="floating-wheels" filter="url(#floatingShadow)">
            {/* Front wheel */}
            <g transform={`rotate(${tireRotation} 30 495)`}>
              <circle cx="30" cy="495" r="15" fill="url(#erpDarkGreyGradient)" stroke="#424242" strokeWidth="2" />
              <circle cx="30" cy="495" r="10" fill="#424242" />
              <circle cx="30" cy="495" r="6" fill="#9E9E9E" />
              {/* ERP pink spoke accents */}
              <line x1="30" y1="495" x2="45" y2="495" stroke="url(#erpPinkGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
              <line x1="30" y1="495" x2="45" y2="495" stroke="url(#erpPinkGradient)" strokeWidth="1.5" strokeLinecap="round" transform="rotate(90 30 495)" opacity="0.8" />
              <line x1="30" y1="495" x2="45" y2="495" stroke="url(#erpPinkGradient)" strokeWidth="1.5" strokeLinecap="round" transform="rotate(180 30 495)" opacity="0.8" />
              <line x1="30" y1="495" x2="45" y2="495" stroke="url(#erpPinkGradient)" strokeWidth="1.5" strokeLinecap="round" transform="rotate(270 30 495)" opacity="0.8" />
            </g>
            
            {/* Rear wheel */}
            <g transform={`rotate(${tireRotation} 90 495)`}>
              <circle cx="90" cy="495" r="15" fill="url(#erpDarkGreyGradient)" stroke="#424242" strokeWidth="2" />
              <circle cx="90" cy="495" r="10" fill="#424242" />
              <circle cx="90" cy="495" r="6" fill="#9E9E9E" />
              {/* ERP pink spoke accents */}
              <line x1="90" y1="495" x2="105" y2="495" stroke="url(#erpPinkGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
              <line x1="90" y1="495" x2="105" y2="495" stroke="url(#erpPinkGradient)" strokeWidth="1.5" strokeLinecap="round" transform="rotate(90 90 495)" opacity="0.8" />
              <line x1="90" y1="495" x2="105" y2="495" stroke="url(#erpPinkGradient)" strokeWidth="1.5" strokeLinecap="round" transform="rotate(180 90 495)" opacity="0.8" />
              <line x1="90" y1="495" x2="105" y2="495" stroke="url(#erpPinkGradient)" strokeWidth="1.5" strokeLinecap="round" transform="rotate(270 90 495)" opacity="0.8" />
            </g>
          </g>
          
          {/* Professional lighting with ERP pink accent */}
          <circle cx="15" cy="450" r="3" fill="#FFFFFF" />
          <circle cx="15" cy="460" r="3" fill="#FFFFFF" />
          <circle cx="15" cy="455" r="2.5" fill="url(#erpPinkGradient)" />
          
          {/* YATRIK branding with ERP pink */}
          <rect x="25" y="470" width="70" height="15" rx="7.5" fill="url(#erpPinkGradient)" />
          <text x="60" y="480" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="700" fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif" letterSpacing="0.5">
            YATRIK
          </text>
          
          {/* ERP tag */}
          <rect x="105" y="475" width="14" height="10" rx="5" fill="url(#erpPinkGradient)" />
          <text x="112" y="482" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontWeight="600" fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif">
            ERP
          </text>
        </g>

        {/* Professional branding circle with animated routes */}
        <g className="branding-circle" filter="url(#premiumShadow)">
          {/* Background circle with gradient stroke */}
          <circle cx="500" cy="150" r="80" fill="rgba(255,255,255,0.1)" stroke="url(#erpPinkGradient)" strokeWidth="3" opacity="0.8" />
          
          {/* Animated route lines forming orbit */}
          <g className="orbital-routes" filter="url(#routeGlow)">
            <path d="M420 150 A80 80 0 0 1 580 150" stroke="url(#erpPinkGradient)" strokeWidth="2" strokeDasharray="10,8" opacity="0.6" />
            <path d="M500 70 A80 80 0 0 1 500 230" stroke="url(#erpPinkGradient)" strokeWidth="2" strokeDasharray="10,8" opacity="0.6" />
            <path d="M440 100 A80 80 0 0 1 560 200" stroke="url(#erpPinkGradient)" strokeWidth="2" strokeDasharray="10,8" opacity="0.5" />
            <path d="M560 100 A80 80 0 0 1 440 200" stroke="url(#erpPinkGradient)" strokeWidth="2" strokeDasharray="10,8" opacity="0.5" />
          </g>
          
          {/* Large "Y" typography */}
          <text x="500" y="160" textAnchor="middle" fill="url(#erpPinkGradient)" fontSize="72" fontWeight="800" fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif" filter="url(#mapIconGlow)">
            Y
          </text>
        </g>

        {/* ERP title with modern styling */}
        <g className="erp-title" filter="url(#premiumShadow)">
          <text x="500" y="280" textAnchor="middle" fill="url(#erpDarkGreyGradient)" fontSize="48" fontWeight="800" fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif" letterSpacing="-0.02em">
            YATRIK
          </text>
          <g transform="translate(500, 300)">
            <rect width="90" height="36" rx="18" fill="url(#erpPinkGradient)" />
            <text x="45" y="24" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="700" fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif" letterSpacing="0.5">
              ERP
            </text>
          </g>
        </g>

        {/* Floating bus shadow */}
        <ellipse
          cx={500 + busPosition}
          cy="610"
          rx="75"
          ry="15"
          fill="#000000"
          opacity="0.08"
          filter="url(#floatingShadow)"
        />
      </motion.svg>
    </motion.div>
  );
};

export default LeftPanel;


