// Google Maps API Configuration
export const GOOGLE_MAPS_CONFIG = {
  // Vite env key (must be defined as VITE_GOOGLE_MAPS_API_KEY in .env)
  API_KEY: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
  
  // Default map options
  DEFAULT_ZOOM: 13,
  DEFAULT_CENTER: {
    lat: 9.9312, // Kochi, Kerala
    lng: 76.2673
  },
  
  // Map styles and options
  MAP_OPTIONS: {
    zoom: 13,
    mapTypeId: 'roadmap',
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    mapTypeControl: true
  }
};

// Helper function to generate Google Maps embed URL
export const generateMapsEmbedUrl = (lat, lng, zoom = 13, apiKey = GOOGLE_MAPS_CONFIG.API_KEY) => {
  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    console.warn('Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your frontend .env');
    return null;
  }
  
  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=${zoom}&maptype=roadmap`;
};

// Helper function to generate Google Maps directions URL
export const generateDirectionsUrl = (origin, destination, apiKey = GOOGLE_MAPS_CONFIG.API_KEY) => {
  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    console.warn('Google Maps API key not configured');
    return null;
  }
  
  return `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=driving`;
};

// Helper function to check if API key is configured
export const isMapsApiConfigured = () => {
  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || undefined;
  return apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE' && apiKey.length > 10;
};
