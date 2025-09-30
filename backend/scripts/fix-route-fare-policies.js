const mongoose = require('mongoose');
const Route = require('../models/Route');
const FarePolicy = require('../models/FarePolicy');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://yatrik:yatrik123@cluster0.3qt2hfg.mongodb.net/yatrik-erp?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Correct bus type mapping to match fare policies
const mapRouteTypeToCorrectBusType = (routeType) => {
  switch (routeType) {
    case 'intercity': return 'City / Ordinary';
    case 'interstate': return 'Luxury / Hi-tech & AC';
    case 'hill_station': return 'Super Fast Passenger';
    case 'seasonal': return 'Fast Passenger / LSFP';
    case 'tourist': return 'A/C Low Floor';
    case 'airport': return 'Garuda Maharaja / Garuda King / Multi-axle Premium';
    default: return 'City / Ordinary';
  }
};

// Get fare from policy using correct bus type
const getFareFromPolicy = async (busType, distance) => {
  try {
    const policy = await FarePolicy.findOne({ busType: busType, isActive: true });
    if (policy) {
      const baseFare = distance * policy.ratePerKm;
      const totalFare = Math.max(baseFare, policy.minimumFare);
      return {
        baseFare: Math.round(totalFare),
        farePerKm: policy.ratePerKm,
        minimumFare: policy.minimumFare
      };
    }
    // Fallback to default calculation
    return {
      baseFare: Math.max(8, Math.floor(distance * 2.5)),
      farePerKm: 2.5,
      minimumFare: 8
    };
  } catch (error) {
    console.error('Error getting fare from policy:', error);
    return {
      baseFare: Math.max(8, Math.floor(distance * 2.5)),
      farePerKm: 2.5,
      minimumFare: 8
    };
  }
};

// Fix existing routes with correct bus types and fare policies
const fixRoutesFarePolicies = async () => {
  try {
    console.log('🔧 Fixing route fare policies...');
    
    // Get all routes
    const routes = await Route.find({ isActive: true });
    console.log(`📊 Found ${routes.length} routes to update`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const route of routes) {
      try {
        // Determine the correct bus type based on route characteristics
        let correctBusType;
        
        // Check if it's an interstate route (longer distances, typically to other states)
        if (route.totalDistance > 200 && (
          route.endingPoint?.city?.toLowerCase().includes('bangalore') ||
          route.endingPoint?.city?.toLowerCase().includes('mysuru') ||
          route.endingPoint?.city?.toLowerCase().includes('mangalore') ||
          route.endingPoint?.city?.toLowerCase().includes('coimbatore') ||
          route.endingPoint?.city?.toLowerCase().includes('kanyakumari')
        )) {
          correctBusType = 'Luxury / Hi-tech & AC'; // Volvo for interstate
        }
        // Check if it's a hill station route
        else if (route.endingPoint?.city?.toLowerCase().includes('munnar') ||
                 route.endingPoint?.city?.toLowerCase().includes('ponmudi') ||
                 route.endingPoint?.city?.toLowerCase().includes('ooty') ||
                 route.endingPoint?.city?.toLowerCase().includes('kumily')) {
          correctBusType = 'Super Fast Passenger'; // Super Fast for hill stations
        }
        // Check if it's an airport route
        else if (route.endingPoint?.city?.toLowerCase().includes('airport') ||
                 route.routeName?.toLowerCase().includes('airport')) {
          correctBusType = 'Garuda Maharaja / Garuda King / Multi-axle Premium'; // Garuda for airport
        }
        // Check if it's a tourist route (short distances to tourist spots)
        else if (route.totalDistance < 50 && (
          route.endingPoint?.city?.toLowerCase().includes('guruvayur') ||
          route.endingPoint?.city?.toLowerCase().includes('kovalam') ||
          route.endingPoint?.city?.toLowerCase().includes('kumarakom') ||
          route.endingPoint?.city?.toLowerCase().includes('sabarimala')
        )) {
          correctBusType = 'A/C Low Floor'; // AC for tourist routes
        }
        // Default to ordinary for intercity routes
        else {
          correctBusType = 'City / Ordinary'; // Ordinary for regular intercity
        }
        
        // Get fare from policy
        const fareData = await getFareFromPolicy(correctBusType, route.totalDistance);
        
        // Update the route
        await Route.findByIdAndUpdate(route._id, {
          busType: correctBusType,
          baseFare: fareData.baseFare,
          farePerKm: fareData.farePerKm
        });
        
        updatedCount++;
        console.log(`✅ Updated route ${route.routeNumber}: ${route.busType} → ${correctBusType}, Base: ₹${fareData.baseFare}, Per KM: ₹${fareData.farePerKm}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating route ${route.routeNumber}:`, error.message);
      }
    }
    
    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} routes`);
    console.log(`❌ Errors: ${errorCount} routes`);
    
  } catch (error) {
    console.error('❌ Error fixing route fare policies:', error);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await fixRoutesFarePolicies();
    console.log('\n✅ Route fare policy fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

