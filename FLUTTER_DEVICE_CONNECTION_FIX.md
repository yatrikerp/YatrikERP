# Flutter Device Connection Fix - ADB Device Offline

## Problem
```
Error: ADB exited with exit code 1
adb.exe: device offline
Error launching application on moto g 40 fusion.
```

## Quick Fixes

### Fix 1: Restart ADB Server (Fastest)
```bash
# Stop ADB server
adb kill-server

# Start ADB server
adb start-server

# Check connected devices
adb devices
```

### Fix 2: Reconnect USB Cable
1. Unplug USB cable from phone
2. Wait 5 seconds
3. Plug USB cable back in
4. Check if device appears:
```bash
adb devices
```

### Fix 3: Revoke USB Debugging Authorization
1. On your phone:
   - Go to **Settings** → **Developer Options**
   - Find **Revoke USB debugging authorizations**
   - Tap it
2. Unplug and replug USB cable
3. Accept the USB debugging prompt on phone
4. Check connection:
```bash
adb devices
```

### Fix 4: Change USB Connection Mode
1. When phone is connected, pull down notification shade
2. Tap on "USB" notification
3. Select **File Transfer** or **PTP** mode
4. Check connection:
```bash
adb devices
```

### Fix 5: Restart Phone
1. Restart your Moto G 40 Fusion
2. Reconnect USB cable
3. Accept USB debugging prompt
4. Check connection:
```bash
adb devices
```

### Fix 6: Use Wireless Debugging (Android 11+)
```bash
# On phone: Settings → Developer Options → Wireless debugging
# Note the IP address and port (e.g., 192.168.1.100:5555)

# On computer:
adb tcpip 5555
adb connect 192.168.1.100:5555

# Verify connection
adb devices

# Run Flutter app
flutter run
```

## Verify Device Connection

### Check Device Status
```bash
# List all devices
adb devices

# Should show:
# List of devices attached
# <device-id>    device
```

### Check Flutter Devices
```bash
# List Flutter-recognized devices
flutter devices

# Should show your Moto G 40 Fusion
```

## Run Flutter App After Fix

### Option 1: Run with Device Selection
```bash
cd D:\YATRIK ERP\flutter
flutter run -d <device-id>
```

### Option 2: Run with Auto-selection
```bash
cd D:\YATRIK ERP\flutter
flutter run
```

### Option 3: Run in Release Mode (Faster)
```bash
cd D:\YATRIK ERP\flutter
flutter run --release
```

## Common Issues & Solutions

### Issue: "No devices found"
**Solution:**
1. Enable Developer Options on phone
2. Enable USB Debugging
3. Connect USB cable
4. Accept debugging prompt

### Issue: "Unauthorized device"
**Solution:**
1. Check phone screen for authorization prompt
2. Tap "Allow" or "OK"
3. Check "Always allow from this computer"

### Issue: "Device offline" persists
**Solution:**
1. Try different USB cable
2. Try different USB port on computer
3. Update USB drivers
4. Restart both phone and computer

### Issue: Build succeeds but install fails
**Solution:**
```bash
# Clear Flutter cache
flutter clean

# Get dependencies
flutter pub get

# Rebuild
flutter run
```

## Alternative: Use Android Emulator

If physical device issues persist, use an emulator:

```bash
# List available emulators
flutter emulators

# Launch an emulator
flutter emulators --launch <emulator-id>

# Run app on emulator
flutter run
```

## Testing the Passenger Dashboard

Once device is connected:

```bash
# Navigate to Flutter directory
cd D:\YATRIK ERP\flutter

# Run the app
flutter run

# Or run in release mode for better performance
flutter run --release
```

### Test Credentials
Use these credentials to test the passenger dashboard:
- **Email:** passenger@example.com
- **Password:** password123

### What to Test
1. ✅ Login with passenger credentials
2. ✅ View dashboard with welcome message
3. ✅ Check upcoming trips
4. ✅ Browse popular routes
5. ✅ Search for trips
6. ✅ View search results
7. ✅ Check My Trips tab
8. ✅ View and edit profile
9. ✅ Check wallet balance
10. ✅ Test all navigation

## Performance Tips

### For Faster Development
```bash
# Use hot reload (press 'r' in terminal)
# Use hot restart (press 'R' in terminal)
# Use release mode for final testing
flutter run --release
```

### For Debugging
```bash
# Run with verbose logging
flutter run -v

# Check logs
flutter logs
```

## Still Having Issues?

### Check ADB Version
```bash
adb version
```

### Update Flutter
```bash
flutter upgrade
flutter doctor
```

### Check USB Drivers
1. Open Device Manager (Windows)
2. Look for your phone under "Portable Devices"
3. If yellow warning, update drivers

### Last Resort
1. Uninstall and reinstall ADB
2. Update Android SDK Platform Tools
3. Try a different computer

## Success Indicators

You'll know it's working when:
1. ✅ `adb devices` shows "device" (not "offline")
2. ✅ `flutter devices` lists your phone
3. ✅ `flutter run` starts building
4. ✅ App installs and launches on phone

## Quick Command Reference

```bash
# ADB Commands
adb kill-server          # Stop ADB
adb start-server         # Start ADB
adb devices              # List devices
adb reconnect            # Reconnect device

# Flutter Commands
flutter devices          # List devices
flutter run              # Run app
flutter clean            # Clean build
flutter doctor           # Check setup
```

## Contact Support

If none of these solutions work:
1. Check Flutter GitHub issues
2. Check device-specific forums
3. Try a different Android device
4. Use an emulator for development

---

**Note:** The "device offline" error is usually temporary and can be fixed with a simple ADB restart or USB reconnection. Don't worry, your code is fine!
