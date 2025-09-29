const mongoose = require('mongoose');
const Depot = require('./models/Depot');
require('dotenv').config();

async function removeAllDepots() {
    try {
        console.log('🗑️  Removing all depots from database...\n');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
        console.log('✅ Connected to MongoDB');

        // Get count before deletion
        const totalDepots = await Depot.countDocuments();
        console.log(`📊 Found ${totalDepots} depots in database`);

        if (totalDepots === 0) {
            console.log('ℹ️  No depots found to delete');
            return;
        }

        // Show some depot details before deletion
        const sampleDepots = await Depot.find({}).limit(5).select('depotCode depotName category');
        console.log('\n📋 Sample depots to be deleted:');
        sampleDepots.forEach(depot => {
            console.log(`   • ${depot.depotCode} - ${depot.depotName} (${depot.category || 'main'})`);
        });

        if (totalDepots > 5) {
            console.log(`   ... and ${totalDepots - 5} more depots`);
        }

        // Delete all depots
        const deleteResult = await Depot.deleteMany({});
        
        console.log('\n🗑️  Deletion Results:');
        console.log(`✅ Successfully deleted ${deleteResult.deletedCount} depots`);
        
        // Verify deletion
        const remainingCount = await Depot.countDocuments();
        console.log(`🔍 Remaining depots: ${remainingCount}`);

        if (remainingCount === 0) {
            console.log('\n🎉 All depots have been successfully removed!');
            console.log('📱 The admin dashboard will now show 0 depots in all categories');
        } else {
            console.log('\n⚠️  Warning: Some depots may still remain in the database');
        }

    } catch (error) {
        console.error('❌ Error removing depots:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        console.log('\n💡 You can now refresh the admin dashboard to see the changes');
    }
}

// Confirm before deletion
console.log('⚠️  WARNING: This will permanently delete ALL depots from the database!');
console.log('🔄 Starting depot removal process...\n');

removeAllDepots();
