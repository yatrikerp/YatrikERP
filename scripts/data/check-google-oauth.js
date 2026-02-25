#!/usr/bin/env node

/**
 * Google OAuth Configuration Checker
 * This script helps verify your Google OAuth setup
 */

require('dotenv').config({ path: './backend/.env' });

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

console.log('\n🔍 Google OAuth Configuration Checker\n');
console.log('='.repeat(50));

// Check if credentials exist
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('❌ ERROR: Google OAuth credentials are missing!');
  console.error('\nRequired environment variables:');
  console.error('  - GOOGLE_CLIENT_ID');
  console.error('  - GOOGLE_CLIENT_SECRET');
  console.error('\nCurrent values:');
  console.error('  - GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? 'SET' : 'MISSING ❌');
  console.error('  - GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING ❌');
  console.error('\n📋 To fix:');
  console.error('  1. Go to: https://console.cloud.google.com/apis/credentials');
  console.error('  2. Create or find your OAuth client');
  console.error('  3. Copy Client ID and Client Secret');
  console.error('  4. Add them to backend/.env file');
  process.exit(1);
}

console.log('✅ Environment variables found');

// Validate Client ID format
if (!GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')) {
  console.error('❌ ERROR: Invalid Client ID format');
  console.error('   Expected format: XXXXXX-XXXXX.apps.googleusercontent.com');
  console.error('   Your Client ID:', GOOGLE_CLIENT_ID);
  process.exit(1);
}

console.log('✅ Client ID format is valid');

// Check for the known disabled client
if (GOOGLE_CLIENT_ID.includes('889305333159-938odo67058fepqktsd8ro7pvsp5c4lv')) {
  console.warn('\n⚠️  WARNING: You are using a client ID that may be DISABLED!');
  console.warn('   Client ID: 889305333159-938odo67058fepqktsd8ro7pvsp5c4lv');
  console.warn('\n🔧 TO FIX THIS ERROR:');
  console.warn('\n   OPTION 1: Enable the existing client (Fastest)');
  console.warn('   1. Go to: https://console.cloud.google.com/apis/credentials');
  console.warn('   2. Find OAuth client: 889305333159-938odo67058fepqktsd8ro7pvsp5c4lv');
  console.warn('   3. Click on it');
  console.warn('   4. If status shows "Disabled", click "ENABLE" button');
  console.warn('   5. Wait 30 seconds, then try Google sign-in again');
  console.warn('\n   OPTION 2: Create a new OAuth client (Recommended)');
  console.warn('   1. Go to: https://console.cloud.google.com/apis/credentials');
  console.warn('   2. Click "+ CREATE CREDENTIALS" > "OAuth client ID"');
  console.warn('   3. Application type: "Web application"');
  console.warn('   4. Name: "YATRIK ERP Web Client"');
  console.warn('   5. Authorized redirect URIs:');
  console.warn('      - Development: http://localhost:5000/api/auth/google/callback');
  console.warn('      - Production: https://yatrikerp.onrender.com/api/auth/google/callback');
  console.warn('   6. Click "Create"');
  console.warn('   7. Copy the new Client ID and Client Secret');
  console.warn('   8. Update backend/.env with new credentials');
  console.warn('   9. Restart your backend server');
  console.warn('\n');
}

// Validate Client Secret length
if (GOOGLE_CLIENT_SECRET.length < 20) {
  console.warn('⚠️  WARNING: Client Secret seems too short');
  console.warn('   Client secrets are typically 24+ characters');
}

console.log('✅ Client Secret length is acceptable');

// Check callback URL
if (GOOGLE_CALLBACK_URL) {
  console.log('✅ Callback URL configured:', GOOGLE_CALLBACK_URL);
} else {
  const isDev = process.env.NODE_ENV !== 'production';
  const defaultCallback = isDev 
    ? 'http://localhost:5000/api/auth/google/callback'
    : 'https://yatrikerp.onrender.com/api/auth/google/callback';
  console.log('ℹ️  Using default callback URL:', defaultCallback);
}

console.log('\n📋 Configuration Summary:');
console.log('   Client ID:', GOOGLE_CLIENT_ID.substring(0, 30) + '...');
console.log('   Client Secret:', GOOGLE_CLIENT_SECRET.substring(0, 10) + '...' + ' (hidden)');
console.log('   Callback URL:', GOOGLE_CALLBACK_URL || 'Using default');

console.log('\n✅ Configuration check complete!');
console.log('\n📝 Next Steps:');
console.log('   1. Make sure the OAuth client is ENABLED in Google Cloud Console');
console.log('   2. Verify the redirect URI matches exactly');
console.log('   3. Ensure OAuth consent screen is configured');
console.log('   4. Restart your backend server');
console.log('   5. Try Google sign-in again\n');
