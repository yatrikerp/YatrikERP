import React from 'react';

const LiveMapsLogo = ({ className = '' }) => {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        {/* Outer ring */}
        <circle cx="100" cy="100" r="78" fill="none" stroke="url(#grad)" strokeWidth="4" opacity="0.35" />
        {/* GPS styling: inner dashed ring and crosshair */}
        <circle cx="100" cy="100" r="58" fill="none" stroke="#22c55e" strokeOpacity="0.2" strokeDasharray="6 6">
          <animate attributeName="stroke-dashoffset" from="0" to="12" dur="6s" repeatCount="indefinite" />
        </circle>
        <line x1="100" y1="28" x2="100" y2="48" stroke="#22c55e" strokeOpacity="0.25" />
        <line x1="100" y1="152" x2="100" y2="172" stroke="#22c55e" strokeOpacity="0.25" />
        <line x1="28" y1="100" x2="48" y2="100" stroke="#22c55e" strokeOpacity="0.25" />
        <line x1="152" y1="100" x2="172" y2="100" stroke="#22c55e" strokeOpacity="0.25" />
        {/* Animated route */}
        <path id="route" d="M20 150 C 60 80, 120 140, 180 60" fill="none" stroke="url(#grad)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="20" cy="150" r="5" fill="#22c55e" className="animate-bounceGentle" />
        <circle cx="180" cy="60" r="6" fill="#ec4899" />
        <circle r="4" fill="#22c55e">
          <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
            <mpath href="#route" />
          </animateMotion>
        </circle>
        {/* Centered Y */}
        <text x="100" y="112" textAnchor="middle" fontFamily="Poppins, Inter, system-ui, sans-serif" fontSize="84" fontWeight="800" fill="#000">Y</text>
      </svg>
      <div className="absolute inset-0 rounded-full animate-pulse" style={{ boxShadow: '0 0 40px 2px rgba(34,197,94,0.25)' }} />
    </div>
  );
};

export default LiveMapsLogo;


