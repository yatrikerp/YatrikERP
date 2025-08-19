import React from 'react';

const LogoAnimated = ({ size = 240, className = '' }) => {
  const logoSize = size;
  const radius = (logoSize - 20) / 2; // Account for stroke width
  
  return (
    <div 
      className={`logo-animated ${className}`}
      style={{ '--logo-size': `${logoSize}px` }}
    >
      <svg
        width={logoSize}
        height={logoSize}
        viewBox={`0 0 ${logoSize} ${logoSize}`}
        className="logo-svg"
        aria-label="YATRIK animated logo with moving bus"
      >
        {/* Outer circle track */}
        <circle
          cx={logoSize / 2}
          cy={logoSize / 2}
          r={radius}
          fill="none"
          stroke="#0e1b2b"
          strokeWidth="3"
          opacity="0.2"
          className="logo-track"
        />
        
        {/* Animated route path */}
        <circle
          cx={logoSize / 2}
          cy={logoSize / 2}
          r={radius}
          fill="none"
          stroke="#ff3366"
          strokeWidth="3"
          strokeDasharray="6 10"
          strokeLinecap="round"
          className="logo-route"
        />
        
        {/* Bus icon */}
        <g 
          id="bus"
          className="logo-bus"
          transform={`translate(${logoSize / 2}, ${logoSize / 2})`}
        >
          {/* Bus body */}
          <rect
            x="-12"
            y="-8"
            width="24"
            height="16"
            rx="3"
            fill="white"
            stroke="#0e1b2b"
            strokeWidth="1.5"
          />
          
          {/* Bus windows */}
          <rect
            x="-10"
            y="-6"
            width="8"
            height="6"
            rx="1"
            fill="#e2e8f0"
            stroke="#0e1b2b"
            strokeWidth="0.5"
          />
          <rect
            x="2"
            y="-6"
            width="8"
            height="6"
            rx="1"
            fill="#e2e8f0"
            stroke="#0e1b2b"
            strokeWidth="0.5"
          />
          
          {/* Bus wheels */}
          <circle
            cx="-8"
            cy="6"
            r="3"
            fill="white"
            stroke="#0e1b2b"
            strokeWidth="1.5"
          />
          <circle
            cx="8"
            cy="6"
            r="3"
            fill="white"
            stroke="#0e1b2b"
            strokeWidth="1.5"
          />
          
          {/* Bus door */}
          <rect
            x="-2"
            y="-8"
            width="4"
            height="16"
            fill="none"
            stroke="#0e1b2b"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        </g>
        
        {/* Pulse beacon ahead of bus */}
        <circle
          cx={logoSize / 2}
          cy={logoSize / 2 - radius + 8}
          r="3"
          fill="#ff3366"
          className="logo-beacon"
        />
        
        {/* YATRIK text */}
        <text
          x={logoSize / 2}
          y={logoSize / 2 + radius + 20}
          textAnchor="middle"
          className="logo-text"
          fill="#0e1b2b"
          fontSize="16"
          fontWeight="700"
          letterSpacing="0.5"
        >
          YATRIK
        </text>
      </svg>
    </div>
  );
};

export default LogoAnimated;
