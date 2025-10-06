const mongoose = require('mongoose');
const Route = require('../models/Route');
const Depot = require('../models/Depot');
const FarePolicy = require('../models/FarePolicy');
const FareCalculationService = require('../services/fareCalculationService');
require('dotenv').config();

// Kerala Routes Data (base, manually curated + programmatic expansion)
const baseKeralaRoutesData = {
  'THRISSUR': [
    { from: 'Thrissur', to: 'Guruvayur', distance: 29, duration: 45, type: 'intercity' },
    { from: 'Thrissur', to: 'Kochi', distance: 74, duration: 120, type: 'intercity' },
    { from: 'Thrissur', to: 'Palakkad', distance: 79, duration: 135, type: 'intercity' },
    { from: 'Thrissur', to: 'Kozhikode', distance: 142, duration: 240, type: 'intercity' },
    { from: 'Thrissur', to: 'Ernakulam', distance: 74, duration: 120, type: 'intercity' }
  ],
  'THIRUVALLA': [
    { from: 'Thiruvalla', to: 'Pathanamthitta', distance: 18, duration: 30, type: 'intercity' },
    { from: 'Thiruvalla', to: 'Kottayam', distance: 27, duration: 45, type: 'intercity' },
    { from: 'Thiruvalla', to: 'Alappuzha', distance: 32, duration: 60, type: 'intercity' },
    { from: 'Thiruvalla', to: 'Kollam', distance: 54, duration: 90, type: 'intercity' },
    { from: 'Thiruvalla', to: 'Kochi', distance: 85, duration: 135, type: 'intercity' }
  ],
  'SULTHAN BATHERY': [
    { from: 'Sulthan Bathery', to: 'Mananthavady', distance: 35, duration: 60, type: 'intercity' },
    { from: 'Sulthan Bathery', to: 'Kalpetta', distance: 19, duration: 35, type: 'intercity' },
    { from: 'Sulthan Bathery', to: 'Kozhikode', distance: 98, duration: 180, type: 'intercity' },
    { from: 'Sulthan Bathery', to: 'Mysuru', distance: 120, duration: 210, type: 'interstate' },
    { from: 'Sulthan Bathery', to: 'Bengaluru', distance: 285, duration: 420, type: 'interstate' }
  ],
  'PATHANAMTHITTA': [
    { from: 'Pathanamthitta', to: 'Thiruvalla', distance: 18, duration: 30, type: 'intercity' },
    { from: 'Pathanamthitta', to: 'Chengannur', distance: 32, duration: 50, type: 'intercity' },
    { from: 'Pathanamthitta', to: 'Erumely', distance: 42, duration: 75, type: 'intercity' },
    { from: 'Pathanamthitta', to: 'Kottayam', distance: 45, duration: 75, type: 'intercity' },
    { from: 'Pathanamthitta', to: 'Sabarimala', distance: 65, duration: 120, type: 'seasonal' }
  ],
  'PALAKKAD': [
    { from: 'Palakkad', to: 'Thrissur', distance: 79, duration: 135, type: 'intercity' },
    { from: 'Palakkad', to: 'Coimbatore', distance: 55, duration: 90, type: 'interstate' },
    { from: 'Palakkad', to: 'Kozhikode', distance: 155, duration: 270, type: 'intercity' },
    { from: 'Palakkad', to: 'Mannarkkad', distance: 45, duration: 75, type: 'intercity' },
    { from: 'Palakkad', to: 'Shornur', distance: 25, duration: 40, type: 'intercity' }
  ],
  'KOTTAYAM': [
    { from: 'Kottayam', to: 'Pala', distance: 32, duration: 55, type: 'intercity' },
    { from: 'Kottayam', to: 'Ernakulam', distance: 65, duration: 105, type: 'intercity' },
    { from: 'Kottayam', to: 'Alappuzha', distance: 45, duration: 75, type: 'intercity' },
    { from: 'Kottayam', to: 'Thiruvalla', distance: 27, duration: 45, type: 'intercity' },
    { from: 'Kottayam', to: 'Kumily', distance: 114, duration: 210, type: 'hill_station' }
  ],
  'KOZHIKKODE': [
    { from: 'Kozhikode', to: 'Kannur', distance: 92, duration: 150, type: 'intercity' },
    { from: 'Kozhikode', to: 'Kalpetta', distance: 73, duration: 135, type: 'intercity' },
    { from: 'Kozhikode', to: 'Thrissur', distance: 142, duration: 240, type: 'intercity' },
    { from: 'Kozhikode', to: 'Malappuram', distance: 55, duration: 90, type: 'intercity' },
    { from: 'Kozhikode', to: 'Mysuru', distance: 220, duration: 360, type: 'interstate' }
  ],
  'KANNUR': [
    { from: 'Kannur', to: 'Kozhikode', distance: 92, duration: 150, type: 'intercity' },
    { from: 'Kannur', to: 'Thalassery', distance: 22, duration: 35, type: 'intercity' },
    { from: 'Kannur', to: 'Kasargod', distance: 70, duration: 120, type: 'intercity' },
    { from: 'Kannur', to: 'Mangalore', distance: 95, duration: 150, type: 'interstate' },
    { from: 'Kannur', to: 'Bangalore', distance: 350, duration: 480, type: 'interstate' }
  ],
  'ALAPPUZHA': [
    { from: 'Alappuzha', to: 'Kottayam', distance: 45, duration: 75, type: 'intercity' },
    { from: 'Alappuzha', to: 'Kollam', distance: 85, duration: 150, type: 'intercity' },
    { from: 'Alappuzha', to: 'Ernakulam', distance: 85, duration: 150, type: 'intercity' },
    { from: 'Alappuzha', to: 'Thiruvalla', distance: 32, duration: 60, type: 'intercity' },
    { from: 'Alappuzha', to: 'Kumarakom', distance: 16, duration: 30, type: 'tourist' }
  ],
  'KOLLAM': [
    { from: 'Kollam', to: 'Thiruvananthapuram', distance: 65, duration: 120, type: 'intercity' },
    { from: 'Kollam', to: 'Alappuzha', distance: 85, duration: 150, type: 'intercity' },
    { from: 'Kollam', to: 'Kottayam', distance: 80, duration: 135, type: 'intercity' },
    { from: 'Kollam', to: 'Pathanamthitta', distance: 75, duration: 120, type: 'intercity' },
    { from: 'Kollam', to: 'Chengannur', distance: 65, duration: 105, type: 'intercity' }
  ],
  'ERNAKULAM': [
    { from: 'Ernakulam', to: 'Thrissur', distance: 74, duration: 120, type: 'intercity' },
    { from: 'Ernakulam', to: 'Kottayam', distance: 65, duration: 105, type: 'intercity' },
    { from: 'Ernakulam', to: 'Alappuzha', distance: 85, duration: 150, type: 'intercity' },
    { from: 'Ernakulam', to: 'Munnar', distance: 130, duration: 240, type: 'hill_station' },
    { from: 'Ernakulam', to: 'Kochi Airport', distance: 25, duration: 45, type: 'airport' }
  ],
  // Added remaining Kerala districts to reach all-district coverage
  'THIRUVANANTHAPURAM': [
    { from: 'Thiruvananthapuram', to: 'Kollam', distance: 65, duration: 120, type: 'intercity' },
    { from: 'Thiruvananthapuram', to: 'Kottayam', distance: 150, duration: 240, type: 'intercity' },
    { from: 'Thiruvananthapuram', to: 'Alappuzha', distance: 150, duration: 240, type: 'intercity' },
    { from: 'Thiruvananthapuram', to: 'Kochi', distance: 200, duration: 300, type: 'intercity' },
    { from: 'Thiruvananthapuram', to: 'Kanyakumari', distance: 90, duration: 150, type: 'interstate' }
  ],
  'IDUKKI': [
    { from: 'Idukki', to: 'Munnar', distance: 35, duration: 75, type: 'hill_station' },
    { from: 'Idukki', to: 'Kottayam', distance: 114, duration: 210, type: 'hill_station' },
    { from: 'Idukki', to: 'Ernakulam', distance: 130, duration: 240, type: 'hill_station' },
    { from: 'Idukki', to: 'Thodupuzha', distance: 50, duration: 90, type: 'intercity' },
    { from: 'Idukki', to: 'Kumily', distance: 90, duration: 180, type: 'hill_station' }
  ],
  'MALAPPURAM': [
    { from: 'Malappuram', to: 'Kozhikode', distance: 50, duration: 90, type: 'intercity' },
    { from: 'Malappuram', to: 'Thrissur', distance: 110, duration: 195, type: 'intercity' },
    { from: 'Malappuram', to: 'Palakkad', distance: 110, duration: 195, type: 'intercity' },
    { from: 'Malappuram', to: 'Kottakkal', distance: 12, duration: 25, type: 'intercity' },
    { from: 'Malappuram', to: 'Manjeri', distance: 12, duration: 25, type: 'intercity' }
  ],
  'WAYANAD': [
    { from: 'Kalpetta', to: 'Sulthan Bathery', distance: 24, duration: 45, type: 'intercity' },
    { from: 'Kalpetta', to: 'Mananthavady', distance: 33, duration: 60, type: 'intercity' },
    { from: 'Kalpetta', to: 'Kozhikode', distance: 73, duration: 135, type: 'intercity' },
    { from: 'Sulthan Bathery', to: 'Mysuru', distance: 120, duration: 210, type: 'interstate' },
    { from: 'Mananthavady', to: 'Kannur', distance: 105, duration: 180, type: 'intercity' }
  ],
  'KASARAGOD': [
    { from: 'Kasaragod', to: 'Kannur', distance: 90, duration: 150, type: 'intercity' },
    { from: 'Kasaragod', to: 'Mangalore', distance: 60, duration: 105, type: 'interstate' },
    { from: 'Kasaragod', to: 'Payyanur', distance: 50, duration: 90, type: 'intercity' },
    { from: 'Kasaragod', to: 'Kanhangad', distance: 30, duration: 55, type: 'intercity' },
    { from: 'Kasaragod', to: 'Bekal', distance: 14, duration: 30, type: 'tourist' }
  ]
};

