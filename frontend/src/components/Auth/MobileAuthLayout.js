import React from 'react';
import { Link } from 'react-router-dom';
import LeftPanel from './LeftPanel';

const MobileAuthLayout = ({ title, subtitle, children }) => {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
      overflow: 'hidden',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Mobile Header */}
      <div style={{
        height: '60px',
        width: '100vw',
        background: '#FFFFFF',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid #DDDDDD',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }} onClick={() => window.location.href = '/'}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}>
            🚌
          </div>
          <span style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1f2937'
          }}>
            YATRIK
          </span>
          <div style={{
            fontSize: '10px',
            fontWeight: '600',
            color: '#3b82f6',
            background: '#eff6ff',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            ERP
          </div>
        </div>
        <a href="#" style={{
          fontSize: '14px',
          color: '#6b7280',
          textDecoration: 'none',
          padding: '6px 12px',
          borderRadius: '6px',
          background: '#f9fafb'
        }}>
          Help
        </a>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginTop: '60px',
        width: '100%'
      }}>
        
        {/* Left Panel - Mobile Optimized */}
        <div style={{
          padding: '1rem',
          minHeight: '30vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%'
        }}>
          <LeftPanel />
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          width: '100%',
          background: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0) 100%)',
          margin: '0.5rem 0'
        }} />

        {/* Right Panel - Form */}
        <div style={{
          flex: 1,
          padding: '1rem',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          width: '100%'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '100%'
          }}>
            
            {/* Title */}
            <div style={{
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937',
                margin: '0 0 0.5rem 0',
                lineHeight: '1.2'
              }}>
                {title}
              </h1>
              {subtitle && (
                <p style={{
                  fontSize: '0.9rem',
                  color: '#6b7280',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  {subtitle}
                </p>
              )}
            </div>

            {/* Form Card */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 8px 25px rgba(2, 6, 23, 0.08)',
              border: '1px solid #e5e7eb',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-specific styles */}
      <style>{`
        @media (max-width: 480px) {
          .mobile-auth-container {
            padding: 0.75rem;
          }
          .mobile-auth-card {
            padding: 1rem;
          }
          .mobile-auth-title h1 {
            font-size: 1.3rem;
          }
          .mobile-auth-title p {
            font-size: 0.85rem;
          }
        }
        
        @media (max-width: 360px) {
          .mobile-auth-container {
            padding: 0.5rem;
          }
          .mobile-auth-card {
            padding: 0.75rem;
          }
          .mobile-auth-title h1 {
            font-size: 1.2rem;
          }
          .mobile-auth-title p {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MobileAuthLayout;
