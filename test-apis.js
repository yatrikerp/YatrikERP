// Test script to verify backend APIs
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function testAPIs() {
  console.log('🧪 Testing YATRIK ERP Backend APIs...\n');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server connectivity...');
    const healthResponse = await fetch(`${BASE_URL}/api/auth/me`);
    console.log('✅ Server is running');
    
    // Test 2: Test cities API
    console.log('\n2️⃣ Testing cities API...');
    const citiesResponse = await fetch(`${BASE_URL}/api/booking/cities`);
    if (citiesResponse.ok) {
      const citiesData = await citiesResponse.json();
      console.log('✅ Cities API working:', citiesData.data?.cities?.length || 0, 'cities found');
    } else {
      console.log('❌ Cities API failed:', citiesResponse.status);
    }

    // Test 3: Test popular routes API
    console.log('\n3️⃣ Testing popular routes API...');
    const routesResponse = await fetch(`${BASE_URL}/api/booking/popular-routes`);
    if (routesResponse.ok) {
      const routesData = await routesResponse.json();
      console.log('✅ Popular routes API working:', routesData.data?.routes?.length || 0, 'routes found');
    } else {
      console.log('❌ Popular routes API failed:', routesResponse.status);
    }

    // Test 4: Test trip search API
    console.log('\n4️⃣ Testing trip search API...');
    const searchResponse = await fetch(`${BASE_URL}/api/booking/search?from=Mumbai&to=Pune&date=2025-08-25`);
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('✅ Trip search API working:', searchData.data?.trips?.length || 0, 'trips found');
    } else {
      console.log('❌ Trip search API failed:', searchResponse.status);
    }

    console.log('\n🎉 API testing completed!');
    
  } catch (error) {
    console.error('❌ Error testing APIs:', error.message);
  }
}

// Run the test
testAPIs();
