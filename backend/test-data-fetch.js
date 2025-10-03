#!/usr/bin/env node
/**
 * TEST DATA FETCH
 * Simple script to test data fetching
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';

async function testDataFetch() {
  try {
    console.log('🚀 TESTING DATA FETCH...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fetch routes
    const routes = await Route.find({ status: 'active', isActive: true }).limit(3);
    console.log('📋 SAMPLE ROUTES:');
    routes.forEach((route, i) => {
      console.log(`${i + 1}. Route: ${route.routeNumber || route._id}`);
      console.log(`   Depot: ${JSON.stringify(route.depot)}`);
      console.log(`   Name: ${route.routeName}`);
      console.log('');
    });

    // Fetch buses
    const buses = await Bus.find().populate('depotId').limit(3);
    console.log('🚌 SAMPLE BUSES:');
    buses.forEach((bus, i) => {
      console.log(`${i + 1}. Bus: ${bus.busNumber}`);
      console.log(`   Depot: ${bus.depotId?.depotName || 'No depot'}`);
      console.log(`   Status: ${bus.status}`);
      console.log('');
    });

    // Fetch depots
    const depots = await Depot.find().limit(3);
    console.log('🏢 SAMPLE DEPOTS:');
    depots.forEach((depot, i) => {
      console.log(`${i + 1}. Depot: ${depot.depotName}`);
      console.log(`   ID: ${depot._id}`);
      console.log(`   Status: ${depot.status}`);
      console.log('');
    });

    console.log('✅ Data fetch test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

testDataFetch();


