#!/usr/bin/env node

require('dotenv').config();

console.log('🔍 Google OAuth Configuration Verification');
console.log('=========================================\n');

// Check environment variables
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

console.log('📋 Environment Variables:');
console.log(`GOOGLE_CLIENT_ID: ${clientId ? '✅ Set' : '❌ Missing'}`);
console.log(`GOOGLE_CLIENT_SECRET: ${clientSecret ? '✅ Set' : '❌ Missing'}`);
console.log(`GOOGLE_CALLBACK_URL: ${callbackUrl ? '✅ Set' : '❌ Missing'}`);

if (clientId) {
  console.log(`   Client ID: ${clientId}`);
}
if (clientSecret) {
  console.log(`   Client Secret: ${clientSecret.substring(0, 10)}...${clientSecret.substring(clientSecret.length - 4)}`);
  console.log(`   Secret Length: ${clientSecret.length} characters`);
  
  // Check if secret looks complete
  if (clientSecret.length < 20) {
    console.log('   ⚠️  WARNING: Client Secret appears to be too short!');
    console.log('   ⚠️  Google Client Secrets are typically 24+ characters long.');
  }
}
if (callbackUrl) {
  console.log(`   Callback URL: ${callbackUrl}`);
}

console.log('\n🔧 OAuth Configuration:');
try {
  const oauthConfig = require('./config/oauth');
  console.log(`Google Strategy Enabled: ${oauthConfig.google.clientSecret ? '✅ Yes' : '❌ No'}`);
  
  if (oauthConfig.google.clientSecret) {
    console.log('✅ Google OAuth strategy will be initialized');
  } else {
    console.log('❌ Google OAuth strategy will NOT be initialized');
    console.log('   This is why Google sign-in is not working!');
  }
} catch (error) {
  console.log('❌ Error loading OAuth config:', error.message);
}

console.log('\n📚 Next Steps:');
if (!clientSecret || clientSecret.length < 20) {
  console.log('1. Go to https://console.cloud.google.com/');
  console.log('2. Navigate to "APIs & Services" > "Credentials"');
  console.log('3. Find your OAuth 2.0 Client ID');
  console.log('4. Copy the complete Client Secret (should be ~24+ characters)');
  console.log('5. Update your .env file');
  console.log('6. Restart the backend server');
} else {
  console.log('✅ Configuration looks good!');
  console.log('If Google sign-in still doesn\'t work, check:');
  console.log('- Google Cloud Console OAuth app settings');
  console.log('- Authorized origins and redirect URIs');
  console.log('- Backend server logs for errors');
}

console.log('\n🧪 Test the configuration:');
console.log('1. Restart backend: npm start');
console.log('2. Visit: http://localhost:3000/login');
console.log('3. Click "Sign in with Google"');
console.log('4. Should redirect to Google OAuth consent screen');
