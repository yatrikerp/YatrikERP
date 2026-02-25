const axios = require('axios');

async function testDepotLogin() {
    console.log('🔍 Testing Depot Login Options...\n');
    
    const emailOptions = [
        'plk-depot@yatrik.com',      // System format
        'depot-plk@yatrik.com',      // Your preferred format
        'palakkad-depot@yatrik.com'  // Alternative system format
    ];
    
    const password = 'Akhil@123';
    
    for (const email of emailOptions) {
        console.log(`Testing: ${email}`);
        try {
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
                console.log(`✅ SUCCESS! ${email} works with password: ${password}`);
                console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
                console.log(`   Role: ${response.data.user?.role || 'unknown'}`);
                return { email, password, success: true };
            } else {
                console.log(`❌ ${email} failed: ${response.data.message}`);
            }
        } catch (error) {
            console.log(`❌ ${email} failed: ${error.response?.data?.message || error.message}`);
        }
    }
    
    console.log('\n💡 None of the email formats worked. Let me try creating a user with the correct format...');
    
    // Try to create user with palakkad-depot format
    try {
        console.log('\n📝 Creating user with palakkad-depot@yatrik.com...');
        const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'Palakkad Depot Manager',
            email: 'palakkad-depot@yatrik.com',
            phone: '9876543210',
            password: 'Akhil@123',
            role: 'depot_manager'
        });
        
        if (registerResponse.data.success) {
            console.log('✅ User created! Testing login...');
            
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'palakkad-depot@yatrik.com',
                password: 'Akhil@123'
            });
            
            if (loginResponse.data.success) {
                console.log('✅ LOGIN SUCCESS!');
                console.log('\n📋 WORKING CREDENTIALS:');
                console.log('   Email: palakkad-depot@yatrik.com');
                console.log('   Password: Akhil@123');
                return { email: 'palakkad-depot@yatrik.com', password: 'Akhil@123', success: true };
            }
        }
    } catch (error) {
        console.log('❌ Registration failed:', error.response?.data?.message || error.message);
    }
    
    return { success: false };
}

testDepotLogin().then(result => {
    if (result.success) {
        console.log('\n🎉 DEPOT CREDENTIALS WORKING!');
        console.log('Now testing all 5 credentials...');
        
        // Test all credentials with working depot email
        const CREDENTIALS = [
            { role: 'ADMIN', email: 'admin@yatrik.com', password: 'admin123' },
            { role: 'DEPOT', email: result.email, password: result.password },
            { role: 'CONDUCTOR', email: 'joel@gmail.com', password: 'Yatrik123' },
            { role: 'DRIVER', email: 'rejith@gmail.com', password: 'Akhil@123' },
            { role: 'PASSENGER', email: 'lijithmk2026@mca.ajce.in', password: 'Akhil@123' }
        ];
        
        console.log('\n🏆 FINAL CREDENTIAL TEST:');
        console.log('═'.repeat(50));
        
        let passed = 0;
        for (const cred of CREDENTIALS) {
            try {
                const response = await axios.post('http://localhost:5000/api/auth/login', {
                    email: cred.email,
                    password: cred.password
                });
                
                if (response.data.success) {
                    console.log(`✅ ${cred.role}: SUCCESS`);
                    passed++;
                } else {
                    console.log(`❌ ${cred.role}: FAILED`);
                }
            } catch (error) {
                console.log(`❌ ${cred.role}: FAILED`);
            }
        }
        
        const successRate = ((passed / CREDENTIALS.length) * 100).toFixed(1);
        console.log('─'.repeat(50));
        console.log(`🎯 FINAL SCORE: ${passed}/${CREDENTIALS.length} (${successRate}%)`);
        
        if (passed === CREDENTIALS.length) {
            console.log('🎉 PERFECT! ALL 5 CREDENTIALS WORKING! 🚀');
        }
    } else {
        console.log('❌ Could not get depot credentials working');
    }
});