// Full inter-district coverage for Kerala + outside-Kerala mappings per district
const allKeralaDistricts = [
  'THIRUVANANTHAPURAM',
  'KOLLAM',
  'PATHANAMTHITTA',
  'ALAPPUZHA',
  'KOTTAYAM',
  'IDUKKI',
  'ERNAKULAM',
  'THRISSUR',
  'PALAKKAD',
  'MALAPPURAM',
  'KOZHIKKODE',
  'WAYANAD',
  'KANNUR',
  'KASARAGOD'
];

// Outside-Kerala city mappings per district (from user spec)
const outsideKeralaByDistrict = {
  THIRUVANANTHAPURAM: [
    'Nagercoil – Tamil Nadu', 'Kanyakumari – Tamil Nadu', 'Tirunelveli – Tamil Nadu',
    'Madurai – Tamil Nadu', 'Trichy – Tamil Nadu', 'Chennai – Tamil Nadu',
    'Pondicherry – Puducherry UT', 'Bengaluru – Karnataka'
  ],
  KOLLAM: [
    'Tirunelveli – Tamil Nadu', 'Madurai – Tamil Nadu', 'Dindigul – Tamil Nadu',
    'Chennai – Tamil Nadu', 'Hosur – Tamil Nadu', 'Bengaluru – Karnataka'
  ],
  PATHANAMTHITTA: [
    'Madurai – Tamil Nadu', 'Dindigul – Tamil Nadu', 'Trichy – Tamil Nadu',
    'Salem – Tamil Nadu', 'Coimbatore – Tamil Nadu', 'Bengaluru – Karnataka'
  ],
  ALAPPUZHA: [
    'Madurai – Tamil Nadu', 'Trichy – Tamil Nadu', 'Chennai – Tamil Nadu',
    'Hosur – Tamil Nadu', 'Bengaluru – Karnataka'
  ],
  KOTTAYAM: [
    'Madurai – Tamil Nadu', 'Dindigul – Tamil Nadu', 'Trichy – Tamil Nadu',
    'Coimbatore – Tamil Nadu', 'Erode – Tamil Nadu', 'Bengaluru – Karnataka'
  ],
  IDUKKI: [
    'Theni – Tamil Nadu', 'Madurai – Tamil Nadu', 'Dindigul – Tamil Nadu',
    'Kodaikanal – Tamil Nadu', 'Coimbatore – Tamil Nadu', 'Pollachi – Tamil Nadu', 'Palani – Tamil Nadu'
  ],
  ERNAKULAM: [
    'Coimbatore – Tamil Nadu', 'Salem – Tamil Nadu', 'Erode – Tamil Nadu',
    'Tirupur – Tamil Nadu', 'Hosur – Tamil Nadu', 'Bengaluru – Karnataka', 'Mysuru – Karnataka', 'Chennai – Tamil Nadu'
  ],
  THRISSUR: [
    'Coimbatore – Tamil Nadu', 'Salem – Tamil Nadu', 'Erode – Tamil Nadu',
    'Hosur – Tamil Nadu', 'Bengaluru – Karnataka', 'Mysuru – Karnataka'
  ],
  PALAKKAD: [
    'Coimbatore – Tamil Nadu', 'Tirupur – Tamil Nadu', 'Erode – Tamil Nadu',
    'Salem – Tamil Nadu', 'Krishnagiri – Tamil Nadu', 'Hosur – Tamil Nadu',
    'Bengaluru – Karnataka', 'Mysuru – Karnataka'
  ],
  MALAPPURAM: [
    'Coimbatore – Tamil Nadu', 'Ooty – Tamil Nadu', 'Salem – Tamil Nadu',
    'Hosur – Tamil Nadu', 'Bengaluru – Karnataka', 'Mysuru – Karnataka'
  ],
  KOZHIKKODE: [
    'Mysuru – Karnataka', 'Bengaluru – Karnataka', 'Mangalore – Karnataka',
    'Coimbatore – Tamil Nadu', 'Ooty – Tamil Nadu'
  ],
  WAYANAD: [
    'Mysuru – Karnataka', 'Bengaluru – Karnataka', 'Mangalore – Karnataka',
    'Coorg – Karnataka', 'Ooty – Tamil Nadu'
  ],
  KANNUR: [
    'Mangalore – Karnataka', 'Udupi – Karnataka', 'Karwar – Karnataka',
    'Goa – Goa UT', 'Hubballi – Karnataka', 'Bengaluru – Karnataka'
  ],
  KASARAGOD: [
    'Mangalore – Karnataka', 'Udupi – Karnataka', 'Kundapura – Karnataka',
    'Karwar – Karnataka', 'Goa – Goa UT', 'Hubballi – Karnataka', 'Belagavi – Karnataka', 'Mumbai – Maharashtra'
  ]
};

