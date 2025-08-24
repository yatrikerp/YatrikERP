// Simple test script to test the search API
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function testSearchAPI() {
  console.log('🧪 Testing YATRIK ERP Search API...\n');

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
      if (citiesData.data?.cities?.length > 0) {
        console.log('📍 Sample cities:', citiesData.data.cities.slice(0, 5));
      }
    } else {
      console.log('❌ Cities API failed:', citiesResponse.status);
    }

    // Test 3: Test popular routes API
    console.log('\n3️⃣ Testing popular routes API...');
    const routesResponse = await fetch(`${BASE_URL}/api/booking/popular-routes`);
    if (routesResponse.ok) {
      const routesData = await routesResponse.json();
      console.log('✅ Popular routes API working:', routesData.data?.routes?.length || 0, 'routes found');
      if (routesData.data?.routes?.length > 0) {
        console.log('🚌 Sample routes:', routesData.data.routes.slice(0, 3));
      }
    } else {
      console.log('❌ Popular routes API failed:', routesResponse.status);
    }

    // Test 4: Test trip search API with any cities
    console.log('\n4️⃣ Testing trip search API...');
    const searchResponse = await fetch(`${BASE_URL}/api/booking/search?from=Mumbai&to=Pune&date=2025-08-25`);
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('✅ Trip search API working:', searchData.data?.trips?.length || 0, 'trips found');
      if (searchData.data?.trips?.length > 0) {
        console.log('🎫 Sample trips:', searchData.data.trips.slice(0, 2));
      } else {
        console.log('ℹ️  No trips found (this is expected if no routes exist yet)');
      }
    } else {
      console.log('❌ Trip search API failed:', searchResponse.status);
    }

    console.log('\n🎉 API testing completed!');
    console.log('\n💡 Next steps:');
    console.log('1. If cities/routes are empty, create sample data');
    console.log('2. If search works but finds no trips, create routes and trips');
    console.log('3. Test the frontend search functionality');
    
  } catch (error) {
    console.error('❌ Error testing APIs:', error.message);
  }
}

// Run the test
testSearchAPI();
