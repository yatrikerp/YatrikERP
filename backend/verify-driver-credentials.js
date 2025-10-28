require('dotenv').config();
const mongoose = require('mongoose');
const Driver = require('./models/Driver');
const bcrypt = require('bcryptjs');

async function verifyDriver() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://yatrikerp:Yatrik123@cluster0.3qt2hfg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    console.log('Using MongoDB URI:', mongoUri.substring(0, 30) + '...');
    await mongoose.connect(mongoUri, {
      dbName: 'yatrik-erp'
    });
    console.log('✅ Connected to MongoDB\n');

    const testEmail = 'driver001.driver@yatrik.com';
    
    console.log(`🔍 Searching for driver: ${testEmail}`);
    
    // Find the driver
    const driver = await Driver.findOne({ 
      email: testEmail 
    }).populate('depotId', 'depotName depotCode');

    if (!driver) {
      console.log('❌ Driver not found with email:', testEmail);
      console.log('\n🔍 Searching for all drivers with .driver@yatrik.com pattern...');
      const allDrivers = await Driver.find({ email: /\.driver@yatrik\.com$/ }).limit(10).select('email name username status');
      if (allDrivers.length > 0) {
        console.log('\nFound drivers:');
        allDrivers.forEach((d, i) => {
          console.log(`  ${i + 1}. ${d.email} - ${d.name} (${d.status})`);
        });
        console.log(`\n📝 Total drivers found: ${allDrivers.length}`);
      } else {
        console.log('❌ No drivers found with the pattern .driver@yatrik.com');
      }
      await mongoose.disconnect();
      return;
    }

    console.log('✅ Driver found!');
    console.log('  Name:', driver.name);
    console.log('  Email:', driver.email);
    console.log('  Username:', driver.username);
    console.log('  Depot:', driver.depotId ? driver.depotId.depotName : 'None');
    console.log('  Status:', driver.status);
    console.log('  Has password:', !!driver.password);
    
    // Test password
    const testPassword = 'Yatrik123';
    console.log('\n🔐 Testing password...');
    
    if (driver.password) {
      const isMatch = await bcrypt.compare(testPassword, driver.password);
      console.log('  Password match:', isMatch);
      
      if (!isMatch) {
        console.log('\n⚠️  Password does not match! Updating password...');
        driver.password = await bcrypt.hash(testPassword, 12);
        await driver.save();
        console.log('✅ Password updated successfully!');
      } else {
        console.log('✅ Password is correct!');
      }
    } else {
      console.log('\n⚠️  No password set! Setting password...');
      driver.password = await bcrypt.hash(testPassword, 12);
      await driver.save();
      console.log('✅ Password set successfully!');
    }

    console.log('\n✅ Verification complete!');
    console.log('📧 Email:', testEmail);
    console.log('🔑 Password: Yatrik123');
    console.log('🎯 Should redirect to: /driver');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

verifyDriver();
