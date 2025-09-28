const axios = require('axios');

async function createDepotUserWithPreferredEmail() {
    console.log('🔧 Creating Depot User with Your Preferred Email...\n');
    
    try {
        // Try to register the depot user with the exact email you want
        console.log('📝 Creating depot user: depot-plk@yatrik.com');
        
        const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'Palakkad Depot Manager',
            email: 'depot-plk@yatrik.com',
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
            console.log('✅ Depot user created successfully!');
            console.log('📋 Login credentials:');
            console.log('   Email: depot-plk@yatrik.com');
            console.log('   Password: Akhil@123');
            
            // Test login immediately
            console.log('\n🔍 Testing login...');
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'depot-plk@yatrik.com',
                password: 'Akhil@123'
            });
            
            if (loginResponse.data.success) {
                console.log('✅ Login test successful!');
                console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...`);
                console.log(`   Role: ${loginResponse.data.user?.role || 'unknown'}`);
                console.log('\n🎉 SUCCESS! Depot user is now working!');
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
                email: 'depot-plk@yatrik.com',
                password: 'Akhil@123'
            });
            
            if (loginResponse.data.success) {
                console.log('✅ Login successful! User already exists and working.');
                console.log('📋 Login credentials:');
                console.log('   Email: depot-plk@yatrik.com');
                console.log('   Password: Akhil@123');
            } else {
                console.log('❌ Login failed:', loginResponse.data.message);
                console.log('💡 The user exists but password might be different');
                
                // Try different passwords
                const passwords = ['Akhil@123', 'depot123', 'admin123'];
                console.log('\n🔍 Trying different passwords...');
                
                for (const pwd of passwords) {
                    try {
                        const testResponse = await axios.post('http://localhost:5000/api/auth/login', {
                            email: 'depot-plk@yatrik.com',
                            password: pwd
                        });
                        
                        if (testResponse.data.success) {
                            console.log(`✅ Found working password: ${pwd}`);
                            console.log('📋 Login credentials:');
                            console.log('   Email: depot-plk@yatrik.com');
                            console.log(`   Password: ${pwd}`);
                            return;
                        }
                    } catch (e) {
                        console.log(`❌ Password "${pwd}" failed`);
                    }
                }
            }
        } else {
            console.log('❌ Error:', error.response?.data || error.message);
        }
    }
}

createDepotUserWithPreferredEmail();