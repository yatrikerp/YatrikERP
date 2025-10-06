const mongoose = require('mongoose');
require('dotenv').config();

async function checkAndFixIndexes() {
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
    
    // List all indexes
    console.log('📋 Current indexes on routes collection:');
    const indexes = await routesCollection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Try to drop all indexes except the default _id index
    for (const index of indexes) {
      if (index.name !== '_id_') {
        try {
          await routesCollection.dropIndex(index.name);
          console.log(`✅ Dropped index: ${index.name}`);
        } catch (error) {
          console.log(`⚠️ Could not drop index ${index.name}: ${error.message}`);
        }
      }
    }

    console.log('✅ Index cleanup completed');
    
  } catch (error) {
    console.error('❌ Error checking/fixing indexes:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

checkAndFixIndexes();

