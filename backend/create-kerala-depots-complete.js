const mongoose = require('mongoose');
const Depot = require('./models/Depot');
const DepotUser = require('./models/DepotUser');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Kerala Depots Data
const keralaDemoData = {
  mainDepots: [
    { code: 'ALP', name: 'ALAPPUZHA', stdCode: '0477', phone: '2251518', stationMaster: '2252501' },
    { code: 'ALY', name: 'ALUVA', stdCode: '0484', phone: '2624007', stationMaster: '2624242' },
    { code: 'ATL', name: 'ATTINGAL', stdCode: '0470', phone: '2622394', stationMaster: '2622202' },
    { code: 'CHR', name: 'CHANGANASSERY', stdCode: '0481', phone: '2421824', stationMaster: '2420245' },
    { code: 'CGR', name: 'CHENGANNUR', stdCode: '0479', phone: '2452213', stationMaster: '2452352' },
    { code: 'CTL', name: 'CHERTHALA', stdCode: '0478', phone: '2813052', stationMaster: '2812582' },
    { code: 'EKM', name: 'ERNAKULAM', stdCode: '0484', phone: '2360531', stationMaster: '2372033' },
    { code: 'KNR', name: 'KANNUR', stdCode: '0497', phone: '2705960', stationMaster: '2707777' },
    { code: 'KGD', name: 'KASERGOD', stdCode: '0499', phone: '4225677', stationMaster: '4230677' },
    { code: 'KYM', name: 'KAYAMKULAM', stdCode: '0479', phone: '2445249', stationMaster: '2442022' },
    { code: 'KLM', name: 'KOLLAM', stdCode: '0474', phone: '2751053', stationMaster: '2752008' },
    { code: 'KTR', name: 'KOTTARAKKARA', stdCode: '0474', phone: '2452812', stationMaster: '2452622' },
    { code: 'KTM', name: 'KOTTAYAM', stdCode: '0481', phone: '2562935', stationMaster: '2562908' },
    { code: 'KKD', name: 'KOZHIKKODE', stdCode: '0495', phone: '2390350', stationMaster: '2723796' },
    { code: 'MVP', name: 'MOOVATTUPUZHA', stdCode: '0485', phone: '2832626', stationMaster: '2832321' },
    { code: 'NDD', name: 'NEDUMANGAD', stdCode: '0472', phone: '2802396', stationMaster: '2812235' },
    { code: 'NTA', name: 'NEYYATINKARA', stdCode: '0471', phone: '2222225', stationMaster: '2222243' },
    { code: 'PLA', name: 'PALA', stdCode: '0482', phone: '2212711', stationMaster: '2212250' },
    { code: 'PLK', name: 'PALAKKAD', stdCode: '0491', phone: '2527298', stationMaster: '2520098' },
    { code: 'PPD', name: 'PAPPANAMCODE', stdCode: '0471', phone: '2491609', stationMaster: '2494002' },
    { code: 'PTA', name: 'PATHANAMTHITTA', stdCode: '0468', phone: '2229213', stationMaster: '2222366' },
    { code: 'PBR', name: 'PERUMBAVOOR', stdCode: '0484', phone: '2523411', stationMaster: '2523416' },
    { code: 'SBY', name: 'SULTHAN BATHERY', stdCode: '0493', phone: '6224217', stationMaster: '6220217' },
    { code: 'TVL', name: 'THIRUVALLA', stdCode: '0469', phone: '2601345', stationMaster: '2602945' },
    { code: 'TSR', name: 'THRISSUR', stdCode: '0487', phone: '2421842', stationMaster: '2421150' },
    { code: 'TVM', name: 'TVM CENTRAL', stdCode: '0471', phone: '2323979', stationMaster: '2325332' },
    { code: 'CTY', name: 'TVM CITY', stdCode: '0471', phone: '2461013', stationMaster: '2575495' },
    { code: 'VZM', name: 'VIZHINJAM', stdCode: '0471', phone: '2480365', stationMaster: '2481365' }
  ],
  
  subDepots: [
    { code: 'ADR', name: 'ADOOR', stdCode: '0473', phone: '4224767', stationMaster: '4224764' },
    { code: 'ANK', name: 'ANKAMALI', stdCode: '0484', phone: '2622920', stationMaster: '2453050' },
    { code: 'CDM', name: 'CHADAYAMANGALAM', stdCode: '0474', phone: '2476200', stationMaster: '2476200' },
    { code: 'CLD', name: 'CHALAKKUDY', stdCode: '0480', phone: '2701638', stationMaster: '2701638' },
    { code: 'CHT', name: 'CHATHANNUR', stdCode: '0474', phone: '2592900', stationMaster: '2592900' },
    { code: 'CTR', name: 'CHITTOOR', stdCode: '0492', phone: '3227488', stationMaster: '3227488' },
    { code: 'ETP', name: 'ERATTUPETTAH', stdCode: '0482', phone: '2272230', stationMaster: '2272230' },
    { code: 'GVR', name: 'GURUVAYOOR', stdCode: '0487', phone: '2556210', stationMaster: '2556450' },
    { code: 'HPD', name: 'HARIPPAD', stdCode: '0479', phone: '2412820', stationMaster: '2412620' },
    { code: 'KPT', name: 'KALPETTA', stdCode: '0493', phone: '6203040', stationMaster: '6202611' },
    { code: 'KHD', name: 'KANHANGAD', stdCode: '0467', phone: '22107055', stationMaster: '2200055' },
    { code: 'KPM', name: 'KANIYAPURAM', stdCode: '0471', phone: '2752533', stationMaster: '2752533' },
    { code: 'KNP', name: 'KARUNAGAPPALLY', stdCode: '0476', phone: '2620466', stationMaster: '2620466' },
    { code: 'KTD', name: 'KATTAKKADA', stdCode: '0471', phone: '2290381', stationMaster: '2290381' },
    { code: 'KTP', name: 'KATTAPPANA', stdCode: '0486', phone: '8252333', stationMaster: '8252333' },
    { code: 'KMR', name: 'KILIMANOOR', stdCode: '0470', phone: '2672617', stationMaster: '2672217' },
    { code: 'KDR', name: 'KODUNGALLOOR', stdCode: '0480', phone: '2803155', stationMaster: '2803155' },
    { code: 'KMG', name: 'KOTHAMANGALAM', stdCode: '0485', phone: '2862202', stationMaster: '2862202' },
    { code: 'KMY', name: 'KUMALY', stdCode: '0486', phone: '9224242', stationMaster: '9224242' },
    { code: 'MLA', name: 'MALA', stdCode: '0480', phone: '2890438', stationMaster: '2890438' },
    { code: 'MLP', name: 'MALAPPURAM', stdCode: '0483', phone: '2736240', stationMaster: '2734950' },
    { code: 'MND', name: 'MANANTHAVADY', stdCode: '0493', phone: '5240240', stationMaster: '5240640' },
    { code: 'MVK', name: 'MAVELIKKARA', stdCode: '0479', phone: '2302282', stationMaster: '2302282' },
    { code: 'NBR', name: 'NILAMBOOR', stdCode: '04931', phone: '223919', stationMaster: '223929' },
    { code: 'NPR', name: 'NORTH PARAVOOR', stdCode: '0484', phone: '2444439', stationMaster: '2442373' },
    { code: 'PSL', name: 'PARASSALA', stdCode: '0471', phone: '2202058', stationMaster: '2202058' },
    { code: 'PPM', name: 'PATHANAPURAM', stdCode: '0475', phone: '2353769', stationMaster: '2354010' },
    { code: 'PNR', name: 'PAYYANNUR', stdCode: '0498', phone: '5203699', stationMaster: '5203062' },
    { code: 'PMN', name: 'PERINTHALMANNA', stdCode: '0493', phone: '3227422', stationMaster: '3227342' },
    { code: 'PRK', name: 'PEROORKKADA', stdCode: '0471', phone: '2437572', stationMaster: '2433683' },
    { code: 'PVM', name: 'PIRAVOM', stdCode: '0485', phone: '2265533', stationMaster: '2265533' },
    { code: 'PNK', name: 'PONKUNNAM', stdCode: '0482', phone: '8221333', stationMaster: '8221333' },
    { code: 'PNI', name: 'PONNANI', stdCode: '0494', phone: '2666396', stationMaster: '2666396' },
    { code: 'PVR', name: 'POOVAR', stdCode: '0471', phone: '2210047', stationMaster: '2210047' },
    { code: 'PLR', name: 'PUNALUR', stdCode: '0475', phone: '2222636', stationMaster: '2222626' },
    { code: 'TLY', name: 'THALASSERY', stdCode: '0490', phone: '2343333', stationMaster: '2343333' },
    { code: 'TSY', name: 'THAMARASSERY', stdCode: '0495', phone: '2224217', stationMaster: '2222217' },
    { code: 'TDP', name: 'THODUPUZHA', stdCode: '0486', phone: '2222388', stationMaster: '2222388' },
    { code: 'TPM', name: 'THOTTILPALAM', stdCode: '0496', phone: '2565944', stationMaster: '2566200' },
    { code: 'VKM', name: 'VAIKOM', stdCode: '0482', phone: '9231210', stationMaster: '9231210' },
    { code: 'VND', name: 'VELLANAD', stdCode: '0472', phone: '2882986', stationMaster: '2884686' },
    { code: 'VRD', name: 'VELLARADA', stdCode: '0471', phone: '2242029', stationMaster: '2242029' },
    { code: 'VJD', name: 'VENJARAMOODU', stdCode: '0472', phone: '2874242', stationMaster: '2874141' },
    { code: 'VKB', name: 'VIKASBHAVAN', stdCode: '0471', phone: '2307890', stationMaster: '2307890' },
    { code: 'VTR', name: 'VITHURA', stdCode: '0472', phone: '2858686', stationMaster: '2858686' }
  ],
  
  operatingCenters: [
    { code: 'ARD', name: 'ARYANAD', stdCode: '0472', phone: '2853900', stationMaster: '2853900' },
    { code: 'ARK', name: 'ARYANKAVU', stdCode: '0475', phone: '2211300', stationMaster: '2211300' },
    { code: 'EDT', name: 'EDATHUVA', stdCode: '0477', phone: '2215400', stationMaster: '2215400' },
    { code: 'EMY', name: 'ERUMELY', stdCode: '0482', phone: '8212345', stationMaster: '8212345' },
    { code: 'IJK', name: 'IRINJALAKKUDA', stdCode: '0480', phone: '2823990', stationMaster: '2823990' },
    { code: 'KNI', name: 'KONNI', stdCode: '0468', phone: '2244555', stationMaster: '2244555' },
    { code: 'KKM', name: 'KOOOTHATTUKULAM', stdCode: '0485', phone: '2253444', stationMaster: '2253444' },
    { code: 'KLP', name: 'KULATHUPUZHA', stdCode: '0475', phone: '2318777', stationMaster: '2318777' },
    { code: 'MPY', name: 'MALLAPPALLY', stdCode: '0469', phone: '2785080', stationMaster: '2785080' },
    { code: 'MKD', name: 'MANNARGHAT', stdCode: '0492', phone: '4225150', stationMaster: '4225150' },
    { code: 'MLT', name: 'MOOLAMATTOM', stdCode: '0486', phone: '2252045', stationMaster: '2252045' },
    { code: 'MNR', name: 'MUNNAR', stdCode: '0486', phone: '5230201', stationMaster: '5230201' },
    { code: 'PLD', name: 'PALODE', stdCode: '0472', phone: '2840259', stationMaster: '2840259' },
    { code: 'PDM', name: 'PANDALAM', stdCode: '0473', phone: '4255800', stationMaster: '4255800' },
    { code: 'PDK', name: 'PUTHUKKADU', stdCode: '0480', phone: '2751648', stationMaster: '2751648' },
    { code: 'RNY', name: 'RANNI', stdCode: '04735', phone: '225253', stationMaster: '225253' },
    { code: 'TDY', name: 'THIRUVAMBADY', stdCode: '0495', phone: '2254500', stationMaster: '2254500' },
    { code: 'VKA', name: 'VADAKARA', stdCode: '0496', phone: '2523377', stationMaster: '2523377' },
    { code: 'VDK', name: 'VADAKKANCHERY', stdCode: '0492', phone: '2255001', stationMaster: '2255001' }
  ]
};

