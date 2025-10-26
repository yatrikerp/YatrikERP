// Backend OAuth Configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const config = {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || (isDevelopment ? 'http://localhost:5000/api/auth/google/callback' : 'https://yatrikerp.onrender.com/api/auth/google/callback'),
    scope: ['profile', 'email']
  },
  // Use environment variable, fallback to correct URL based on environment
  frontendURL: process.env.FRONTEND_URL || (isDevelopment ? 'http://localhost:3000' : 'https://yatrikerp.live'),
  jwtSecret: process.env.JWT_SECRET || 'yatrikerp',
  jwtExpire: process.env.JWT_EXPIRE || '7d'
};

// Validate OAuth configuration - no fallbacks, require proper environment variables
if (!config.google.clientID || !config.google.clientSecret) {
  console.error('❌ ERROR: Google OAuth credentials are missing!');
  console.error('   Required environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET');
  console.error('   Google OAuth will not work until these are properly configured.');
  console.error('   Current values:');
  console.error('   - GOOGLE_CLIENT_ID:', config.google.clientID ? 'SET' : 'MISSING');
  console.error('   - GOOGLE_CLIENT_SECRET:', config.google.clientSecret ? 'SET' : 'MISSING');
  console.error('   - GOOGLE_CALLBACK_URL:', config.google.callbackURL);
}

module.exports = config;
