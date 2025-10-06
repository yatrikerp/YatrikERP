const mongoose = require('mongoose');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');
const User = require('./models/User');
require('dotenv').config();

// Kerala Bus Types from Streamlined Bus Management
const keralaBusTypes = [
  {
    id: 'ordinary',
    name: 'Ordinary',
    description: 'Basic service, stops at all points, Non-AC simple seats',
    capacity: { total: 50, sleeper: 0, seater: 50, ladies: 10, disabled: 4 },
    amenities: ['charging'],
    specifications: {
      manufacturer: 'Ashok Leyland',
      model: 'JanBus',
      fuelType: 'diesel',
      mileage: 12,
      maxSpeed: 60,
      length: 11,
      width: 2.5,
      height: 3.2
    },
    priceCategory: 'budget'
  },
  {
    id: 'lspf',
    name: 'Limited Stop Fast Passenger (LSFP)',
    description: 'Fewer stops, Non-AC 2+3 seater, medium-distance travel',
    capacity: { total: 45, sleeper: 0, seater: 45, ladies: 8, disabled: 3 },
    amenities: ['charging'],
    specifications: {
      manufacturer: 'Tata',
      model: 'Starbus',
      fuelType: 'diesel',
      mileage: 11,
      maxSpeed: 70,
      length: 11,
      width: 2.5,
      height: 3.2
    },
    priceCategory: 'economy'
  },
  {
    id: 'fast_passenger',
    name: 'Fast Passenger',
    description: 'Limited stops, better speed, Non-AC comfortable seats',
    capacity: { total: 45, sleeper: 0, seater: 45, ladies: 8, disabled: 3 },
    amenities: ['charging'],
    specifications: {
      manufacturer: 'Tata',
      model: 'Starbus Ultra',
      fuelType: 'diesel',
      mileage: 10,
      maxSpeed: 75,
      length: 11,
      width: 2.5,
      height: 3.2
    },
    priceCategory: 'standard'
  },
  {
    id: 'venad',
    name: 'Venad',
    description: 'Ordinary long-distance service, south Kerala routes',
    capacity: { total: 50, sleeper: 0, seater: 50, ladies: 10, disabled: 4 },
    amenities: ['charging'],
    specifications: {
      manufacturer: 'Ashok Leyland',
      model: 'Viking',
      fuelType: 'diesel',
      mileage: 12,
      maxSpeed: 60,
      length: 11,
      width: 2.5,
      height: 3.2
    },
    priceCategory: 'budget'
  },
  {
    id: 'super_fast',
    name: 'Super Fast',
    description: 'Popular category, limited stops, better cushioning, long-distance',
    capacity: { total: 45, sleeper: 0, seater: 45, ladies: 8, disabled: 3 },
    amenities: ['charging'],
    specifications: {
      manufacturer: 'Tata',
      model: 'Starbus Ultra',
      fuelType: 'diesel',
      mileage: 9,
      maxSpeed: 80,
      length: 11,
      width: 2.5,
      height: 3.2
    },
    priceCategory: 'standard'
  },
  {
    id: 'garuda_volvo',
    name: 'Garuda Volvo',
    description: 'AC luxury Volvo, pushback, curtains, charging ports',
    capacity: { total: 30, sleeper: 30, seater: 0, ladies: 5, disabled: 2 },
    amenities: ['ac', 'wifi', 'charging', 'refreshments', 'toilet'],
    specifications: {
      manufacturer: 'Volvo',
      model: '9400 XL',
      fuelType: 'diesel',
      mileage: 8,
      maxSpeed: 120,
      length: 12.5,
      width: 2.6,
      height: 3.5
    },
    priceCategory: 'luxury'
  },
  {
    id: 'garuda_scania',
    name: 'Garuda Scania',
    description: 'AC luxury Scania, premium interstate service',
    capacity: { total: 30, sleeper: 30, seater: 0, ladies: 5, disabled: 2 },
    amenities: ['ac', 'wifi', 'charging', 'refreshments', 'toilet', 'entertainment'],
    specifications: {
      manufacturer: 'Scania',
      model: 'Metrolink',
      fuelType: 'diesel',
      mileage: 8.5,
      maxSpeed: 120,
      length: 12.5,
      width: 2.6,
      height: 3.5
    },
    priceCategory: 'luxury'
  },
  {
    id: 'garuda_maharaja',
    name: 'Garuda Maharaja',
    description: 'Premium long-distance, AC pushback, large leg space',
    capacity: { total: 28, sleeper: 28, seater: 0, ladies: 4, disabled: 2 },
    amenities: ['ac', 'wifi', 'charging', 'refreshments', 'toilet', 'entertainment'],
    specifications: {
      manufacturer: 'Mercedes-Benz',
      model: 'Tourismo',
      fuelType: 'diesel',
      mileage: 9,
      maxSpeed: 120,
      length: 12.5,
      width: 2.6,
      height: 3.8
    },
    priceCategory: 'super_luxury'
  },
  {
    id: 'rajadhani',
    name: 'Rajadhani',
    description: 'AC long-distance service with premium comfort',
    capacity: { total: 35, sleeper: 35, seater: 0, ladies: 6, disabled: 2 },
    amenities: ['ac', 'wifi', 'charging', 'refreshments'],
    specifications: {
      manufacturer: 'Volvo',
      model: 'B9R',
      fuelType: 'diesel',
      mileage: 8.5,
      maxSpeed: 100,
      length: 12,
      width: 2.5,
      height: 3.5
    },
    priceCategory: 'premium'
  },
  {
    id: 'minnal',
    name: 'Minnal',
    description: 'Overnight services, AC/Non-AC semi-sleeper, night journeys',
    capacity: { total: 35, sleeper: 35, seater: 0, ladies: 6, disabled: 2 },
    amenities: ['ac', 'charging', 'refreshments'],
    specifications: {
      manufacturer: 'Tata',
      model: 'Starbus Sleeper',
      fuelType: 'diesel',
      mileage: 9,
      maxSpeed: 90,
      length: 12,
      width: 2.5,
      height: 3.5
    },
    priceCategory: 'premium'
  },
  {
    id: 'ananthapuri_fast',
    name: 'Ananthapuri (Fast / Superfast / Deluxe)',
    description: 'Special Trivandrum-based branded service',
    capacity: { total: 45, sleeper: 0, seater: 45, ladies: 8, disabled: 3 },
    amenities: ['charging'],
    specifications: {
      manufacturer: 'Tata',
      model: 'Starbus Ultra',
      fuelType: 'diesel',
      mileage: 9,
      maxSpeed: 80,
      length: 11,
      width: 2.5,
      height: 3.2
    },
    priceCategory: 'standard'
  },
  {
    id: 'low_floor_non_ac',
    name: 'Low Floor Non-AC',
    description: 'Modern city service, wide doors, GPS-enabled',
    capacity: { total: 45, sleeper: 0, seater: 45, ladies: 8, disabled: 6 },
    amenities: ['charging'],
    specifications: {
      manufacturer: 'Ashok Leyland',
      model: 'JanBus LF',
      fuelType: 'diesel',
      mileage: 10,
      maxSpeed: 70,
      length: 11,
      width: 2.5,
      height: 3.0
    },
    priceCategory: 'standard'
  },
  {
    id: 'low_floor_ac',
    name: 'Low Floor AC (Volvo)',
    description: 'Volvo AC city service, Trivandrum/Kochi',
    capacity: { total: 40, sleeper: 0, seater: 40, ladies: 6, disabled: 4 },
    amenities: ['ac', 'wifi', 'charging'],
    specifications: {
      manufacturer: 'Volvo',
      model: 'B7RLE',
      fuelType: 'diesel',
      mileage: 9,
      maxSpeed: 80,
      length: 11,
      width: 2.5,
      height: 3.0
    },
    priceCategory: 'premium'
  },
  {
    id: 'jnnurm_city',
    name: 'JNNURM / City Circular',
    description: 'Special city buses, funded under JNNURM scheme',
    capacity: { total: 50, sleeper: 0, seater: 50, ladies: 10, disabled: 6 },
    amenities: ['charging'],
    specifications: {
      manufacturer: 'Tata',
      model: 'Starbus City',
      fuelType: 'diesel',
      mileage: 11,
      maxSpeed: 60,
      length: 11,
      width: 2.5,
      height: 3.2
    },
    priceCategory: 'budget'
  }
];

