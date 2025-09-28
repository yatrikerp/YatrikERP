const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Depot = require('./models/Depot');
const DepotUser = require('./models/DepotUser');
const User = require('./models/User');

// Comprehensive depot data
const depotData = {
  mainDepots: [
    { code: '45', abbr: 'ALP', name: 'ALAPPUZHA', stdCode: '0477', officeNo: '2251518', stationMasterNo: '2252501' },
    { code: '61', abbr: 'ALY', name: 'ALUVA', stdCode: '0484', officeNo: '2624007', stationMasterNo: '2624242' },
    { code: '33', abbr: 'ATL', name: 'ATTINGAL', stdCode: '0470', officeNo: '2622394', stationMasterNo: '2622202' },
    { code: '44', abbr: 'CHR', name: 'CHANGANASSERY', stdCode: '0481', officeNo: '2421824', stationMasterNo: '2420245' },
    { code: '40', abbr: 'CGR', name: 'CHENGANNUR', stdCode: '0479', officeNo: '2452213', stationMasterNo: '2452352' },
    { code: '46', abbr: 'CTL', name: 'CHERTHALA', stdCode: '0478', officeNo: '2813052', stationMasterNo: '2812582' },
    { code: '56', abbr: 'EKM', name: 'ERNAKULAM', stdCode: '0484', officeNo: '2360531', stationMasterNo: '2372033' },
    { code: '77', abbr: 'KNR', name: 'KANNUR', stdCode: '0497', officeNo: '2705960', stationMasterNo: '2707777' },
    { code: '84', abbr: 'KGD', name: 'KASERGOD', stdCode: '0499', officeNo: '4225677', stationMasterNo: '4230677' },
    { code: '41', abbr: 'KYM', name: 'KAYAMKULAM', stdCode: '0479', officeNo: '2445249', stationMasterNo: '2442022' },
    { code: '34', abbr: 'KLM', name: 'KOLLAM', stdCode: '0474', officeNo: '2751053', stationMasterNo: '2752008' },
    { code: '35', abbr: 'KTR', name: 'KOTTARAKKARA', stdCode: '0474', officeNo: '2452812', stationMasterNo: '2452622' },
    { code: '47', abbr: 'KTM', name: 'KOTTAYAM', stdCode: '0481', officeNo: '2562935', stationMasterNo: '2562908' },
    { code: '72', abbr: 'KKD', name: 'KOZHIKKODE', stdCode: '0495', officeNo: '2390350', stationMasterNo: '2723796' },
    { code: '52', abbr: 'MVP', name: 'MOOVATTUPUZHA', stdCode: '0485', officeNo: '2832626', stationMasterNo: '2832321' },
    { code: '31', abbr: 'NDD', name: 'NEDUMANGAD', stdCode: '0472', officeNo: '2802396', stationMasterNo: '2812235' },
    { code: '22', abbr: 'NTA', name: 'NEYYATINKARA', stdCode: '0471', officeNo: '2222225', stationMasterNo: '2222243' },
    { code: '50', abbr: 'PLA', name: 'PALA', stdCode: '0482', officeNo: '2212711', stationMasterNo: '2212250' },
    { code: '69', abbr: 'PLK', name: 'PALAKKAD', stdCode: '0491', officeNo: '2527298', stationMasterNo: '2520098' },
    { code: '26', abbr: 'PPD', name: 'PAPPANAMCODE', stdCode: '0471', officeNo: '2491609', stationMasterNo: '2494002' },
    { code: '37', abbr: 'PTA', name: 'PATHANAMTHITTA', stdCode: '0468', officeNo: '2229213', stationMasterNo: '2222366' },
    { code: '59', abbr: 'PBR', name: 'PERUMBAVOOR', stdCode: '0484', officeNo: '2523411', stationMasterNo: '2523416' },
    { code: '75', abbr: 'SBY', name: 'SULTHAN BATHERY', stdCode: '0493', officeNo: '6224217', stationMasterNo: '6220217' },
    { code: '43', abbr: 'TVL', name: 'THIRUVALLA', stdCode: '0469', officeNo: '2601345', stationMasterNo: '2602945' },
    { code: '63', abbr: 'TSR', name: 'THRISSUR', stdCode: '0487', officeNo: '2421842', stationMasterNo: '2421150' },
    { code: '27', abbr: 'TVM', name: 'TVM CENTRAL', stdCode: '0471', officeNo: '2323979', stationMasterNo: '2325332' },
    { code: '28', abbr: 'CTY', name: 'TVM CITY', stdCode: '0471', officeNo: '2461013', stationMasterNo: '2575495' },
    { code: '24', abbr: 'VZM', name: 'VIZHINJAM', stdCode: '0471', officeNo: '2480365', stationMasterNo: '2481365' }
  ],
  subDepots: [
    { code: '38', abbr: 'ADR', name: 'ADOOR', stdCode: '0473', phoneNo: '4224767', stationMasterNo: '4224764' },
    { code: '57', abbr: 'ANK', name: 'ANKAMALI', stdCode: '0484', phoneNo: '2622920', stationMasterNo: '2453050' },
    { code: '80', abbr: 'CDM', name: 'CHADAYAMANGALAM', stdCode: '0474', phoneNo: '2476200', stationMasterNo: '2476200' },
    { code: '58', abbr: 'CLD', name: 'CHALAKKUDY', stdCode: '0480', phoneNo: '2701638', stationMasterNo: '2701638' },
    { code: '97', abbr: 'CHT', name: 'CHATHANNUR', stdCode: '0474', phoneNo: '2592900', stationMasterNo: '' },
    { code: '70', abbr: 'CTR', name: 'CHITTOOR', stdCode: '0492', phoneNo: '3227488', stationMasterNo: '3227488' },
    { code: '48', abbr: 'ETP', name: 'ERATTUPETTAH', stdCode: '0482', phoneNo: '2272230', stationMasterNo: '2272230' },
    { code: '66', abbr: 'GVR', name: 'GURUVAYOOR', stdCode: '0487', phoneNo: '2556210', stationMasterNo: '2556450' },
    { code: '42', abbr: 'HPD', name: 'HARIPPAD', stdCode: '0479', phoneNo: '2412820', stationMasterNo: '2412620' },
    { code: '74', abbr: 'KPT', name: 'KALPETTA', stdCode: '0493', phoneNo: '6203040', stationMasterNo: '6202611' },
    { code: '106', abbr: 'KHD', name: 'KANHANGAD', stdCode: '0467', phoneNo: '22107055', stationMasterNo: '2200055' },
    { code: '91', abbr: 'KPM', name: 'KANIYAPURAM', stdCode: '0471', phoneNo: '2752533', stationMasterNo: '' },
    { code: '87', abbr: 'KNP', name: 'KARUNAGAPPALLY', stdCode: '0476', phoneNo: '2620466', stationMasterNo: '2620466' },
    { code: '25', abbr: 'KTD', name: 'KATTAKKADA', stdCode: '0471', phoneNo: '2290381', stationMasterNo: '2290381' },
    { code: '14', abbr: 'KTP', name: 'KATTAPPANA', stdCode: '0486', phoneNo: '8252333', stationMasterNo: '8252333' },
    { code: '30', abbr: 'KMR', name: 'KILIMANOOR', stdCode: '0470', phoneNo: '2672617', stationMasterNo: '2672217' },
    { code: '90', abbr: 'KDR', name: 'KODUNGALLOOR', stdCode: '0480', phoneNo: '2803155', stationMasterNo: '2803155' },
    { code: '55', abbr: 'KMG', name: 'KOTHAMANGALAM', stdCode: '0485', phoneNo: '2862202', stationMasterNo: '2862202' },
    { code: '05', abbr: 'KMY', name: 'KUMALY', stdCode: '0486', phoneNo: '9224242', stationMasterNo: '9224242' },
    { code: '85', abbr: 'MLA', name: 'MALA', stdCode: '0480', phoneNo: '2890438', stationMasterNo: '2890438' },
    { code: '71', abbr: 'MLP', name: 'MALAPPURAM', stdCode: '0483', phoneNo: '2736240', stationMasterNo: '2734950' },
    { code: '76', abbr: 'MND', name: 'MANANTHAVADY', stdCode: '0493', phoneNo: '5240240', stationMasterNo: '5240640' },
    { code: '88', abbr: 'MVK', name: 'MAVELIKKARA', stdCode: '0479', phoneNo: '2302282', stationMasterNo: '2302282' },
    { code: '86', abbr: 'NBR', name: 'NILAMBOOR', stdCode: '04931', phoneNo: '223919', stationMasterNo: '223929' },
    { code: '62', abbr: 'NPR', name: 'NORTH PARAVOOR', stdCode: '0484', phoneNo: '2444439', stationMasterNo: '2442373' },
    { code: '21', abbr: 'PSL', name: 'PARASSALA', stdCode: '0471', phoneNo: '2202058', stationMasterNo: '2202058' },
    { code: '15', abbr: 'PPM', name: 'PATHANAPURAM', stdCode: '0475', phoneNo: '2353769', stationMasterNo: '2354010' },
    { code: '78', abbr: 'PNR', name: 'PAYYANNUR', stdCode: '0498', phoneNo: '5203699', stationMasterNo: '5203062' },
    { code: '68', abbr: 'PMN', name: 'PERINTHALMANNA', stdCode: '0493', phoneNo: '3227422', stationMasterNo: '3227342' },
    { code: '81', abbr: 'PRK', name: 'PEROORKKADA', stdCode: '0471', phoneNo: '2437572', stationMasterNo: '2433683' },
    { code: '83', abbr: 'PVM', name: 'PIRAVOM', stdCode: '0485', phoneNo: '2265533', stationMasterNo: '2265533' },
    { code: '49', abbr: 'PNK', name: 'PONKUNNAM', stdCode: '0482', phoneNo: '8221333', stationMasterNo: '8221333' },
    { code: '67', abbr: 'PNI', name: 'PONNANI', stdCode: '0494', phoneNo: '2666396', stationMasterNo: '2666396' },
    { code: '23', abbr: 'PVR', name: 'POOVAR', stdCode: '0471', phoneNo: '2210047', stationMasterNo: '2210047' },
    { code: '36', abbr: 'PLR', name: 'PUNALUR', stdCode: '0475', phoneNo: '2222636', stationMasterNo: '2222626' },
    { code: '18', abbr: 'TLY', name: 'THALASSERY', stdCode: '0490', phoneNo: '2343333', stationMasterNo: '2343333' },
    { code: '73', abbr: 'TSY', name: 'THAMARASSERY', stdCode: '0495', phoneNo: '2224217', stationMasterNo: '2222217' },
    { code: '53', abbr: 'TDP', name: 'THODUPUZHA', stdCode: '0486', phoneNo: '2222388', stationMasterNo: '2222388' },
    { code: '94', abbr: 'TPM', name: 'THOTTILPALAM', stdCode: '0496', phoneNo: '2565944', stationMasterNo: '2566200' },
    { code: '51', abbr: 'VKM', name: 'VAIKOM', stdCode: '0482', phoneNo: '9231210', stationMasterNo: '9231210' },
    { code: '20', abbr: 'VND', name: 'VELLANAD', stdCode: '0472', phoneNo: '2882986', stationMasterNo: '2884686' },
    { code: '93', abbr: 'VRD', name: 'VELLARADA', stdCode: '0471', phoneNo: '2242029', stationMasterNo: '2242029' },
    { code: '16', abbr: 'VJD', name: 'VENJARAMOODU', stdCode: '0472', phoneNo: '2874242', stationMasterNo: '2874141' },
    { code: '29', abbr: 'VKB', name: 'VIKASBHAVAN', stdCode: '0471', phoneNo: '2307890', stationMasterNo: '2307890' },
    { code: '17', abbr: 'VTR', name: 'VITHURA', stdCode: '0472', phoneNo: '2858686', stationMasterNo: '2858686' }
  ],
  operatingCenters: [
    { code: '19', abbr: 'ARD', name: 'ARYANAD', stdCode: '0472', phoneNo: '2853900', stationMasterNo: '2853900' },
    { code: '06', abbr: 'ARK', name: 'ARYANKAVU', stdCode: '0475', phoneNo: '2211300', stationMasterNo: '2211300' },
    { code: '98', abbr: 'EDT', name: 'EDATHUVA', stdCode: '0477', phoneNo: '2215400', stationMasterNo: '2215400' },
    { code: '95', abbr: 'EMY', name: 'ERUMELY', stdCode: '0482', phoneNo: '8212345', stationMasterNo: '8212345' },
    { code: '89', abbr: 'IJK', name: 'IRINJALAKKUDA', stdCode: '0480', phoneNo: '2823990', stationMasterNo: '2823990' },
    { code: '107', abbr: 'KNI', name: 'KONNI', stdCode: '0468', phoneNo: '', stationMasterNo: '2244555' },
    { code: '108', abbr: 'KKM', name: 'KOOOTHATTUKULAM', stdCode: '0485', phoneNo: '', stationMasterNo: '2253444' },
    { code: '07', abbr: 'KLP', name: 'KULATHUPUZHA', stdCode: '0475', phoneNo: '2318777', stationMasterNo: '2318777' },
    { code: '96', abbr: 'MPY', name: 'MALLAPPALLY', stdCode: '0469', phoneNo: '2785080', stationMasterNo: '2785080' },
    { code: '08', abbr: 'MKD', name: 'MANNARGHAT', stdCode: '0492', phoneNo: '4225150', stationMasterNo: '4225150' },
    { code: '54', abbr: 'MLT', name: 'MOOLAMATTOM', stdCode: '0486', phoneNo: '2252045', stationMasterNo: '2252045' },
    { code: '60', abbr: 'MNR', name: 'MUNNAR', stdCode: '0486', phoneNo: '5230201', stationMasterNo: '5230201' },
    { code: '32', abbr: 'PLD', name: 'PALODE', stdCode: '0472', phoneNo: '2840259', stationMasterNo: '2840259' },
    { code: '39', abbr: 'PDM', name: 'PANDALAM', stdCode: '0473', phoneNo: '4255800', stationMasterNo: '4255800' },
    { code: '65', abbr: 'PDK', name: 'PUTHUKKADU', stdCode: '0480', phoneNo: '2751648', stationMasterNo: '' },
    { code: '101', abbr: 'RNY', name: 'RANNI', stdCode: '04735', phoneNo: '', stationMasterNo: '225253' },
    { code: '79', abbr: 'TDY', name: 'THIRUVAMBADY', stdCode: '0495', phoneNo: '2254500', stationMasterNo: '' },
    { code: '92', abbr: 'VKA', name: 'VADAKARA', stdCode: '0496', phoneNo: '2523377', stationMasterNo: '' },
    { code: '82', abbr: 'VDK', name: 'VADAKKANCHERY', stdCode: '0492', phoneNo: '2255001', stationMasterNo: '' }
  ]
};

