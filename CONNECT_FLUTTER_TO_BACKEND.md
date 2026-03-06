# Connect Flutter App to Backend - Complete Guide

## Current Status

✅ **Backend URL:** `https://yatrikerp.onrender.com` (Production)
✅ **Web App:** Working with passenger login
✅ **Flutter App:** Configured to use same backend
⚠️ **Issue:** Need to use exact same credentials

## Step-by-Step Connection Guide

### Step 1: Find Your Passenger Credentials

Run this script to see all passenger users in the database:

```bash
cd backend
node test-passenger-login.js
```

This will show you:
- All passenger users in the database
- Their email addresses
- Their IDs and status
- Create a test passenger if none exist

**Expected Output:**
```
✅ Found 1 passenger user(s):

1. Passenger Details:
   Name: John Doe
   Email: john.doe@example.com
   Phone: +919876543210
   Status: active
   ID: 507f1f77bcf86cd799439011
```

### Step 2: Use These Credentials in Flutter App

Take the email from Step 1 and use it to login in the Flutter app.

**If you don't know the password:**

#### Option A: Reset via Web App
1. Go to web app login page
2. Click "Forgot Password"
3. Reset password
4. Use new password in Flutter app

#### Option B: Update in Database
```bash
# Run this to set password to "password123"
node backend/create-test-passenger.js
```

### Step 3: Verify Backend Connection

#### Check Backend is Running
```bash
cd backend
npm start
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

#### Test API Endpoint
Open browser or use curl:
```bash
curl https://yatrikerp.onrender.com/api/health
```

Should return:
```json
{"status":"ok","message":"Server is running"}
```

### Step 4: Test Flutter App Login

```bash
cd flutter
flutter run
```

Login with the credentials from Step 1.

**Expected Flow:**
1. Enter email and password
2. Tap "Login"
3. See loading indicator
4. Redirect to dashboard
5. See welcome message

**Check Flutter Logs:**
```
🔐 Attempting login for: your.email@example.com
📥 Login response: true
✅ Login successful, saving token...
🔍 Token verification: Token saved successfully
```

## Common Issues & Solutions

### Issue 1: "Invalid email or password"

**Cause:** Password doesn't match database

**Solution:**
```bash
# Update password to known value
cd backend
node create-test-passenger.js
```

Then use:
- Email: `passenger@example.com`
- Password: `password123`

### Issue 2: "User not found in database"

**Cause:** User doesn't exist or wrong email

**Solution:**
```bash
# Check what users exist
node test-passenger-login.js

# Use the email shown in the output
```

### Issue 3: "Authentication failed" (401 error)

**Cause:** Token validation failing

**Solutions:**

**A. Check user status:**
```bash
# In MongoDB shell or Compass
db.users.findOne({ email: 'your.email@example.com' })
```

Ensure `status: "active"`

**B. Update user status:**
```bash
# In MongoDB shell
db.users.updateOne(
  { email: 'your.email@example.com' },
  { $set: { status: 'active' } }
)
```

**C. Verify role:**
```bash
# In MongoDB shell
db.users.updateOne(
  { email: 'your.email@example.com' },
  { $set: { role: 'passenger', roleType: 'external' } }
)
```

### Issue 4: "Network error" or "Connection refused"

**Cause:** Backend not accessible

**Solutions:**

**A. Check backend is running:**
```bash
cd backend
npm start
```

**B. Check backend URL in Flutter:**
```dart
// flutter/lib/config/api_config.dart
static const String baseUrl = 'https://yatrikerp.onrender.com';
```

**C. Test backend directly:**
```bash
curl https://yatrikerp.onrender.com/api/health
```

### Issue 5: "Device offline" (ADB error)

**Solution:**
```bash
adb kill-server
adb start-server
adb devices
```

## Testing Checklist

### Backend Tests
- [ ] Backend server is running
- [ ] MongoDB is connected
- [ ] API health endpoint responds
- [ ] Passenger user exists in database
- [ ] User status is 'active'
- [ ] User role is 'passenger'

### Flutter Tests
- [ ] App launches successfully
- [ ] Login screen displays
- [ ] Can enter credentials
- [ ] Login button works
- [ ] Loading indicator shows
- [ ] Redirects to dashboard on success
- [ ] Dashboard loads data
- [ ] No 401 errors in logs

### Credentials Tests
- [ ] Know the passenger email
- [ ] Know the passenger password
- [ ] Credentials work in web app
- [ ] Credentials work in Flutter app

## Quick Test Commands

```bash
# 1. Check passenger users
cd backend
node test-passenger-login.js