// Helper functions
function generateDepotEmail(code, category) {
  const suffix = category === 'main' ? 'depot' : category === 'sub' ? 'subdepot' : 'opcenter';
  return `${code.toLowerCase()}-${suffix}@yatrik.com`;
}

function generateDepotPassword(code) {
  return `${code}@2024`;
}

function getRandomCapacity(category) {
  switch (category) {
    case 'main':
      return {
        totalBuses: Math.floor(Math.random() * 30) + 40, // 40-70 buses
        availableBuses: 0,
        maintenanceBuses: 0
      };
    case 'sub':
      return {
        totalBuses: Math.floor(Math.random() * 20) + 20, // 20-40 buses
        availableBuses: 0,
        maintenanceBuses: 0
      };
    case 'operating':
      return {
        totalBuses: Math.floor(Math.random() * 15) + 10, // 10-25 buses
        availableBuses: 0,
        maintenanceBuses: 0
      };
  }
}

function getFacilitiesByCategory(category) {
  const allFacilities = [
    'Fuel_Station', 'Maintenance_Bay', 'Washing_Bay', 'Parking_Lot',
    'Driver_Rest_Room', 'Canteen', 'Security_Office', 'Admin_Office',
    'Training_Room', 'Spare_Parts_Store'
  ];
  
  switch (category) {
    case 'main':
      return allFacilities.slice(0, 7); // Most facilities
    case 'sub':
      return ['Parking_Lot', 'Driver_Rest_Room', 'Admin_Office', 'Security_Office'];
    case 'operating':
      return ['Parking_Lot', 'Driver_Rest_Room'];
  }
}

