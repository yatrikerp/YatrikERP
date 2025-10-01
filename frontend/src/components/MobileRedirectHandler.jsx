import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isMobileDevice, shouldUseMobileUI } from '../utils/mobileDetection';

const MobileRedirectHandler = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Only redirect if user is logged in and is a passenger
    if (!user || user.role !== 'passenger') {
      return;
    }

    const isMobile = isMobileDevice() || shouldUseMobileUI();
    
    if (isMobile) {
      const currentPath = location.pathname;
      
      // Routes that should redirect to mobile dashboard
      const mobileRedirectRoutes = ['/pax', '/passenger/dashboard'];
      
      if (mobileRedirectRoutes.includes(currentPath)) {
        console.log(`🔄 MobileRedirectHandler: Redirecting ${currentPath} to /passenger/mobile`);
        navigate('/passenger/mobile', { replace: true });
      }
    }
  }, [location.pathname, user, navigate]);

  return children;
};

export default MobileRedirectHandler;
