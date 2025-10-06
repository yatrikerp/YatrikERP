const mongoose = require('mongoose');
require('dotenv').config();

async function fixRouteIndex() {
  try {
    const connectionUri = process.env.MONGODB_URI;
    
    if (!connectionUri) {
      throw new Error('MONGODB_URI environment variable is required.');
    }
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(connectionUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully');

    // Get the routes collection
    const routesCollection = mongoose.connection.db.collection('routes');
    
    // Drop the problematic unique index
    try {
      await routesCollection.dropIndex('schedules.scheduleId_1');
      console.log('✅ Dropped unique index on schedules.scheduleId');
    } catch (error) {
      console.log('ℹ️ Index schedules.scheduleId_1 not found or already dropped');
    }

    console.log('✅ Route index fix completed');
    
  } catch (error) {
    console.error('❌ Error fixing route index:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

fixRouteIndex();