# 2. Start backend (if not running)
npm start

# 3. Test API
curl https://yatrikerp.onrender.com/api/health

# 4. Run Flutter app
cd ../flutter
flutter run

# 5. Login with credentials from step 1
```

## Using Same Credentials as Web App

### Method 1: Find Credentials in Browser

1. Open web app in browser
2. Open Developer Tools (F12)
3. Go to Application/Storage tab
4. Check Local Storage or Session Storage
5. Look for saved email or user data

### Method 2: Check Browser Saved Passwords

1. Open browser settings
2. Go to Passwords
3. Search for your backend URL
4. View saved credentials

### Method 3: Use Known Test Account

If you have a test account that works in web app:
1. Use same email in Flutter app
2. Use same password
3. Should work identically

## Verification Steps

### 1. Verify User Exists
```bash
node backend/test-passenger-login.js
```

### 2. Verify Backend Connection
```bash
curl https://yatrikerp.onrender.com/api/health
```

### 3. Verify Flutter Config
```dart
// Check flutter/lib/config/api_config.dart
static const String baseUrl = 'https://yatrikerp.onrender.com';
```

### 4. Test Login
```bash
flutter run
# Login with credentials
```

## Success Indicators

✅ You'll know it's working when:

1. **Backend:**
   - Server running without errors
   - MongoDB connected
   - API responds to health check

2. **Flutter App:**
   - Login succeeds
   - Token is saved
   - Dashboard loads
   - Welcome message shows
   - No 401 errors

3. **Logs:**
   ```
   # Flutter logs
   ✅ Login successful, saving token...
   🔍 Token verification: Token saved successfully
   
   # Backend logs
   [AUTH] Token verified successfully
   [AUTH] User authenticated
   ```

## Production vs Development

### Current Setup (Production)
```dart
// flutter/lib/config/api_config.dart
static const String baseUrl = 'https://yatrikerp.onrender.com';
```

This connects to the same backend as your web app.

### For Local Development
If you want to test with local backend:

```dart
// Uncomment in api_config.dart
static const String baseUrl = 'http://192.168.1.XXX:5000'; // Your IP
```

Then start local backend:
```bash
cd backend
npm start
```

## Final Checklist

Before testing Flutter app:

- [ ] Backend is running
- [ ] Passenger user exists (run test-passenger-login.js)
- [ ] Know the email and password
- [ ] Credentials work in web app
- [ ] Flutter app is configured with correct backend URL
- [ ] Device/emulator is connected

## Support Scripts

### 1. Check Passengers
```bash
node backend/test-passenger-login.js
```

### 2. Create Test Passenger
```bash
node backend/create-test-passenger.js
```

### 3. Test Backend
```bash
curl https://yatrikerp.onrender.com/api/health
```

## Next Steps

1. ✅ Run `node backend/test-passenger-login.js`
2. ✅ Note the email and password
3. ✅ Ensure backend is running
4. ✅ Run Flutter app: `flutter run`
5. ✅ Login with noted credentials
6. ✅ Test all features

---

**Status:** ✅ Ready to connect
**Backend:** https://yatrikerp.onrender.com
**Action:** Run test-passenger-login.js to get credentials
