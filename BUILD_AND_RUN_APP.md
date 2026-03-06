# Build and Run Flutter App - Quick Guide

## What Changed
✅ Only Passenger and Conductor login allowed
✅ Clean, simplified UI with role indicator
✅ Connected to production backend: https://yatrikerp.onrender.com
✅ Fast performance with optimized API calls

## Quick Start - Run on Your Device

### Option 1: Run on Android Device/Emulator (Recommended)
```bash
cd flutter
flutter run
```

### Option 2: Run on Chrome (Web)
```bash
cd flutter
flutter run -d chrome
```

### Option 3: Build APK for Installation
```bash
cd flutter
flutter build apk --release
```
APK will be at: `flutter/build/app/outputs/flutter-apk/app-release.apk`

## Test Credentials

### Passenger Login
- Email: `passenger@test.com`
- Password: `password123`

### Conductor Login
- Email: `conductor@test.com`
- Password: `password123`

## What You'll See

1. **Splash Screen** - Animated YATRIK logo
2. **Landing Page** - Beautiful hero section with search
3. **Login Screen** - NEW: "For Passengers & Conductors only" badge
4. **Passenger Home** - Book tickets, view trips
5. **Conductor Dashboard** - Verify tickets, manage trips

## Backend Connection
- Production URL: https://yatrikerp.onrender.com
- Real-time data from MongoDB Atlas
- Fast API responses with 30s timeout

## Build Commands

### Check Flutter Setup
```bash
flutter doctor
```

### Get Dependencies
```bash
cd flutter
flutter pub get
```

### Run in Debug Mode (Hot Reload)
```bash
cd flutter
flutter run
```

### Build Release APK
```bash
cd flutter
flutter build apk --release
```

### Build App Bundle (for Play Store)
```bash
cd flutter
flutter build appbundle --release
```

## Troubleshooting

### If build fails:
```bash
cd flutter
flutter clean
flutter pub get
flutter run
```

### If backend connection fails:
- Check internet connection
- Backend URL is already set to production
- No changes needed!

## Next Steps
1. Run `flutter run` to see changes
2. Test passenger login
3. Test conductor login
4. Try admin login (will be rejected with message)