// Kerala depot codes for bus assignment
const keralaDepotCodes = [
  'TVM', 'CTY', 'ALP', 'ALY', 'ATL', 'CHR', 'CGR', 'CTL', 'EKM', 'KNR', 'KGD', 'KYM',
  'KLM', 'KTR', 'KTM', 'KKD', 'MVP', 'NDD', 'NTA', 'PLA', 'PLK', 'PPD', 'PTA', 'PBR',
  'SBY', 'TVL', 'TSR', 'VZM', 'ADR', 'ANK', 'CDM', 'CLD', 'CHT', 'CTR', 'ETP', 'GVR',
  'HPD', 'KPT', 'KHD', 'KPM', 'KNP', 'KTD', 'KTP', 'KMR', 'KDR', 'KMG', 'KMY', 'MLA',
  'MLP', 'MND', 'MVK', 'NBR', 'NPR', 'PSL', 'PPM', 'PNR', 'PMN', 'PRK', 'PVM', 'PNK',
  'PNI', 'PVR', 'PLR', 'TLY', 'TSY', 'TDP', 'TPM', 'VKM', 'VND', 'VRD', 'VJD', 'VKB',
  'VTR', 'ARD', 'ARK', 'EDT', 'EMY', 'IJK', 'KNI', 'KKM', 'KLP', 'MPY', 'MKD', 'MLT',
  'MNR', 'PLD', 'PDM', 'PDK', 'RNY', 'TDY', 'VKA', 'VDK'
];

