const mongoose = require('mongoose');
const KSRTCDataImporter = require('../services/ksrtcDataImporter');
const Route = require('../models/Route');
const Stop = require('../models/Stop');
const RouteStop = require('../models/RouteStop');
const RouteGraph = require('../models/RouteGraph');
require('dotenv').config();

// Sample KSRTC data for Kerala
const sampleRoutes = [
  {
    routeNumber: 'K01',
    routeName: 'Thiruvananthapuram - Kochi Express',
    startingPoint: {
      city: 'Thiruvananthapuram',
      location: 'Central Bus Station',
      coordinates: { latitude: 8.5241, longitude: 76.9366 }
    },
    endingPoint: {
      city: 'Kochi',
      location: 'Vyttila Mobility Hub',
      coordinates: { latitude: 9.9312, longitude: 76.2673 }
    },
    totalDistance: 220,
    estimatedDuration: 240,
    baseFare: 150,
    farePerKm: 1.2,
    features: ['AC', 'WiFi'],
    status: 'active',
    createdBy: null
  },
  {
    routeNumber: 'K02',
    routeName: 'Kochi - Kozhikode Express',
    startingPoint: {
      city: 'Kochi',
      location: 'Vyttila Mobility Hub',
      coordinates: { latitude: 9.9312, longitude: 76.2673 }
    },
    endingPoint: {
      city: 'Kozhikode',
      location: 'Calicut Bus Station',
      coordinates: { latitude: 11.2588, longitude: 75.7804 }
    },
    totalDistance: 185,
    estimatedDuration: 210,
    baseFare: 120,
    farePerKm: 1.1,
    features: ['AC'],
    status: 'active',
    createdBy: null
  },
  {
    routeNumber: 'K03',
    routeName: 'Thiruvananthapuram - Kozhikode Super Express',
    startingPoint: {
      city: 'Thiruvananthapuram',
      location: 'Central Bus Station',
      coordinates: { latitude: 8.5241, longitude: 76.9366 }
    },
    endingPoint: {
      city: 'Kozhikode',
      location: 'Calicut Bus Station',
      coordinates: { latitude: 11.2588, longitude: 75.7804 }
    },
    totalDistance: 405,
    estimatedDuration: 450,
    baseFare: 280,
    farePerKm: 1.3,
    features: ['AC', 'WiFi', 'USB_Charging'],
    status: 'active',
    createdBy: null
  },
  {
    routeNumber: 'K04',
    routeName: 'Kochi - Thrissur Local',
    startingPoint: {
      city: 'Kochi',
      location: 'Vyttila Mobility Hub',
      coordinates: { latitude: 9.9312, longitude: 76.2673 }
    },
    endingPoint: {
      city: 'Thrissur',
      location: 'Thrissur Bus Station',
      coordinates: { latitude: 10.5276, longitude: 76.2144 }
    },
    totalDistance: 85,
    estimatedDuration: 95,
    baseFare: 60,
    farePerKm: 0.8,
    features: [],
    status: 'active',
    createdBy: null
  }
];

const sampleStops = [
  { stopCode: 'TVM01', stopName: 'Thiruvananthapuram Central', latitude: 8.5241, longitude: 76.9366 },
  { stopCode: 'TVM02', stopName: 'Kazhakuttom', latitude: 8.5667, longitude: 76.8667 },
  { stopCode: 'KOC01', stopName: 'Vyttila Mobility Hub', latitude: 9.9312, longitude: 76.2673 },
  { stopCode: 'KOC02', stopName: 'Ernakulam Junction', latitude: 9.9674, longitude: 76.2454 },
  { stopCode: 'KOC03', stopName: 'Fort Kochi', latitude: 9.9667, longitude: 76.2333 },
  { stopCode: 'TSR01', stopName: 'Thrissur Bus Station', latitude: 10.5276, longitude: 76.2144 },
  { stopCode: 'TSR02', stopName: 'Guruvayur', latitude: 10.5939, longitude: 76.0411 },
  { stopCode: 'CLT01', stopName: 'Calicut Bus Station', latitude: 11.2588, longitude: 75.7804 },
  { stopCode: 'CLT02', stopName: 'Kozhikode Railway Station', latitude: 11.2588, longitude: 75.7804 },
  { stopCode: 'CLT03', stopName: 'Malappuram', latitude: 11.0732, longitude: 76.0740 }
];

