const axios = require('axios');

// Updated credentials with correct depot email format
const CREDENTIALS = [
    { role: 'ADMIN', email: 'admin@yatrik.com', password: 'admin123' },
    { role: 'DEPOT', email: 'depot-plk@yatrik.com', password: 'Akhil@123' },  // Fixed email format
    { role: 'CONDUCTOR', email: 'joel@gmail.com', password: 'Yatrik123' },
    { role: 'DRIVER', email: 'rejith@gmail.com', password: 'Akhil@123' },
    { role: 'PASSENGER', email: 'lijithmk2026@mca.ajce.in', password: 'Akhil@123' }
];

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

async function verifyAllCredentials() {
    console.log(colorize('\n🎯 FINAL CREDENTIAL VERIFICATION', 'cyan'));
    console.log(colorize('═'.repeat(60), 'cyan'));
    
    const results = [];
    
    for (const cred of CREDENTIALS) {
        const startTime = Date.now();
        let success = false;
        let error = '';
        let token = '';
        
        try {
            console.log(colorize(`\n🔍 Testing ${cred.role}...`, 'blue'));
            
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email: cred.email,
                password: cred.password
            }, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success && response.data.token) {
                success = true;
                token = response.data.token.substring(0, 20) + '...';
                console.log(colorize(`✅ ${cred.role}: LOGIN SUCCESS`, 'green'));
                console.log(colorize(`   Token: ${token}`, 'dim'));
            } else {
                error = response.data.message || 'Login failed';
                console.log(colorize(`❌ ${cred.role}: ${error}`, 'red'));
            }
            
        } catch (err) {
            error = err.response?.data?.message || err.message;
            console.log(colorize(`❌ ${cred.role}: ${error}`, 'red'));
        }
        
        const duration = Date.now() - startTime;
        results.push({
            role: cred.role,
            email: cred.email,
            success,
            duration: (duration / 1000).toFixed(1) + 's',
            error,
            token: token || 'N/A'
        });
    }
    
    // Print results table
    console.log(colorize('\n🏆 FINAL VERIFICATION RESULTS', 'magenta'));
    console.log(colorize('═'.repeat(100), 'magenta'));
    console.log(colorize('Role'.padEnd(12) + 'Email'.padEnd(35) + 'Status'.padEnd(10) + 'Time'.padEnd(8) + 'Token'.padEnd(25) + 'Error', 'magenta'));
    console.log(colorize('─'.repeat(100), 'magenta'));
    
    results.forEach(result => {
        const status = result.success ? colorize('SUCCESS', 'green') : colorize('FAILED', 'red');
        const errorText = result.error ? result.error.substring(0, 15) + '...' : '';
        console.log(
            result.role.padEnd(12) + 
            result.email.padEnd(35) + 
            status.padEnd(18) + 
            result.duration.padEnd(8) + 
            result.token.padEnd(25) + 
            errorText
        );
    });
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    const successRate = ((passed / total) * 100).toFixed(1);
    
    console.log(colorize('─'.repeat(100), 'magenta'));
    console.log(colorize(`\n🎯 FINAL SCORE: ${passed}/${total} credentials working (${successRate}%)`, 'yellow'));
    
    if (passed === total) {
        console.log(colorize('\n🎉 PERFECT SCORE! ALL CREDENTIALS ARE WORKING! 🚀', 'green'));
        console.log(colorize('✅ You now have 100% success rate for all login credentials!', 'green'));
        
        console.log(colorize('\n📋 CORRECTED CREDENTIAL LIST:', 'cyan'));
        console.log(colorize('─'.repeat(50), 'cyan'));
        results.forEach(result => {
            if (result.success) {
                console.log(colorize(`✅ ${result.role}: ${result.email} / Akhil@123`, 'green'));
            }
        });
        
    } else if (passed > 0) {
        console.log(colorize('⚠️  SOME CREDENTIALS STILL NEED ATTENTION', 'yellow'));
    } else {
        console.log(colorize('🚨 ALL CREDENTIALS FAILED - CHECK BACKEND', 'red'));
    }
}

verifyAllCredentials().catch(console.error);
