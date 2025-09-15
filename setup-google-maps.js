#!/usr/bin/env node

/**
 * Google Maps API Setup Helper
 * This script helps configure Google Maps API for YATRIK ERP
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🗺️  Google Maps API Setup for YATRIK ERP');
console.log('==========================================\n');

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupGoogleMaps() {
  try {
    console.log('📋 Prerequisites:');
    console.log('1. Google Cloud Console project created');
    console.log('2. Maps JavaScript API and Maps Embed API enabled');
    console.log('3. API key generated\n');

    const apiKey = await askQuestion('🔑 Enter your Google Maps API key: ');
    
    if (!apiKey || !apiKey.startsWith('AIza')) {
      console.log('❌ Invalid API key format. API key should start with "AIza"');
      process.exit(1);
    }

    const envPath = path.join(__dirname, 'frontend', '.env');
    const envExamplePath = path.join(__dirname, 'frontend', '.env.example');

    // Create .env file
    const envContent = `# Google Maps API Configuration
REACT_APP_GOOGLE_MAPS_API_KEY=${apiKey}

# Other environment variables can be added here
# REACT_APP_API_BASE_URL=http://localhost:5000
`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file with your API key');

    // Create .env.example file
    const envExampleContent = `# Google Maps API Configuration
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Other environment variables
# REACT_APP_API_BASE_URL=http://localhost:5000
`;

    fs.writeFileSync(envExamplePath, envExampleContent);
    console.log('✅ Created .env.example file');

    console.log('\n🎉 Setup Complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. Restart your development server: npm start');
    console.log('2. Go to the landing page and click "Track Bus"');
    console.log('3. Verify the Google Maps integration works');

    console.log('\n🔧 Configuration:');
    console.log(`- API Key: ${apiKey.substring(0, 10)}...`);
    console.log(`- Environment file: ${envPath}`);
    console.log(`- Maps config: frontend/src/config/maps.js`);

    console.log('\n⚠️  Security Reminders:');
    console.log('- Never commit .env file to version control');
    console.log('- Restrict your API key to specific domains');
    console.log('- Monitor API usage in Google Cloud Console');

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
  } finally {
    rl.close();
  }
}

// Check if we're in the correct directory
if (!fs.existsSync(path.join(__dirname, 'frontend'))) {
  console.log('❌ Please run this script from the YATRIK ERP root directory');
  process.exit(1);
}

setupGoogleMaps();
