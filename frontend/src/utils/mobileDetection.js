// Utility functions for mobile detection
export const isMobileDevice = () => {
  // Check multiple indicators for mobile
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isMobileWidth = window.innerWidth < 768;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Consider it mobile if any two conditions are true
  const mobileIndicators = [isMobileUserAgent, isMobileWidth, isTouchDevice];
  const trueCount = mobileIndicators.filter(Boolean).length;
  
  return trueCount >= 2;
};

export const isTabletDevice = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isTabletUserAgent = /ipad|tablet|kindle|silk/i.test(userAgent);
  const isTabletWidth = window.innerWidth >= 768 && window.innerWidth < 1024;
  
  return isTabletUserAgent || isTabletWidth;
};

export const getDeviceType = () => {
  if (isMobileDevice()) return 'mobile';
  if (isTabletDevice()) return 'tablet';
  return 'desktop';
};

export const shouldUseMobileUI = () => {
  return isMobileDevice() || isTabletDevice();
};
