// Mobile redirect utility for handling OAuth and other redirects
import { isMobileDevice, shouldUseMobileUI } from './mobileDetection';

export const getMobileAwareRoute = (route, role = 'PASSENGER') => {
  const isMobile = isMobileDevice() || shouldUseMobileUI();
  
  // Route mapping for mobile vs desktop
  const mobileRoutes = {
    '/pax': '/passenger/mobile',
    '/passenger/dashboard': '/passenger/mobile',
    '/dashboard': '/passenger/mobile'
  };
  
  // Only redirect passenger routes to mobile
  if (role === 'PASSENGER' && isMobile && mobileRoutes[route]) {
    console.log(`🔄 Mobile redirect: ${route} → ${mobileRoutes[route]}`);
    return mobileRoutes[route];
  }
  
  return route;
};

export const ensureMobileRedirect = (navigate, role = 'PASSENGER') => {
  const isMobile = isMobileDevice() || shouldUseMobileUI();
  
  if (isMobile && role === 'PASSENGER') {
    const currentPath = window.location.pathname;
    const mobileRoute = getMobileAwareRoute(currentPath, role);
    
    if (mobileRoute !== currentPath) {
      console.log(`🔄 Ensuring mobile redirect: ${currentPath} → ${mobileRoute}`);
      navigate(mobileRoute, { replace: true });
      return true;
    }
  }
  
  return false;
};

// Global mobile redirect check - can be called from anywhere
export const checkAndRedirectMobile = () => {
  const isMobile = isMobileDevice() || shouldUseMobileUI();
  const currentPath = window.location.pathname;
  
  if (isMobile && currentPath === '/pax') {
    console.log('🔄 Global mobile redirect check: redirecting /pax to /passenger/mobile');
    window.location.replace('/passenger/mobile');
    return true;
  }
  
  return false;
};
