# Final Google Sign-In Setup - Simple Version

## Current Status

✅ **Your Flutter app is READY** - Login and Register screens already have Google Sign-In buttons
✅ **Your code is READY** - All authentication logic is implemented
✅ **Your Android OAuth client exists** - Client ID: `your_google_client_id_here`
✅ **Your SHA-1 is ready** - `DD:BC:C9:63:C2:6C:28:E2:7B:18:E6:32:A9:50:02:BB:1C:48:A1:FC`

## What You Need: Just ONE File

You only need to get `google-services.json` from Firebase and place it in your project.

---

## Step 1: Go to Firebase Console

Open: https://console.firebase.google.com/

Sign in with your Google account.

---

## Step 2: Select Your Project

You should see a project list. Look for **yatrikerp**.

**If you see it**: Click on it → Go to Step 3

**If you DON'T see it**:
1. Click **"Add project"**
2. You'll see: **"Enter your project name"**
3. Start typing `yatrikerp`
4. You should see: **"Import Google Cloud project"** with `yatrikerp` listed
5. Select `yatrikerp`
6. Click **Continue**
7. Accept terms → Click **Continue**
8. Wait 30 seconds for setup

---

## Step 3: Add Android App

You should now be in your project dashboard.

Look for: **"Get started by adding Firebase to your app"**

Click the **Android icon** (🤖 robot icon)

**OR** if you don't see that:
1. Click the **⚙️ gear icon** next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"**
4. Click **"Add app"** → Select **Android**

---

## Step 4: Fill in the Form

```
Android package name: com.yatrik.erp.yatrik_mobile
```
(Copy and paste this exactly)

```
App nickname: YATRIK Mobile
```
(Optional - you can type anything)

```
Debug signing certificate SHA-1: DD:BC:C9:63:C2:6C:28:E2:7B:18:E6:32:A9:50:02:BB:1C:48:A1:FC
```
(Copy and paste this)

Click **"Register app"**

---

## Step 5: Download google-services.json

You'll see a big button: **"Download google-services.json"**

Click it. The file will download to your Downloads folder.

---

## Step 6: Move the File

Move `google-services.json` from your Downloads folder to:

```
D:\YATRIK ERP\flutter\android\app\google-services.json
```

**IMPORTANT**: It must be in the `app` folder!

```
flutter/
└── android/
    └── app/
        └── google-services.json  ← Put it here!
```

---

## Step 7: Click Through the Rest

Firebase will show more steps. Just click:
- **"Next"** (Add Firebase SDK) - Skip this, already done
- **"Next"** (Add initialization code) - Skip this, already done  
- **"Continue to console"**

---

## Step 8: Rebuild Your App

Open Command Prompt or PowerShell:

```bash
cd D:\YATRIK ERP\flutter
flutter clean
flutter pub get
flutter build apk --debug
```

Wait for it to finish (takes 2-3 minutes).

---

## Step 9: Install on Your Device

```bash
flutter install
```

Or copy the APK to your phone:
```
D:\YATRIK ERP\flutter\build\app\outputs\flutter-apk\app-debug.apk
```

---

## Step 10: Test Google Sign-In

1. Open YATRIK app
2. Go to **Login** screen
3. You'll see **"Continue with Google"** button
4. Tap it
5. Select your Google account
6. Grant permissions
7. Should redirect to home screen ✅

**OR** try from Register screen:
1. Go to **Register** screen
2. You'll see **"Sign up with Google"** button
3. Tap it
4. Same flow as above

---

## What's Already Done

I already updated these files for you:

✅ `flutter/lib/services/auth_service.dart` - Google Sign-In service
✅ `flutter/lib/providers/auth_provider.dart` - Authentication provider
✅ `flutter/lib/screens/auth/login_screen.dart` - Has Google button
✅ `flutter/lib/screens/auth/register_screen.dart` - Has Google button
✅ `backend/routes/auth.js` - Backend Google auth endpoint
✅ `flutter/android/build.gradle` - Google Services plugin
✅ `flutter/android/app/build.gradle` - Google Services applied

---

## Troubleshooting

### Error: "PlatformException: sign_in_failed"

**Cause**: google-services.json not found or SHA-1 not added

**Fix**:
1. Check file exists: `flutter/android/app/google-services.json`
2. Go to Firebase → Project Settings → Your apps → Android
3. Verify SHA-1 is listed
4. If not, add it: `DD:BC:C9:63:C2:6C:28:E2:7B:18:E6:32:A9:50:02:BB:1C:48:A1:FC`
5. Wait 5 minutes
6. Rebuild: `flutter clean && flutter build apk`

### Error: "Google Sign-In cancelled"

**Cause**: User pressed back button

**Fix**: This is normal, not an error

### Error: "Failed to build APK"

**Cause**: google-services.json in wrong location

**Fix**: Must be in `flutter/android/app/` not `flutter/android/`

### Google button doesn't appear

**Cause**: Old build cached

**Fix**: Run `flutter clean` then rebuild

---

## Quick Checklist

- [ ] Went to Firebase Console
- [ ] Selected/imported project: yatrikerp
- [ ] Added Android app
- [ ] Entered package: `com.yatrik.erp.yatrik_mobile`
- [ ] Entered SHA-1: `DD:BC:C9:63:C2:6C:28:E2:7B:18:E6:32:A9:50:02:BB:1C:48:A1:FC`
- [ ] Downloaded google-services.json
- [ ] Placed in: `flutter/android/app/google-services.json`
- [ ] Ran: `flutter clean && flutter pub get`
- [ ] Built: `flutter build apk --debug`
- [ ] Installed on device
- [ ] Tested Google Sign-In

---

## Summary

You only need to do 3 things:

1. **Get google-services.json from Firebase** (Steps 1-7)
2. **Place it in flutter/android/app/** (Step 6)
3. **Rebuild app** (Steps 8-9)

Everything else is already done! The login and register screens already have Google Sign-In buttons with full functionality.

After you place the file and rebuild, Google Sign-In will work immediately! 🚀

---

## Need Help?

If you get stuck:

1. Check if `google-services.json` exists in `flutter/android/app/`
2. Run `flutter clean && flutter pub get && flutter build apk`
3. Check logs: `flutter logs` (look for 🔵, ✅, ❌ messages)
4. Verify SHA-1 is in Firebase Console

That's it! Simple as that.
