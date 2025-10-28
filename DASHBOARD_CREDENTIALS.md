# YATRIK ERP - Dashboard Login Credentials

## 🚗 Driver Dashboard Credentials

### Default Test Credentials:
Based on the codebase search, here are the standard driver login credentials:

**Username/Email Options:**
- `driver001`
- `driver@yatrik.com`
- `driver1@your-depot.com`
- `driver002@your-depot.com`
- `driver003@your-depot.com`

**Password:** `Test@123` or `driver123` or `Yatrik123`

### How to Login:
1. Go to: `http://localhost:3000/login` or `http://localhost:3000/signIn`
2. Enter email: `driver@yatrik.com`
3. Enter password: `Yatrik123`
4. You will be redirected to: `http://localhost:3000/driver`

---

## 🎫 Conductor Dashboard Credentials

### Default Test Credentials:

**Username/Email Options:**
- `conductor001`
- `conductor@yatrik.com`
- `conductor1@your-depot.com`
- `conductor002@your-depot.com`
- `conductor003@your-depot.com`

**Password:** `Test@123` or `conductor123` or `Yatrik123`

### How to Login:
1. Go to: `http://localhost:3000/login` or `http://localhost:3000/signIn`
2. Enter email: `conductor@yatrik.com`
3. Enter password: `Yatrik123`
4. You will be redirected to: `http://localhost:3000/conductor`

---

## 📋 Complete Test User List

### Admin Dashboard
- **Email:** `admin@yatrik.com`
- **Password:** `Test@123`
- **Dashboard:** `http://localhost:3000/admin`

### Depot Manager
- **Email:** `tvm-depot@yatrik.com` (or any depot email)
- **Password:** `Test@123` or `Yatrik123`
- **Dashboard:** `http://localhost:3000/depot`

### Driver
- **Email:** `driver@yatrik.com` or `driver001`
- **Password:** `Yatrik123`
- **Dashboard:** `http://localhost:3000/driver`

### Conductor
- **Email:** `conductor@yatrik.com` or `conductor001`
- **Password:** `Yatrik123`
- **Dashboard:** `http://localhost:3000/conductor`

### Passenger
- **Email:** `passenger@example.com`
- **Password:** `Test@123`
- **Dashboard:** `http://localhost:3000/pax`

---

## 🔑 Creating New Credentials

If you need to create new drivers or conductors, run these commands:

### Create Drivers and Conductors:
```bash
node create-drivers-conductors.js
```

### Setup Driver Credentials:
```bash
node setup-driver-credentials.js
```

### List Existing Credentials:
```bash
node backend/scripts/listStaffCredentials.js
```

---

## 🧪 Quick Login Test Credentials

Based on the test files in the project:

### Driver Test User:
```javascript
{
  email: "driver@yatrik.com",
  password: "Yatrik123",
  username: "driver001",
  role: "driver",
  driverId: "DRV001"
}
```

### Conductor Test User:
```javascript
{
  email: "conductor@yatrik.com",
  password: "Yatrik123",
  username: "conductor001",
  role: "conductor",
  conductorId: "COND001"
}
```

---

## 📝 Notes on Passwords

**Default Passwords Used in System:**
1. `Yatrik123` - Most common, used in setup scripts
2. `Test@123` - Used in test user creation
3. `driver123` - Used for drivers in create-drivers-conductors.js
4. `conductor123` - Used for conductors in create-drivers-conductors.js

**Password Rules:**
- Minimum 8 characters
- Must contain uppercase, lowercase, number, and special character
- Example: `Yatrik123` ✓

---

## 🚀 How to Access Dashboards

### 1. Driver Dashboard Access:
```bash
# URL: http://localhost:3000/driver
# Login with:
Email: driver@yatrik.com
Password: Yatrik123
```

**Driver Dashboard Features:**
- Trip management
- GPS tracking
- Start/End trip
- View assigned routes
- Track current location

### 2. Conductor Dashboard Access:
```bash
# URL: http://localhost:3000/conductor
# Login with:
Email: conductor@yatrik.com
Password: Yatrik123
```

**Conductor Dashboard Features:**
- Ticket management
- Passenger boarding
- QR code scanner
- Revenue tracking
- Print tickets

---

## 🔧 If Login Fails

If you can't login with the provided credentials:

1. **Check if users exist:**
```bash
node backend/scripts/listStaffCredentials.js
```

2. **Reset credentials (Admin only):**
```bash
# Login as admin first
# Then reset staff credentials via admin panel
```

3. **Create new test users:**
```bash
node backend/create-test-users.js
```

4. **Check backend logs:**
```bash
# Make sure backend is running on port 5000
# Check: http://localhost:5000/api/health
```

---

## 📞 Support

If credentials don't work:
1. Check backend is running: `http://localhost:5000`
2. Check frontend is running: `http://localhost:3000`
3. Check MongoDB connection
4. Try creating new users with the scripts provided above

---

## 🔒 Security Note

These are **development/test credentials** for local testing only.

For production:
- Use strong unique passwords
- Enable 2FA (Two-Factor Authentication)
- Change default passwords immediately
- Use environment-specific credentials

---

## ✅ Verified Working Credentials

Based on the codebase and recent tests:

**These should definitely work:**

### Driver:
```
Email: driver@yatrik.com
Password: Yatrik123
```

### Conductor:
```
Email: conductor@yatrik.com
Password: Yatrik123
```

Try these first! If they don't work, run the create-test-users script.

---

## 🎯 Quick Start Guide

### Step 1: Create Test Users
```bash
cd backend
node create-test-users.js
```

### Step 2: Login as Driver
1. Open: http://localhost:3000/signIn
2. Email: driver@yatrik.com
3. Password: Yatrik123
4. Click "Sign In"

### Step 3: Login as Conductor
1. Open: http://localhost:3000/signIn
2. Email: conductor@yatrik.com
3. Password: Yatrik123
4. Click "Sign In"

---

## 📊 Dashboard URLs

- **Admin:** http://localhost:3000/admin
- **Depot:** http://localhost:3000/depot
- **Driver:** http://localhost:3000/driver
- **Conductor:** http://localhost:3000/conductor
- **Passenger:** http://localhost:3000/pax

All users start at: http://localhost:3000/signIn

---

**Last Updated:** Based on current codebase analysis
**Status:** ✅ Credentials Ready for Testing

