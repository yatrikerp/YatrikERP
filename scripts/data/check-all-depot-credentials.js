const mongoose = require('mongoose');
require('dotenv').config();

async function checkAllDepotCredentials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const DepotUser = require('./backend/models/DepotUser');
    const Depot = require('./backend/models/Depot');
    
    // Get all depot users
    const depotUsers = await DepotUser.find({}).select('username email status depotName depotCode');
    console.log(`\n📊 Found ${depotUsers.length} depot users in database:\n`);
    
    // Get all depots
    const depots = await Depot.find({}).select('depotName depotCode status');
    console.log(`\n🏢 Found ${depots.length} depots in database:\n`);
    
    // Display depot users
    console.log('👥 DEPOT USERS:');
    console.log('='.repeat(80));
    depotUsers.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Depot: ${user.depotName} (${user.depotCode})`);
      console.log('   ' + '-'.repeat(60));
    });
    
    // Display depots
    console.log('\n🏢 DEPOTS:');
    console.log('='.repeat(80));
    depots.forEach((depot, index) => {
      console.log(`${index + 1}. Depot Name: ${depot.depotName}`);
      console.log(`   Depot Code: ${depot.depotCode}`);
      console.log(`   Status: ${depot.status}`);
      console.log('   ' + '-'.repeat(60));
    });
    
    // Check for VZM depot specifically
    console.log('\n🔍 CHECKING FOR VZM DEPOT:');
    console.log('='.repeat(50));
    
    const vzmDepot = depots.find(d => 
      d.depotCode?.toLowerCase() === 'vzm' || 
      d.depotName?.toLowerCase().includes('vzm') ||
      d.depotName?.toLowerCase().includes('vizianagaram')
    );
    
    const vzmUser = depotUsers.find(u => 
      u.email?.toLowerCase().includes('vzm') ||
      u.username?.toLowerCase().includes('vzm') ||
      u.depotCode?.toLowerCase() === 'vzm'
    );
    
    if (vzmDepot) {
      console.log('✅ VZM Depot found:');
      console.log(`   Name: ${vzmDepot.depotName}`);
      console.log(`   Code: ${vzmDepot.depotCode}`);
      console.log(`   Status: ${vzmDepot.status}`);
    } else {
      console.log('❌ VZM Depot NOT found');
    }
    
    if (vzmUser) {
      console.log('✅ VZM Depot User found:');
      console.log(`   Username: ${vzmUser.username}`);
      console.log(`   Email: ${vzmUser.email}`);
      console.log(`   Status: ${vzmUser.status}`);
      console.log(`   Depot: ${vzmUser.depotName} (${vzmUser.depotCode})`);
    } else {
      console.log('❌ VZM Depot User NOT found');
    }
    
    // Test credentials for all depot users
    console.log('\n🧪 TEST CREDENTIALS FOR ALL DEPOT USERS:');
    console.log('='.repeat(80));
    
    depotUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.depotName} (${user.depotCode})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Password: ${user.depotCode?.toUpperCase()}@Yatrik2024`);
      console.log('   ' + '-'.repeat(60));
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAllDepotCredentials();

