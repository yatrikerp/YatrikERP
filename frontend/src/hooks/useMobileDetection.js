import { useState, useEffect } from 'react';

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const isMobileDevice = width < 768;
      const isTabletDevice = width >= 768 && width < 1024;
      
      setIsMobile(isMobileDevice);
      setIsTablet(isTabletDevice);
      
      if (isMobileDevice) {
        setScreenSize('mobile');
      } else if (isTabletDevice) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    // Initial check
    checkDevice();

    // Add event listener
    window.addEventListener('resize', checkDevice);

    // Cleanup
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return {
    isMobile,
    isTablet,
    screenSize,
    isMobileOrTablet: isMobile || isTablet
  };
};

export default useMobileDetection;
