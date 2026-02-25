const bcrypt = require('bcryptjs');

// Simple script to create the correct depot user
async function createDepotUser() {
    try {
        const axios = require('axios');
        
        console.log('🔧 Creating/Updating Depot User...');
        
        // Try to register the depot user with the correct password
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'Palakkad Depot Manager',
            email: 'depot-plk@yatrik.com',
            password: 'Akhil@123',
            role: 'depot_manager'
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data.success) {
            console.log('✅ Depot user created successfully!');
            console.log('📋 Login credentials:');
            console.log('   Email: depot-plk@yatrik.com');
            console.log('   Password: Akhil@123');
        } else {
            console.log('❌ Registration failed:', response.data.message);
        }
        
    } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
            console.log('✅ Depot user already exists');
            console.log('🔄 Trying to update password...');
            
            // Try to login with old password first
            try {
                const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                    email: 'depot-plk@yatrik.com',
                    password: 'depot123'  // Try old password
                });
                
                if (loginResponse.data.success) {
                    console.log('✅ Old password works, updating to new password...');
                    // You would need an update password endpoint
                    console.log('⚠️  Please update password manually in database or use old password: depot123');
                }
            } catch (loginError) {
                console.log('❌ Old password also failed');
                console.log('🔍 Let me check what the actual password is...');
            }
        } else {
            console.log('❌ Error:', error.response?.data?.message || error.message);
        }
    }
}

createDepotUser();