// Helper functions
const generateDepotEmail = (depotCode, depotType = 'main') => {
  const prefix = depotType === 'main' ? 'depot' : depotType === 'sub' ? 'subdepot' : 'opcenter';
  return `${depotCode.toLowerCase()}-${prefix}@yatrik.com`;
};

const generateDepotPassword = (depotCode) => {
  return `${depotCode}@Yatrik2024`;
};

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

async function clearExistingData() {
  console.log('🧹 Clearing existing depot data...');
  
  try {
    // Delete all existing depots
    const deletedDepots = await Depot.deleteMany({});
    console.log(`   Deleted ${deletedDepots.deletedCount} existing depots`);
    
    // Delete all existing depot users
    const deletedDepotUsers = await DepotUser.deleteMany({});
    console.log(`   Deleted ${deletedDepotUsers.deletedCount} existing depot users`);
    
    // Delete regular users with depot_manager role
    const deletedUsers = await User.deleteMany({ role: 'depot_manager' });
    console.log(`   Deleted ${deletedUsers.deletedCount} existing depot manager users`);
    
    console.log('✅ Existing data cleared successfully\n');
  } catch (error) {
    console.error('❌ Error clearing existing data:', error);
    throw error;
  }
}

async function createDepotsBatch(depots, depotType, adminUserId) {
  const depotDocs = [];
  const depotUserDocs = [];
  
  for (const depotInfo of depots) {
    const email = generateDepotEmail(depotInfo.abbr, depotType);
    const password = generateDepotPassword(depotInfo.abbr);
    const username = `${depotInfo.abbr.toLowerCase()}-${depotType}`;

    // Create depot document
    const depotDoc = {
      depotCode: depotInfo.abbr,
      depotName: depotInfo.name,
      location: {
        address: `${depotInfo.name} Bus Station`,
        city: depotInfo.name,
        state: 'Kerala',
        pincode: '680000'
      },
      contact: {
        phone: depotInfo.phoneNo || depotInfo.officeNo || '0000000000',
        email: email,
        manager: { name: `${depotInfo.name} Manager` }
      },
      capacity: {
        totalBuses: depotType === 'main' ? 50 : depotType === 'sub' ? 30 : 15,
        availableBuses: depotType === 'main' ? 40 : depotType === 'sub' ? 25 : 12,
        maintenanceBuses: 0
      },
      operatingHours: {
        openTime: '06:00',
        closeTime: '22:00',
        workingDays: ['monday','tuesday','wednesday','thursday','friday','saturday']
      },
      facilities: depotType === 'main' ? 
        ['Fuel_Station', 'Maintenance_Bay', 'Parking_Lot', 'Admin_Office'] :
        depotType === 'sub' ? 
        ['Parking_Lot', 'Admin_Office'] : 
        ['Parking_Lot'],
      status: 'active',
      isActive: true,
      createdBy: adminUserId
    };
    
    depotDocs.push(depotDoc);
  }

  // Insert all depots at once
  const savedDepots = await Depot.insertMany(depotDocs);
  console.log(`✅ Created ${savedDepots.length} ${depotType} depots`);

  // Create depot users for each depot
  for (let i = 0; i < savedDepots.length; i++) {
    const depot = savedDepots[i];
    const depotInfo = depots[i];
    const email = generateDepotEmail(depotInfo.abbr, depotType);
    const password = generateDepotPassword(depotInfo.abbr);
    const username = `${depotInfo.abbr.toLowerCase()}-${depotType}`;

    const depotUserDoc = {
      username: username,
      email: email,
      password: password,
      role: 'depot_manager',
      depotId: depot._id,
      depotCode: depotInfo.abbr,
      depotName: depotInfo.name,
      permissions: ['view_depot_info','view_buses','manage_buses','view_routes','view_schedules','view_reports'],
      status: 'active'
    };
    
    depotUserDocs.push(depotUserDoc);
  }

  // Insert all depot users at once
  const savedDepotUsers = await DepotUser.insertMany(depotUserDocs);
  console.log(`✅ Created ${savedDepotUsers.length} ${depotType} depot users`);

  return { depots: savedDepots, users: savedDepotUsers };
}

