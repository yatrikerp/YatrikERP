require('dotenv').config();
const mongoose = require('mongoose');
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');
const bcrypt = require('bcryptjs');

async function resetCredentials() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://yatrikerp:Yatrik123@cluster0.3qt2hfg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri, { dbName: 'yatrik-erp' });
    console.log('✅ Connected to MongoDB\n');

    const password = 'Yatrik123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    console.log('='.repeat(70));
    console.log('🔧 RESETTING ALL DRIVER CREDENTIALS');
    console.log('='.repeat(70));
    
    // Reset all drivers
    const drivers = await Driver.find({});
    console.log(`Found ${drivers.length} drivers`);
    
    let driverUpdated = 0;
    for (const driver of drivers) {
      driver.password = hashedPassword;
      driver.status = 'active';
      await driver.save();
      driverUpdated++;
      if (driverUpdated <= 10) {
        console.log(`✅ Updated: ${driver.email} - ${driver.name}`);
      }
    }
    
    console.log(`\n📊 Total drivers updated: ${driverUpdated}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('🔧 RESETTING ALL CONDUCTOR CREDENTIALS');
    console.log('='.repeat(70));
    
    // Reset all conductors
    const conductors = await Conductor.find({});
    console.log(`Found ${conductors.length} conductors`);
    
    let conductorUpdated = 0;
    for (const conductor of conductors) {
      conductor.password = hashedPassword;
      conductor.status = 'active';
      await conductor.save();
      conductorUpdated++;
      if (conductorUpdated <= 10) {
        console.log(`✅ Updated: ${conductor.email} - ${conductor.name}`);
      }
    }
    
    console.log(`\n📊 Total conductors updated: ${conductorUpdated}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL CREDENTIALS RESET SUCCESSFULLY!');
    console.log('='.repeat(70));
    
    // Show test credentials
    console.log('\n📧 Test Credentials:');
    console.log('-'.repeat(70));
    console.log('DRIVER:');
    console.log('  Email: driver001.driver@yatrik.com');
    console.log('  Password: Yatrik123');
    console.log('  Redirects to: /driver');
    console.log('-'.repeat(70));
    console.log('CONDUCTOR:');
    console.log('  Email: conductor001.conductor@yatrik.com');
    console.log('  Password: Yatrik123');
    console.log('  Redirects to: /conductor');
    console.log('-'.repeat(70));
    
    console.log(`\n📊 Database Summary:`);
    console.log(`  Total Drivers: ${drivers.length}`);
    console.log(`  Total Conductors: ${conductors.length}`);
    console.log(`\n✅ Password reset: Yatrik123 (for all accounts)`);
    
    await mongoose.disconnect();
    console.log('\n✅ Done! You can now login.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

resetCredentials().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
