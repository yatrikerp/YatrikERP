// Google OAuth Configuration
// This file is now used for reference only - actual OAuth is handled by backend

export const GOOGLE_CONFIG = {
  // Your Google OAuth Client ID (you'll get this from Google Cloud Console)
  CLIENT_ID: '889305333159-938odo67058fepqktsd8ro7pvsp5c4lv.apps.googleusercontent.com',
  
  // Backend OAuth endpoint (using relative URL for proxy)
  BACKEND_OAUTH_URL: `${(((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) || process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, ''))}/api/auth/google`,
  
  // Frontend callback URL
  FRONTEND_CALLBACK_URL: 'http://localhost:5173/oauth/callback'
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









