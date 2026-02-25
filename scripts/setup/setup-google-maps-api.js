#!/usr/bin/env node

/**
 * Google Maps API Setup Script for YATRIK ERP
 * This script helps configure the Google Maps API key for the frontend
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🗺️  YATRIK ERP - Google Maps API Setup');
console.log('=====================================\n');

console.log('This script will help you configure Google Maps API for live bus tracking.\n');

console.log('📋 Prerequisites:');
console.log('1. Go to https://console.cloud.google.com/');
console.log('2. Create a new project or select existing one');
console.log('3. Enable the following APIs:');
console.log('   - Maps JavaScript API');
console.log('   - Directions API');
console.log('   - Places API');
console.log('   - Geocoding API');
console.log('4. Create credentials (API Key)');
console.log('5. Restrict the API key to your domain (optional but recommended)\n');

rl.question('Enter your Google Maps API Key: ', (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.log('❌ No API key provided. Exiting...');
    rl.close();
    return;
  }

  const envContent = `# YATRIK ERP Frontend - Development Environment Configuration

# API Configuration
REACT_APP_API_URL=http://localhost:5000

# Razorpay Configuration (for development)
REACT_APP_RAZORPAY_KEY=rzp_test_your_razorpay_key_here

# Google Maps API Configuration
# Get your API key from: https://console.cloud.google.com/
# Enable the following APIs:
# - Maps JavaScript API
# - Directions API
# - Places API
# - Geocoding API
VITE_GOOGLE_MAPS_API_KEY=${apiKey.trim()}

# Development Configuration
PORT=5173`;

  const envPath = path.join(__dirname, 'frontend', '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Environment file created successfully!');
    console.log(`📁 Location: ${envPath}`);
    console.log('\n🚀 Next steps:');
    console.log('1. Restart your frontend development server');
    console.log('2. The Google Maps integration should now work');
    console.log('3. Test the Live Bus Tracking feature');
    console.log('\n💡 Note: Make sure to add .env to your .gitignore file');
  } catch (error) {
    console.error('❌ Error creating environment file:', error.message);
    console.log('\n🔧 Manual setup:');
    console.log('1. Create a file named ".env" in the frontend directory');
    console.log('2. Add the following content:');
    console.log(`VITE_GOOGLE_MAPS_API_KEY=${apiKey.trim()}`);
  }
  
  rl.close();
});

rl.on('close', () => {
  console.log('\n🎉 Setup complete! Happy coding!');
});
