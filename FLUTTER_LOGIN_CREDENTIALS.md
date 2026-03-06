# Flutter App Login Credentials

## 🔐 Test Accounts

### 1. Super Admin
```
Email: superadmin@yatrik.com
Password: SuperAdmin@123
Role: Super Admin
Access: Full system access
```

### 2. Admin
```
Email: admin@yatrik.com
Password: Admin@123
Role: Admin
Access: Administrative functions, AI features
```

### 3. Depot Manager
```
Email: depot@yatrik.com
Password: Depot@123
Role: Depot Manager
Access: Depot operations, staff management
```

### 4. Conductor
```
Email: conductor@yatrik.com
Password: Conductor@123
Role: Conductor
Access: Ticket booking, trip management
```

### 5. Passenger (Test User)
```
Email: passenger@yatrik.com
Password: Passenger@123
Role: Passenger
Access: Book tickets, view trips
```

### 6. Vendor
```
Email: vendor@yatrik.com
Password: Vendor@123
Role: Vendor
Access: Vendor operations
```

---

## 🌐 API Configuration

### Production URL
```
https://yatrikerp.onrender.com
```

### Local Development URLs
```
WiFi: http://192.168.55.175:5000
Android Emulator: http://10.0.2.2:5000
iOS Simulator: http://localhost:5000
```

---

## 🔧 Network Error Fixes

### Issue 1: Cannot Connect to Server

**Solution 1: Check if backend is running**
```bash
cd backend
npm start
```

**Solution 2: Use correct IP for physical device**
1. Find your computer's IP address:
   - Windows: `ipconfig` (look for IPv4)
   - Mac/Linux: `ifconfig` or `ip addr`
2. Update `flutter/lib/config/api_config.dart`:
   ```dart
   static const String baseUrl = 'http://YOUR_IP:5000';
   ```

**Solution 3: Allow network permissions**
Check `flutter/android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
```

### Issue 2: SSL/HTTPS Errors

Add to `flutter/android/app/src/main/AndroidManifest.xml`:
```xml
<application
    android:usesCleartextTraffic="true">
```

### Issue 3: Timeout Errors

Increase timeout in `flutter/lib/services/api_service.dart`:
```dart
final response = await _client.get(url, headers: headers)
    .timeout(const Duration(seconds: 30)); // Increase if needed
```

---

## 📱 Quick Test Steps

### 1. Test Backend Connection
```bash
# From your computer
curl https://yatrikerp.onrender.com/api/health

# Should return: {"status":"ok"}
```

### 2. Test Login API
```bash
curl -X POST https://yatrikerp.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"passenger@yatrik.com","password":"Passenger@123"}'
```

### 3. Test from Flutter App
1. Open the app
2. Click "Login"
3. Enter: `passenger@yatrik.com` / `Passenger@123`
4. Click "Sign In"

---

## 🐛 Debugging Network Issues

### Enable Debug Logging

Add to `flutter/lib/services/api_service.dart`:
```dart
Future<Map<String, dynamic>> get(String endpoint, {bool requireAuth = true}) async {
  try {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    print('🌐 GET Request: $url'); // Add this
    
    final headers = _getHeadersSync(includeAuth: requireAuth);
    print('📋 Headers: $headers'); // Add this
    
    final response = await _client.get(url, headers: headers)
        .timeout(const Duration(seconds: 30));
    
    print('✅ Response: ${response.statusCode}'); // Add this
    print('📦 Body: ${response.body}'); // Add this
    
    return _handleResponse(response);
  } catch (e) {
    print('❌ Error: $e'); // Add this
    throw Exception('Network error: $e');
  }
}
```

### Check Flutter Console
Run with verbose logging:
```bash
flutter run -v
```

---

## 🔄 Common Fixes

### Fix 1: Clear App Data
```bash
flutter clean
flutter pub get
flutter run
```

### Fix 2: Reset API Configuration
Edit `flutter/lib/config/api_config.dart`:
```dart
class ApiConfig {
  // For physical device on same WiFi
  static const String baseUrl = 'http://192.168.1.XXX:5000';
  
  // OR use production
  static const String baseUrl = 'https://yatrikerp.onrender.com';
}
```

### Fix 3: Check Device Network
- Ensure device is connected to internet
- Try opening browser on device
- Visit: https://yatrikerp.onrender.com

---

## 📊 API Endpoints

### Authentication
- POST `/api/auth/login` - Login
- POST `/api/auth/register` - Register
- POST `/api/auth/logout` - Logout

### Passenger
- GET `/api/passenger/dashboard` - Dashboard data
- GET `/api/passenger/bookings` - My bookings
- GET `/api/passenger/trips/search` - Search trips

### Booking
- POST `/api/booking` - Create booking
- POST `/api/booking/confirm` - Confirm booking
- GET `/api/booking/my-bookings` - My bookings

### Admin (AI Features)
- GET `/api/admin/dashboard` - Admin dashboard
- POST `/api/ai-scheduling/predict-demand` - Demand prediction
- POST `/api/ai-scheduling/calculate-fatigue` - Crew fatigue
- POST `/api/ai-scheduling/genetic-schedule` - AI scheduling

---

## 🎯 Testing Checklist

- [ ] Backend server is running
- [ ] API URL is correct in api_config.dart
- [ ] Device has internet connection
- [ ] Device and server on same network (for local)
- [ ] Network permissions in AndroidManifest.xml
- [ ] Test with passenger@yatrik.com / Passenger@123
- [ ] Check Flutter console for errors
- [ ] Try production URL if local fails

---

## 💡 Pro Tips

1. **Use Production URL First**: `https://yatrikerp.onrender.com` - Always works
2. **For Local Development**: Use your computer's IP address
3. **Check Firewall**: Ensure port 5000 is not blocked
4. **Use WiFi**: Both device and computer on same network
5. **Enable Debug Mode**: Add print statements to track requests

---

## 🆘 Still Having Issues?

### Check These:

1. **Backend Status**
   ```bash
   curl https://yatrikerp.onrender.com/api/health
   ```

2. **Flutter Console**
   Look for error messages starting with ❌

3. **Network Inspector**
   Use Charles Proxy or similar to inspect requests

4. **Try Different Account**
   Test with multiple credentials to rule out account issues

---

## 📞 Support

If login still fails:
1. Check backend logs
2. Verify MongoDB connection
3. Ensure JWT_SECRET is set
4. Check user exists in database

---

**Last Updated**: March 3, 2026
**Status**: ✅ All credentials active
**Backend**: https://yatrikerp.onrender.com
