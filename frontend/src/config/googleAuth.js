// Google OAuth Configuration
// This file is now used for reference only - actual OAuth is handled by backend

// Determine base URL dynamically
const getBackendURL = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof process !== 'undefined' && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Production default
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000' 
    : 'https://yatrikerp.onrender.com';
};

const getFrontendURL = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FRONTEND_URL) {
    return import.meta.env.VITE_FRONTEND_URL;
  }
  if (typeof process !== 'undefined' && process.env.REACT_APP_FRONTEND_URL) {
    return process.env.REACT_APP_FRONTEND_URL;
  }
  // Production default
  return window.location.origin;
};

export const GOOGLE_CONFIG = {
  // Your Google OAuth Client ID (you'll get this from Google Cloud Console)
  CLIENT_ID: '889305333159-938odo67058fepqktsd8ro7pvsp5c4lv.apps.googleusercontent.com',
  
  // Backend OAuth endpoint (using environment variables)
  BACKEND_OAUTH_URL: `${getBackendURL().replace(/\/$/, '')}/api/auth/google`,
  
  // Frontend callback URL (using environment variables)
  FRONTEND_CALLBACK_URL: `${getFrontendURL()}/oauth/callback`
};

// Helper function to handle Google authentication via backend
export const handleGoogleAuth = () => {
  try {
    console.log('Redirecting to backend Google OAuth...');
    
    // Redirect to backend OAuth endpoint
    window.location.href = GOOGLE_CONFIG.BACKEND_OAUTH_URL;
    
  } catch (error) {
    console.error('Google Auth Error:', error);
    alert('Google authentication failed. Please try again.');
  }
};









