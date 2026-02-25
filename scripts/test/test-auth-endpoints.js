#!/usr/bin/env node

/**
 * Authentication Endpoints Test Script
 * Tests the authentication API endpoints to verify they're working correctly
 */

const http = require('http');

console.log('🔐 Testing Authentication Endpoints');
console.log('==================================\n');

// Test configuration
const config = {
  hostname: 'localhost',
  port: 5000,
  timeout: 5000
};

// Test data
const testCredentials = {
  email: 'admin@yatrik.com',
  password: 'admin123',
  depotEmail: 'test-depot@yatrik.com',
  depotPassword: 'depot123'
};

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.hostname,
      port: config.port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: config.timeout
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testHealthEndpoint() {
  console.log('🏥 Testing health endpoint...');
  try {
    const response = await makeRequest('/api/health');
    if (response.statusCode === 200) {
      console.log('✅ Health endpoint is working');
      console.log(`   Database: ${response.data.database || 'unknown'}`);
      console.log(`   API: ${response.data.api || 'unknown'}`);
    } else {
      console.log(`❌ Health endpoint failed with status ${response.statusCode}`);
    }
  } catch (error) {
    console.log('❌ Health endpoint error:', error.message);
  }
  console.log('');
}

async function testAuthLoginEndpoint() {
  console.log('🔑 Testing auth login endpoint...');
  try {
    const response = await makeRequest('/api/auth/login', 'POST', {
      email: testCredentials.email,
      password: testCredentials.password
    });
    
    if (response.statusCode === 200) {
      console.log('✅ Auth login endpoint is working');
      console.log(`   User: ${response.data.data?.user?.name || 'unknown'}`);
      console.log(`   Role: ${response.data.data?.user?.role || 'unknown'}`);
    } else if (response.statusCode === 401) {
      console.log('⚠️  Auth login endpoint is working but credentials are invalid');
      console.log('   This is expected if test user doesn\'t exist');
    } else {
      console.log(`❌ Auth login endpoint failed with status ${response.statusCode}`);
      console.log(`   Error: ${response.data.error || response.data.message || 'unknown'}`);
    }
  } catch (error) {
    console.log('❌ Auth login endpoint error:', error.message);
  }
  console.log('');
}

async function testDepotAuthLoginEndpoint() {
  console.log('🏢 Testing depot auth login endpoint...');
  try {
    const response = await makeRequest('/api/depot-auth/login', 'POST', {
      username: testCredentials.depotEmail,
      password: testCredentials.depotPassword
    });
    
    if (response.statusCode === 200) {
      console.log('✅ Depot auth login endpoint is working');
      console.log(`   User: ${response.data.data?.user?.username || 'unknown'}`);
      console.log(`   Role: ${response.data.data?.user?.role || 'unknown'}`);
    } else if (response.statusCode === 401) {
      console.log('⚠️  Depot auth login endpoint is working but credentials are invalid');
      console.log('   This is expected if test depot user doesn\'t exist');
    } else {
      console.log(`❌ Depot auth login endpoint failed with status ${response.statusCode}`);
      console.log(`   Error: ${response.data.error || response.data.message || 'unknown'}`);
    }
  } catch (error) {
    console.log('❌ Depot auth login endpoint error:', error.message);
  }
  console.log('');
}

async function testInvalidEndpoint() {
  console.log('🚫 Testing invalid endpoint (should return 404)...');
  try {
    const response = await makeRequest('/api/invalid-endpoint');
    if (response.statusCode === 404) {
      console.log('✅ Invalid endpoint correctly returns 404');
    } else {
      console.log(`⚠️  Invalid endpoint returned status ${response.statusCode} instead of 404`);
    }
  } catch (error) {
    console.log('❌ Invalid endpoint test error:', error.message);
  }
  console.log('');
}

async function testServerConnection() {
  console.log('🔌 Testing server connection...');
  try {
    const response = await makeRequest('/api/health');
    console.log('✅ Server is reachable');
  } catch (error) {
    console.log('❌ Server is not reachable:', error.message);
    console.log('💡 Make sure the backend server is running: cd backend && npm run dev');
    return false;
  }
  console.log('');
  return true;
}

// Main test function
async function runTests() {
  console.log('Starting authentication endpoint tests...\n');
  
  const serverReachable = await testServerConnection();
  if (!serverReachable) {
    console.log('❌ Cannot proceed with tests - server is not reachable');
    process.exit(1);
  }
  
  await testHealthEndpoint();
  await testAuthLoginEndpoint();
  await testDepotAuthLoginEndpoint();
  await testInvalidEndpoint();
  
  console.log('🎉 Authentication endpoint tests completed!');
  console.log('\n📋 Summary:');
  console.log('- If you see ✅ for login endpoints, they are working correctly');
  console.log('- If you see ⚠️  for login endpoints, the endpoints work but test users may not exist');
  console.log('- If you see ❌ for any endpoint, there may be a configuration issue');
  console.log('\n💡 To create test users, check the backend scripts directory');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testHealthEndpoint, testAuthLoginEndpoint, testDepotAuthLoginEndpoint };

