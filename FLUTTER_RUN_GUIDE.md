# 🚀 How to Run Your Flutter App

## ✅ What's Updated

1. **Animated Splash Screen** - Smooth fade and scale animations
2. **Modern Landing Page** - Matches web app UI with gradients and animations
3. **Fixed Syntax Errors** - Landing screen now compiles correctly
4. **Google Sign-In Ready** - Client ID configured

## 📱 Running the App

### Option 1: Run on Android Emulator (Recommended for Testing)

1. **Start Android Emulator:**
   - Open Android Studio
   - Click "Device Manager" (phone icon on right sidebar)
   - Click ▶️ on any emulator to start it
   - Wait for emulator to fully boot

2. **Run Flutter App:**
   ```bash
   cd flutter
   flutter run
   ```

3. **Or specify the device:**
   ```bash
   flutter run -d emulator-5554
   ```

### Option 2: Run on Physical Android Device

1. **Enable Developer Options on your phone:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back → Developer Options
   - Enable "USB Debugging"

2. **Connect phone via USB**

3. **Verify device is connected:**
   ```bash
   flutter devices
   ```

4. **Run the app:**
   ```bash
   cd flutter
   flutter run
   ```

### Option 3: Run on Chrome (Web - for quick testing)

```bash
cd flutter
flutter run -d chrome
```

## 🎨 What You'll See

### 1. Splash Screen (2 seconds)
- Animated YATRIK logo with fade-in effect
- Gradient background (Pink → Green)
- Loading indicator
- Auto-navigates to Landing or Home based on auth status

### 2. Landing Screen
- Modern header with animated logo
- Hero section with gradient background
- Trust badges (Safe Travel, Fast Booking, 5★ Rated)
- Stats (10M+ Travelers, 50K+ Routes, 99% On Time)
- Search form (From, To, Date)
- Features section
- Footer

### 3. Login Screen
- Google Sign-In button (configured with your Client ID)
- Email/Password login
- Animated logo
- Modern UI matching web app

## 🔧 Useful Commands

### Check Connected Devices
```bash
flutter devices
```

### Run with Hot Reload (Recommended)
```bash
flutter run
```
Then press:
- `r` - Hot reload (fast, preserves state)
- `R` - Hot restart (slower, resets state)
- `q` - Quit

### Run in Release Mode (Faster, for testing performance)
```bash
flutter run --release
```

### Clean Build (if you face issues)
```bash
flutter clean
flutter pub get
flutter run
```

### View Logs
```bash
flutter logs
```

### Build APK (for sharing/testing)
```bash
flutter build apk --release
```
APK will be in: `build/app/outputs/flutter-apk/app-release.apk`

## 📱 Testing the App

### Test Flow:
1. **Splash Screen** → Auto-navigates after 2 seconds
2. **Landing Screen** → Click "Book Now" or "Login"
3. **Login Screen** → Try Google Sign-In or Email/Password
4. **Home Screen** → Search trips, view bookings
5. **Booking Flow** → Select trip, choose seats, confirm

### Test Google Sign-In:
1. Click "Sign in with Google" button
2. Select your Google account
3. Should redirect to home screen
4. Check if user data is loaded

## 🎯 App Features to Test

### Landing Page:
- ✅ Animated logo and gradients
- ✅ Search form (requires login)
- ✅ Navigation to Login/Register
- ✅ Responsive design

### Login/Register:
- ✅ Google Sign-In (with your Client ID)
- ✅ Email/Password authentication
- ✅ Form validation
- ✅ Error handling

### Home Screen:
- ✅ Trip search
- ✅ View bookings
- ✅ User profile
- ✅ Logout

### Conductor Dashboard:
- ✅ View assigned trips
- ✅ Scan tickets
- ✅ Mark attendance

## 🐛 Troubleshooting

### Error: "No devices found"
**Solution:** Start an emulator or connect a physical device

### Error: "Gradle build failed"
**Solution:**
```bash
cd flutter/android
./gradlew clean
cd ../..
flutter clean
flutter pub get
flutter run
```

### Error: "Google Sign-In not working"
**Solution:** Make sure you added the SHA-1 fingerprint to Google Cloud Console

### App is slow/laggy
**Solution:** Run in release mode:
```bash
flutter run --release
```

### Hot reload not working
**Solution:** Press `R` for hot restart or restart the app

## 📊 Performance Tips

### For Best Performance:
1. Run in **release mode** for testing speed
2. Use **physical device** instead of emulator when possible
3. Close other apps to free up resources
4. Enable **hardware acceleration** in emulator settings

### For Development:
1. Use **debug mode** with hot reload
2. Keep **Flutter DevTools** open for debugging
3. Use **Android Studio** for better debugging experience

## 🎨 UI Customization

The app UI matches your web app with:
- Same color scheme (Pink, Green, Teal)
- Same gradients and shadows
- Same typography and spacing
- Same animations and transitions

To customize:
- Colors: `flutter/lib/utils/colors.dart`
- Theme: `flutter/lib/utils/theme.dart`
- Screens: `flutter/lib/screens/`

## 📱 Next Steps

1. **Test all features** on emulator/device
2. **Complete Google Sign-In setup** (add backend integration)
3. **Test booking flow** end-to-end
4. **Build release APK** for distribution
5. **Submit to Play Store** (optional)

## 🚀 Quick Start

```bash
# Navigate to flutter directory
cd flutter

# Get dependencies
flutter pub get

# Run on connected device/emulator
flutter run

# Or run on specific device
flutter run -d <device-id>

# Or run on Chrome for quick testing
flutter run -d chrome
```

---

**Your app is ready to run!** Just execute `flutter run` and see your animated logo and modern UI in action! 🎉
