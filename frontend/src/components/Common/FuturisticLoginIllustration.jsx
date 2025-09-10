import React from 'react';

const FuturisticLoginIllustration = () => {
  return (
    <div className="futuristic-illustration">
      <svg
        viewBox="0 0 400 400"
        className="illustration-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background gradient */}
        <defs>
          <radialGradient id="backgroundGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00BCD4" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#E91E63" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
          </radialGradient>
          
          <linearGradient id="busGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00BCD4" />
            <stop offset="50%" stopColor="#1976D2" />
            <stop offset="100%" stopColor="#0B3A53" />
          </linearGradient>
          
          <linearGradient id="hubGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E91E63" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FF4081" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00BCD4" stopOpacity="0.4" />
          </linearGradient>
          
          <linearGradient id="ySymbolGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E91E63" />
            <stop offset="50%" stopColor="#FF4081" />
            <stop offset="100%" stopColor="#00BCD4" />
          </linearGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Background */}
        <rect width="400" height="400" fill="url(#backgroundGradient)" />
        
        {/* Circuit lines */}
        <g className="circuit-lines" opacity="0.3">
          <path d="M50 100 Q200 50 350 100" stroke="#00BCD4" strokeWidth="1" fill="none" opacity="0.4">
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" />
          </path>
          <path d="M50 300 Q200 350 350 300" stroke="#E91E63" strokeWidth="1" fill="none" opacity="0.4">
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" begin="1s" />
          </path>
          <path d="M100 50 Q100 200 100 350" stroke="#00BCD4" strokeWidth="1" fill="none" opacity="0.3">
            <animate attributeName="opacity" values="0.1;0.5;0.1" dur="4s" repeatCount="indefinite" begin="0.5s" />
          </path>
          <path d="M300 50 Q300 200 300 350" stroke="#E91E63" strokeWidth="1" fill="none" opacity="0.3">
            <animate attributeName="opacity" values="0.1;0.5;0.1" dur="4s" repeatCount="indefinite" begin="1.5s" />
          </path>
        </g>
        
        {/* Smart transport hub base */}
        <circle cx="200" cy="200" r="120" fill="url(#hubGradient)" opacity="0.3" filter="url(#softGlow)" />
        <circle cx="200" cy="200" r="100" fill="url(#hubGradient)" opacity="0.2" filter="url(#softGlow)" />
        
        {/* ERP Module Icons around the hub */}
        {/* Ticket Icon */}
        <g className="erp-icon" transform="translate(200, 80)">
          <rect x="-12" y="-8" width="24" height="16" rx="2" fill="#00BCD4" opacity="0.8" filter="url(#softGlow)" />
          <rect x="-8" y="-4" width="16" height="8" rx="1" fill="#FFFFFF" />
          <circle cx="-6" cy="0" r="1" fill="#00BCD4" />
          <circle cx="6" cy="0" r="1" fill="#00BCD4" />
        </g>
        
        {/* GPS Icon */}
        <g className="erp-icon" transform="translate(320, 200)">
          <circle cx="0" cy="0" r="12" fill="#E91E63" opacity="0.8" filter="url(#softGlow)" />
          <path d="M-6,-6 L6,6 M6,-6 L-6,6" stroke="#FFFFFF" strokeWidth="2" />
        </g>
        
        {/* Cloud Icon */}
        <g className="erp-icon" transform="translate(200, 320)">
          <path d="M-15,-5 Q-20,-10 -10,-10 Q-5,-15 5,-10 Q15,-10 10,-5 Q15,0 5,0 Q0,5 -10,0 Q-15,0 -15,-5 Z" 
                fill="#00BCD4" opacity="0.8" filter="url(#softGlow)" />
        </g>
        
        {/* Seat Icon */}
        <g className="erp-icon" transform="translate(80, 200)">
          <rect x="-10" y="-8" width="20" height="16" rx="2" fill="#E91E63" opacity="0.8" filter="url(#softGlow)" />
          <rect x="-6" y="-4" width="12" height="8" rx="1" fill="#FFFFFF" />
          <circle cx="-2" cy="0" r="1" fill="#E91E63" />
          <circle cx="2" cy="0" r="1" fill="#E91E63" />
        </g>
        
        {/* Modern City Bus */}
        <g className="bus-container" transform="translate(200, 200)">
          {/* Bus body */}
          <rect x="-60" y="-25" width="120" height="50" rx="8" fill="url(#busGradient)" filter="url(#glow)" />
          
          {/* Bus windows */}
          <rect x="-50" y="-20" width="100" height="15" rx="4" fill="#E3F2FD" opacity="0.9" />
          
          {/* Passenger silhouettes in windows */}
          <g className="passengers" opacity="0.7">
            <circle cx="-35" cy="-12" r="3" fill="#1976D2" />
            <circle cx="-20" cy="-12" r="3" fill="#1976D2" />
            <circle cx="-5" cy="-12" r="3" fill="#1976D2" />
            <circle cx="10" cy="-12" r="3" fill="#1976D2" />
            <circle cx="25" cy="-12" r="3" fill="#1976D2" />
            <circle cx="40" cy="-12" r="3" fill="#1976D2" />
          </g>
          
          {/* Bus wheels */}
          <circle cx="-40" cy="20" r="8" fill="#212121" />
          <circle cx="40" cy="20" r="8" fill="#212121" />
          <circle cx="-40" cy="20" r="5" fill="#424242" />
          <circle cx="40" cy="20" r="5" fill="#424242" />
          
          {/* Bus headlights */}
          <circle cx="-55" cy="-5" r="4" fill="#FFD700" filter="url(#glow)" />
          <circle cx="-55" cy="5" r="4" fill="#FFD700" filter="url(#glow)" />
          
          {/* YATRIK ERP Display on bus */}
          <rect x="-45" y="-35" width="90" height="12" rx="6" fill="#0B3A53" opacity="0.9" />
          <text x="0" y="-27" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">
            YATRIK ERP
          </text>
        </g>
        
        {/* Large glowing Y symbol in the center */}
        <g className="y-symbol" transform="translate(200, 200)">
          <path d="M-20,-30 L0,0 L20,-30 L15,-30 L0,-5 L-15,-30 Z M0,0 L0,30" 
                stroke="url(#ySymbolGradient)" 
                strokeWidth="8" 
                fill="none" 
                filter="url(#glow)"
                strokeLinecap="round"
                strokeLinejoin="round">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
          </path>
        </g>
        
        {/* Neon highlights and effects */}
        <g className="neon-effects" opacity="0.6">
          <circle cx="200" cy="200" r="130" fill="none" stroke="#00BCD4" strokeWidth="1" opacity="0.3">
            <animate attributeName="r" values="120;140;120" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.1;0.4;0.1" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="200" cy="200" r="150" fill="none" stroke="#E91E63" strokeWidth="1" opacity="0.2">
            <animate attributeName="r" values="140;160;140" dur="5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.05;0.3;0.05" dur="5s" repeatCount="indefinite" />
          </circle>
        </g>
        
        {/* Glassmorphism overlay */}
        <rect x="0" y="0" width="400" height="400" fill="url(#backgroundGradient)" opacity="0.1" />
      </svg>
    </div>
  );
};

export default FuturisticLoginIllustration;