const sampleRouteStops = [
  // Route K01: Thiruvananthapuram - Kochi
  { routeNumber: 'K01', stopCode: 'TVM01', stopSequence: 1, distanceFromStart: 0, distanceFromPrev: 0, estimatedArrival: 0, estimatedDeparture: 5, segmentDuration: 0, fareFromStart: 0, latitude: 8.5241, longitude: 76.9366, stopType: 'terminal', ksrtcStopCode: 'TVM01', createdBy: null },
  { routeNumber: 'K01', stopCode: 'TVM02', stopSequence: 2, distanceFromStart: 15, distanceFromPrev: 15, estimatedArrival: 20, estimatedDeparture: 25, segmentDuration: 20, fareFromStart: 25, latitude: 8.5667, longitude: 76.8667, stopType: 'major', ksrtcStopCode: 'TVM02', createdBy: null },
  { routeNumber: 'K01', stopCode: 'TSR01', stopSequence: 3, distanceFromStart: 135, distanceFromPrev: 120, estimatedArrival: 155, estimatedDeparture: 160, segmentDuration: 135, fareFromStart: 160, latitude: 10.5276, longitude: 76.2144, stopType: 'major', ksrtcStopCode: 'TSR01', createdBy: null },
  { routeNumber: 'K01', stopCode: 'KOC01', stopSequence: 4, distanceFromStart: 220, distanceFromPrev: 85, estimatedArrival: 240, estimatedDeparture: 245, segmentDuration: 85, fareFromStart: 220, latitude: 9.9312, longitude: 76.2673, stopType: 'terminal', ksrtcStopCode: 'KOC01', createdBy: null },

  // Route K02: Kochi - Kozhikode
  { routeNumber: 'K02', stopCode: 'KOC01', stopSequence: 1, distanceFromStart: 0, distanceFromPrev: 0, estimatedArrival: 0, estimatedDeparture: 5, segmentDuration: 0, fareFromStart: 0, latitude: 9.9312, longitude: 76.2673, stopType: 'terminal', ksrtcStopCode: 'KOC01', createdBy: null },
  { routeNumber: 'K02', stopCode: 'KOC02', stopSequence: 2, distanceFromStart: 12, distanceFromPrev: 12, estimatedArrival: 15, estimatedDeparture: 20, segmentDuration: 15, fareFromStart: 15, latitude: 9.9674, longitude: 76.2454, stopType: 'major', ksrtcStopCode: 'KOC02', createdBy: null },
  { routeNumber: 'K02', stopCode: 'TSR01', stopSequence: 3, distanceFromStart: 85, distanceFromPrev: 73, estimatedArrival: 95, estimatedDeparture: 100, segmentDuration: 80, fareFromStart: 95, latitude: 10.5276, longitude: 76.2144, stopType: 'major', ksrtcStopCode: 'TSR01', createdBy: null },
  { routeNumber: 'K02', stopCode: 'CLT01', stopSequence: 4, distanceFromStart: 185, distanceFromPrev: 100, estimatedArrival: 210, estimatedDeparture: 215, segmentDuration: 115, fareFromStart: 185, latitude: 11.2588, longitude: 75.7804, stopType: 'terminal', ksrtcStopCode: 'CLT01', createdBy: null },

  // Route K03: Thiruvananthapuram - Kozhikode (Direct)
  { routeNumber: 'K03', stopCode: 'TVM01', stopSequence: 1, distanceFromStart: 0, distanceFromPrev: 0, estimatedArrival: 0, estimatedDeparture: 5, segmentDuration: 0, fareFromStart: 0, latitude: 8.5241, longitude: 76.9366, stopType: 'terminal', ksrtcStopCode: 'TVM01', createdBy: null },
  { routeNumber: 'K03', stopCode: 'TSR01', stopSequence: 2, distanceFromStart: 135, distanceFromPrev: 135, estimatedArrival: 150, estimatedDeparture: 155, segmentDuration: 150, fareFromStart: 180, latitude: 10.5276, longitude: 76.2144, stopType: 'major', ksrtcStopCode: 'TSR01', createdBy: null },
  { routeNumber: 'K03', stopCode: 'CLT01', stopSequence: 3, distanceFromStart: 405, distanceFromPrev: 270, estimatedArrival: 450, estimatedDeparture: 455, segmentDuration: 300, fareFromStart: 405, latitude: 11.2588, longitude: 75.7804, stopType: 'terminal', ksrtcStopCode: 'CLT01', createdBy: null },

  // Route K04: Kochi - Thrissur Local
  { routeNumber: 'K04', stopCode: 'KOC01', stopSequence: 1, distanceFromStart: 0, distanceFromPrev: 0, estimatedArrival: 0, estimatedDeparture: 5, segmentDuration: 0, fareFromStart: 0, latitude: 9.9312, longitude: 76.2673, stopType: 'terminal', ksrtcStopCode: 'KOC01', createdBy: null },
  { routeNumber: 'K04', stopCode: 'KOC02', stopSequence: 2, distanceFromStart: 12, distanceFromPrev: 12, estimatedArrival: 15, estimatedDeparture: 20, segmentDuration: 15, fareFromStart: 12, latitude: 9.9674, longitude: 76.2454, stopType: 'major', ksrtcStopCode: 'KOC02', createdBy: null },
  { routeNumber: 'K04', stopCode: 'TSR01', stopSequence: 3, distanceFromStart: 85, distanceFromPrev: 73, estimatedArrival: 95, estimatedDeparture: 100, segmentDuration: 80, fareFromStart: 68, latitude: 10.5276, longitude: 76.2144, stopType: 'terminal', ksrtcStopCode: 'TSR01', createdBy: null }
];

