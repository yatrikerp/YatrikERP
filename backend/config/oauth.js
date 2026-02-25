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
  console.error('');
  console.error('   📋 SETUP INSTRUCTIONS:');
  console.error('   1. Go to https://console.cloud.google.com/');
  console.error('   2. Select your project (or create a new one)');
  console.error('   3. Navigate to: APIs & Services > Credentials');
  console.error('   4. Click "Create Credentials" > "OAuth client ID"');
  console.error('   5. Application type: "Web application"');
  console.error('   6. Authorized redirect URIs:');
  console.error('      - Development: http://localhost:5000/api/auth/google/callback');
  console.error('      - Production: https://yatrikerp.onrender.com/api/auth/google/callback');
  console.error('   7. Copy the Client ID and Client Secret');
  console.error('   8. Add them to your .env file:');
  console.error('      GOOGLE_CLIENT_ID=your-client-id-here');
  console.error('      GOOGLE_CLIENT_SECRET=your-client-secret-here');
  console.error('   9. Make sure the OAuth consent screen is configured');
  console.error('   10. Ensure the OAuth client is ENABLED (not disabled)');
} else {
  // Validate format
  if (!config.google.clientID.includes('.apps.googleusercontent.com')) {
    console.warn('⚠️ WARNING: Google Client ID format may be invalid.');
    console.warn('   Expected format: XXXXXX-XXXXX.apps.googleusercontent.com');
  }
  
  if (config.google.clientSecret.length < 20) {
    console.warn('⚠️ WARNING: Google Client Secret seems too short.');
    console.warn('   Client secrets are typically 24+ characters long.');
  }
  
  // Check if the client ID matches the disabled one
  if (config.google.clientID && config.google.clientID.includes('889305333159-938odo67058fepqktsd8ro7pvsp5c4lv')) {
    console.error('');
    console.error('⚠️  ⚠️  ⚠️  CRITICAL WARNING ⚠️  ⚠️  ⚠️');
    console.error('   Your Google OAuth client is DISABLED in Google Cloud Console!');
    console.error('   Client ID: 889305333159-938odo67058fepqktsd8ro7pvsp5c4lv');
    console.error('');
    console.error('   🚨 THIS IS WHY GOOGLE SIGN-IN IS FAILING!');
    console.error('');
    console.error('   🔧 QUICK FIX (2 minutes):');
    console.error('   1. Go to: https://console.cloud.google.com/apis/credentials');
    console.error('   2. Find OAuth client: 889305333159-938odo67058fepqktsd8ro7pvsp5c4lv');
    console.error('   3. Click on it');
    console.error('   4. If status shows "Disabled", click "ENABLE" button');
    console.error('   5. Wait 30 seconds');
    console.error('   6. Restart this backend server');
    console.error('   7. Try Google sign-in again');
    console.error('');
    console.error('   📋 See: YOUR_GOOGLE_OAUTH_FIX.md for detailed instructions');
    console.error('');
  }
  
  console.log('✅ Google OAuth configuration loaded');
  console.log('   Client ID:', config.google.clientID.substring(0, 20) + '...');
  console.log('   Callback URL:', config.google.callbackURL);
}

module.exports = config;
