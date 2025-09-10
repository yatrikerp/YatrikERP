import React from 'react';
import FuturisticLoginIllustration from '../Common/FuturisticLoginIllustration';
import './LeftPanel.css';

const LeftPanel = () => {
  return (
    <div className="left-panel">
      <div className="content-area">
        <div className="text-center relative">
          {/* Futuristic Illustration */}
          <FuturisticLoginIllustration />
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
