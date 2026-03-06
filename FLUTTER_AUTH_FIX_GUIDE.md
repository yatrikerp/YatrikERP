# Flutter Authentication Fix Guide

## Problem
The Flutter app is getting a 401 authentication error when trying to fetch passenger data after login:
```
I/flutter: ✅ Status: 401
I/flutter: 🔒 401 Error: Authentication failed. Please contact system administrator.
```

## Root Cause
The passenger user doesn't exist in the database, or the token is not being properly validated by the backend.

## Solution

### Step 1: Create Test Passenger User

Run this script to create/verify the test passenger user:

```bash
cd backend
node create-test-passenger.js
```

This will:
- Check if `passenger@example.com` exists
- Create it if it doesn't exist
- Update the password to `password123`
- Set status to `active`

### Step 2: Verify Backend is Running

Make sure your backend server is running:

```bash
cd backend
npm start
# or
node server.js
```

### Step 3: Test Login from Flutter App

1. Stop the Flutter app if running
2. Clear app data (optional but recommended):
   ```bash
   flutter clean
   flutter pub get
   ```
3. Run the app again:
   ```bash
   flutter run
   ```
4. Login with:
   - Email: `passenger@example.com`
   - Password: `password123`

### Step 4: Check Logs

Watch the Flutter logs for:
```
🔐 Attempting login for: passenger@example.com
📥 Login response: true
✅ Login successful, saving token...
👤 User role: passenger
🔍 Token verification: Token saved successfully
```

And backend logs for:
```
[AUTH] Token verified successfully
[AUTH] User authenticated
```

## What Was Fixed

### 1. Dashboard Tab Error Handling
Updated `flutter/lib/screens/passenger/tabs/dashboard_tab.dart`:
- Added try-catch for tickets API call
- Detects 401 errors and logs out automatically
- Falls back to default routes if API fails
- Continues loading even if one API fails

### 2. API Service Token Clearing
Updated `flutter/lib/services/api_service.dart`:
- Automatically clears token on 401 errors
- Better error messages

### 3. Test Passenger Creation
Created `backend/create-test-passenger.js`:
- Creates test passenger if doesn't exist
- Updates password to known value
- Ensures status is active

## Testing the Fix

### Test 1: Login
```bash
# Run Flutter app
flutter run

# Login with:
# Email: passenger@example.com
# Password: password123
```

Expected: Login succeeds and redirects to dashboard

### Test 2: Dashboard Load
After login, check that:
- Welcome message shows
- Quick action cards display
- Popular routes load (even if tickets fail)
- No 401 errors in logs

### Test 3: API Calls
Check Flutter logs for:
```
🌐 GET: https://yatrikerp.onrender.com/api/passenger/tickets
🔑 Token added to headers
✅ Status: 200  (or graceful handling of 401)
```

## Alternative: Use Different Test User

If you want to create your own test passenger:

### Option 1: Via Backend Script
```javascript
// backend/create-custom-passenger.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI);
const User = require('./models/User');

async function createPassenger() {
  const hashedPassword = await bcrypt.hash('yourpassword', 10);
  
  const passenger = new User({
    name: 'Your Name',
    email: 'your.email@example.com',
    phone: '+919876543210',
    password: hashedPassword,
    role: 'passenger',
    roleType: 'external',
    status: 'active',
    profileCompleted: true,
    emailVerified: true,
  });
  
  await passenger.save();
  console.log('Passenger created!');
  mongoose.connection.close();
}

createPassenger();
```

### Option 2: Via Registration API
Use the web app or Postman to register:
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Your Name",
  "email": "your.email@example.com",
  "phone": "+919876543210",
  "password": "yourpassword",
  "role": "passenger"
}
```

## Troubleshooting

### Issue: Still Getting 401 After Creating User

**Check 1: User exists in database**
```bash
# In MongoDB shell or Compass
db.users.findOne({ email: 'passenger@example.com' })
```

**Check 2: Token is being saved**
```
# Flutter logs should show:
🔍 Token verification: Token saved successfully
```

**Check 3: Backend can find user**
```
# Backend logs should show:
[AUTH] Token verified successfully
[AUTH] User authenticated
```

### Issue: Token Verification Fails

**Solution:** Check JWT_SECRET in backend `.env` file:
```bash
# backend/.env
JWT_SECRET=your-secret-key-here
```

Make sure it's the same secret used to generate the token.

### Issue: User Status is Not Active

**Solution:** Update user status:
```javascript
// In MongoDB shell
db.users.updateOne(
  { email: 'passenger@example.com' },
  { $set: { status: 'active' } }
)
```

### Issue: Role Mismatch

**Solution:** Ensure user role is exactly 'passenger':
```javascript
// In MongoDB shell
db.users.updateOne(
  { email: 'passenger@example.com' },
  { $set: { role: 'passenger', roleType: 'external' } }
)
```

## Verification Checklist

- [ ] Backend server is running
- [ ] Test passenger user exists in database
- [ ] User status is 'active'
- [ ] User role is 'passenger'
- [ ] Password is 'password123'
- [ ] Flutter app can login
- [ ] Token is saved after login
- [ ] Dashboard loads without 401 errors
- [ ] Popular routes display
- [ ] Navigation works

## Success Indicators

You'll know it's working when:

1. ✅ Login succeeds without errors
2. ✅ Dashboard loads and shows welcome message
3. ✅ No 401 errors in Flutter logs
4. ✅ Popular routes display
5. ✅ All tabs are accessible
6. ✅ Navigation is smooth

## Next Steps

Once authentication is working:

1. Test all dashboard features
2. Test search functionality
3. Test my trips tab
4. Test profile tab
5. Test wallet screen

## Support

If you're still having issues:

1. Check backend logs for errors
2. Check Flutter logs for token issues
3. Verify database connection
4. Ensure API URL is correct in `flutter/lib/config/api_config.dart`
5. Try clearing app data and logging in again

---

**Status:** ✅ Fix Applied
**Files Modified:**
- `flutter/lib/screens/passenger/tabs/dashboard_tab.dart`
- `flutter/lib/services/api_service.dart`
- `backend/create-test-passenger.js` (new)

**Next Action:** Run `node backend/create-test-passenger.js` and test login
