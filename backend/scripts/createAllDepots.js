/* Creates a comprehensive set of depots across major cities.
   Usage: node backend/scripts/createAllDepots.js
*/

const mongoose = require('mongoose');
const Depot = require('../models/Depot');
require('dotenv').config();

async function connect() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp';
  await mongoose.connect(uri, {
    autoIndex: true,
  });
}

function makeDepot({ code, name, city, state, pincode, lat, lng, phone, email, manager }) {
  return {
    depotCode: code,
    depotName: name,
    location: {
      address: `${name} Depot`,
      city,
      state,
      pincode,
      coordinates: { latitude: lat, longitude: lng }
    },
    contact: {
      phone,
      email,
      manager: {
        name: manager || `${city} Manager`,
        phone,
        email
      }
    },
    capacity: {
      totalBuses: 80,
      availableBuses: 70,
      maintenanceBuses: 10
    },
    operatingHours: {
      openTime: '05:00',
      closeTime: '23:00',
      workingDays: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
    },
    facilities: ['Fuel_Station','Maintenance_Bay','Washing_Bay','Parking_Lot','Driver_Rest_Room','Canteen','Security_Office','Admin_Office'],
    status: 'active',
    isActive: true
  };
}

async function upsertDepot(doc) {
  await Depot.findOneAndUpdate(
    { depotCode: doc.depotCode },
    { $set: doc },
    { upsert: true, new: true }
  );
}

async function main() {
  await connect();
  console.log('Connected to MongoDB');

  const depots = [
    // South & West
    { code: 'KL-COK-001', name: 'Kochi Central', city: 'Kochi', state: 'Kerala', pincode: '682016', lat: 9.9312, lng: 76.2673, phone: '+91-484-222-0001', email: 'kochi@yatrik.com' },
    { code: 'KL-TVM-001', name: 'Trivandrum City', city: 'Trivandrum', state: 'Kerala', pincode: '695001', lat: 8.5241, lng: 76.9366, phone: '+91-471-233-0002', email: 'trivandrum@yatrik.com' },
    { code: 'MH-MUM-001', name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra', pincode: '400008', lat: 19.0760, lng: 72.8777, phone: '+91-22-2307-0000', email: 'mumbai@yatrik.com' },
    { code: 'MH-PUN-001', name: 'Pune Shivajinagar', city: 'Pune', state: 'Maharashtra', pincode: '411005', lat: 18.5204, lng: 73.8567, phone: '+91-20-2553-0003', email: 'pune@yatrik.com' },
    { code: 'GA-PNJ-001', name: 'Panaji Hub', city: 'Panaji', state: 'Goa', pincode: '403001', lat: 15.4909, lng: 73.8278, phone: '+91-832-222-0004', email: 'goa@yatrik.com' },
    { code: 'KA-BLR-001', name: 'Bengaluru Majestic', city: 'Bengaluru', state: 'Karnataka', pincode: '560009', lat: 12.9716, lng: 77.5946, phone: '+91-80-2235-0005', email: 'bengaluru@yatrik.com' },
    { code: 'TN-MAA-001', name: 'Chennai CMBT', city: 'Chennai', state: 'Tamil Nadu', pincode: '600107', lat: 13.0827, lng: 80.2707, phone: '+91-44-2479-0006', email: 'chennai@yatrik.com' },
    // North & East
    { code: 'DL-DEL-001', name: 'Delhi Kashmiri Gate', city: 'Delhi', state: 'Delhi', pincode: '110006', lat: 28.7041, lng: 77.1025, phone: '+91-11-2386-0007', email: 'delhi@yatrik.com' },
    { code: 'WB-CCU-001', name: 'Kolkata Esplanade', city: 'Kolkata', state: 'West Bengal', pincode: '700001', lat: 22.5726, lng: 88.3639, phone: '+91-33-2225-0008', email: 'kolkata@yatrik.com' },
    { code: 'GJ-AMD-001', name: 'Ahmedabad Gita Mandir', city: 'Ahmedabad', state: 'Gujarat', pincode: '380022', lat: 23.0225, lng: 72.5714, phone: '+91-79-2535-0009', email: 'ahmedabad@yatrik.com' },
    { code: 'TS-HYD-001', name: 'Hyderabad MGBS', city: 'Hyderabad', state: 'Telangana', pincode: '500095', lat: 17.3850, lng: 78.4867, phone: '+91-40-2461-0010', email: 'hyderabad@yatrik.com' }
  ].map(makeDepot);

  for (const d of depots) {
    await upsertDepot(d);
    console.log(`Upserted depot: ${d.depotCode} - ${d.depotName}`);
  }

  console.log(`\nTotal depots ensured: ${depots.length}`);
  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error('Error creating depots:', err);
  process.exit(1);
});


