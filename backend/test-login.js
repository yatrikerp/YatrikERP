require('dotenv').config();
const mongoose = require('mongoose');
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');
const bcrypt = require('bcryptjs');

async function testLogin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://yatrikerp:Yatrik123@cluster0.3qt2hfg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri, { dbName: 'yatrik-erp' });
    console.log('✅ Connected to MongoDB\n');

    // Test driver login
    console.log('='.repeat(60));
    console.log('🚗 TESTING DRIVER LOGIN');
    console.log('='.repeat(60));
    
    const driverEmail = 'driver001.driver@yatrik.com';
    const driverPassword = 'Yatrik123';
    
    const driver = await Driver.findOne({ 
      email: driverEmail,
      status: 'active'
    }).populate('depotId', 'depotName depotCode');
    
    if (driver) {
      console.log('✅ Driver found:', driver.name);
      console.log('   Email:', driver.email);
      console.log('   Depot:', driver.depotId ? driver.depotId.depotName : 'None');
      
      const passwordMatch = await bcrypt.compare(driverPassword, driver.password);
      console.log('   Password match:', passwordMatch);
      
      if (!passwordMatch) {
        console.log('⚠️  Updating password...');
        driver.password = await bcrypt.hash(driverPassword, 12);
        await driver.save();
        console.log('✅ Password updated!');
      }
    } else {
      console.log('❌ Driver not found');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎫 TESTING CONDUCTOR LOGIN');
    console.log('='.repeat(60));
    
    const conductorEmail = 'conductor001.conductor@yatrik.com';
    const conductorPassword = 'Yatrik123';
    
    const conductor = await Conductor.findOne({ 
      email: conductorEmail,
      status: 'active'
    }).populate('depotId', 'depotName depotCode');
    
    if (conductor) {
      console.log('✅ Conductor found:', conductor.name);
      console.log('   Email:', conductor.email);
      console.log('   Depot:', conductor.depotId ? conductor.depotId.depotName : 'None');
      
      const passwordMatch = await bcrypt.compare(conductorPassword, conductor.password);
      console.log('   Password match:', passwordMatch);
      
      if (!passwordMatch) {
        console.log('⚠️  Updating password...');
        conductor.password = await bcrypt.hash(conductorPassword, 12);
        await conductor.save();
        console.log('✅ Password updated!');
      }
    } else {
      console.log('❌ Conductor not found');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log('Driver login: driver001.driver@yatrik.com / Yatrik123 → /driver');
    console.log('Conductor login: conductor001.conductor@yatrik.com / Yatrik123 → /conductor');
    
    await mongoose.disconnect();
    console.log('\n✅ Test complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();
