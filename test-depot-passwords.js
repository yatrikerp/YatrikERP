const axios = require('axios');

async function testDepotPasswords() {
    console.log('🔍 Testing different depot passwords...\n');
    
    const passwords = ['Akhil@123', 'depot123', 'admin123'];
    const email = 'depot-plk@yatrik.com';
    
    for (const password of passwords) {
        try {
            console.log(`Testing password: ${password}`);
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email: email,
                password: password
            }, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success) {
                console.log(`✅ SUCCESS! Password "${password}" works for ${email}`);
                console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
                return;
            }
        } catch (error) {
            console.log(`❌ Password "${password}" failed: ${error.response?.data?.message || error.message}`);
        }
    }
    
    console.log('\n🔧 None of the passwords worked. Let me try to create the user...');
    
    // Try to register the user
    try {
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'Palakkad Depot Manager',
            email: email,
            password: 'Akhil@123',
            role: 'depot_manager'
        }, {
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data.success) {
            console.log('✅ Successfully created depot user!');
            console.log(`   Email: ${email}`);
            console.log(`   Password: Akhil@123`);
        }
    } catch (error) {
        console.log('❌ Registration failed:', error.response?.data?.message || error.message);
        console.log('\n💡 Suggestion: Check if the user exists in database with a different password');
    }
}

testDepotPasswords();
