# Flutter App - Passenger & Conductor Only

## Changes Made

The Flutter app has been simplified to support only **Passenger** and **Conductor** login roles.

### Updated Files

1. **flutter/lib/screens/auth/login_screen.dart**
   - Simplified role-based routing to only allow passenger and conductor roles
   - Added visual indicator showing "For Passengers & Conductors only"
   - All other roles (admin, depot, driver, etc.) are rejected with a clear message
   - Users with unsupported roles are automatically logged out

2. **flutter/lib/screens/splash_screen.dart**
   - Added role-based routing on app startup
   - Automatically logs out users with unsupported roles
   - Routes conductors to `/conductor` dashboard
   - Routes passengers to `/home` screen

3. **flutter/lib/main.dart**
   - Removed admin-related imports and screens
   - Removed AI scheduling provider (admin feature)
   - Kept only essential providers: Auth, Booking, Trip

### Supported Roles

✅ **Passenger** - Full access to booking and travel features
✅ **Conductor** - Access to conductor dashboard for ticket verification

❌ **Admin, Depot Manager, Driver, etc.** - Redirected to web version

### User Experience

- Login screen shows clear message: "For Passengers & Conductors only"
- Users with unsupported roles see: "This app is only for passengers and conductors. Please use the web version for other roles."
- Registration always creates passenger accounts
- Smooth role-based navigation after login

### Testing

All files passed diagnostics with no errors. The app is ready to use!