async function importSampleData() {
  try {
    console.log('🚀 Starting KSRTC sample data import...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('✅ Connected to MongoDB');

    const dataImporter = new KSRTCDataImporter();

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️ Clearing existing data...');
    await Promise.all([
      Route.deleteMany({}),
      Stop.deleteMany({}),
      RouteStop.deleteMany({}),
      RouteGraph.deleteMany({})
    ]);
    console.log('✅ Existing data cleared');

    // Import routes
    console.log('📋 Importing routes...');
    for (const routeData of sampleRoutes) {
      await dataImporter.importSingleRoute(routeData);
    }
    console.log(`✅ Imported ${sampleRoutes.length} routes`);

    // Import stops
    console.log('🚏 Importing stops...');
    for (const stopData of sampleStops) {
      await dataImporter.importSingleStop(stopData);
    }
    console.log(`✅ Imported ${sampleStops.length} stops`);

    // Import route stops
    console.log('🛤️ Importing route stops...');
    for (const routeStopData of sampleRouteStops) {
      await dataImporter.importSingleRouteStop(routeStopData);
    }
    console.log(`✅ Imported ${sampleRouteStops.length} route stops`);

    // Build route graph
    console.log('🕸️ Building route graph...');
    const graph = await dataImporter.buildRouteGraph();
    console.log(`✅ Route graph built with ${graph.nodeCount} nodes and ${graph.edgeCount} edges`);

    console.log('🎉 Sample data import completed successfully!');
    console.log('\n📊 Import Statistics:');
    console.log(`Routes: ${sampleRoutes.length}`);
    console.log(`Stops: ${sampleStops.length}`);
    console.log(`Route Stops: ${sampleRouteStops.length}`);
    console.log(`Graph Nodes: ${graph.nodeCount}`);
    console.log(`Graph Edges: ${graph.edgeCount}`);

    // Test the pathfinding
    console.log('\n🧪 Testing pathfinding...');
    const PathfindingService = require('../services/pathfindingService');
    const pathfindingService = new PathfindingService();

    // Find a sample route
    const tvmStop = await Stop.findOne({ code: 'TVM01' });
    const cltStop = await Stop.findOne({ code: 'CLT01' });

    if (tvmStop && cltStop) {
      console.log(`\n🔍 Finding route from ${tvmStop.name} to ${cltStop.name}...`);
      const result = await pathfindingService.findRouteOptions(tvmStop._id, cltStop._id, '10:00', { maxOptions: 3 });
      
      console.log(`✅ Found ${result.length} route options:`);
      result.forEach((route, index) => {
        console.log(`  ${index + 1}. ${route.routeSummary}`);
        console.log(`     Duration: ${route.totalDuration} minutes`);
        console.log(`     Fare: ₹${route.totalFare}`);
        console.log(`     Transfers: ${route.transferCount}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error importing sample data:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  importSampleData()
    .then(() => {
      console.log('✅ Import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

module.exports = { importSampleData, sampleRoutes, sampleStops, sampleRouteStops };

















