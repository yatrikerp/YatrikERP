require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');
const Depot = require('./models/Depot');

// Get MongoDB URI from environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://yatrikerp:Yatrik123@cluster0.3qt2hfg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Malayali names pools
const maleFirstNames = [
  'Rajesh', 'Ravi', 'Suresh', 'Mohan', 'Vijay', 'Kumar', 'Saju', 'Babu', 'Sunil', 'Prasad',
  'Raj', 'Gopal', 'Krishnan', 'Sankar', 'Rajan', 'Deepu', 'Pradeep', 'Ajay', 'Naveen', 'Vinod'
];

const femaleFirstNames = [
  'Anita', 'Deepa', 'Saritha', 'Latha', 'Meera', 'Suma', 'Remya', 'Priya', 'Jisha', 'Reena',
  'Divya', 'Kavya', 'Leela', 'Swathi', 'Indira', 'Geetha', 'Sushma', 'Neethu', 'Anju', 'Shiny'
];

const lastNames = [
  'Kumar', 'Nair', 'Narayanan', 'Menon', 'Pillai', 'Krishnan', 'Unni', 'Krishnankutty', 
  'Das', 'Sharma', 'Varma', 'Shenoy', 'Kurup', 'Nambiar', 'Prabhakaran', 'Reddy', 'Namboothiri'
];

function generateKeralaName(isMale = null) {
  const gender = isMale === null ? Math.random() > 0.5 : isMale;
  const firstName = gender 
    ? maleFirstNames[Math.floor(Math.random() * maleFirstNames.length)]
    : femaleFirstNames[Math.floor(Math.random() * femaleFirstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

function generateKeralaPhone() {
  const digits = [9, 8, 7, 6];
  const firstDigit = digits[Math.floor(Math.random() * digits.length)];
  const rest = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  return `${firstDigit}${rest}`;
}

function generateEmail(name, employeeCode) {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.');
  return `${cleanName}.${employeeCode.toLowerCase()}@yatrik.com`;
}

function generateEmployeeCode(depotCode, index, isDriver) {
  const prefix = depotCode.substring(0, 3).toUpperCase();
  const rolePrefix = isDriver ? 'DRV' : 'CON';
  return `${prefix}-${rolePrefix}-${String(index + 1).padStart(3, '0')}`;
}

async function assignStaffToDepots() {
  try {
    console.log('🚀 Starting staff assignment for all depots...\n');
    
    console.log('📡 Connecting to MongoDB...');
    console.log('Using MongoDB URI:', MONGODB_URI ? 'Found' : 'Not found');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    const depots = await Depot.find({ status: 'active' });
    console.log(`📋 Found ${depots.length} active depots\n`);

    if (depots.length === 0) {
      console.log('❌ No active depots found');
      await mongoose.disconnect();
      process.exit(0);
    }

    let totalDriversCreated = 0;
    let totalConductorsCreated = 0;

    for (const depot of depots) {
      console.log(`\n📦 Processing Depot: ${depot.depotName} (${depot.depotCode})`);
      
      // Check existing staff
      const existingDrivers = await Driver.countDocuments({ depotId: depot._id });
      const existingConductors = await Conductor.countDocuments({ depotId: depot._id });
      
      console.log(`   Current: ${existingDrivers} drivers, ${existingConductors} conductors`);
      
      const neededDrivers = Math.max(0, 20 - existingDrivers);
      const neededConductors = Math.max(0, 20 - existingConductors);
      
      console.log(`   Needed: ${neededDrivers} drivers, ${neededConductors} conductors`);
      
      // Create drivers
      if (neededDrivers > 0) {
        const newDrivers = [];
        for (let i = 0; i < neededDrivers; i++) {
          const name = generateKeralaName(true);
          const phone = generateKeralaPhone();
          const employeeCode = generateEmployeeCode(depot.depotCode, existingDrivers + i, true);
          const email = generateEmail(name, employeeCode);
          const password = 'TempPass@123';
          
          newDrivers.push({
            name,
            email,
            phone,
            employeeCode,
            password,
            depotId: depot._id,
            status: 'active',
            drivingLicense: {
              licenseNumber: `KL${Math.floor(Math.random() * 10000000)}`,
              expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 5) // 5 years
            },
            address: `${depot.depotName} Area`,
            emergencyContact: {
              name: `${name.split(' ')[0]} Family`,
              phone: generateKeralaPhone(),
              relationship: 'Family'
            },
            salary: 30000 + Math.floor(Math.random() * 10000),
            joiningDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
          });
        }
        
        await Driver.insertMany(newDrivers);
        totalDriversCreated += newDrivers.length;
        console.log(`   ✅ Created ${newDrivers.length} drivers`);
      }
      
      // Create conductors
      if (neededConductors > 0) {
        const newConductors = [];
        for (let i = 0; i < neededConductors; i++) {
          const name = generateKeralaName(false);
          const phone = generateKeralaPhone();
          const employeeCode = generateEmployeeCode(depot.depotCode, existingConductors + i, false);
          const email = generateEmail(name, employeeCode);
          const password = 'TempPass@123';
          
          newConductors.push({
            name,
            email,
            phone,
            employeeCode,
            password,
            depotId: depot._id,
            status: 'active',
            address: `${depot.depotName} Area`,
            emergencyContact: {
              name: `${name.split(' ')[0]} Family`,
              phone: generateKeralaPhone(),
              relationship: 'Family'
            },
            salary: 25000 + Math.floor(Math.random() * 10000),
            joiningDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
          });
        }
        
        await Conductor.insertMany(newConductors);
        totalConductorsCreated += newConductors.length;
        console.log(`   ✅ Created ${newConductors.length} conductors`);
      }
      
      // Final count
      const finalDrivers = await Driver.countDocuments({ depotId: depot._id });
      const finalConductors = await Conductor.countDocuments({ depotId: depot._id });
      console.log(`   📊 Final: ${finalDrivers} drivers, ${finalConductors} conductors`);
    }

    console.log(`\n✅ Staff assignment completed!`);
    console.log(`   Total drivers created: ${totalDriversCreated}`);
    console.log(`   Total conductors created: ${totalConductorsCreated}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err.stack);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

assignStaffToDepots();

