import React from 'react';
import { Link } from 'react-router-dom';
import LeftPanel from './LeftPanel';

const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <div className="auth-page">
      {/* Left Column */}
      <div className="auth-col auth-left">
        <LeftPanel />
      </div>
      <div className="auth-divider" aria-hidden="true" />
      {/* Right Column */}
      <div className="auth-col auth-right">
        <div className="auth-form-wrap">
          <div className="auth-header">
            <Link to="/" className="auth-brand">YATRIK ERP</Link>
            <div className="auth-title">
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
          <div className="auth-card">
            {children}
          </div>
        </div>
      </div>
      {/* Scoped Styles */}
      <style>{`
        /* Full-page layout */
        .auth-page {
          min-height: 100vh;
          display: flex;
          flex-direction: row;
          background: linear-gradient(160deg, #eef6ff 0%, #ffffff 100%);
          overflow: hidden;
        }

        .auth-col {
          flex: 1 1 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-left { padding: 2rem 1rem; }

        .auth-right { padding: 2rem 1rem; }

        .auth-divider {
          width: 1px;
          background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.06) 15%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.06) 85%, rgba(0,0,0,0) 100%);
          box-shadow: 0 0 24px rgba(0,0,0,0.05);
        }

        .auth-form-wrap {
          width: 100%;
          max-width: 420px;
        }

        .auth-header { margin-bottom: 1rem; text-align: left; }

        .auth-brand {
          display: inline-block;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: #ff3366;
          text-decoration: none;
          margin-bottom: 0.5rem;
        }

        .auth-title h1 {
          margin: 0 0 0.25rem 0;
          font-size: 1.75rem;
          line-height: 1.2;
          color: #0f172a;
        }

        .auth-title p {
          margin: 0;
          color: #475569;
          font-size: 0.95rem;
        }

        .auth-card {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(2, 6, 23, 0.06);
          padding: 1.25rem;
        }

        /* Responsiveness */
        @media (max-width: 1024px) {
          .auth-form-wrap { max-width: 400px; }
        }

        @media (max-width: 768px) {
          .auth-page { flex-direction: column; }
          .auth-divider { height: 1px; width: 100%; }
          .auth-left { padding-bottom: 0.5rem; }
          .auth-right { padding-top: 0.5rem; }
        }

        .login-hero-circle {
          width: clamp(280px, 60vw, 560px);
          height: clamp(280px, 60vw, 560px);
          position: relative;
        }
        
        .login-circle-bg {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255, 51, 102, 0.1) 0%, rgba(225, 29, 72, 0.05) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        
        .login-route-svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }
        
        .route-line {
          stroke: #22C55E;
          stroke-width: clamp(2px, 0.4vw, 3px);
          fill: none;
          stroke-linecap: round;
          stroke-dasharray: 8 10;
          animation: routeDash 7s linear infinite;
        }
        
        .route-line--h,
        .route-line--v {
          stroke: url(#routeGradient);
          stroke-width: clamp(3px, 0.6vw, 4px);
          fill: none;
          stroke-linecap: round;
          stroke-dasharray: 12 16;
          animation: routeDash 7s linear infinite;
          filter: drop-shadow(0 2px 4px rgba(34, 197, 94, 0.2));
        }
        
        /* Responsive stroke width adjustments */
        @media (max-width: 1023px) {
          .route-line--h,
          .route-line--v {
            stroke-width: clamp(3px, 0.8vw, 4px);
          }
        }
        
        @media (max-width: 639px) {
          .route-line--h,
          .route-line--v {
            stroke-width: clamp(3px, 1vw, 4px);
          }
        }
        
        .route-line--h { stroke-dashoffset: 0; }
        .route-line--v { stroke-dashoffset: 0; }
        
        .route-pin { /* No animation for pins */ }
        .route-marker { will-change: transform; }
        
        /* Responsive pin and marker sizing */
        @media (max-width: 1023px) {
          .route-pin circle { r: clamp(6px, 1.2vw, 8px); }
          .route-pin circle:last-child { r: clamp(3px, 0.6vw, 4px); }
          .route-marker circle { r: clamp(3px, 0.6vw, 4px); }
        }
        @media (max-width: 639px) {
          .route-pin circle { r: clamp(5px, 1.5vw, 7px); }
          .route-pin circle:last-child { r: clamp(2.5px, 0.75vw, 3.5px); }
          .route-marker circle { r: clamp(2.5px, 0.75vw, 3.5px); }
        }
        
        .route-marker--h1 { transform-origin: 120px 300px; }
        .route-marker--h2 { transform-origin: 480px 300px; }
        .route-marker--v1 { transform-origin: 300px 120px; }
        .route-marker--v2 { transform-origin: 300px 480px; }
        
        /* Animations */
        @keyframes routeDash { to { stroke-dashoffset: -18; } }
        .animated-icon { will-change: transform; animation: iconFloat 4s ease-in-out infinite; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1)); }
        .icon-bus-center { animation: busCenterFloat 4s ease-in-out infinite; filter: drop-shadow(0 8px 16px rgba(34, 197, 94, 0.3)); will-change: transform; }
        .icon-bus-center:hover { filter: drop-shadow(0 12px 24px rgba(34, 197, 94, 0.5)); transform: scale(1.05); transition: all 0.4s ease; }
        @keyframes busCenterFloat { 0%, 100% { transform: translateY(0px) scale(1); opacity: 0.95; } 50% { transform: translateY(-6px) scale(1.02); opacity: 1; } }
        
        /* Motion Preferences */
        @media (prefers-reduced-motion: reduce) {
          .route-line, .route-pin, .route-marker, .animated-icon, .icon-bus-center { animation: none !important; transform: none !important; }
        }
        
        /* Header Responsive Styling */
        @media (max-width: 768px) {
          header .flex { flex-direction: column; gap: 1rem; text-align: center; }
          header .space-x-6 { gap: 1rem; }
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;


