# 🔧 Fix Flutter Authentication - Quick Guide

## The Problem
Your Flutter app logs in successfully but gets a 401 error when loading the dashboard.

## The Solution (2 Steps)

### Step 1: Create Test Passenger User
```bash
cd backend
node create-test-passenger.js
```

You should see:
```
✅ Test passenger created successfully!
   Email: passenger@example.com
   Password: password123
```

### Step 2: Test the App
```bash
cd ../flutter
flutter run
```

Login with:
- **Email:** `passenger@example.com`
- **Password:** `password123`

## What This Does

The script:
1. Checks if test passenger exists in database
2. Creates it if missing
3. Sets password to `password123`
4. Sets status to `active`
5. Ensures role is `passenger`

## Expected Result

After running the script and logging in:
- ✅ Login succeeds
- ✅ Dashboard loads
- ✅ Welcome message shows
- ✅ Popular routes display
- ✅ No 401 errors

## If It Still Doesn't Work

### Check 1: Backend Running?
```bash
cd backend
npm start
```

### Check 2: Database Connected?
Check backend logs for:
```
✅ MongoDB connected successfully
```

### Check 3: User Created?
The script should output:
```
✅ Test passenger created successfully!
```

### Check 4: Flutter Logs
Look for:
```
✅ Login successful, saving token...
🔍 Token verification: Token saved successfully
```

## Alternative: Manual Database Fix

If the script doesn't work, manually create the user in MongoDB:

```javascript
// In MongoDB shell or Compass
db.users.insertOne({
  name: "Test Passenger",
  email: "passenger@example.com",
  phone: "+919876543210",
  password: "$2a$10$YourHashedPasswordHere",  // Use bcrypt to hash "password123"
  role: "passenger",
  roleType: "external",
  status: "active",
  profileCompleted: true,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Quick Test Commands

```bash
# 1. Create passenger
cd backend
node create-test-passenger.js

# 2. Start backend (if not running)
npm start

# 3. Run Flutter app
cd ../flutter
flutter run

# 4. Login and test
# Email: passenger@example.com
# Password: password123
```

## Success Checklist

- [ ] Script runs without errors
- [ ] Backend is running
- [ ] Flutter app launches
- [ ] Login succeeds
- [ ] Dashboard loads
- [ ] No 401 errors in logs

## Files Modified

1. ✅ `backend/create-test-passenger.js` - New script to create test user
2. ✅ `flutter/lib/screens/passenger/tabs/dashboard_tab.dart` - Better error handling
3. ✅ `flutter/lib/services/api_service.dart` - Auto-logout on 401

## Need More Help?

See `FLUTTER_AUTH_FIX_GUIDE.md` for detailed troubleshooting.

---

**Quick Fix Time:** 2 minutes
**Status:** ✅ Ready to test
