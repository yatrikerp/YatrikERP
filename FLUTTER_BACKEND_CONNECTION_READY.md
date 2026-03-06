# ✅ Flutter Backend Connection - Ready!

## Your Flutter App is Already Connected!

Good news! Your Flutter app is already configured to use the same backend as your web app:

**Backend URL:** `https://yatrikerp.onrender.com` ✅

## Just Need the Right Credentials

### Quick Solution (30 seconds)

Run this command to see your passenger credentials:

```bash
cd backend
node test-passenger-login.js
```

**This will:**
1. Show all passenger users in your database
2. Display their email addresses
3. Create a test passenger if none exist
4. Set password to `password123` for testing

### Then Login to Flutter App

Use the email shown in the output with the password from your web app (or `password123` if using test account).

## Example Output

```
✅ Found 1 passenger user(s):

1. Passenger Details:
   Name: John Doe
   Email: john.doe@example.com
   Phone: +919876543210
   Status: active
   ID: 507f1f77bcf86cd799439011

📋 Use these credentials to login to the Flutter app
```

## Test the Connection

```bash
# 1. Get credentials
cd backend
node test-passenger-login.js

# 2. Run Flutter app
cd ../flutter
flutter run

# 3. Login with the email from step 1
```

## What's Already Configured

✅ **Backend URL:** Points to production server
✅ **API Endpoints:** All configured correctly
✅ **Authentication:** Uses same JWT tokens as web app
✅ **Error Handling:** Graceful fallbacks implemented
✅ **Token Management:** Automatic save/clear

## The Connection Flow

```
Flutter App → https://yatrikerp.onrender.com → MongoDB
     ↓                                              ↓
  Same Backend                              Same Database
     ↓                                              ↓
  Web App    ←  Same Credentials  →    Same Users
```

## If You Know Your Web App Credentials

Just use them directly in the Flutter app! They should work identically.

**Example:**
- If you login to web app with: `user@example.com` / `mypassword`
- Use the same in Flutter app: `user@example.com` / `mypassword`

## Quick Verification

### Check Backend is Running
```bash
curl https://yatrikerp.onrender.com/api/health
```

Should return: `{"status":"ok"}`

### Check Your Credentials Work
1. Open web app
2. Login with your credentials
3. If it works, use same credentials in Flutter app

## Common Scenarios

### Scenario 1: I know my web app credentials
✅ **Solution:** Use them directly in Flutter app

### Scenario 2: I don't remember my password
✅ **Solution:** Run `node test-passenger-login.js` to create test account with known password

### Scenario 3: I want to use a test account
✅ **Solution:** Run `node create-test-passenger.js` to create:
- Email: `passenger@example.com`
- Password: `password123`

## Files Already Configured

1. ✅ `flutter/lib/config/api_config.dart` - Backend URL set
2. ✅ `flutter/lib/services/api_service.dart` - API calls configured
3. ✅ `flutter/lib/providers/auth_provider.dart` - Authentication flow
4. ✅ All dashboard screens - Ready to use

## No Configuration Needed!

Your Flutter app is already connected to the backend. You just need valid credentials.

## Success Checklist

- [ ] Backend is running (it's on Render, so always running)
- [ ] Know passenger email (run test-passenger-login.js)
- [ ] Know password (from web app or use test account)
- [ ] Flutter app installed on device
- [ ] Ready to login!

## One-Line Test

```bash
cd backend && node test-passenger-login.js && cd ../flutter && flutter run
```

This will:
1. Show your credentials
2. Launch Flutter app
3. You login with shown credentials

---

**Status:** ✅ Already Connected
**Action Needed:** Get credentials and login
**Time Required:** 30 seconds
