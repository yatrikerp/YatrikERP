#!/usr/bin/env node

/**
 * Google OAuth Environment Setup Script
 * This script helps you set up your Google OAuth credentials
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupGoogleOAuth() {
  console.log('\n🔧 Google OAuth Environment Setup\n');
  console.log('='.repeat(50));
  
  // Your provided credentials
  const providedCredentials = {
    clientID: '889305333159-938odo67058fepqktsd8ro7pvsp5c4lv.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: 'http://localhost:5000/api/auth/google/callback'
  };
  
  console.log('\n📋 Your Current Credentials:');
  console.log('   Client ID:', providedCredentials.clientID);
  console.log('   Client Secret:', providedCredentials.clientSecret.substring(0, 15) + '...');
  console.log('   Callback URL:', providedCredentials.callbackURL);
  
  console.log('\n⚠️  IMPORTANT: This OAuth client is DISABLED in Google Cloud Console!');
  console.log('   You MUST enable it before Google sign-in will work.\n');
  
  const useProvided = await askQuestion('Do you want to use these credentials? (yes/no): ');
  
  if (useProvided.toLowerCase() !== 'yes' && useProvided.toLowerCase() !== 'y') {
    console.log('\nPlease provide your credentials:');
    const clientID = await askQuestion('Google Client ID: ');
    const clientSecret = await askQuestion('Google Client Secret: ');
    const callbackURL = await askQuestion('Callback URL (default: http://localhost:5000/api/auth/google/callback): ') || 'http://localhost:5000/api/auth/google/callback';
    
    providedCredentials.clientID = clientID;
    providedCredentials.clientSecret = clientSecret;
    providedCredentials.callbackURL = callbackURL;
  }
  
  // Determine environment
  const isProduction = await askQuestion('\nIs this for production? (yes/no): ');
  const isProd = isProduction.toLowerCase() === 'yes' || isProduction.toLowerCase() === 'y';
  
  if (isProd) {
    providedCredentials.callbackURL = 'https://yatrikerp.onrender.com/api/auth/google/callback';
    console.log('\n✅ Using production callback URL:', providedCredentials.callbackURL);
  }
  
  // Find or create .env file
  const envPath = path.join(__dirname, 'backend', '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('\n✅ Found existing .env file');
  } else {
    console.log('\n📝 Creating new .env file');
  }
  
  // Update or add Google OAuth credentials
  const lines = envContent.split('\n');
  let updated = false;
  const newLines = lines.map(line => {
    if (line.startsWith('GOOGLE_CLIENT_ID=')) {
      updated = true;
      return `GOOGLE_CLIENT_ID=${providedCredentials.clientID}`;
    }
    if (line.startsWith('GOOGLE_CLIENT_SECRET=')) {
      updated = true;
      return `GOOGLE_CLIENT_SECRET=${providedCredentials.clientSecret}`;
    }
    if (line.startsWith('GOOGLE_CALLBACK_URL=')) {
      updated = true;
      return `GOOGLE_CALLBACK_URL=${providedCredentials.callbackURL}`;
    }
    return line;
  });
  
  if (!updated) {
    // Add new lines if they don't exist
    newLines.push('');
    newLines.push('# Google OAuth Configuration');
    newLines.push(`GOOGLE_CLIENT_ID=${providedCredentials.clientID}`);
    newLines.push(`GOOGLE_CLIENT_SECRET=${providedCredentials.clientSecret}`);
    newLines.push(`GOOGLE_CALLBACK_URL=${providedCredentials.callbackURL}`);
  }
  
  // Write to file
  fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');
  console.log('\n✅ Updated backend/.env file');
  
  console.log('\n📋 Next Steps:');
  console.log('   1. Go to: https://console.cloud.google.com/apis/credentials');
  console.log('   2. Find OAuth client: 889305333159-938odo67058fepqktsd8ro7pvsp5c4lv');
  console.log('   3. Click on it');
  console.log('   4. If status shows "Disabled", click "ENABLE"');
  console.log('   5. Verify Authorized redirect URIs include:');
  console.log('      -', providedCredentials.callbackURL);
  if (isProd) {
    console.log('      - http://localhost:5000/api/auth/google/callback (for development)');
  }
  console.log('   6. Restart your backend server');
  console.log('   7. Test Google sign-in\n');
  
  rl.close();
}

setupGoogleOAuth().catch(console.error);
