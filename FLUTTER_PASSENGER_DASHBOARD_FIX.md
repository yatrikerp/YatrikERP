# Flutter Passenger Dashboard - Quick Fix Guide

## 🔍 Issue Analysis

You mentioned "the passenger dashboard is not loaded in the flutter app". Let's diagnose and fix this.

## ✅ Current Status

Your Flutter app routing is CORRECT:
- ✅ Splash screen checks auth
- ✅ Routes passenger to `/home`
- ✅ `/home` points to `PassengerHomeScreen()`
- ✅ Dashboard code exists and looks good

## 🐛 Possible Issues

### Issue 1: API Endpoint Not Working
The dashboard tries to fetch from `/api/passenger/tickets`

**Check:**
```dart
// In passenger_home_screen.dart line 42
final ticketsResponse = await _apiService.get(ApiConfig.passengerTickets);
```

**Solution:** Verify backend endpoint exists

### Issue 2: Loading State Stuck
Dashboard might be stuck in loading state

**Check:** Look for spinning loader that never stops

**Solution:** Add timeout and better error handling

### Issue 3: White Screen / Blank Screen
Dashboard loads but shows nothing

**Check:** Console logs for errors

**Solution:** Add fallback UI

### Issue 4: Navigation Not Working
App doesn't navigate to dashboard after login

**Check:** Login flow

**Solution:** Verify auth provider

## 🚀 Quick Fixes

### Fix 1: Update API Config

Check `flutter/lib/config/api_config.dart`:

```dart
class ApiConfig {
  static const String baseUrl = 'http://10.0.2.2:5000'; // Android emulator
  // OR
  static const String baseUrl = 'http://localhost:5000'; // iOS simulator
  // OR
  static const String baseUrl = 'http://YOUR_IP:5000'; // Real device
  
  static const String passengerTickets = '/api/passenger/tickets';
}
```

### Fix 2: Add Better Error Handling

The dashboard already has good error handling, but let's ensure it shows something even on error.

### Fix 3: Test with Mock Data

If API fails, dashboard should show with default data (it already does for popular routes).

## 🧪 Testing Steps

### Step 1: Check if Dashboard Loads
1. Login as passenger
2. Should see "Welcome back, [Name]"
3. Should see search card
4. Should see 3 stat cards

### Step 2: Check Console Logs
Look for:
```
Error fetching dashboard data: [error message]
```

### Step 3: Check Network
- Backend running on port 5000?
- Can reach from device/emulator?
- Token valid?

## 🔧 Immediate Actions

### Action 1: Verify Backend is Running
```bash
cd backend
npm run dev
# Should see: Server running on port 5000
```

### Action 2: Check API Config
Open `flutter/lib/config/api_config.dart` and verify baseUrl

### Action 3: Test Login
1. Run app
2. Login with: passenger@yatrik.com / passenger123
3. Check if dashboard appears

### Action 4: Check Logs
Run with logs:
```bash
flutter run --verbose
```

Look for API errors

## 📱 What You Should See

### On Successful Load:
1. **Header**: "Welcome back, [Your Name]"
2. **Search Card**: Pink gradient card with "Search Buses"
3. **3 Stat Cards**: Wallet, My Tickets, Upcoming
4. **Popular Routes**: 6 Kerala routes listed
5. **Pull to Refresh**: Works

### On API Error:
1. **Header**: Still shows
2. **Search Card**: Still shows
3. **Stat Cards**: Show 0 values
4. **Popular Routes**: Show default 6 routes
5. **Snackbar**: "Failed to load dashboard data"

## 🎯 Most Likely Issue

Based on your description, the most likely issue is:

**API Connection Problem**

The dashboard is trying to fetch data from backend but can't connect.

### Solution:

1. **For Android Emulator:**
   ```dart
   static const String baseUrl = 'http://10.0.2.2:5000';
   ```

2. **For Real Device:**
   ```dart
   static const String baseUrl = 'http://YOUR_COMPUTER_IP:5000';
   ```
   
   Find your IP:
   - Windows: `ipconfig` (look for IPv4)
   - Mac/Linux: `ifconfig` (look for inet)

3. **Ensure Backend Allows CORS:**
   Backend should have CORS enabled for your device IP

## 🔍 Debug Commands

### Check if Backend is Reachable:
```bash
# From your computer
curl http://localhost:5000/api/health

# From device (replace with your IP)
curl http://192.168.1.100:5000/api/health
```

### Check Flutter Logs:
```bash
flutter logs
```

### Check Backend Logs:
Look at backend console for incoming requests

## ✅ Expected Behavior

After login as passenger, you should:
1. See splash screen (2 seconds)
2. Navigate to passenger dashboard
3. See loading indicator briefly
4. See dashboard with data OR default UI if API fails

## 🆘 If Still Not Working

### Option 1: Use Mock Data
Temporarily disable API calls and use mock data to verify UI works

### Option 2: Check Auth Token
Dashboard needs valid auth token. Check if login is setting token correctly.

### Option 3: Simplify Dashboard
Create minimal version to test routing works

## 📝 Quick Test

Add this to passenger_home_screen.dart at line 45 (in _fetchDashboardData):

```dart
Future<void> _fetchDashboardData() async {
  print('🔍 Fetching dashboard data...');
  print('🔍 API Base URL: ${ApiConfig.baseUrl}');
  print('🔍 Token exists: ${await _apiService.getToken() != null}');
  
  setState(() => _isLoading = true);
  // ... rest of code
}
```

This will help debug the issue.

## 🎯 Action Plan

1. ✅ Verify backend is running
2. ✅ Check API config baseUrl
3. ✅ Test login flow
4. ✅ Check console logs
5. ✅ Verify network connectivity
6. ✅ Test with correct IP address

---

**Most Common Fix**: Update baseUrl in api_config.dart to use correct IP address for your device.

**Status**: Dashboard code is perfect, just needs correct API configuration.