async function createKeralaBuses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing buses
    console.log('🧹 Clearing existing buses...');
    await Bus.deleteMany({});
    console.log('✅ Existing buses cleared');

    // Get admin user for assignment
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'System Admin',
        email: 'admin@yatrik.com',
        password: 'admin123',
        role: 'admin',
        status: 'active'
      });
      console.log('✅ Created admin user');
    }

    // Get all depots
    const depots = await Depot.find({ status: 'active' });
    console.log(`🏢 Found ${depots.length} active depots`);

    if (depots.length === 0) {
      console.log('❌ No active depots found. Please create depots first.');
      return;
    }

    const buses = [];
    let busCounter = 1;

    // Create buses for each depot and bus type
    for (const depot of depots) {
      console.log(`\n🚌 Creating buses for depot: ${depot.depotName} (${depot.depotCode})`);
      
      // Determine number of buses per type based on depot category
      let busesPerType;
      switch (depot.category) {
        case 'main':
          busesPerType = 3; // 3 buses per type for main depots
          break;
        case 'sub':
          busesPerType = 2; // 2 buses per type for sub depots
          break;
        case 'operating':
          busesPerType = 1; // 1 bus per type for operating centers
          break;
        default:
          busesPerType = 2;
      }

      // Create buses for each bus type
      for (const busType of keralaBusTypes) {
        for (let i = 0; i < busesPerType; i++) {
          const busNumber = `KL-${depot.depotCode}-${String(busCounter).padStart(3, '0')}`;
          const registrationNumber = `KL${Math.floor(Math.random() * 100)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(Math.random() * 10000)}`;
          
          const bus = {
            busNumber,
            registrationNumber,
            depotId: depot._id,
            busType: busType.id,
            capacity: busType.capacity,
            amenities: busType.amenities,
            specifications: {
              ...busType.specifications,
              year: 2020 + Math.floor(Math.random() * 4) // Random year between 2020-2023
            },
            status: Math.random() > 0.1 ? 'active' : 'maintenance', // 90% active, 10% maintenance
            fuel: {
              currentLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
              lastRefuel: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last 7 days
              averageConsumption: busType.specifications.mileage,
              tankCapacity: busType.specifications.fuelType === 'diesel' ? 200 : 150
            },
            assignedBy: adminUser._id,
            notes: `${busType.name} - ${busType.description}`,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          buses.push(bus);
          busCounter++;
        }
      }
    }

    // Insert buses in batches
    console.log(`\n🚌 Creating ${buses.length} Kerala buses...`);
    const batchSize = 50;
    let createdCount = 0;

    for (let i = 0; i < buses.length; i += batchSize) {
      const batch = buses.slice(i, i + batchSize);
      await Bus.insertMany(batch);
      createdCount += batch.length;
      console.log(`✅ Created ${createdCount}/${buses.length} buses`);
    }

    // Summary statistics
    console.log('\n📊 KERALA BUS CREATION SUMMARY:');
    console.log('=====================================');
    console.log(`Total buses created: ${createdCount}`);
    
    const typeStats = await Bus.aggregate([
      { $group: { _id: '$busType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📋 Bus types distribution:');
    typeStats.forEach(stat => {
      const busType = keralaBusTypes.find(bt => bt.id === stat._id);
      console.log(`  ${busType?.name || stat._id}: ${stat.count} buses`);
    });

    const depotStats = await Bus.aggregate([
      { $lookup: { from: 'depots', localField: 'depotId', foreignField: '_id', as: 'depot' } },
      { $unwind: '$depot' },
      { $group: { _id: '$depot.depotName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n🏢 Top depots by bus count:');
    depotStats.slice(0, 10).forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} buses`);
    });

    console.log('\n✅ KERALA BUS CREATION COMPLETED!');
    console.log('🎯 All buses are now available in the streamlined bus management');

  } catch (error) {
    console.error('❌ Error creating Kerala buses:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

createKeralaBuses();