function estimateDistanceKm(from, to) {
  // Rough heuristic: spread distances 60–600km
  const i = allKeralaDistricts.indexOf(from);
  const j = allKeralaDistricts.indexOf(to);
  if (i >= 0 && j >= 0) {
    const d = Math.abs(i - j) + 1;
    return Math.min(600, 60 + d * 40);
  }
  // For outside, default 150–700 range based on string length
  const seed = (String(from).length + String(to).length) % 10;
  return 150 + seed * 50;
}

function estimateDurationMin(distanceKm) {
  const avgSpeed = 40; // km/h
  return Math.round((distanceKm / avgSpeed) * 60);
}

function parseOutsideCityLabel(label) {
  // Example: "Coimbatore – Tamil Nadu" -> { city: 'Coimbatore', state: 'Tamil Nadu' }
  const parts = String(label).split('–').map(s => s.trim());
  return { city: parts[0] || label, state: parts[1] || '' };
}

function buildFullKeralaRoutesData() {
  // Start with manual base
  const map = JSON.parse(JSON.stringify(baseKeralaRoutesData));

  // Ensure all districts exist in map
  for (const dist of allKeralaDistricts) {
    if (!map[dist]) map[dist] = [];
  }

  // Add inter-district pairs for all districts
  for (const from of allKeralaDistricts) {
    for (const to of allKeralaDistricts) {
      if (to === from) continue;
      const distance = estimateDistanceKm(from, to);
      const duration = estimateDurationMin(distance);
      const fromCity = from.replace(/_/g, ' ').toLowerCase() === 'kozhikkode' ? 'Kozhikode' : from.replace(/_/g, ' ').toLowerCase() === 'thiruvananthapuram' ? 'Thiruvananthapuram' : from.split(' ')[0].charAt(0) + from.split(' ')[0].slice(1).toLowerCase();
      const toCity = to.replace(/_/g, ' ').toLowerCase() === 'kozhikkode' ? 'Kozhikode' : to.replace(/_/g, ' ').toLowerCase() === 'thiruvananthapuram' ? 'Thiruvananthapuram' : to.split(' ')[0].charAt(0) + to.split(' ')[0].slice(1).toLowerCase();
      map[from].push({ from: fromCity, to: toCity, distance, duration, type: 'intercity' });
    }
  }

  // Add outside-Kerala mappings
  for (const [dist, labels] of Object.entries(outsideKeralaByDistrict)) {
    const fromCity = dist.replace(/_/g, ' ').toLowerCase() === 'thiruvananthapuram' ? 'Thiruvananthapuram' : dist.split(' ')[0].charAt(0) + dist.split(' ')[0].slice(1).toLowerCase();
    if (!map[dist]) map[dist] = [];
    for (const label of labels) {
      const { city, state } = parseOutsideCityLabel(label);
      const distance = estimateDistanceKm(fromCity, city);
      const duration = estimateDurationMin(distance);
      const type = state.includes('Karnataka') ? 'interstate' : state.includes('Tamil Nadu') ? 'interstate' : 'interstate';
      map[dist].push({ from: fromCity, to: city, distance, duration, type });
    }
  }

  return map;
}

