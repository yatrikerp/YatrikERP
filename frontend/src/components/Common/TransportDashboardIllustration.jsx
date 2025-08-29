import React, { useEffect, useRef, useState } from 'react';
import './TransportDashboardIllustration.css';

const TransportDashboardIllustration = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log('TransportDashboardIllustration: Component mounted');
    setIsVisible(true);
    
    // Force a re-render after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
      console.log('TransportDashboardIllustration: Forced visibility update');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Simple, immediately visible component
  return (
    <div 
      className="transport-dashboard-illustration"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        zIndex: 9999,
        backgroundColor: '#0B1426',
        border: '6px solid #FF6B35',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#00BCD4',
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 0 50px rgba(255, 107, 53, 0.5)'
      }}
    >
      {/* Always visible debug header */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: '#FF6B35',
        color: 'white',
        padding: '15px',
        fontSize: '16px',
        borderRadius: '10px',
        fontWeight: 'bold',
        zIndex: 10000,
        boxShadow: '0 0 20px rgba(255, 107, 53, 0.8)'
      }}>
        🚌 3D CITY MAP ACTIVE - {new Date().toLocaleTimeString()}
      </div>

      {/* Main content */}
      <div style={{ textAlign: 'center', zIndex: 10001 }}>
        <h1 style={{ 
          fontSize: '36px', 
          marginBottom: '20px',
          color: '#00BCD4',
          textShadow: '0 0 30px rgba(0, 188, 212, 0.8)',
          fontWeight: 'bold'
        }}>
          YATRIK ERP
        </h1>
        
        <h2 style={{ 
          fontSize: '24px', 
          marginBottom: '30px',
          color: '#FF6B35',
          fontWeight: 'normal',
          textShadow: '0 0 20px rgba(255, 107, 53, 0.6)'
        }}>
          3D Transport City Map
        </h2>

        {/* Feature grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          marginTop: '30px'
        }}>
          <div style={{
            background: 'rgba(0, 188, 212, 0.2)',
            padding: '20px',
            borderRadius: '15px',
            border: '2px solid rgba(0, 188, 212, 0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 0 20px rgba(0, 188, 212, 0.3)'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🗺️</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>3D Isometric Roads</div>
          </div>
          
          <div style={{
            background: 'rgba(0, 188, 212, 0.2)',
            padding: '20px',
            borderRadius: '15px',
            border: '2px solid rgba(0, 188, 212, 0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 0 20px rgba(0, 188, 212, 0.3)'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🚌</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Live Bus Tracking</div>
          </div>
          
          <div style={{
            background: 'rgba(255, 107, 53, 0.2)',
            padding: '20px',
            borderRadius: '15px',
            border: '2px solid rgba(255, 107, 53, 0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 0 20px rgba(255, 107, 53, 0.3)'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>✨</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Holographic Icons</div>
          </div>
          
          <div style={{
            background: 'rgba(255, 107, 53, 0.2)',
            padding: '20px',
            borderRadius: '15px',
            border: '2px solid rgba(255, 107, 53, 0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 0 20px rgba(255, 107, 53, 0.3)'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🎯</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Smart Routing</div>
          </div>
        </div>

        {/* Status indicator */}
        <div style={{
          marginTop: '30px',
          padding: '15px',
          background: 'rgba(0, 188, 212, 0.1)',
          borderRadius: '10px',
          border: '2px solid rgba(0, 188, 212, 0.4)',
          fontSize: '12px',
          opacity: 0.9,
          boxShadow: '0 0 15px rgba(0, 188, 212, 0.2)'
        }}>
          Component Status: {isVisible ? '✅ VISIBLE' : '❌ HIDDEN'} | 
          Z-Index: 9999 | 
          Position: Relative | 
          Time: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default TransportDashboardIllustration;
