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
  
  // Test if we can find users
  const User = require('./models/User');
  const users = await User.find({});
  console.log(`📊 Found ${users.length} users in database`);
  
  if (users.length > 0) {
    console.log('👥 Users found:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });
  }
  
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
})
.finally(() => {
  mongoose.connection.close();
  console.log('\n🔌 Connection closed');
});
