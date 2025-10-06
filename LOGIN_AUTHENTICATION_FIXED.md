# YATRIK ERP - Login Authentication System Fixed

## Overview
The login authentication system has been updated to properly handle all user roles and redirect them to their respective dashboards.

## User Roles and Dashboard Redirections

1. **Admin**
   - Role: `admin`
   - Dashboard: `/admin`
   - Login: Email-based through `/api/auth/login`

2. **Depot Manager**
   - Role: `depot_manager`
   - Dashboard: `/depot`
   - Login Methods:
     - Depot-specific email pattern: `{code}-depot@yatrik.com` or `depot-{code}@yatrik.com`
     - Through `/api/depot-auth/login` or unified `/api/auth/login`

3. **Conductor**
   - Role: `conductor`
   - Dashboard: `/conductor`
   - Login Methods:
     - Username-based through `/api/conductor/login`
     - Unified login through `/api/auth/login` with username

4. **Driver**
   - Role: `driver`
   - Dashboard: `/driver`
   - Login Methods:
     - Username-based through `/api/driver/login`
     - Unified login through `/api/auth/login` with username

5. **Passenger**
   - Role: `passenger`
   - Dashboard: `/pax` (desktop) or `/mobile/passenger` (mobile)
   - Login: Email-based through `/api/auth/login`

## Authentication Flow

### Backend Changes

1. **Unified Login Endpoint** (`/api/auth/login`)
   - Now accepts both `email` and `username` parameters
   - Automatically detects user type based on identifier:
     - Depot email pattern → Depot user
     - Username (not email) → Check Conductor, then Driver
     - Regular email → Regular user (Admin/Passenger)
   - Returns `redirectPath` in response for frontend routing

2. **Individual Role Endpoints**
   - `/api/depot-auth/login` - Depot-specific login
   - `/api/conductor/login` - Conductor-specific login
   - `/api/driver/login` - Driver-specific login
   - All endpoints now return `redirectPath` in response

### Frontend Changes

1. **Auth.js Component**
   - Automatically determines which backend endpoint to use
   - Stores `redirectPath` from backend response
   - Uses backend-provided path for navigation

2. **RedirectDashboard Component**
   - Handles all user roles properly
   - Mobile detection for passenger users
   - Proper fallback handling

3. **AuthContext**
   - Detects depot users automatically
   - Handles role normalization
   - Manages location tracking for drivers

## Testing the Implementation

### Test Users Creation Script

Create a file `create-test-users.js`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./backend/models/User');
const DepotUser = require('./backend/models/DepotUser');
const Conductor = require('./backend/models/Conductor');
const Driver = require('./backend/models/Driver');
const Depot = require('./backend/models/Depot');

require('dotenv').config();

