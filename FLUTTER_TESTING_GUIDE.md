# Flutter App Testing Guide

## Quick Test Commands

### 1. Clean Build and Run
```bash
cd flutter
flutter clean
flutter pub get
flutter run
```

### 2. Check Logs in Real-Time
Look for these key log messages:

#### During Login:
```
🔐 Attempting login for: [email]
📥 Login response: true
✅ Login successful, saving token...
👤 User role: passenger
💾 Token saved: [token]...
🔍 Token verification: Token saved successfully
```

#### During Dashboard Load:
```
🔑 Token available for dashboard fetch
🌐 GET: https://yatrikerp.onrender.com/api/passenger/tickets
🔑 Token added to headers
✅ Status: 200
```

#### If Authentication Fails:
```
⚠️ No token found
OR
✅ Status: 401
🔒 401 Error: Authentication failed
🔒 Authentication error detected, redirecting to login
```

## Test Scenarios

### Scenario 1: Fresh Login
1. Open app (should show splash → landing → login)
2. Enter credentials:
   - Email: `passenger@example.com`
   - Password: `password123`
3. Click "Sign In"
4. Should navigate to passenger dashboard
5. Dashboard should load with:
   - Welcome message with user name
   - Search card
   - Stats cards (Wallet, Tickets, Upcoming)
   - Popular routes
   - Upcoming trips (if any)

### Scenario 2: Token Persistence
1. Login successfully
2. Close app completely (swipe away from recent apps)
3. Reopen app
4. Should automatically show dashboard (no login required)
5. Dashboard should load data successfully

### Scenario 3: Pull to Refresh
1. On dashboard, pull down to refresh
2. Should show loading indicator
3. Should reload all dashboard data
4. Check logs for new API calls

### Scenario 4: Error Recovery
1. Login successfully
2. Turn off internet/WiFi
3. Try to refresh dashboard
4. Should show error message with "Retry" button
5. Turn on internet
6. Click "Retry"
7. Should load successfully

## Common Issues and Solutions

### Issue: "⚠️ No token found"
**Solution:**
- Check if login was successful
- Verify token is being saved (look for "💾 Token saved" log)
- Try clearing app data and logging in again

### Issue: "Status: 401"
**Solution:**
- Token might be expired
- Backend might have restarted (tokens invalidated)
- Try logging out and logging in again
- Check backend JWT_SECRET is consistent

### Issue: Dashboard shows loading forever
**Solution:**
- Check internet connection
- Check backend is running (https://yatrikerp.onrender.com)
- Look for error logs in console
- Try pull-to-refresh

### Issue: App crashes on login
**Solution:**
- Check logs for error messages
- Verify API endpoint is correct
- Check backend is accessible
- Try `flutter clean` and rebuild

## Passenger Test Credentials

Use these credentials for testing:

```
Email: passenger@example.com
Password: password123
```

Or create a new passenger account using the Register screen.

## Backend API Endpoints

The Flutter app uses these endpoints (same as web):

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout
- `GET /api/passenger/tickets` - Get tickets
- `GET /api/passenger/wallet` - Get wallet balance
- `GET /api/passenger/dashboard` - Get dashboard data

## Comparing with Web App

To verify Flutter app matches web app:

1. Open web app: http://localhost:3000/pax
2. Login with same credentials
3. Compare features:
   - ✅ Welcome header
   - ✅ Search functionality
   - ✅ Popular routes
   - ✅ Upcoming trips
   - ✅ Wallet balance
   - ✅ Ticket count
   - ✅ Pull to refresh (web has auto-refresh)

## Performance Expectations

- Login: < 2 seconds
- Dashboard load: < 3 seconds
- Pull to refresh: < 2 seconds
- Navigation: Instant

## Debug Mode

To enable more detailed logs, the app already has debug prints enabled. Look for these emoji indicators:

- 🔐 Authentication
- 💾 Storage operations
- 🔑 Token operations
- 🌐 Network requests
- ✅ Success
- ❌ Errors
- ⚠️ Warnings
- 🔒 Security issues
- 📥 Responses
- 📦 Data
- 🔍 Verification

## Next Steps After Testing

If everything works:
1. ✅ Mark authentication as fixed
2. ✅ Test all dashboard features
3. ✅ Test booking flow
4. ✅ Test ticket viewing
5. ✅ Test profile management

If issues persist:
1. Share complete logs from console
2. Note exact steps to reproduce
3. Check backend logs for corresponding errors
4. Verify network connectivity
5. Try on different device/emulator
