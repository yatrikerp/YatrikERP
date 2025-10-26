const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Conductor = require('./models/Conductor');

async function updateConductorsOnly() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB successfully');

    const newPassword = 'Yatrik@123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    console.log('\n🎫 Updating Conductors only...');
    console.log('📋 New format: {name}-conductor@yatrik.com');
    console.log('🔐 New password: Yatrik@123');

    const conductors = await Conductor.find({}).select('_id name username email');
    console.log(`Found ${conductors.length} conductors to update`);

    let conductorUpdateCount = 0;
    const batchSize = 50;
    
    for (let i = 0; i < conductors.length; i += batchSize) {
      const batch = conductors.slice(i, i + batchSize);
      const updatePromises = batch.map(async (conductor) => {
        try {
          const cleanName = conductor.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const newEmail = `${cleanName}-conductor@yatrik.com`;
          const newUsername = `${cleanName}-conductor`;

          await Conductor.findByIdAndUpdate(conductor._id, {
            email: newEmail,
            username: newUsername,
            password: hashedPassword,
            loginAttempts: 0,
            lockUntil: null
          });

          return { success: true, name: conductor.name, newEmail, newUsername };
        } catch (error) {
          return { success: false, name: conductor.name, error: error.message };
        }
      });

      const results = await Promise.all(updatePromises);
      
      const successful = results.filter(r => r.success).length;
      conductorUpdateCount += successful;
      
      const progress = Math.round(((i + batch.length) / conductors.length) * 100);
      console.log(`📊 Progress: ${i + batch.length}/${conductors.length} (${progress}%) - Updated: ${successful}/${batch.length}`);
      
      // Show sample updates from this batch
      const sampleSuccess = results.filter(r => r.success).slice(0, 3);
      sampleSuccess.forEach(result => {
        console.log(`  ✅ ${result.name} -> ${result.newEmail}`);
      });
    }

    console.log(`\n✅ Conductors updated: ${conductorUpdateCount}/${conductors.length}`);
    console.log(`🔐 All passwords set to: Yatrik@123`);

    // Verify the updates
    console.log('\n🔍 Verifying conductor updates...');
    const updatedConductors = await Conductor.find({}).select('name username email').limit(5);
    console.log('\n📋 Sample Updated Conductors:');
    updatedConductors.forEach((conductor, index) => {
      console.log(`${index + 1}. ${conductor.name} -> ${conductor.email} (${conductor.username})`);
    });

    console.log('\n🎉 Conductor credential update completed successfully!');

  } catch (error) {
    console.error('❌ Error during conductor update:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the update
updateConductorsOnly();



