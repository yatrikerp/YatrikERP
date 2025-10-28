const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');

const Booking = mongoose.model('Booking', new mongoose.Schema({}, { strict: false }));
const Trip = mongoose.model('Trip', new mongoose.Schema({}, { strict: false }));

async function createData() {
  try {
    console.log('🔌 Connected to MongoDB');
    
    // Check existing data
    const tripCount = await Trip.countDocuments();
    const bookingCount = await Booking.countDocuments();
    
    console.log(`📊 Current data: ${tripCount} trips, ${bookingCount} bookings`);
    
    if (tripCount === 0) {
      console.log('⚠️ No trips found. Please create trips first through the admin panel.');
      console.log('Or the database is empty.');
      process.exit(1);
    }
    
    if (bookingCount >= 50) {
      console.log('✅ You already have enough bookings for ML testing!');
      process.exit(0);
    }
    
    console.log('✅ Ready to test ML models with existing data.');
    console.log(`\n📝 Summary:`);
    console.log(`   - Routes: Check in DB`);
    console.log(`   - Trips: ${tripCount}`);
    console.log(`   - Bookings: ${bookingCount}`);
    console.log(`\n🔧 To add more bookings:`);
    console.log(`   1. Go to http://localhost:5173`);
    console.log(`   2. Login as admin`);
    console.log(`   3. Make test bookings`);
    console.log(`\n🚀 Run ML models:`);
    console.log(`   curl -X POST http://localhost:5001/run_all`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createData();