async function setupComprehensiveDepots() {
  console.log('🚀 Setting up comprehensive depot system (FAST MODE)...\n');
  
  await connectToDatabase();
  await clearExistingData();

  // Get or create admin user for createdBy field
  let adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    console.log('⚠️  No admin user found, creating one...');
    adminUser = new User({
      name: 'System Admin',
      email: 'admin@yatrik.com',
      password: 'Admin@123',
      role: 'admin',
      status: 'active'
    });
    await adminUser.save();
    console.log('✅ Created admin user');
  }

  const credentials = [];

  // Create Main Depots (batch)
  console.log('📋 Creating Main Depots (27)...');
  const mainResult = await createDepotsBatch(depotData.mainDepots, 'main', adminUser._id);
  depotData.mainDepots.forEach((depot, index) => {
    credentials.push({
      type: 'Main Depot',
      name: depot.name,
      code: depot.abbr,
      email: generateDepotEmail(depot.abbr, 'main'),
      password: generateDepotPassword(depot.abbr)
    });
  });

  // Create Sub Depots (batch)
  console.log('\n📋 Creating Sub Depots (45)...');
  const subResult = await createDepotsBatch(depotData.subDepots, 'sub', adminUser._id);
  depotData.subDepots.forEach((depot, index) => {
    credentials.push({
      type: 'Sub Depot',
      name: depot.name,
      code: depot.abbr,
      email: generateDepotEmail(depot.abbr, 'sub'),
      password: generateDepotPassword(depot.abbr)
    });
  });

  // Create Operating Centers (batch)
  console.log('\n📋 Creating Operating Centers (19)...');
  const operatingResult = await createDepotsBatch(depotData.operatingCenters, 'operating', adminUser._id);
  depotData.operatingCenters.forEach((depot, index) => {
    credentials.push({
      type: 'Operating Center',
      name: depot.name,
      code: depot.abbr,
      email: generateDepotEmail(depot.abbr, 'operating'),
      password: generateDepotPassword(depot.abbr)
    });
  });

  // Summary
  console.log('\n📊 DEPOT SETUP SUMMARY:');
  console.log('=====================================');
  console.log(`Main Depots:     ${mainResult.depots.length} created`);
  console.log(`Sub Depots:      ${subResult.depots.length} created`);
  console.log(`Operating Centers: ${operatingResult.depots.length} created`);
  console.log(`Total:           ${mainResult.depots.length + subResult.depots.length + operatingResult.depots.length} depots created`);

  // Sample credentials
  console.log('\n🔐 SAMPLE DEPOT MANAGER CREDENTIALS:');
  console.log('=====================================');
  console.log('Main Depot: TVM CENTRAL');
  console.log('  Email: tvm-depot@yatrik.com');
  console.log('  Password: TVM@Yatrik2024');
  console.log('');
  console.log('Sub Depot: KATTAPPANA');
  console.log('  Email: ktp-subdepot@yatrik.com');
  console.log('  Password: KTP@Yatrik2024');
  console.log('');
  console.log('Operating Center: ARYANAD');
  console.log('  Email: ard-opcenter@yatrik.com');
  console.log('  Password: ARD@Yatrik2024');

  console.log('\n✅ Comprehensive depot setup completed!');
  console.log('💡 You can now test login with any of the credentials above');
  console.log('🌐 Login URL: http://localhost:5173/depot-login');
  console.log('🎯 Depot Management URL: http://localhost:5173/admin/depot-management');

  await mongoose.disconnect();
  console.log('🔌 Disconnected from database');
}

// Run the setup
setupComprehensiveDepots().catch(console.error);
