import React from 'react';
import useMediaQuery from '../hooks/useMediaQuery';
import MobileLandingPage from '../mobile/LandingPage';
import LandingPage from '../pages/LandingPage';

const MobileWrapper = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // If mobile, show mobile landing page
  // If desktop, show existing desktop landing page
  return isMobile ? <MobileLandingPage /> : <LandingPage />;
};

export default MobileWrapper;

