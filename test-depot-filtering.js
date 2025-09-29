const axios = require('axios');

async function testDepotFiltering() {
    console.log('🧪 Testing Depot Filtering API...\n');
    
    const baseUrl = 'http://localhost:5000/api/depots';
    
    const tests = [
        { name: 'All Depots', params: {} },
        { name: 'Main Depots Only', params: { category: 'main' } },
        { name: 'Sub Depots Only', params: { category: 'sub' } },
        { name: 'Operating Centers Only', params: { category: 'operating' } },
        { name: 'Active Depots', params: { status: 'active' } },
        { name: 'Depots with Capacity', params: { hasCapacity: 'true' } }
    ];

    for (const test of tests) {
        try {
            console.log(`🔍 Testing: ${test.name}`);
            
            const queryParams = new URLSearchParams(test.params);
            const url = `${baseUrl}?${queryParams.toString()}`;
            
            const response = await axios.get(url, {
                timeout: 5000,
                headers: {
                    'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'your-admin-token-here'}`
                }
            });

            if (response.data.success) {
                const depots = response.data.data || [];
                console.log(`   ✅ Found ${depots.length} depots`);
                
                // Show depot details if any found
                if (depots.length > 0) {
                    depots.slice(0, 3).forEach(depot => {
                        console.log(`   📍 ${depot.depotName} (${depot.category || 'main'}) - ${depot.depotCode}`);
                    });
                    if (depots.length > 3) {
                        console.log(`   ... and ${depots.length - 3} more`);
                    }
                }
            } else {
                console.log(`   ❌ API Error: ${response.data.message}`);
            }
        } catch (error) {
            console.log(`   ❌ Request Error: ${error.response?.data?.message || error.message}`);
        }
        
        console.log(''); // Empty line for readability
    }

    // Test admin endpoint
    console.log('🔍 Testing Admin Endpoint...');
    try {
        const response = await axios.get('http://localhost:5000/api/admin/depots', {
            timeout: 5000,
            headers: {
                'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'your-admin-token-here'}`
            }
        });

        if (Array.isArray(response.data)) {
            const depots = response.data;
            console.log(`   ✅ Admin endpoint returned ${depots.length} depots`);
            
            // Group by category
            const categories = depots.reduce((acc, depot) => {
                const category = depot.category || 'main';
                acc[category] = (acc[category] || 0) + 1;
                return acc;
            }, {});
            
            console.log('   📊 Categories breakdown:');
            Object.entries(categories).forEach(([category, count]) => {
                console.log(`      ${category}: ${count} depots`);
            });
        } else {
            console.log(`   ❌ Admin endpoint returned unexpected format:`, response.data);
        }
    } catch (error) {
        console.log(`   ❌ Admin endpoint error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎯 Testing Complete!');
    console.log('💡 If you see different counts for each category, the filtering is working correctly!');
}

testDepotFiltering();
