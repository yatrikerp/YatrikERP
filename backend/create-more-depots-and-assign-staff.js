const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/User');
const Depot = require('./models/Depot');

async function createMoreDepotsAndAssignStaff() {
  try {
    console.log('🚀 Creating more depots and assigning staff...');
    
    // Get all existing users (drivers and conductors)
    const allStaff = await User.find({ 
      role: { $in: ['driver', 'conductor'] },
      status: 'active'
    });
    
    console.log(`👥 Found ${allStaff.length} active staff members`);
    
    // Get all existing depots
    const existingDepots = await Depot.find({});
    console.log(`🏢 Found ${existingDepots.length} existing depots`);
    
    // Create new depots if we don't have enough
    const newDepots = [
      {
        depotCode: 'TVM',
        depotName: 'Thiruvananthapuram Central',
        location: {
          address: 'Thiruvananthapuram Central Bus Station',
          city: 'Thiruvananthapuram',
          state: 'Kerala',
          pincode: '695001'
        },
        contact: {
          phone: '04712345678',
          email: 'tvm@yatrik.com',
          manager: { name: 'Rajesh Kumar' }
        },
        capacity: {
          totalBuses: 30,
          availableBuses: 30,
          maintenanceBuses: 0
        },
        operatingHours: {
          openTime: '05:00',
          closeTime: '23:00'
        },
        createdBy: '507f1f77bcf86cd799439011', // Default admin ID
        status: 'active'
      },
      {
        depotCode: 'KOZ',
        depotName: 'Kozhikode Central',
        location: {
          address: 'Kozhikode Central Bus Station',
          city: 'Kozhikode',
          state: 'Kerala',
          pincode: '673001'
        },
        contact: {
          phone: '04952345678',
          email: 'koz@yatrik.com',
          manager: { name: 'Priya Sharma' }
        },
        capacity: {
          totalBuses: 25,
          availableBuses: 25,
          maintenanceBuses: 0
        },
        operatingHours: {
          openTime: '05:00',
          closeTime: '23:00'
        },
        createdBy: '507f1f77bcf86cd799439011',
        status: 'active'
      },
      {
        depotCode: 'TCR',
        depotName: 'Thrissur Central',
        location: {
          address: 'Thrissur Central Bus Station',
          city: 'Thrissur',
          state: 'Kerala',
          pincode: '680001'
        },
        contact: {
          phone: '04872345678',
          email: 'tcr@yatrik.com',
          manager: { name: 'Suresh Patel' }
        },
        capacity: {
          totalBuses: 20,
          availableBuses: 20,
          maintenanceBuses: 0
        },
        operatingHours: {
          openTime: '05:00',
          closeTime: '23:00'
        },
        createdBy: '507f1f77bcf86cd799439011',
        status: 'active'
      },
      {
        depotCode: 'ALP',
        depotName: 'Alappuzha Central',
        location: {
          address: 'Alappuzha Central Bus Station',
          city: 'Alappuzha',
          state: 'Kerala',
          pincode: '688001'
        },
        contact: {
          phone: '04772345678',
          email: 'alp@yatrik.com',
          manager: { name: 'Sunita Devi' }
        },
        capacity: {
          totalBuses: 18,
          availableBuses: 18,
          maintenanceBuses: 0
        },
        operatingHours: {
          openTime: '05:00',
          closeTime: '23:00'
        },
        createdBy: '507f1f77bcf86cd799439011',
        status: 'active'
      },
      {
        depotCode: 'IDK',
        depotName: 'Idukki Central',
        location: {
          address: 'Idukki Central Bus Station',
          city: 'Idukki',
          state: 'Kerala',
          pincode: '685601'
        },
        contact: {
          phone: '04862234567',
          email: 'idk@yatrik.com',
          manager: { name: 'Amit Singh' }
        },
        capacity: {
          totalBuses: 15,
          availableBuses: 15,
          maintenanceBuses: 0
        },
        operatingHours: {
          openTime: '05:00',
          closeTime: '23:00'
        },
        createdBy: '507f1f77bcf86cd799439011',
        status: 'active'
      }
    ];
    
    // Create new depots
    const createdDepots = [];
    for (const depotData of newDepots) {
      const existingDepot = await Depot.findOne({ depotCode: depotData.depotCode });
      if (!existingDepot) {
        const depot = new Depot(depotData);
        await depot.save();
        createdDepots.push(depot);
        console.log(`✅ Created depot: ${depot.depotName}`);
      } else {
        createdDepots.push(existingDepot);
        console.log(`⚠️ Depot already exists: ${depotData.depotName}`);
      }
    }
    
    // Get all depots (existing + newly created)
    const allDepots = await Depot.find({ status: 'active' });
    console.log(`\n🏢 Total active depots: ${allDepots.length}`);
    
    // Distribute staff evenly across all depots
    const staffPerDepot = Math.floor(allStaff.length / allDepots.length);
    const remainingStaff = allStaff.length % allDepots.length;
    
    console.log(`📊 Distributing ${allStaff.length} staff across ${allDepots.length} depots`);
    console.log(`📊 ${staffPerDepot} staff per depot, ${remainingStaff} extra staff`);
    
    let staffIndex = 0;
    
    for (let i = 0; i < allDepots.length; i++) {
      const depot = allDepots[i];
      const staffCount = staffPerDepot + (i < remainingStaff ? 1 : 0);
      
      // Get staff for this depot
      const depotStaff = allStaff.slice(staffIndex, staffIndex + staffCount);
      staffIndex += staffCount;
      
      // Assign staff to depot
      for (const staff of depotStaff) {
        await User.findByIdAndUpdate(staff._id, { depotId: depot._id });
      }
      
      console.log(`✅ Assigned ${depotStaff.length} staff to ${depot.depotName}:`);
      depotStaff.forEach(staff => {
        console.log(`   - ${staff.name} (${staff.role})`);
      });
    }
    
    // Verify assignments
    console.log('\n🔍 Verification - Final depot assignments:');
    for (const depot of allDepots) {
      const depotStaff = await User.find({ 
        depotId: depot._id,
        role: { $in: ['driver', 'conductor'] }
      });
      console.log(`🏢 ${depot.depotName}: ${depotStaff.length} staff`);
      depotStaff.forEach(staff => {
        console.log(`   - ${staff.name} (${staff.role})`);
      });
    }
    
    console.log('\n✅ Successfully created depots and assigned staff!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

createMoreDepotsAndAssignStaff();
