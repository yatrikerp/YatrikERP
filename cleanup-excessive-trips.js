/**
 * Cleanup Script for Excessive Trips
 * 
 * This script helps clean up the over-scheduled trips in the system.
 * It provides options to:
 * 1. View current trip statistics
 * 2. Delete ALL trips (for fresh start)
 * 3. Delete duplicate/excessive trips while keeping reasonable ones
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Models
const Trip = require('./backend/models/Trip');
const Bus = require('./backend/models/Bus');
const Route = require('./backend/models/Route');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function getTripStatistics() {
  console.log('\n📊 CURRENT TRIP STATISTICS\n');
  console.log('='.repeat(60));
  
  const totalTrips = await Trip.countDocuments();
  const scheduledTrips = await Trip.countDocuments({ status: 'scheduled' });
  const runningTrips = await Trip.countDocuments({ status: 'running' });
  const completedTrips = await Trip.countDocuments({ status: 'completed' });
  
  const totalBuses = await Bus.countDocuments({ status: 'active' });
  const totalRoutes = await Route.countDocuments({ status: 'active' });
  
  console.log(`Total Trips:      ${totalTrips.toLocaleString()}`);
  console.log(`  - Scheduled:    ${scheduledTrips.toLocaleString()}`);
  console.log(`  - Running:      ${runningTrips.toLocaleString()}`);
  console.log(`  - Completed:    ${completedTrips.toLocaleString()}`);
  console.log(`\nTotal Buses:      ${totalBuses.toLocaleString()}`);
  console.log(`Total Routes:     ${totalRoutes.toLocaleString()}`);
  
  // Calculate recommended trips
  const recommendedTripsPerBus = 3;
  const recommendedTotalTrips = totalBuses * recommendedTripsPerBus;
  
  console.log(`\n📋 RECOMMENDATIONS:`);
  console.log(`Recommended trips (${recommendedTripsPerBus} per bus): ${recommendedTotalTrips.toLocaleString()}`);
  console.log(`Current excess: ${(totalTrips - recommendedTotalTrips).toLocaleString()}`);
  
  // Get trips by date
  const tripsByDate = await Trip.aggregate([
    {
      $group: {
        _id: '$serviceDate',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  console.log(`\n📅 TRIPS BY DATE:`);
  tripsByDate.forEach(({ _id, count }) => {
    const date = new Date(_id).toLocaleDateString();
    console.log(`  ${date}: ${count.toLocaleString()} trips`);
  });
  
  // Get trips per bus statistics
  const tripsPerBus = await Trip.aggregate([
    {
      $group: {
        _id: '$busId',
        tripCount: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        avgTripsPerBus: { $avg: '$tripCount' },
        maxTripsPerBus: { $max: '$tripCount' },
        minTripsPerBus: { $min: '$tripCount' },
        busesWithTrips: { $sum: 1 }
      }
    }
  ]);
  
  if (tripsPerBus.length > 0) {
    console.log(`\n🚌 BUS UTILIZATION:`);
    console.log(`  Buses with trips: ${tripsPerBus[0].busesWithTrips} / ${totalBuses}`);
    console.log(`  Avg trips/bus: ${tripsPerBus[0].avgTripsPerBus.toFixed(2)}`);
    console.log(`  Max trips/bus: ${tripsPerBus[0].maxTripsPerBus}`);
    console.log(`  Min trips/bus: ${tripsPerBus[0].minTripsPerBus}`);
  }
  
  console.log('='.repeat(60));
}

async function deleteAllTrips() {
  console.log('\n⚠️  WARNING: This will delete ALL trips from the system!');
  console.log('Press Ctrl+C to cancel or wait 5 seconds to proceed...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('🗑️  Deleting all trips...');
  const result = await Trip.deleteMany({});
  console.log(`✅ Deleted ${result.deletedCount} trips`);
  
  return result.deletedCount;
}

async function cleanupExcessiveTrips() {
  console.log('\n🧹 CLEANING UP EXCESSIVE TRIPS\n');
  console.log('This will keep only reasonable trips per bus (max 3 per day)...\n');
  
  const buses = await Bus.find({ status: 'active' }).lean();
  let totalDeleted = 0;
  
  // For each bus, keep only the first 3 trips per day
  for (const bus of buses) {
    // Get all trips for this bus
    const trips = await Trip.find({ busId: bus._id })
      .sort({ serviceDate: 1, startTime: 1 })
      .lean();
    
    // Group by service date
    const tripsByDate = {};
    trips.forEach(trip => {
      const dateKey = trip.serviceDate.toISOString().split('T')[0];
      if (!tripsByDate[dateKey]) {
        tripsByDate[dateKey] = [];
      }
      tripsByDate[dateKey].push(trip);
    });
    
    // For each date, keep only first 3 trips
    for (const [date, dateTrips] of Object.entries(tripsByDate)) {
      if (dateTrips.length > 3) {
        const tripsToDelete = dateTrips.slice(3); // Keep first 3, delete rest
        const tripIds = tripsToDelete.map(t => t._id);
        
        await Trip.deleteMany({ _id: { $in: tripIds } });
        totalDeleted += tripIds.length;
        
        console.log(`  Bus ${bus.busNumber} on ${date}: Kept 3, deleted ${tripIds.length} trips`);
      }
    }
  }
  
  console.log(`\n✅ Total trips deleted: ${totalDeleted.toLocaleString()}`);
  return totalDeleted;
}

async function main() {
  await connectDB();
  
  console.log('\n' + '='.repeat(60));
  console.log('  YATRIK ERP - TRIP CLEANUP UTILITY');
  console.log('='.repeat(60));
  
  // Show current statistics
  await getTripStatistics();
  
  console.log('\n\nOPTIONS:');
  console.log('1. Delete ALL trips (fresh start)');
  console.log('2. Clean up excessive trips (keep max 3 per bus per day)');
  console.log('3. View statistics only (already shown above)');
  console.log('\nTo run an option, modify this script or run:');
  console.log('  node cleanup-excessive-trips.js delete-all');
  console.log('  node cleanup-excessive-trips.js cleanup');
  
  const args = process.argv.slice(2);
  
  if (args.includes('delete-all')) {
    await deleteAllTrips();
    await getTripStatistics();
  } else if (args.includes('cleanup')) {
    await cleanupExcessiveTrips();
    await getTripStatistics();
  }
  
  await mongoose.connection.close();
  console.log('\n✅ Done!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});


