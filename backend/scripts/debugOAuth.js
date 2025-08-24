const oauthConfig = require('../config/oauth');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

console.log('🔍 OAuth Configuration Debug:');
console.log('=====================================');
console.log('Config loaded:', oauthConfig);
console.log('Google Client Secret:', oauthConfig.google.clientSecret ? '✅ Set' : '❌ Missing');
console.log('Google Callback URL:', oauthConfig.google.callbackURL);

console.log('\n🔍 Testing Google Strategy Creation:');
console.log('=====================================');

try {
  // Test creating the Google strategy
  const strategy = new GoogleStrategy({
    clientID: oauthConfig.google.clientID,
    clientSecret: oauthConfig.google.clientSecret || 'test-secret',
    callbackURL: oauthConfig.google.callbackURL
  }, (accessToken, refreshToken, profile, done) => {
    console.log('✅ Google Strategy created successfully');
    done(null, { id: 'test' });
  });
  
  console.log('✅ Google Strategy object created');
  console.log('Strategy callback URL:', strategy._callbackURL);
  
} catch (error) {
  console.error('❌ Error creating Google Strategy:', error);
}

console.log('\n🔍 Environment Variables:');
console.log('=====================================');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET || '❌ Not set');
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || '❌ Not set');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '❌ Not set');
