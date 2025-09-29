const axios = require('axios');

async function createSampleDepotsWithCategories() {
    console.log('🚀 Creating sample depots with different categories...\n');
    
    const sampleDepots = [
        // Main Depots
        {
            depotCode: 'TVM',
            depotName: 'Trivandrum Main Depot',
            category: 'main',
            location: {
                address: 'Central Bus Station',
                city: 'Trivandrum',
                state: 'Kerala',
                pincode: '695001'
            },
            contact: {
                phone: '04712323979',
                email: 'tvm-main@yatrik.com'
            },
            capacity: {
                totalBuses: 25,
                availableBuses: 20,
                maintenanceBuses: 5
            },
            facilities: ['Fuel_Station', 'Maintenance_Bay', 'Washing_Bay', 'Parking_Lot'],
            status: 'active'
        },
        {
            depotCode: 'KOCH',
            depotName: 'Kochi Main Depot',
            category: 'main',
            location: {
                address: 'KSRTC Bus Station',
                city: 'Kochi',
                state: 'Kerala',
                pincode: '682031'
            },
            contact: {
                phone: '04842345678',
                email: 'koch-main@yatrik.com'
            },
            capacity: {
                totalBuses: 30,
                availableBuses: 25,
                maintenanceBuses: 5
            },
            facilities: ['Fuel_Station', 'Maintenance_Bay', 'Washing_Bay', 'Parking_Lot', 'Driver_Rest_Room'],
            status: 'active'
        },
        
        // Sub Depots
        {
            depotCode: 'TVM-SUB',
            depotName: 'Trivandrum Sub Depot',
            category: 'sub',
            location: {
                address: 'Kazhakootam',
                city: 'Trivandrum',
                state: 'Kerala',
                pincode: '695582'
            },
            contact: {
                phone: '04712345678',
                email: 'tvm-sub@yatrik.com'
            },
            capacity: {
                totalBuses: 15,
                availableBuses: 12,
                maintenanceBuses: 3
            },
            facilities: ['Parking_Lot', 'Driver_Rest_Room'],
            status: 'active'
        },
        {
            depotCode: 'KOCH-SUB',
            depotName: 'Kochi Sub Depot',
            category: 'sub',
            location: {
                address: 'Aluva',
                city: 'Kochi',
                state: 'Kerala',
                pincode: '683101'
            },
            contact: {
                phone: '04842345679',
                email: 'koch-sub@yatrik.com'
            },
            capacity: {
                totalBuses: 12,
                availableBuses: 10,
                maintenanceBuses: 2
            },
            facilities: ['Parking_Lot'],
            status: 'active'
        },
        
        // Operating Centers
        {
            depotCode: 'TVM-OP',
            depotName: 'Trivandrum Operating Center',
            category: 'operating',
            location: {
                address: 'Neyyattinkara',
                city: 'Trivandrum',
                state: 'Kerala',
                pincode: '695121'
            },
            contact: {
                phone: '04712345680',
                email: 'tvm-op@yatrik.com'
            },
            capacity: {
                totalBuses: 8,
                availableBuses: 6,
                maintenanceBuses: 2
            },
            facilities: ['Parking_Lot'],
            status: 'active'
        },
        {
            depotCode: 'KOCH-OP',
            depotName: 'Kochi Operating Center',
            category: 'operating',
            location: {
                address: 'Fort Kochi',
                city: 'Kochi',
                state: 'Kerala',
                pincode: '682001'
            },
            contact: {
                phone: '04842345681',
                email: 'koch-op@yatrik.com'
            },
            capacity: {
                totalBuses: 6,
                availableBuses: 5,
                maintenanceBuses: 1
            },
            facilities: ['Parking_Lot'],
            status: 'active'
        }
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const depot of sampleDepots) {
        try {
            console.log(`📝 Creating ${depot.category} depot: ${depot.depotName}...`);
            
            const response = await axios.post('http://localhost:5000/api/depots', depot, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'your-admin-token-here'}`
                },
                timeout: 10000
            });

            if (response.data.success) {
                console.log(`✅ Successfully created ${depot.depotName}`);
                successCount++;
            } else {
                console.log(`❌ Failed to create ${depot.depotName}: ${response.data.message}`);
                errorCount++;
            }
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
                console.log(`⚠️  Depot ${depot.depotName} already exists - skipping`);
                successCount++;
            } else {
                console.log(`❌ Error creating ${depot.depotName}:`, error.response?.data?.message || error.message);
                errorCount++;
            }
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successfully created/verified: ${successCount} depots`);
    console.log(`❌ Errors: ${errorCount} depots`);
    console.log(`📈 Total: ${sampleDepots.length} depots processed`);
    
    console.log('\n🎯 Depot Categories Created:');
    console.log(`🏢 Main Depots: ${sampleDepots.filter(d => d.category === 'main').length}`);
    console.log(`🏪 Sub Depots: ${sampleDepots.filter(d => d.category === 'sub').length}`);
    console.log(`🚀 Operating Centers: ${sampleDepots.filter(d => d.category === 'operating').length}`);
    
    console.log('\n✨ You can now test the filtering in the admin dashboard!');
    console.log('🔗 Go to: http://localhost:3000/admin/depots');
}

createSampleDepotsWithCategories();