async function createDepotWithUser(depotData, category, adminUserId) {
  try {
    const capacity = getRandomCapacity(category);
    capacity.availableBuses = Math.floor(capacity.totalBuses * 0.8); // 80% available
    capacity.maintenanceBuses = capacity.totalBuses - capacity.availableBuses;

    // Create depot
    const depot = new Depot({
      depotCode: depotData.code,
      depotName: depotData.name,
      category: category,
      abbreviation: depotData.code,
      stdCode: depotData.stdCode,
      officePhone: depotData.phone,
      stationMasterPhone: depotData.stationMaster,
      location: {
        address: `${depotData.name} Bus Station`,
        city: depotData.name,
        state: 'Kerala',
        pincode: '680000'
      },
      contact: {
        phone: `${depotData.stdCode}${depotData.phone}`,
        email: generateDepotEmail(depotData.code, category),
        manager: {
          name: `${depotData.name} Manager`,
          phone: `${depotData.stdCode}${depotData.stationMaster}`,
          email: generateDepotEmail(depotData.code, category)
        }
      },
      capacity: capacity,
      operatingHours: {
        openTime: '06:00',
        closeTime: '22:00',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      },
      facilities: getFacilitiesByCategory(category),
      status: 'active',
      createdBy: adminUserId,
      isActive: true
    });

    await depot.save();

    // Create depot manager user using DepotUser model
    const hashedPassword = await bcrypt.hash(generateDepotPassword(depotData.code), 10);
    
    const depotUser = new DepotUser({
      username: `${depotData.code.toLowerCase()}-manager`,
      email: generateDepotEmail(depotData.code, category),
      password: hashedPassword,
      depotId: depot._id,
      depotCode: depotData.code,
      depotName: depotData.name,
      role: 'depot_manager',
      status: 'active',
      permissions: [
        'manage_buses',
        'view_buses',
        'manage_routes',
        'view_routes',
        'manage_schedules',
        'view_schedules',
        'view_reports',
        'view_depot_info'
      ]
    });

    await depotUser.save();

    return {
      depot: depot,
      user: depotUser,
      credentials: {
        username: `${depotData.code.toLowerCase()}-manager`,
        email: generateDepotEmail(depotData.code, category),
        password: generateDepotPassword(depotData.code)
      }
    };
  } catch (error) {
    console.error(`Error creating depot ${depotData.code}:`, error.message);
    return null;
  }
}

