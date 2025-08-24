// Simple test script to test the search API using built-in modules
const http = require('http');

const BASE_URL = 'localhost';
const PORT = 5000;

function makeRequest(path, callback) {
  const options = {
    hostname: BASE_URL,
    port: PORT,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        callback(null, res.statusCode, jsonData);
      } catch (error) {
        callback(error, res.statusCode, data);
      }
    });
  });

  req.on('error', (error) => {
    callback(error);
  });

  req.end();
}

async function testSearchAPI() {
  console.log('🧪 Testing YATRIK ERP Search API...\n');

  try {
    // Test 1: Check existing trips
    console.log('1️⃣ Testing existing trips API...');
    makeRequest('/api/booking/existing-trips', (error, statusCode, data) => {
      if (error) {
        console.log('❌ Error:', error.message);
        return;
      }
      
      if (statusCode === 200) {
        console.log('✅ Existing trips API working:', data.data?.total || 0, 'trips found');
        if (data.data?.trips?.length > 0) {
          console.log('🎫 Sample trips:');
          data.data.trips.slice(0, 3).forEach(trip => {
            console.log(`   - ${trip.route?.from} → ${trip.route?.to} on ${trip.date} at ${trip.time}`);
          });
        }
      } else {
        console.log('❌ Existing trips API failed:', statusCode);
      }
    });

    // Wait a bit for the first request
    setTimeout(() => {
      // Test 2: Test cities API
      console.log('\n2️⃣ Testing cities API...');
      makeRequest('/api/booking/cities', (error, statusCode, data) => {
        if (error) {
          console.log('❌ Error:', error.message);
          return;
        }
        
        if (statusCode === 200) {
          console.log('✅ Cities API working:', data.data?.cities?.length || 0, 'cities found');
          if (data.data?.cities?.length > 0) {
            console.log('📍 Sample cities:', data.data.cities.slice(0, 5));
          }
        } else {
          console.log('❌ Cities API failed:', statusCode);
        }
      });
    }, 1000);

    // Wait a bit for the second request
    setTimeout(() => {
      // Test 3: Test trip search API
      console.log('\n3️⃣ Testing trip search API...');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const searchDate = tomorrow.toISOString().split('T')[0];
      
      makeRequest(`/api/booking/search?from=Mumbai&to=Pune&date=${searchDate}`, (error, statusCode, data) => {
        if (error) {
          console.log('❌ Error:', error.message);
          return;
        }
        
        if (statusCode === 200) {
          console.log('✅ Trip search API working:', data.data?.trips?.length || 0, 'trips found');
          if (data.data?.trips?.length > 0) {
            console.log('🎫 Sample trips:');
            data.data.trips.slice(0, 2).forEach(trip => {
              console.log(`   - ${trip.from} → ${trip.to} at ${trip.departure} for ₹${trip.fare}`);
            });
          } else {
            console.log('ℹ️  No trips found (this is expected if no routes exist yet)');
          }
        } else {
          console.log('❌ Trip search API failed:', statusCode);
        }
      });
    }, 2000);

    // Wait a bit for the third request
    setTimeout(() => {
      console.log('\n🎉 API testing completed!');
      console.log('\n💡 Next steps:');
      console.log('1. Check the existing trips to see what admin has created');
      console.log('2. If cities are empty, create some routes/trips');
      console.log('3. Test the frontend search functionality');
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error testing APIs:', error.message);
  }
}

// Run the test
testSearchAPI();
