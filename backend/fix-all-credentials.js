require('dotenv').config();
const mongoose = require('mongoose');
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');
const bcrypt = require('bcryptjs');

async function fixCredentials() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://yatrikerp:Yatrik123@cluster0.3qt2hfg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri, { dbName: 'yatrik-erp' });
    console.log('✅ Connected to MongoDB\n');

    const password = 'Yatrik123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    console.log('='.repeat(60));
    console.log('🚗 FIXING DRIVER CREDENTIALS');
    console.log('='.repeat(60));
    
    // Fix all drivers
    const drivers = await Driver.find({});
    console.log(`Found ${drivers.length} drivers`);
    
    let driverFixed = 0;
    for (const driver of drivers) {
      if (!driver.password || !(await bcrypt.compare(password, driver.password)).toString().match('true')) {
        driver.password = hashedPassword;
        driver.status = 'active';
        await driver.save();
        driverFixed++;
        console.log(`✅ Fixed: ${driver.email}`);
      }
    }
    
    console.log(`\n📊 Fixed ${driverFixed} drivers`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎫 FIXING CONDUCTOR CREDENTIALS');
    console.log('='.repeat(60));
    
    // Fix all conductors
    const conductors = await Conductor.find({});
    console.log(`Found ${conductors.length} conductors`);
    
    let conductorFixed = 0;
    for (const conductor of conductors) {
      if (!conductor.password || !(await bcrypt.compare(password, conductor.password)).toString().match('true')) {
        conductor.password = hashedPassword;
        conductor.status = 'active';
        await conductor.save();
        conductorFixed++;
        console.log(`✅ Fixed: ${conductor.email}`);
      }
    }
    
    console.log(`\n📊 Fixed ${conductorFixed} conductors`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL CREDENTIALS FIXED!');
    console.log('='.repeat(60));
    console.log(`Total drivers: ${drivers.length}`);
    console.log(`Total conductors: ${conductors.length}`);
    console.log('\n📧 Test credentials:');
    console.log('Driver: driver001.driver@yatrik.com / Yatrik123');
    console.log('Conductor: conductor001.conductor@yatrik.com / Yatrik123');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixCredentials();