async function createTestUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    
    // Create a test depot first
    const depot = await Depot.findOneAndUpdate(
      { depotCode: 'TVM001' },
      {
        depotName: 'Trivandrum Central Depot',
        depotCode: 'TVM001',
        location: {
          address: 'Central Bus Station, Trivandrum',
          coordinates: {
            latitude: 8.5241,
            longitude: 76.9366
          }
        },
        status: 'active'
      },
      { upsert: true, new: true }
    );

    console.log('Created depot:', depot.depotCode);

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('Test@123', 10);

    // 1. Create Admin User
    const admin = await User.findOneAndUpdate(
      { email: 'admin@yatrik.com' },
      {
        name: 'Admin User',
        email: 'admin@yatrik.com',
        phone: '+919876543210',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        emailVerified: true
      },
      { upsert: true, new: true }
    );
    console.log('Created admin:', admin.email);

    // 2. Create Depot Manager
    const depotManager = await DepotUser.findOneAndUpdate(
      { email: 'tvm-depot@yatrik.com' },
      {
        username: 'tvm-depot',
        email: 'tvm-depot@yatrik.com',
        password: hashedPassword,
        role: 'depot_manager',
        depotId: depot._id,
        depotCode: depot.depotCode,
        depotName: depot.depotName,
        permissions: ['manage_buses', 'manage_routes', 'manage_schedules', 'manage_staff'],
        status: 'active'
      },
      { upsert: true, new: true }
    );
    console.log('Created depot manager:', depotManager.email);

    // 3. Create Conductor
    const conductor = await Conductor.findOneAndUpdate(
      { username: 'conductor001' },
      {
        conductorId: 'COND001',
        name: 'Test Conductor',
        username: 'conductor001',
        password: hashedPassword,
        email: 'conductor@yatrik.com',
        phone: '+919876543211',
        employeeCode: 'EMP-COND-001',
        depotId: depot._id,
        status: 'active'
      },
      { upsert: true, new: true }
    );
    console.log('Created conductor:', conductor.username);

    // 4. Create Driver
    const driver = await Driver.findOneAndUpdate(
      { username: 'driver001' },
      {
        driverId: 'DRV001',
        name: 'Test Driver',
        username: 'driver001',
        password: hashedPassword,
        email: 'driver@yatrik.com',
        phone: '+919876543212',
        employeeCode: 'EMP-DRV-001',
        depotId: depot._id,
        drivingLicense: {
          licenseNumber: 'KL-2023-0123456789',
          licenseType: 'HMV',
          expiryDate: new Date('2025-12-31'),
          status: 'valid'
        },
        status: 'active'
      },
      { upsert: true, new: true }
    );
    console.log('Created driver:', driver.username);

    // 5. Create Passenger
    const passenger = await User.findOneAndUpdate(
      { email: 'passenger@example.com' },
      {
        name: 'Test Passenger',
        email: 'passenger@example.com',
        phone: '+919876543213',
        password: hashedPassword,
        role: 'passenger',
        status: 'active',
        emailVerified: true
      },
      { upsert: true, new: true }
    );
    console.log('Created passenger:', passenger.email);

    console.log('\n✅ All test users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('==================');
    console.log('Admin: admin@yatrik.com / Test@123');
    console.log('Depot: tvm-depot@yatrik.com / Test@123');
    console.log('Conductor: conductor001 / Test@123');
    console.log('Driver: driver001 / Test@123');
    console.log('Passenger: passenger@example.com / Test@123');

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await mongoose.connection.close();
  }
}

createTestUsers();
```

### Run Test User Creation

```bash
node create-test-users.js
```

## Testing Each Role

### 1. Test Admin Login
- Navigate to `/login`
- Enter: `admin@yatrik.com` / `Test@123`
- Should redirect to `/admin`

### 2. Test Depot Manager Login
- Navigate to `/depot-login` or `/login`
- Enter: `tvm-depot@yatrik.com` / `Test@123`
- Should redirect to `/depot`

### 3. Test Conductor Login
- Navigate to `/login`
- Enter: `conductor001` / `Test@123`
- Should redirect to `/conductor`

### 4. Test Driver Login
- Navigate to `/login`
- Enter: `driver001` / `Test@123`
- Should redirect to `/driver`

### 5. Test Passenger Login
- Navigate to `/login`
- Enter: `passenger@example.com` / `Test@123`
- Should redirect to `/pax` (desktop) or `/mobile/passenger` (mobile)

## Key Features

1. **Unified Login**: The main `/api/auth/login` endpoint can handle all user types
2. **Auto-detection**: System automatically detects user type based on identifier format
3. **Role-based Routing**: Each role is automatically redirected to their specific dashboard
4. **Mobile Support**: Passengers on mobile devices are redirected to mobile-optimized views
5. **Backward Compatibility**: Individual role endpoints still work for legacy integrations

## Security Considerations

1. All passwords are hashed using bcrypt
2. JWT tokens include role information for authorization
3. Failed login attempts are tracked and accounts can be locked
4. Depot users have specific permissions that are validated

## Troubleshooting

If a user is not redirected properly:

1. Check the browser console for role detection logs
2. Verify the user's role in the database
3. Clear browser cache and localStorage
4. Check if the user's status is 'active'

## Future Enhancements

1. Single Sign-On (SSO) integration
2. Two-factor authentication
3. Role-based access control (RBAC) refinements
4. Session management improvements
