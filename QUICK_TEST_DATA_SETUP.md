# 🚌 Quick Test Data Setup for Passenger Booking

## 🎯 Purpose
Before passengers can book tickets, you need routes, buses, and trips in your system.

---

## Method 1: Using Admin Dashboard (Recommended)

### Step 1: Create Admin User

**Quick MongoDB Insert:**

1. Go to **MongoDB Atlas** → Your Cluster → **Browse Collections**
2. Select database: `yatrik` or `yatrik-erp`
3. Select collection: `users`
4. Click **"Insert Document"**
5. Paste this:

```json
{
  "name": "Admin User",
  "email": "admin@yatrik.com",
  "phone": "9000000000",
  "password": "$2a$10$5Z9qF5Z9qF5Z9qF5Z9qF5e.K.K.K.K.K.K.K.K.K.K.K.K.K.K.K",
  "role": "admin",
  "status": "active",
  "isActive": true,
  "authProvider": "local",
  "emailVerified": true,
  "phoneVerified": true,
  "wallet": {
    "balance": 0,
    "transactions": []
  }
}
```

**Login:** admin@yatrik.com / admin123

---

### Step 2: Login as Admin

1. Go to your Vercel URL
2. Click **"Login"**
3. Enter admin credentials
4. You should see **Admin Dashboard**

---

### Step 3: Create a Depot

1. In Admin Dashboard, go to **"Depot Management"**
2. Click **"Add New Depot"**
3. Fill in:
   ```
   Depot Name: Central Depot
   Depot Code: CD001
   Location: City Center
   Contact: 9876543210
   Email: depot@yatrik.com
   ```
4. Click **"Save"**

---

### Step 4: Add a Bus

1. Go to **"Fleet Management"** or **"Bus Management"**
2. Click **"Add New Bus"**
3. Fill in:
   ```
   Registration Number: KL-01-AB-1234
   Bus Type: AC Seater
   Total Seats: 40
   Depot: Central Depot (select from dropdown)
   Status: Available
   ```
4. **Configure Seat Layout:**
   - Rows: 10
   - Seats per row: 4
   - Total: 40 seats
5. Click **"Save"**

---

### Step 5: Create Stops

1. Go to **"Stop Management"**
2. Create **Origin Stop**:
   ```
   Stop Name: Mumbai Central
   Stop Code: MUM-01
   Address: Mumbai Central Station
   ```
3. Create **Destination Stop**:
   ```
   Stop Name: Pune Station
   Stop Code: PUNE-01
   Address: Pune Railway Station
   ```

---

### Step 6: Create a Route

1. Go to **"Route Management"**
2. Click **"Add New Route"**
3. Fill in:
   ```
   Route Number: R001
   Route Name: Mumbai - Pune Express
   Category: Express
   Status: Active
   ```
4. **Add Stops:**
   - Stop 1: Mumbai Central (sequence: 1, distance: 0 km)
   - Stop 2: Pune Station (sequence: 2, distance: 150 km)
5. Click **"Save Route"**

---

### Step 7: Schedule a Trip

1. Go to **"Trip Management"** or **"Trip Scheduling"**
2. Click **"Add New Trip"** or **"Schedule Trip"**
3. Fill in:
   ```
   Route: R001 - Mumbai - Pune Express
   Bus: KL-01-AB-1234
   Departure Date: Today or Tomorrow
   Departure Time: 09:00 AM
   Arrival Time: 12:00 PM
   Base Fare: ₹500
   Status: Scheduled
   ```
4. Click **"Schedule Trip"**

---

## Method 2: Quick API Insert (Advanced)

If you're comfortable with API calls, use this:

### Create Sample Data via API

Use Postman or curl to create data via your backend API:

**Base URL:** `https://yatrik-erp-production-075e.up.railway.app`

1. **Login as Admin** (get token)
2. **Create Depot** → POST `/api/admin/depots`
3. **Create Bus** → POST `/api/admin/buses`
4. **Create Stops** → POST `/api/admin/stops`
5. **Create Route** → POST `/api/admin/routes`
6. **Create Trip** → POST `/api/admin/trips`

---

## Method 3: Use Sample Data Script

Create this file in your backend: `backend/scripts/create-sample-booking-data.js`

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Depot = require('../models/Depot');
const Bus = require('../models/Bus');
const Stop = require('../models/Stop');
const Route = require('../models/Route');
const RouteStop = require('../models/RouteStop');
const Trip = require('../models/Trip');

