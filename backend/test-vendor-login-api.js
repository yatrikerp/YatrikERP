const axios = require('axios');

async function testVendorLogin() {
  try {
    console.log('🧪 Testing vendor login via API...\n');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'vendor@yatrik.com',
      password: 'vendor123'
    }, {
      validateStatus: function (status) {
        return status < 500; // Don't throw on 4xx errors
      }
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.success) {
      console.log('\n✅ Login successful!');
      console.log('User role:', response.data.user?.role);
      console.log('Redirect path:', response.data.redirectPath);
    } else {
      console.log('\n❌ Login failed!');
      console.log('Error:', response.data.message || response.data.error);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testVendorLogin();

