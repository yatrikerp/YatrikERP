import React from 'react';
import './LeftPanel.css';

const LeftPanel = () => {
  return (
    <div className="left-panel">
      <div className="lp-card">
        <svg className="lp-card__svg" viewBox="0 0 720 520" role="img" aria-label="YATRIK ERP login visual">
          <defs>
            {/* Background gradient */}
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E3F2FD" />
              <stop offset="100%" stopColor="#E0F7FA" />
            </linearGradient>
            {/* Teal gradient */}
            <linearGradient id="teal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00ACC1" />
              <stop offset="100%" stopColor="#00838F" />
            </linearGradient>
            {/* Shimmer mask */}
            <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ffffff00" />
              <stop offset="0.5" stopColor="#ffffffff" />
              <stop offset="1" stopColor="#ffffff00" />
            </linearGradient>
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#000" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Soft background */}
          <rect x="0" y="0" width="720" height="520" fill="url(#bg)" />

          {/* White card */}
          <g filter="url(#softShadow)">
            <rect x="60" y="110" width="600" height="260" rx="28" fill="#fff" />
            {/* Card shimmer */}
            <g className="lp-card__shimmer">
              <rect x="60" y="110" width="600" height="260" rx="28" fill="#fff" />
              <rect x="-300" y="110" width="220" height="260" rx="28" fill="url(#shimmer)">
                <animate attributeName="x" from="-300" to="920" dur="2.8s" repeatCount="indefinite" />
              </rect>
            </g>
          </g>

          {/* Logo badge (teal circle with bus) */}
          <g className="lp-card__badge" transform="translate(160,240)">
            <circle cx="0" cy="0" r="58" fill="url(#teal)" />
            {/* bus body */}
            <g className="lp-card__bus">
              <rect x="-36" y="-10" width="60" height="28" rx="8" fill="#F1F5F9" />
              <rect x="-30" y="-6" width="28" height="10" rx="2" fill="#CBD5E1" />
              <rect x="2" y="-6" width="16" height="10" rx="2" fill="#CBD5E1" />
              {/* wheels */}
              <g transform="translate(-20,20)">
                <circle cx="0" cy="0" r="6" fill="#0F172A" />
                <circle cx="38" cy="0" r="6" fill="#0F172A" />
              </g>
              {/* headlight */}
              <circle cx="28" cy="4" r="3.2" fill="#FFB300" />
            </g>
          </g>

          {/* Wordmark and headings */}
          <g className="lp-card__brand" transform="translate(250,220)">
            <text x="0" y="0" className="lp-card__title">YATRIK</text>
            <g transform="translate(192,-18)">
              <rect width="56" height="28" rx="14" fill="#E91E63" />
              <text x="28" y="20" textAnchor="middle" className="lp-card__pill">ERP</text>
            </g>
            <text x="0" y="36" className="lp-card__subtitle">Smart Bus Travel Management</text>
            <text x="0" y="64" className="lp-card__tagline">Smart Management Suite • Routes • Tracking • Analytics</text>
          </g>

          {/* Orbiting smart icons around the brand center */}
          <g className="lp-orbit" transform="translate(260,230)">
            {/* Map pin */}
            <g className="lp-icon" transform="translate(0,-90)">
              <circle cx="0" cy="0" r="14" fill="#E6FFFB" />
              <path d="M0,-10 a10,10 0 1,1 0,20 a10,10 0 1,1 0,-20 Z" fill="none" />
              <path d="M0,-7 a7,7 0 1,1 0,14 a7,7 0 1,1 0,-14 Z" fill="#00ACC1" />
              <circle cx="0" cy="0" r="3" fill="#fff" />
            </g>
            {/* Shield */}
            <g className="lp-icon" transform="translate(78,-34)">
              <path d="M0,-12 L14,-6 L14,6 C14,16 6,24 0,26 C-6,24 -14,16 -14,6 L-14,-6 Z" fill="#00ACC1" opacity="0.9" />
              <rect x="-2" y="-4" width="4" height="10" rx="1" fill="#fff" />
            </g>
            {/* Chart */}
            <g className="lp-icon" transform="translate(48,72)">
              <rect x="-12" y="-6" width="6" height="12" fill="#E91E63" rx="1" />
              <rect x="-2" y="-10" width="6" height="16" fill="#00ACC1" rx="1" />
              <rect x="8" y="-2" width="6" height="8" fill="#FF8A00" rx="1" />
            </g>
            {/* Clock */}
            <g className="lp-icon" transform="translate(-78,36)">
              <circle cx="0" cy="0" r="10" fill="#E6FFFB" stroke="#00ACC1" />
              <line x1="0" y1="0" x2="0" y2="-6" stroke="#00ACC1" strokeWidth="2" strokeLinecap="round" />
              <line x1="0" y1="0" x2="5" y2="3" stroke="#00ACC1" strokeWidth="2" strokeLinecap="round" />
            </g>
            {/* Small dashed route */}
            <g className="lp-icon" transform="translate(-40,-70)">
              <path d="M-18,0 C-8,-10, 8,-10, 18,0" fill="none" stroke="#00ACC1" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 6" />
            </g>
          </g>

          {/* Moving dashed route under the card */}
          <path d="M80 420 C 220 390, 500 390, 640 420" className="lp-card__route" />
            </svg>
      </div>
    </div>
  );
};

export default LeftPanel;


