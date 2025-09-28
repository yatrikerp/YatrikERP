const mongoose = require('mongoose');
const FareCalculationService = require('../services/fareCalculationService');
require('dotenv').config();

async function initializeFarePolicies() {
  try {
    console.log('🚀 Starting fare policies initialization...');
    
    // Connect to MongoDB
    const connectionUri = process.env.MONGODB_URI;
    if (!connectionUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(connectionUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Initialize default fare policies
    const result = await FareCalculationService.createDefaultFarePolicies();
    
    if (result.success) {
      console.log('✅ Default fare policies created successfully');
      console.log('📊 Fare policies initialized for all KSRTC bus types');
    } else {
      console.error('❌ Failed to create fare policies:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error initializing fare policies:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the initialization
initializeFarePolicies();
