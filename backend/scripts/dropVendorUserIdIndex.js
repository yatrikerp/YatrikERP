/**
 * Script to drop the unique index on Vendor.userId
 * Run this once to fix the "userId already exists" error
 * 
 * Usage: node backend/scripts/dropVendorUserIdIndex.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function dropUserIdIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('vendors');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('📋 Current indexes:', indexes.map(idx => idx.name));

    // Find userId index
    const userIdIndex = indexes.find(idx => 
      idx.key && idx.key.userId !== undefined
    );

    if (userIdIndex) {
      console.log('🔍 Found userId index:', userIdIndex.name);
      
      // Check if it's unique
      if (userIdIndex.unique) {
        console.log('⚠️  userId index is unique - dropping it...');
        await collection.dropIndex(userIdIndex.name);
        console.log('✅ Dropped unique userId index:', userIdIndex.name);
      } else {
        console.log('ℹ️  userId index exists but is not unique - no action needed');
      }
    } else {
      console.log('ℹ️  No userId index found');
    }

    // Create new sparse (non-unique) index
    try {
      await collection.createIndex({ userId: 1 }, { sparse: true, name: 'userId_1_sparse' });
      console.log('✅ Created new sparse userId index');
    } catch (err) {
      if (err.code === 85) {
        console.log('ℹ️  Index already exists with different options');
      } else {
        throw err;
      }
    }

    // Verify final indexes
    const finalIndexes = await collection.indexes();
    console.log('📋 Final indexes:', finalIndexes.map(idx => ({
      name: idx.name,
      key: idx.key,
      unique: idx.unique,
      sparse: idx.sparse
    })));

    console.log('✅ Index fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
dropUserIdIndex();
