const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Depot = require('./models/Depot');

// Sample depot data
const sampleDepots = [
  {
    depotName: 'Central Bus Depot',
    depotCode: 'CBD001',
    address: '123 Main Street, City Center',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    phone: '+91-22-12345678',
    email: 'central@yatrik.com',
    capacity: 50,
    operatingHours: {
      start: '05:00',
      end: '23:00'
    },
    facilities: ['Maintenance Bay', 'Fuel Station', 'Driver Rest Area', 'Cafeteria'],
    status: 'active'
  },
  {
    depotName: 'North Terminal',
    depotCode: 'NT002',
    address: '456 North Avenue, Suburb',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400002',
    phone: '+91-22-12345679',
    email: 'north@yatrik.com',
    capacity: 30,
    operatingHours: {
      start: '06:00',
      end: '22:00'
    },
    facilities: ['Maintenance Bay', 'Driver Rest Area'],
    status: 'active'
  },
  {
    depotName: 'South Hub',
    depotCode: 'SH003',
    address: '789 South Road, Industrial Area',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400003',
    phone: '+91-22-12345680',
    email: 'south@yatrik.com',
    capacity: 40,
    operatingHours: {
      start: '05:30',
      end: '23:30'
    },
    facilities: ['Maintenance Bay', 'Fuel Station', 'Driver Rest Area', 'Cafeteria', 'Workshop'],
    status: 'active'
  },
  {
    depotName: 'East Station',
    depotCode: 'ES004',
    address: '321 East Street, Commercial District',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400004',
    phone: '+91-22-12345681',
    email: 'east@yatrik.com',
    capacity: 25,
    operatingHours: {
      start: '06:30',
      end: '21:30'
    },
    facilities: ['Maintenance Bay', 'Driver Rest Area'],
    status: 'active'
  },
  {
    depotName: 'West Terminal',
    depotCode: 'WT005',
    address: '654 West Boulevard, Residential Area',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400005',
    phone: '+91-22-12345682',
    email: 'west@yatrik.com',
    capacity: 35,
    operatingHours: {
      start: '05:00',
      end: '22:30'
    },
    facilities: ['Maintenance Bay', 'Fuel Station', 'Driver Rest Area', 'Cafeteria'],
    status: 'active'
  }
];

async function createSampleDepots() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('✅ Connected to MongoDB');

    // Check existing depots
    const existingDepots = await Depot.find({});
    console.log(`📋 Found ${existingDepots.length} existing depots`);

    if (existingDepots.length > 0) {
      console.log('⚠️ Depots already exist. Skipping depot creation.');
      console.log('Existing depots:');
      existingDepots.forEach((depot, index) => {
        console.log(`${index + 1}. ${depot.depotName || depot.name} (${depot.depotCode || depot.code})`);
      });
      return;
    }

    // Create depots
    console.log('\n🏢 Creating sample depots...');
    const createdDepots = [];
    
    for (const depotData of sampleDepots) {
      const depot = new Depot(depotData);
      const savedDepot = await depot.save();
      createdDepots.push(savedDepot);
      console.log(`✅ Created depot: ${depotData.depotName} (${depotData.depotCode})`);
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`✅ Created ${createdDepots.length} depots`);
    
    console.log('\n🏢 Created Depots:');
    createdDepots.forEach((depot, index) => {
      console.log(`${index + 1}. ${depot.depotName} (${depot.depotCode})`);
      console.log(`   📍 ${depot.address}, ${depot.city}`);
      console.log(`   📞 ${depot.phone} | ${depot.email}`);
      console.log(`   🚌 Capacity: ${depot.capacity} buses`);
      console.log(`   ⏰ Hours: ${depot.operatingHours.start} - ${depot.operatingHours.end}`);
      console.log(`   🛠️ Facilities: ${depot.facilities.join(', ')}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error creating sample depots:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
createSampleDepots();

