const axios = require('axios');

async function createDepotUserWithValidatedEmail() {
    console.log('🔧 Creating Depot User with System-Validated Email...\n');
    
    // The system requires format: {place}-depot@yatrik.com
    // Your preferred: depot-plk@yatrik.com
    // Valid format: plk-depot@yatrik.com (swapping the order)
    
    const validEmail = 'plk-depot@yatrik.com';
    const preferredEmail = 'depot-plk@yatrik.com';
    
    try {
        console.log('📝 Creating depot user with validated email format...');
        console.log(`   System requires: {place}-depot@yatrik.com`);
        console.log(`   Your preferred:  ${preferredEmail}`);
        console.log(`   Using format:    ${validEmail}`);
        
        const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'Palakkad Depot Manager',
            email: validEmail,
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
            console.log('\n📋 WORKING CREDENTIALS:');
            console.log('   Email: ' + validEmail);
            console.log('   Password: Akhil@123');
            
            // Test login
            console.log('\n🔍 Testing login...');
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: validEmail,
                password: 'Akhil@123'
            });
            
            if (loginResponse.data.success) {
                console.log('✅ Login test successful!');
                console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...`);
                console.log(`   Role: ${loginResponse.data.user?.role || 'unknown'}`);
                
                console.log('\n🎯 SOLUTION SUMMARY:');
                console.log('─'.repeat(50));
                console.log('❌ Your preferred email format is not supported by the system');
                console.log('✅ Use this email format instead:');
                console.log(`   📧 ${validEmail}`);
                console.log('   🔑 Password: Akhil@123');
                console.log('─'.repeat(50));
                
                // Now test all credentials with the corrected email
                console.log('\n🧪 Testing all credentials with corrected depot email...');
                await testAllCredentialsWithCorrectedEmail(validEmail);
                
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
                email: validEmail,
                password: 'Akhil@123'
            });
            
            if (loginResponse.data.success) {
                console.log('✅ Login successful! User already exists and working.');
                console.log('\n📋 WORKING CREDENTIALS:');
                console.log('   Email: ' + validEmail);
                console.log('   Password: Akhil@123');
                
                // Test all credentials
                await testAllCredentialsWithCorrectedEmail(validEmail);
            } else {
                console.log('❌ Login failed:', loginResponse.data.message);
            }
        } else {
            console.log('❌ Error:', error.response?.data || error.message);
        }
    }
}

async function testAllCredentialsWithCorrectedEmail(depotEmail) {
    const CREDENTIALS = [
        { role: 'ADMIN', email: 'admin@yatrik.com', password: 'admin123' },
        { role: 'DEPOT', email: depotEmail, password: 'Akhil@123' },
        { role: 'CONDUCTOR', email: 'joel@gmail.com', password: 'Yatrik123' },
        { role: 'DRIVER', email: 'rejith@gmail.com', password: 'Akhil@123' },
        { role: 'PASSENGER', email: 'lijithmk2026@mca.ajce.in', password: 'Akhil@123' }
    ];
    
    console.log('\n🏆 FINAL CREDENTIAL TEST WITH CORRECTED DEPOT EMAIL');
    console.log('═'.repeat(70));
    
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
                console.log(`✅ ${cred.role}: SUCCESS`);
            } else {
                console.log(`❌ ${cred.role}: FAILED`);
            }
            
        } catch (error) {
            results.push({ role: cred.role, success: false, email: cred.email });
            console.log(`❌ ${cred.role}: FAILED - ${error.response?.data?.message || error.message}`);
        }
    }
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    const successRate = ((passed / total) * 100).toFixed(1);
    
    console.log('─'.repeat(70));
    console.log(`🎯 FINAL SCORE: ${passed}/${total} credentials working (${successRate}%)`);
    
    if (passed === total) {
        console.log('🎉 PERFECT! ALL CREDENTIALS ARE NOW WORKING! 🚀');
        console.log('\n📋 FINAL WORKING CREDENTIALS:');
        results.forEach(result => {
            if (result.success) {
                console.log(`✅ ${result.role}: ${result.email}`);
            }
        });
    }
}

createDepotUserWithValidatedEmail();
