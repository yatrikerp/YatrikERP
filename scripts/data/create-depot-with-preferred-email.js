const axios = require('axios');

async function createDepotUserWithPreferredEmail() {
    console.log('🔧 Creating Depot User with Your Preferred Email...\n');
    console.log('📧 Email: depot-plk@yatrik.com');
    console.log('🔑 Password: Akhil@123\n');
    
    try {
        console.log('📝 Creating depot user...');
        
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
            console.log('\n📋 Login credentials:');
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
                
                // Now test all 5 credentials
                console.log('\n🏆 TESTING ALL 5 CREDENTIALS FOR 100% SUCCESS');
                console.log('═'.repeat(60));
                
                await testAllCredentials();
                
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
                console.log('\n📋 WORKING CREDENTIALS:');
                console.log('   Email: depot-plk@yatrik.com');
                console.log('   Password: Akhil@123');
                
                // Test all credentials
                await testAllCredentials();
            } else {
                console.log('❌ Login failed:', loginResponse.data.message);
            }
        } else {
            console.log('❌ Error:', error.response?.data || error.message);
        }
    }
}

async function testAllCredentials() {
    const CREDENTIALS = [
        { role: 'ADMIN', email: 'admin@yatrik.com', password: 'admin123' },
        { role: 'DEPOT', email: 'depot-plk@yatrik.com', password: 'Akhil@123' },
        { role: 'CONDUCTOR', email: 'joel@gmail.com', password: 'Yatrik123' },
        { role: 'DRIVER', email: 'rejith@gmail.com', password: 'Akhil@123' },
        { role: 'PASSENGER', email: 'lijithmk2026@mca.ajce.in', password: 'Akhil@123' }
    ];
    
    const results = [];
    
    for (const cred of CREDENTIALS) {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email: cred.email,
                password: cred.password
            });
            
            const success = response.data.success;
            results.push({ role: cred.role, success, email: cred.email });
            
            if (success) {
                console.log(`✅ ${cred.role}: SUCCESS - ${cred.email}`);
            } else {
                console.log(`❌ ${cred.role}: FAILED - ${response.data.message}`);
            }
            
        } catch (error) {
            results.push({ role: cred.role, success: false, email: cred.email });
            console.log(`❌ ${cred.role}: FAILED - ${error.response?.data?.message || error.message}`);
        }
    }
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    const successRate = ((passed / total) * 100).toFixed(1);
    
    console.log('─'.repeat(60));
    console.log(`🎯 FINAL SCORE: ${passed}/${total} credentials working (${successRate}%)`);
    
    if (passed === total) {
        console.log('\n🎉 PERFECT! ALL 5 CREDENTIALS ARE NOW WORKING! 🚀');
        console.log('\n📋 FINAL WORKING CREDENTIALS:');
        console.log('═'.repeat(50));
        results.forEach(result => {
            if (result.success) {
                console.log(`✅ ${result.role}: ${result.email}`);
            }
        });
        console.log('═'.repeat(50));
        console.log('🎯 SUCCESS RATE: 100% - ALL CREDENTIALS WORKING!');
    } else {
        console.log(`⚠️  ${total - passed} credentials still need attention`);
    }
}

createDepotUserWithPreferredEmail();
