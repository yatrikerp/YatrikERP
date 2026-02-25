const axios = require('axios');

// Test depot login credentials
const testCredentials = [
  {
    name: 'Kattappana Sub Depot',
    email: 'ktp-subdepot@yatrik.com',
    password: 'KTP@Yatrik2024'
  },
  {
    name: 'Alappuzha Main Depot',
    email: 'alp-depot@yatrik.com',
    password: 'ALP@Yatrik2024'
  },
  {
    name: 'Thiruvananthapuram Central',
    email: 'tvm-depot@yatrik.com',
    password: 'TVM@Yatrik2024'
  }
];

async function testDepotLogin(credential) {
  try {
    console.log(`🔍 Testing login for: ${credential.name}`);
    console.log(`   Email: ${credential.email}`);
    console.log(`   Password: ${credential.password}`);

    const response = await axios.post('http://localhost:5000/api/depot-auth/login', {
      username: credential.email,
      email: credential.email,
      password: credential.password
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Login successful!');
      console.log(`   User ID: ${response.data.data.user._id}`);
      console.log(`   Username: ${response.data.data.user.username}`);
      console.log(`   Role: ${response.data.data.user.role}`);
      console.log(`   Depot ID: ${response.data.data.user.depotId}`);
      console.log(`   Token: ${response.data.data.token.substring(0, 20)}...`);
      
      // Test depot dashboard access
      console.log('\n🔍 Testing depot dashboard access...');
      const dashboardResponse = await axios.get('http://localhost:5000/api/depot-auth/dashboard', {
        headers: {
          'Authorization': `Bearer ${response.data.data.token}`
        }
      });

      if (dashboardResponse.data.success) {
        console.log('✅ Dashboard access successful!');
        console.log(`   Depot: ${dashboardResponse.data.data.depot.depotName}`);
        console.log(`   Capacity: ${dashboardResponse.data.data.stats.totalBuses} buses`);
        console.log(`   Available: ${dashboardResponse.data.data.stats.availableBuses} buses`);
      } else {
        console.log('❌ Dashboard access failed:', dashboardResponse.data.message);
      }

      return { success: true, credential: credential.name };
    } else {
      console.log('❌ Login failed:', response.data.message);
      return { success: false, credential: credential.name, error: response.data.message };
    }

  } catch (error) {
    if (error.response?.status === 401) {
      console.log('❌ Invalid credentials:', error.response.data.message);
    } else if (error.response?.status === 404) {
      console.log('❌ User not found - depot user may not exist');
    } else {
      console.log('❌ Login error:', error.response?.data || error.message);
    }
    return { success: false, credential: credential.name, error: error.response?.data || error.message };
  }
}

async function testAllDepotLogins() {
  console.log('🚀 Testing Depot Manager Login System...\n');
  
  const results = [];
  
  for (const credential of testCredentials) {
    const result = await testDepotLogin(credential);
    results.push(result);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('📊 LOGIN TEST SUMMARY:');
  console.log('=====================================');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful logins: ${successful}`);
  console.log(`❌ Failed logins: ${failed}`);
  
  if (successful > 0) {
    console.log('\n🎉 Depot login system is working!');
    console.log('💡 You can now use these credentials to login at:');
    console.log('🌐 http://localhost:5173/depot-login');
  } else {
    console.log('\n⚠️  No successful logins found.');
    console.log('💡 You may need to run the depot creation script first:');
    console.log('📝 node create-depot-users-comprehensive.js');
  }
}

// Run the tests
testAllDepotLogins().catch(console.error);

