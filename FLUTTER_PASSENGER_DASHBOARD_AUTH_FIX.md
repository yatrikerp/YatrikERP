# Flutter Passenger Dashboard Authentication Fix

## Problem Identified
The Flutter app was getting 401 authentication errors when trying to access the passenger dashboard:
```
I/flutter (12532): 🌐 GET: https://yatrikerp.onrender.com/api/passenger/tickets
I/flutter (12532): 🔑 Token added to headers
I/flutter (12532): ✅ Status: 401
I/flutter (12532): ❌ GET Error: Exception: Authentication failed. Please contact system administrator.
```

## Root Causes

### 1. Token Not Persisting Properly
- The `ApiService.getToken()` method was returning cached token without reloading from SharedPreferences
- This caused stale or null tokens to be used for API requests
- Token was being saved but not properly retrieved on subsequent requests

### 2. Token Save Order Issue
- During login, token was being saved in parallel with other data
- This could cause race conditions where API calls happened before token was fully persisted

### 3. Insufficient Error Handling
- No detection of authentication errors to trigger re-login
- No verification that token was successfully saved after login
- Generic error messages didn't help identify the auth issue

## Fixes Applied

### 1. Fixed Token Retrieval (`api_service.dart`)
**Before:**
```dart
Future<String?> getToken() async {
  if (_token != null) return _token;  // Returns cached token
  await init();
  return _token;
}
```

**After:**
```dart
Future<String?> getToken() async {
  await init();
  _token = _prefs?.getString('auth_token');  // Always reload from storage
  return _token;
}
```

### 2. Fixed Token Saving (`api_service.dart`)
**Before:**
```dart
Future<void> setToken(String token) async {
  _token = token;
  await init();
  await _prefs?.setString('auth_token', token);
}
```

**After:**
```dart
Future<void> setToken(String token) async {
  await init();  // Initialize FIRST
  _token = token;
  await _prefs?.setString('auth_token', token);
  print('💾 Token saved: ${token.substring(0, 20)}...'); // Debug log
}
```

### 3. Enhanced Login Flow (`auth_provider.dart`)
Added comprehensive logging and token verification:
```dart
// Save token FIRST before anything else
await _apiService.setToken(_token!);

// Then save user data and preferences
await Future.wait([...]);

// Verify token was saved
final savedToken = await _apiService.getToken();
print('🔍 Token verification: ${savedToken != null ? "Token saved successfully" : "ERROR: Token not saved!"}');
```

### 4. Better Error Handling (`api_service.dart`)
Added specific 401 error detection:
```dart
if (response.statusCode == 401) {
  final message = body['message'] ?? 'Authentication failed. Please log in again.';
  print('🔒 401 Error: $message');
  throw Exception(message);
}
```

### 5. Dashboard Authentication Check (`passenger_home_screen.dart`)
Added token verification before API calls:
```dart
// Ensure API service is initialized and token is loaded
await _apiService.init();
final token = await _apiService.getToken();

if (token == null) {
  print('⚠️ No token available, redirecting to login');
  Navigator.pushReplacementNamed(context, '/login');
  return;
}

// Check if it's an authentication error
if (e.toString().contains('Authentication failed') || 
    e.toString().contains('401')) {
  // Clear auth and redirect to login
  await authProvider.logout();
  Navigator.pushReplacementNamed(context, '/login');
}
```

## Testing Instructions

### 1. Clean Install Test
```bash
cd flutter
flutter clean
flutter pub get
flutter run
```

### 2. Login Flow Test
1. Open the app
2. Login with passenger credentials
3. Check logs for:
   - `🔐 Attempting login for: [email]`
   - `✅ Login successful, saving token...`
   - `💾 Token saved: [token preview]...`
   - `🔍 Token verification: Token saved successfully`

### 3. Dashboard Load Test
1. After successful login, dashboard should load
2. Check logs for:
   - `🔑 Token available for dashboard fetch`
   - `🌐 GET: https://yatrikerp.onrender.com/api/passenger/tickets`
   - `🔑 Token added to headers`
   - `✅ Status: 200` (not 401!)

### 4. Token Persistence Test
1. Login successfully
2. Close the app completely
3. Reopen the app
4. Should automatically navigate to dashboard without login
5. Dashboard should load data successfully

### 5. Error Recovery Test
1. Login successfully
2. Manually clear token from backend (or wait for expiration)
3. Try to load dashboard
4. Should detect 401 error and redirect to login
5. Check logs for: `🔒 Authentication error detected, redirecting to login`

## Expected Behavior

### Successful Login Flow
```
🔐 Attempting login for: passenger@example.com
📥 Login response: true
✅ Login successful, saving token...
👤 User role: passenger
💾 Token saved: eyJhbGciOiJIUzI1NiIs...
🔍 Token verification: Token saved successfully
```

### Successful Dashboard Load
```
🔑 Token available for dashboard fetch
🌐 GET: https://yatrikerp.onrender.com/api/passenger/tickets
🔑 Token added to headers
✅ Status: 200
```

### Authentication Error Recovery
```
🌐 GET: https://yatrikerp.onrender.com/api/passenger/tickets
✅ Status: 401
🔒 401 Error: Authentication failed. Please log in again.
🔒 Authentication error detected, redirecting to login
```

## Web App Parity

The Flutter passenger dashboard now has the same functionality as the web app:

### Features Implemented
✅ Welcome header with user name
✅ Quick search card for booking trips
✅ Popular routes display (Kerala routes)
✅ Stats cards (Wallet, My Tickets, Upcoming)
✅ Upcoming trips list with details
✅ Pull-to-refresh functionality
✅ Proper error handling with retry
✅ Authentication state management
✅ Automatic logout on auth errors

### API Endpoints Used (Same as Web)
- `/api/passenger/tickets` - Get user's tickets/bookings
- `/api/passenger/wallet` - Get wallet balance
- `/api/passenger/dashboard` - Get dashboard data (future use)

## Files Modified

1. `flutter/lib/services/api_service.dart`
   - Fixed token retrieval to always reload from storage
   - Fixed token saving to initialize first
   - Enhanced error handling for 401 errors

2. `flutter/lib/providers/auth_provider.dart`
   - Added comprehensive logging
   - Fixed token save order (save token first)
   - Added token verification after save

3. `flutter/lib/screens/home/passenger_home_screen.dart`
   - Added token check before API calls
   - Added authentication error detection
   - Added automatic logout and redirect on auth errors
   - Enhanced error messages with retry option

## Next Steps

1. Test the app thoroughly with the fixes
2. Monitor logs to ensure tokens are being saved and loaded correctly
3. If issues persist, check:
   - Backend JWT secret configuration
   - Token expiration settings
   - Network connectivity
   - SharedPreferences permissions on device

## Debug Commands

### Check if token is saved
```dart
final prefs = await SharedPreferences.getInstance();
final token = prefs.getString('auth_token');
print('Saved token: $token');
```

### Clear all saved data (for testing)
```dart
final prefs = await SharedPreferences.getInstance();
await prefs.clear();
```

### Test API call with token
```dart
final apiService = ApiService();
await apiService.init();
final token = await apiService.getToken();
print('Current token: $token');
```
