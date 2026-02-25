require('dotenv').config();
const mongoose = require('mongoose');

console.log('========================================');
console.log('  Testing MongoDB Connection');
console.log('========================================\n');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.log('❌ ERROR: MONGODB_URI not found in .env file');
  process.exit(1);
}

console.log('📡 Connection URI:', uri.replace(/\/\/.*@/, '//***:***@'));
console.log('🔌 Attempting to connect...\n');

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

mongoose.connect(uri, options)
  .then(() => {
    console.log('✅ SUCCESS! MongoDB Atlas connected successfully!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('\n========================================');
    console.log('  Connection is working perfectly!');
    console.log('========================================\n');
    console.log('You can now start the server with:');
    console.log('  node server.js\n');
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ FAILED to connect to MongoDB Atlas\n');
    console.log('Error:', err.message);
    console.log('\n========================================');
    console.log('  Fix Required: Whitelist Your IP');
    console.log('========================================\n');
    console.log('Steps to fix:');
    console.log('1. Go to: https://cloud.mongodb.com/');
    console.log('2. Click "Network Access" (left sidebar)');
    console.log('3. Click "Add IP Address"');
    console.log('4. Click "Add Current IP Address"');
    console.log('5. Click "Confirm"');
    console.log('6. Wait 1-2 minutes');
    console.log('7. Run this test again\n');
    process.exit(1);
  });
