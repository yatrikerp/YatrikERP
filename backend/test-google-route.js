const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

console.log('🧪 Testing Google OAuth Route Setup\n');

// Test environment variables
console.log('📋 Environment Variables:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL ? '✅ Set' : '❌ Missing');

// Test OAuth config
try {
  const oauthConfig = require('./config/oauth');
  console.log('\n📋 OAuth Config:');
  console.log('Google Client ID:', oauthConfig.google.clientID ? '✅ Set' : '❌ Missing');
  console.log('Google Client Secret:', oauthConfig.google.clientSecret ? '✅ Set' : '❌ Missing');
  console.log('Google Callback URL:', oauthConfig.google.callbackURL ? '✅ Set' : '❌ Missing');
} catch (error) {
  console.log('❌ Error loading OAuth config:', error.message);
}

// Test Passport Google Strategy
console.log('\n🔐 Testing Passport Google Strategy:');
try {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('✅ Environment variables are set');
    
    // Test if we can create the strategy
    const testStrategy = new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
    }, (accessToken, refreshToken, profile, done) => {
      console.log('✅ Google Strategy callback function works');
      return done(null, { id: 'test-user' });
    });
    
    console.log('✅ Google Strategy can be created');
  } else {
    console.log('❌ Missing required environment variables');
  }
} catch (error) {
  console.log('❌ Error creating Google Strategy:', error.message);
}

// Test basic Express setup
console.log('\n🚀 Testing Express Setup:');
try {
  const app = express();
  app.use(passport.initialize());
  console.log('✅ Express and Passport can be initialized');
} catch (error) {
  console.log('❌ Error initializing Express/Passport:', error.message);
}

console.log('\n📚 Next Steps:');
console.log('1. Check if MongoDB is running and accessible');
console.log('2. Verify Google Cloud Console OAuth app settings');
console.log('3. Check browser console for any JavaScript errors');
console.log('4. Test the route: http://localhost:5000/api/auth/google');
console.log('5. Check backend server logs for any errors');