async function createSampleData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Create Admin User
    let admin = await User.findOne({ email: 'admin@yatrik.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Admin User',
        email: 'admin@yatrik.com',
        phone: '9000000000',
        password: 'admin123',
        role: 'admin',
        status: 'active',
        isActive: true,
        authProvider: 'local',
        emailVerified: true
      });
      console.log('✅ Admin created');
    }

    // 2. Create Passenger User
    let passenger = await User.findOne({ email: 'passenger@test.com' });
    if (!passenger) {
      passenger = await User.create({
        name: 'Test Passenger',
        email: 'passenger@test.com',
        phone: '9876543210',
        password: 'passenger123',
        role: 'passenger',
        status: 'active',
        isActive: true,
        authProvider: 'local',
        emailVerified: true,
        wallet: { balance: 5000 }
      });
      console.log('✅ Passenger created');
    }

    // 3. Create Depot
    let depot = await Depot.findOne({ depotCode: 'CD001' });
    if (!depot) {
      depot = await Depot.create({
        name: 'Central Depot',
        depotCode: 'CD001',
        location: {
          address: 'City Center',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        contactNumber: '9876543210',
        email: 'depot@yatrik.com',
        status: 'active'
      });
      console.log('✅ Depot created');
    }

    // 4. Create Bus
    let bus = await Bus.findOne({ registrationNumber: 'KL-01-AB-1234' });
    if (!bus) {
      bus = await Bus.create({
        registrationNumber: 'KL-01-AB-1234',
        busType: 'AC Seater',
        totalSeats: 40,
        availableSeats: 40,
        depotId: depot._id,
        seatLayout: {
          rows: 10,
          seatsPerRow: 4,
          totalSeats: 40
        },
        status: 'available'
      });
      console.log('✅ Bus created');
    }

    // 5. Create Stops
    let stop1 = await Stop.findOne({ stopCode: 'MUM-01' });
    if (!stop1) {
      stop1 = await Stop.create({
        stopName: 'Mumbai Central',
        stopCode: 'MUM-01',
        address: 'Mumbai Central Station',
        city: 'Mumbai',
        state: 'Maharashtra',
        coordinates: {
          latitude: 18.9688,
          longitude: 72.8205
        }
      });
      console.log('✅ Stop 1 created');
    }

    let stop2 = await Stop.findOne({ stopCode: 'PUNE-01' });
    if (!stop2) {
      stop2 = await Stop.create({
        stopName: 'Pune Station',
        stopCode: 'PUNE-01',
        address: 'Pune Railway Station',
        city: 'Pune',
        state: 'Maharashtra',
        coordinates: {
          latitude: 18.5204,
          longitude: 73.8567
        }
      });
      console.log('✅ Stop 2 created');
    }

    // 6. Create Route
    let route = await Route.findOne({ routeNumber: 'R001' });
    if (!route) {
      route = await Route.create({
        routeNumber: 'R001',
        routeName: 'Mumbai - Pune Express',
        sourceCity: 'Mumbai',
        destinationCity: 'Pune',
        category: 'Express',
        distance: 150,
        duration: 180, // 3 hours in minutes
        status: 'active'
      });
      console.log('✅ Route created');

      // Create Route Stops
      await RouteStop.create({
        routeId: route._id,
        stopId: stop1._id,
        sequence: 1,
        distanceFromStart: 0,
        durationFromStart: 0
      });

      await RouteStop.create({
        routeId: route._id,
        stopId: stop2._id,
        sequence: 2,
        distanceFromStart: 150,
        durationFromStart: 180
      });
      console.log('✅ Route stops created');
    }

    // 7. Create Trip for Today
    const today = new Date();
    const departureTime = new Date(today);
    departureTime.setHours(9, 0, 0, 0); // 9:00 AM
    
    const arrivalTime = new Date(departureTime);
    arrivalTime.setHours(12, 0, 0, 0); // 12:00 PM

    let trip = await Trip.findOne({ 
      routeId: route._id, 
      departureTime: departureTime 
    });
    
    if (!trip) {
      trip = await Trip.create({
        routeId: route._id,
        busId: bus._id,
        depotId: depot._id,
        departureTime: departureTime,
        arrivalTime: arrivalTime,
        baseFare: 500,
        availableSeats: 40,
        status: 'scheduled',
        boardingPoints: [
          {
            stopId: stop1._id,
            time: departureTime,
            sequence: 1
          }
        ],
        droppingPoints: [
          {
            stopId: stop2._id,
            time: arrivalTime,
            sequence: 2
          }
        ]
      });
      console.log('✅ Trip created for today at 9:00 AM');
    }

    console.log('\n🎉 Sample data created successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Admin: admin@yatrik.com / admin123');
    console.log('Passenger: passenger@test.com / passenger123');
    console.log('\n🎫 Available Trip:');
    console.log('Route: Mumbai → Pune');
    console.log('Time: 9:00 AM - 12:00 PM');
    console.log('Fare: ₹500');
    console.log('Available Seats: 40');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createSampleData();
```

**Run it:**
```bash
cd backend
node scripts/create-sample-booking-data.js
```

---

## ✅ After Data Setup

You should have:
- ✅ 1 Admin user
- ✅ 1 Passenger user
- ✅ 1 Depot
- ✅ 1 Bus (40 seats)
- ✅ 2 Stops (Mumbai, Pune)
- ✅ 1 Route (Mumbai - Pune)
- ✅ 1 Trip scheduled for today

---

## 🎫 Now You Can Book!

**Login Credentials:**
```
Passenger Login:
Email: passenger@test.com
Password: passenger123
```

**Search for:**
```
From: Mumbai Central
To: Pune Station
Date: Today
```

You should see the trip and be able to book! 🚀

