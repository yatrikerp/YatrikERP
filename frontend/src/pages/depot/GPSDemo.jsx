import React, { useState } from 'react';
import LiveGPSMap from '../../components/Common/LiveGPSMap';

const GPSDemo = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div style={{ height: '100vh', padding: '20px', background: '#f5f5f5' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#E91E63' }}>
        YATRIK ERP - GPS Live Route Monitoring Demo
      </h1>
      
      <div style={{ height: 'calc(100vh - 100px)' }}>
        <LiveGPSMap 
          isFullScreen={isFullScreen}
          onToggleFullScreen={handleToggleFullScreen}
        />
      </div>
    </div>
  );
};

export default GPSDemo;
