const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/yatrik_erp');
    console.log('MongoDB connected successfully');

    const db = mongoose.connection.db;
    const collections = await db.collections();
    console.log('Available collections:', collections.map(c => c.collectionName));

    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

testConnection();
