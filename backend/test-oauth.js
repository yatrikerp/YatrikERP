require('dotenv').config();

console.log('🔍 OAuth Configuration Debug:');
console.log('=============================');

// Check environment variables
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);
console.log('GOOGLE_CLIENT_SECRET length:', process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.length : 'undefined');
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);

// Test OAuth config loading
const oauthConfig = require('./config/oauth');
console.log('\n📋 OAuth Config Object:');
console.log('Google Client ID:', oauthConfig.google.clientID);
console.log('Google Client Secret:', oauthConfig.google.clientSecret);
console.log('Google Client Secret exists:', !!oauthConfig.google.clientSecret);
console.log('Google Client Secret length:', oauthConfig.google.clientSecret ? oauthConfig.google.clientSecret.length : 'undefined');

// Test if Google strategy would be initialized
if (oauthConfig.google.clientSecret) {
  console.log('✅ Google OAuth strategy would be initialized');
} else {
  console.log('❌ Google OAuth strategy will NOT be initialized - missing client secret');
}
