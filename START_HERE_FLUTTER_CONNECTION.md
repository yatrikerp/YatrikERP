# 🚀 Start Here - Flutter Backend Connection

## TL;DR

Your Flutter app is **already connected** to the same backend as your web app. You just need to use the same login credentials.

## One Command to Get Started

```bash
cd backend && node test-passenger-login.js
```

This shows you the passenger credentials in your database.

## Then Login

1. Run Flutter app: `flutter run`
2. Use the email shown in the command above
3. Use your web app password (or `password123` for test account)

## That's It! 🎉

---

## More Details (If Needed)

### Your Current Setup

```
Flutter App (Mobile)
        ↓
    Same Backend
        ↓
https://yatrikerp.onrender.com
        ↓
    Same Database
        ↓
    Same Users
        ↓
Web App (Browser)
```

### What Works

✅ Backend connection configured
✅ API endpoints set up
✅ Authentication flow ready
✅ All 6 dashboard screens implemented
✅ Error handling in place

### What You Need

Just valid passenger credentials that work in your web app.

### Get Credentials

**Option 1: Use your existing web app credentials**
- If you can login to web app, use same email/password in Flutter

**Option 2: Check what's in database**
```bash
cd backend
node test-passenger-login.js
```

**Option 3: Create test account**
```bash
cd backend
node create-test-passenger.js
```
Creates: `passenger@example.com` / `password123`

### Test It

```bash
# Terminal 1: Get credentials
cd backend
node test-passenger-login.js

# Terminal 2: Run app
cd flutter
flutter run

# Login with credentials from Terminal 1
```

### Expected Result

1. ✅ Login succeeds
2. ✅ Dashboard loads
3. ✅ Welcome message shows
4. ✅ All tabs work
5. ✅ No errors

### If Something Goes Wrong

See these guides:
- `CONNECT_FLUTTER_TO_BACKEND.md` - Detailed connection guide
- `FLUTTER_AUTH_FIX_GUIDE.md` - Troubleshooting
- `FLUTTER_BACKEND_CONNECTION_READY.md` - Quick reference

### Support Scripts

```bash
# Show all passengers
node backend/test-passenger-login.js

# Create test passenger
node backend/create-test-passenger.js

# Test backend
curl https://yatrikerp.onrender.com/api/health
```

---

## Quick Start Checklist

- [ ] Backend is running (always running on Render)
- [ ] Run `node backend/test-passenger-login.js`
- [ ] Note the email shown
- [ ] Run `flutter run`
- [ ] Login with noted email and your password
- [ ] Enjoy the app! 🎉

---

**Time to get started:** 1 minute
**Difficulty:** Easy
**Status:** ✅ Ready to use
