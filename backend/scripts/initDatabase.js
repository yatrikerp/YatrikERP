#!/usr/bin/env node

/**
 * Database Initialization Script
 * This script sets up the database structure without any demo data
 * Run this to initialize your production database
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initDatabase() {
  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      console.error('❌ Error: MONGODB_URI environment variable is not set!');
      console.log('Please create a .env file in the backend directory with:');
      console.log('MONGODB_URI=mongodb://localhost:27017/yatrik-erp');
      console.log('\nOr copy from env.example:');
      console.log('cp env.example .env');
      process.exit(1);
    }

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Get database instance
    const db = mongoose.connection.db;

    // Create collections if they don't exist
    console.log('📚 Creating database collections...');
    
    const collections = [
      'users', 'buses', 'routes', 'stops', 'trips', 
      'bookings', 'tickets', 'depots', 'farepolicies', 
      'systemconfigs', 'auditlogs', 'wallets', 'duties'
    ];

    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 48) { // Collection already exists
          console.log(`ℹ️  Collection already exists: ${collectionName}`);
        } else {
          console.log(`⚠️  Warning creating ${collectionName}:`, error.message);
        }
      }
    }

    // Create indexes for better performance
    console.log('🔍 Creating database indexes...');
    
    try {
      // Users indexes - Remove duplicate since Mongoose handles this
      // await db.collection('users').createIndex({ "email": 1 }, { unique: true });
      // await db.collection('users').createIndex({ "phone": 1 });
      await db.collection('users').createIndex({ "role": 1 });
      console.log('✅ Users indexes handled by Mongoose schema');

      // Buses indexes
      await db.collection('buses').createIndex({ "registrationNo": 1 }, { unique: true });
      await db.collection('buses').createIndex({ "depotId": 1 });
      console.log('✅ Created buses indexes');

      // Routes indexes - Remove duplicate since Mongoose handles this
      // await db.collection('routes').createIndex({ "code": 1 }, { unique: true });
      // await db.collection('routes').createIndex({ "name": 1 });
      console.log('✅ Routes indexes handled by Mongoose schema');

      // Stops indexes - Remove duplicate since Mongoose handles this
      // await db.collection('stops').createIndex({ "code": 1 }, { unique: true });
      // await db.collection('stops').createIndex({ "name": 1 });
      console.log('✅ Stops indexes handled by Mongoose schema');

      // Trips indexes
      await db.collection('trips').createIndex({ "routeId": 1 });
      await db.collection('trips').createIndex({ "busId": 1 });
      await db.collection('trips').createIndex({ "serviceDate": 1 });
      await db.collection('trips').createIndex({ "status": 1 });
      console.log('✅ Created trips indexes');

      // Bookings indexes
      await db.collection('bookings').createIndex({ "pnr": 1 }, { unique: true });
      await db.collection('bookings').createIndex({ "userId": 1 });
      await db.collection('bookings').createIndex({ "tripId": 1 });
      await db.collection('bookings').createIndex({ "status": 1 });
      console.log('✅ Created bookings indexes');

      // Tickets indexes
      await db.collection('tickets').createIndex({ "ticketNumber": 1 }, { unique: true });
      await db.collection('tickets').createIndex({ "bookingId": 1 });
      await db.collection('tickets').createIndex({ "status": 1 });
      console.log('✅ Created tickets indexes');

      // Depots indexes - Remove duplicate since Mongoose handles this
      // await db.collection('depots').createIndex({ "code": 1 }, { unique: true });
      // await db.collection('depots').createIndex({ "name": 1 });
      console.log('✅ Depots indexes handled by Mongoose schema');

      // Wallets indexes
      await db.collection('wallets').createIndex({ "userId": 1 }, { unique: true });
      await db.collection('wallets').createIndex({ "status": 1 });
      console.log('✅ Created wallets indexes');

      // Duties indexes
      await db.collection('duties').createIndex({ "conductorId": 1 });
      await db.collection('duties').createIndex({ "tripId": 1 });
      await db.collection('duties').createIndex({ "date": 1 });
      console.log('✅ Created duties indexes');

    } catch (error) {
      console.log('⚠️  Warning creating indexes:', error.message);
    }

    // Create system configuration
    console.log('⚙️  Setting up system configuration...');
    
    try {
      const SystemConfig = require('../models/SystemConfig');
      const existingConfig = await SystemConfig.findOne();
      
      if (!existingConfig) {
        const systemConfig = new SystemConfig({
          jwtExpiryMinutes: 30,
          corsOrigins: [process.env.FRONTEND_URL || 'http://localhost:3000'],
          features: {
            pax: true,
            etm: true,
            driver: true,
            occ: true
          },
          maintenance: {
            enabled: false,
            message: 'System is under maintenance. Please try again later.'
          },
          updatedBy: null // Will be set when admin user is created
        });

        await systemConfig.save();
        console.log('✅ System configuration created');
      } else {
        console.log('ℹ️  System configuration already exists');
      }
    } catch (error) {
      console.log('⚠️  Warning creating system config:', error.message);
    }

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Create an admin user via API:');
    console.log('   POST /api/auth/register');
    console.log('2. Add real data (depots, routes, buses) via admin panel');
    console.log('3. Configure OAuth providers if needed');
    console.log('\n🌐 You can now start your server and access the admin panel');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    if (error.name === 'MongoServerSelectionError') {
      console.log('\n💡 Make sure MongoDB is running and MONGODB_URI is correct in your .env file');
    }
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
    console.log('✅ Done.');
  }
}

// Run the initialization function
initDatabase();
