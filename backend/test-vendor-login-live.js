const axios = require('axios');

async function testVendorLogin() {
  console.log('🧪 Testing Vendor Login via API...\n');
  console.log('📧 Email: vendor@yatrik.com');
  console.log('🔑 Password: vendor123\n');
  
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'vendor@yatrik.com',
      password: 'vendor123'
    }, {
      timeout: 5000,
      validateStatus: function (status) {
        return status < 500; // Don't throw on 4xx errors
      }
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.success) {
      console.log('\n✅✅✅ LOGIN SUCCESSFUL! ✅✅✅');
      console.log('👤 User:', response.data.user?.name);
      console.log('🎭 Role:', response.data.user?.role);
      console.log('🔀 Redirect Path:', response.data.redirectPath);
      console.log('🎫 Token:', response.data.token ? 'Generated' : 'Missing');
      console.log('\n✅ Vendor can now login!');
    } else {
      console.log('\n❌❌❌ LOGIN FAILED ❌❌❌');
      console.log('Error:', response.data.message || response.data.error || 'Unknown error');
      console.log('\n⚠️  Possible issues:');
      console.log('   1. Backend server not running');
      console.log('   2. Backend server needs restart');
      console.log('   3. User not found or password incorrect');
      console.log('   4. User role not set to "vendor"');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('\n❌❌❌ CONNECTION REFUSED ❌❌❌');
      console.log('⚠️  Backend server is not running!');
      console.log('\n📝 To start the server:');
      console.log('   cd backend');
      console.log('   npm start');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n❌❌❌ REQUEST TIMED OUT ❌❌❌');
      console.log('⚠️  Backend server is not responding!');
    } else {
      console.log('\n❌❌❌ ERROR ❌❌❌');
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', error.response.data);
      }
    }
  }
}

testVendorLogin();