async function createAllKeralaDepots() {
  try {
    console.log('🚀 Creating Kerala Depots with Complete CRUD Operations...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }
    console.log(`👤 Using admin user: ${adminUser.name} (${adminUser.email})`);

    const results = {
      main: { success: 0, failed: 0, credentials: [] },
      sub: { success: 0, failed: 0, credentials: [] },
      operating: { success: 0, failed: 0, credentials: [] }
    };

    // Create Main Depots
    console.log('\n🏢 Creating Main Depots...');
    for (const depotData of keralaDemoData.mainDepots) {
      const result = await createDepotWithUser(depotData, 'main', adminUser._id);
      if (result) {
        results.main.success++;
        results.main.credentials.push({
          code: depotData.code,
          name: depotData.name,
          ...result.credentials
        });
        console.log(`✅ Created main depot: ${depotData.code} - ${depotData.name}`);
      } else {
        results.main.failed++;
        console.log(`❌ Failed to create main depot: ${depotData.code} - ${depotData.name}`);
      }
      
      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Create Sub Depots
    console.log('\n🏪 Creating Sub Depots...');
    for (const depotData of keralaDemoData.subDepots) {
      const result = await createDepotWithUser(depotData, 'sub', adminUser._id);
      if (result) {
        results.sub.success++;
        results.sub.credentials.push({
          code: depotData.code,
          name: depotData.name,
          ...result.credentials
        });
        console.log(`✅ Created sub depot: ${depotData.code} - ${depotData.name}`);
      } else {
        results.sub.failed++;
        console.log(`❌ Failed to create sub depot: ${depotData.code} - ${depotData.name}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Create Operating Centers
    console.log('\n🚀 Creating Operating Centers...');
    for (const depotData of keralaDemoData.operatingCenters) {
      const result = await createDepotWithUser(depotData, 'operating', adminUser._id);
      if (result) {
        results.operating.success++;
        results.operating.credentials.push({
          code: depotData.code,
          name: depotData.name,
          ...result.credentials
        });
        console.log(`✅ Created operating center: ${depotData.code} - ${depotData.name}`);
      } else {
        results.operating.failed++;
        console.log(`❌ Failed to create operating center: ${depotData.code} - ${depotData.name}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    console.log('\n📊 CREATION SUMMARY:');
    console.log(`🏢 Main Depots: ${results.main.success} created, ${results.main.failed} failed`);
    console.log(`🏪 Sub Depots: ${results.sub.success} created, ${results.sub.failed} failed`);
    console.log(`🚀 Operating Centers: ${results.operating.success} created, ${results.operating.failed} failed`);
    
    const totalSuccess = results.main.success + results.sub.success + results.operating.success;
    const totalFailed = results.main.failed + results.sub.failed + results.operating.failed;
    
    console.log(`\n🎯 TOTAL: ${totalSuccess} depots created successfully, ${totalFailed} failed`);

    // Display credentials
    console.log('\n🔑 DEPOT MANAGER CREDENTIALS:');
    console.log('\n🏢 MAIN DEPOTS:');
    results.main.credentials.forEach(cred => {
      console.log(`   ${cred.code} - ${cred.name}`);
      console.log(`   👤 Username: ${cred.username}`);
      console.log(`   📧 Email: ${cred.email}`);
      console.log(`   🔒 Password: ${cred.password}`);
      console.log(`   🌐 Dashboard: http://localhost:5173/depot/dashboard`);
      console.log('');
    });

    console.log('\n🏪 SUB DEPOTS:');
    results.sub.credentials.forEach(cred => {
      console.log(`   ${cred.code} - ${cred.name}`);
      console.log(`   👤 Username: ${cred.username}`);
      console.log(`   📧 Email: ${cred.email}`);
      console.log(`   🔒 Password: ${cred.password}`);
      console.log(`   🌐 Dashboard: http://localhost:5173/depot/dashboard`);
      console.log('');
    });

    console.log('\n🚀 OPERATING CENTERS:');
    results.operating.credentials.forEach(cred => {
      console.log(`   ${cred.code} - ${cred.name}`);
      console.log(`   👤 Username: ${cred.username}`);
      console.log(`   📧 Email: ${cred.email}`);
      console.log(`   🔒 Password: ${cred.password}`);
      console.log(`   🌐 Dashboard: http://localhost:5173/depot/dashboard`);
      console.log('');
    });

    console.log('\n✨ All depots created with automated credentials!');
    console.log('🔗 Admin Dashboard: http://localhost:5173/admin/depot-management');
    console.log('🎯 You can now test filtering by category in the admin dashboard!');

  } catch (error) {
    console.error('❌ Error creating Kerala depots:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createAllKeralaDepots();
