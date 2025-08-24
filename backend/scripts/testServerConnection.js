const mongoose = require('mongoose');

console.log('🔍 Testing server database connection...');

// Use the exact same connection logic as server.js
const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp';
console.log(`📡 Connection string: ${connectionString}`);

mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  console.log(`🗄️  Database name: ${mongoose.connection.name}`);
  console.log(`🔗 Connection string: ${mongoose.connection.host}:${mongoose.connection.port}`);
  
  // List all collections in this database
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`📚 Collections in ${mongoose.connection.name}:`);
  collections.forEach(col => console.log(`  - ${col.name}`));
  
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
})
.finally(() => {
  mongoose.connection.close();
  console.log('\n🔌 Connection closed');
});
