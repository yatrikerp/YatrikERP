const axios = require('axios');

async function createDepotUserViaAdmin() {
    console.log('🔧 Creating Depot User via Admin API...\n');
    
    try {
        // Step 1: Get admin token
        console.log('🔑 Getting admin token...');
        const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@yatrik.com',
            password: 'admin123'
        });
        
        if (!adminLogin.data.success) {
            console.log('❌ Failed to get admin token');
            return;
        }
        
        const adminToken = adminLogin.data.token;
        console.log('✅ Admin token obtained');
        
        // Step 2: Create depot user via admin API
        console.log('👤 Creating depot user...');
        const createUser = await axios.post('http://localhost:5000/api/admin/users', {
            name: 'Palakkad Depot Manager',
            email: 'depot-plk@yatrik.com',
            phone: '+91-9876543210',
            role: 'depot_manager',
            status: 'active',
            password: 'Akhil@123',
            address: 'Palakkad Bus Station, Kerala',
            emergencyContact: '+91-9876543211',
            dateOfBirth: '1985-01-01',
            gender: 'Male'
        }, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (createUser.data.success || createUser.status === 201) {
            console.log('✅ Depot user created successfully via admin API!');
            console.log('📋 Login credentials:');
            console.log('   Email: depot-plk@yatrik.com');
            console.log('   Password: Akhil@123');
        } else {
            console.log('❌ Failed to create user:', createUser.data);
        }
        
    } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
            console.log('✅ Depot user already exists');
            console.log('🔄 Trying to update password...');
            
            // Try to reset password
            try {
                const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
                    email: 'admin@yatrik.com',
                    password: 'admin123'
                });
                
                const adminToken = adminLogin.data.token;
                
                // Find user ID first
                const usersResponse = await axios.get('http://localhost:5000/api/admin/users', {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                });
                
                const depotUser = usersResponse.data.users?.find(user => user.email === 'depot-plk@yatrik.com');
                
                if (depotUser) {
                    const resetResponse = await axios.post(`http://localhost:5000/api/admin/users/${depotUser._id}/reset-password`, {
                        newPassword: 'Akhil@123'
                    }, {
                        headers: {
                            'Authorization': `Bearer ${adminToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (resetResponse.data.success) {
                        console.log('✅ Password updated successfully!');
                        console.log('📋 Login credentials:');
                        console.log('   Email: depot-plk@yatrik.com');
                        console.log('   Password: Akhil@123');
                    } else {
                        console.log('❌ Failed to update password:', resetResponse.data);
                    }
                } else {
                    console.log('❌ Could not find depot user in system');
                }
                
            } catch (resetError) {
                console.log('❌ Failed to reset password:', resetError.response?.data || resetError.message);
            }
        } else {
            console.log('❌ Error:', error.response?.data || error.message);
        }
    }
}

createDepotUserViaAdmin();
