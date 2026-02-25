const axios = require('axios');

async function createDepotUser() {
    console.log('🔧 Creating Depot User - Simple Approach...\n');
    
    try {
        // Try to register as a regular user first, then convert to depot user
        console.log('📝 Step 1: Registering as regular user...');
        
        const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'Palakkad Depot Manager',
            email: 'palakkad-depot@yatrik.com',
            phone: '9876543210',
            password: 'Akhil@123',
            role: 'depot_manager'
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (registerResponse.data.success) {
            console.log('✅ User registered successfully!');
            console.log('📋 Login credentials:');
            console.log('   Email: palakkad-depot@yatrik.com');
            console.log('   Password: Akhil@123');
            console.log('   Role: depot_manager');
            
            // Test login
            console.log('\n🔍 Testing login...');
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'palakkad-depot@yatrik.com',
                password: 'Akhil@123'
            });
            
            if (loginResponse.data.success) {
                console.log('✅ Login test successful!');
                console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...`);
                console.log(`   Role: ${loginResponse.data.user?.role || 'unknown'}`);
            } else {
                console.log('❌ Login test failed:', loginResponse.data.message);
            }
            
        } else {
            console.log('❌ Registration failed:', registerResponse.data);
        }
        
    } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
            console.log('✅ User already exists! Testing login...');
            
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'palakkad-depot@yatrik.com',
                password: 'Akhil@123'
            });
            
            if (loginResponse.data.success) {
                console.log('✅ Login successful!');
                console.log('📋 Login credentials:');
                console.log('   Email: palakkad-depot@yatrik.com');
                console.log('   Password: Akhil@123');
            } else {
                console.log('❌ Login failed:', loginResponse.data.message);
                console.log('💡 The user exists but password might be different');
            }
        } else {
            console.log('❌ Error:', error.response?.data || error.message);
        }
    }
}

createDepotUser();