const keralaRoutesData = buildFullKeralaRoutesData();

// Bus type mapping (using correct enum values)
const mapRouteTypeToBusType = (routeType) => {
  switch (routeType) {
    case 'intercity': return 'ordinary';
    case 'interstate': return 'volvo';
    case 'hill_station': return 'super_fast';
    case 'seasonal': return 'fast_passenger';
    case 'tourist': return 'ac';
    case 'airport': return 'garuda';
    default: return 'ordinary';
  }
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://yatrik:yatrik123@cluster0.3qt2hfg.mongodb.net/yatrik-erp?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Get fare from policy
const getFareFromPolicy = async (busType, distance) => {
  try {
    const policy = await FarePolicy.findOne({ busType: busType, isActive: true });
    if (policy) {
      const baseFare = distance * policy.ratePerKm;
      const totalFare = Math.max(baseFare, policy.minimumFare);
      return {
        baseFare: Math.round(totalFare),
        farePerKm: policy.ratePerKm,
        minimumFare: policy.minimumFare
      };
    }
    // Fallback to default calculation
    return {
      baseFare: Math.max(8, Math.floor(distance * 2.5)),
      farePerKm: 2.5,
      minimumFare: 8
    };
  } catch (error) {
    console.error('Error getting fare from policy:', error);
    return {
      baseFare: Math.max(8, Math.floor(distance * 2.5)),
      farePerKm: 2.5,
      minimumFare: 8
    };
  }
};

// Import Kerala routes to database
const importKeralaRoutes = async () => {
  try {
    console.log('🚀 Starting Kerala routes import...');
    
    // Clear existing routes first to avoid duplicate key issues
    console.log('🧹 Clearing existing routes...');
    const deleteResult = await Route.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing routes`);
    
    // Get all depots
    const depots = await Depot.find({ isActive: true });
    console.log(`📊 Found ${depots.length} depots`);
    
    // Get admin user ID (assuming first admin user)
    const adminUser = { _id: '68a14f559891fce2ae3c7f65' }; // Default admin ID
    
    let totalRoutes = 0;
    let successCount = 0;
    let errorCount = 0;
    
    // Process each depot's routes
    for (const [depotName, routes] of Object.entries(keralaRoutesData)) {
      console.log(`\n📍 Processing ${depotName} with ${routes.length} routes...`);
      
      // Find matching depot
      const matchingDepot = depots.find(d => 
        d.depotName === depotName || 
        d.name === depotName ||
        d.depotName?.toLowerCase().includes(depotName.toLowerCase()) ||
        d.name?.toLowerCase().includes(depotName.toLowerCase()) ||
        depotName.toLowerCase().includes(d.depotName?.toLowerCase()) ||
        depotName.toLowerCase().includes(d.name?.toLowerCase())
      );
      
      if (!matchingDepot) {
        console.warn(`⚠️ Depot not found: ${depotName}`);
        errorCount += routes.length;
        continue;
      }
      
      console.log(`✅ Found depot: ${matchingDepot.depotName} (${matchingDepot._id})`);
      
      // Process each route
      for (const route of routes) {
        try {
          totalRoutes++;
          
          const busType = mapRouteTypeToBusType(route.type);
          const fareData = await getFareFromPolicy(busType, route.distance);
          
          // Generate route number
          const routeNumber = `KL-${route.from.substr(0,3).toUpperCase()}-${route.to.substr(0,3).toUpperCase()}-${Math.floor(Math.random() * 900) + 100}`;
          
          const routeData = {
            routeNumber: routeNumber,
            routeName: `${route.from} to ${route.to}`,
            startingPoint: {
              city: route.from,
              location: `${route.from} Bus Station, Kerala`,
              coordinates: { latitude: 0, longitude: 0 } // Placeholder coordinates
            },
            endingPoint: {
              city: route.to,
              location: `${route.to} Bus Station, ${route.type === 'interstate' ? 'Other State' : 'Kerala'}`,
              coordinates: { latitude: 0, longitude: 0 } // Placeholder coordinates
            },
            totalDistance: route.distance,
            estimatedDuration: route.duration,
            depot: {
              depotId: matchingDepot._id,
              depotName: matchingDepot.depotName || matchingDepot.name,
              depotLocation: `${matchingDepot.depotName || matchingDepot.name}, Kerala`
            },
            busType: busType,
            baseFare: fareData.baseFare,
            farePerKm: fareData.farePerKm,
            status: 'active',
            features: route.type === 'ac' ? ['AC'] : ['WiFi'], // Use valid enum values
            notes: `Kerala ${route.type} route`,
            intermediateStops: [],
            createdBy: adminUser._id,
            isActive: true
          };
          
          // Check if route already exists
          const existingRoute = await Route.findOne({ 
            routeNumber: routeData.routeNumber 
          });
          
          if (existingRoute) {
            console.log(`⏭️ Route already exists: ${routeData.routeNumber}`);
            continue;
          }
          
          // Create new route
          const newRoute = new Route(routeData);
          await newRoute.save();
          
          successCount++;
          console.log(`✅ Created route: ${routeData.routeNumber} (${routeData.routeName})`);
          
        } catch (error) {
          errorCount++;
          console.error(`❌ Error creating route ${route.from} to ${route.to}:`, error.message);
        }
      }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`Total routes processed: ${totalRoutes}`);
    console.log(`Successfully created: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    
    // Get final count
    const totalRoutesInDB = await Route.countDocuments({ isActive: true });
    console.log(`\n🎉 Total routes in database: ${totalRoutesInDB}`);
    
  } catch (error) {
    console.error('❌ Error importing Kerala routes:', error);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await importKeralaRoutes();
    console.log('\n✅ Kerala routes import completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { importKeralaRoutes, keralaRoutesData };
