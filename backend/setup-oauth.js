#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 YATRIK ERP OAuth Setup\n');

// Check if .env already exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists. This will update it.\n');
}

// Default values
const defaults = {
  NODE_ENV: 'development',
  PORT: '5000',
  MONGODB_URI: 'mongodb://localhost:27017/yatrik-erp',
  JWT_SECRET: 'your-super-secret-jwt-key-here-change-this-in-production',
  JWT_EXPIRE: '7d',
  FRONTEND_URL: 'http://localhost:3000',
  BCRYPT_ROUNDS: '12',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX: '100',
  SESSION_SECRET: 'please-change-this-session-secret'
};

// OAuth providers
const oauthProviders = [
  {
    name: 'Google',
    envVars: {
      GOOGLE_CLIENT_ID: 'your_google_client_id_here',
      GOOGLE_CLIENT_SECRET: 'your_google_client_secret_here',
      GOOGLE_CALLBACK_URL: 'http://localhost:5000/api/auth/google/callback'
    }
  },
  {
    name: 'Twitter',
    envVars: {
      TWITTER_CONSUMER_KEY: 'your_twitter_consumer_key_here',
      TWITTER_CONSUMER_SECRET: 'your_twitter_consumer_secret_here',
      TWITTER_CALLBACK_URL: 'http://localhost:5000/api/auth/twitter/callback'
    }
  },
  {
    name: 'Microsoft',
    envVars: {
      MICROSOFT_CLIENT_ID: 'your_microsoft_client_id_here',
      MICROSOFT_CLIENT_SECRET: 'your_microsoft_client_secret_here',
      MICROSOFT_CALLBACK_URL: 'http://localhost:5000/api/auth/microsoft/callback'
    }
  }
];

async function askQuestion(question, defaultValue = '') {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function setupOAuth() {
  console.log('📋 Setting up OAuth configuration...\n');
  
  const envContent = [];
  
  // Add default environment variables
  for (const [key, value] of Object.entries(defaults)) {
    envContent.push(`${key}=${value}`);
  }
  
  envContent.push(''); // Empty line
  
  // Add OAuth configuration
  for (const provider of oauthProviders) {
    console.log(`🔐 ${provider.name} OAuth Setup:`);
    
    for (const [key, defaultValue] of Object.entries(provider.envVars)) {
      let value;
      
      if (key.includes('CALLBACK_URL')) {
        // Callback URLs are fixed for localhost
        value = defaultValue;
        console.log(`  ${key}: ${value} (fixed for localhost)`);
      } else if (key.includes('CLIENT_ID') || key.includes('CONSUMER_KEY')) {
        value = await askQuestion(`  ${key}: `, defaultValue);
        if (value === defaultValue) {
          console.log(`    ⚠️  Please get your ${provider.name} Client ID from the developer console`);
        }
      } else if (key.includes('CLIENT_SECRET') || key.includes('CONSUMER_SECRET')) {
        value = await askQuestion(`  ${key}: `, defaultValue);
        if (value === defaultValue) {
          console.log(`    ⚠️  Please get your ${provider.name} Client Secret from the developer console`);
        }
      }
      
      envContent.push(`${key}=${value}`);
    }
    
    console.log(''); // Empty line
  }
  
  // Write .env file
  fs.writeFileSync(envPath, envContent.join('\n'));
  
  console.log('✅ .env file created successfully!');
  console.log('\n📚 Next steps:');
  console.log('1. Get your OAuth credentials from the respective providers');
  console.log('2. Update the .env file with your actual credentials');
  console.log('3. Restart your backend server');
  console.log('\n🔗 OAuth Provider Links:');
  console.log('  Google: https://console.cloud.google.com/');
  console.log('  Twitter: https://developer.twitter.com/');
  console.log('  Microsoft: https://portal.azure.com/');
  
  rl.close();
}

setupOAuth().catch(console.error);
