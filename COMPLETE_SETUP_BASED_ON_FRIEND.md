# Complete Google Sign-In Setup (Based on Your Friend's Working Setup)

## What You Were Missing!

Your friend's guide revealed TWO critical steps you haven't done:

1. ❌ **Enable Google Sign-In in Firebase Authentication** (This is why it fails!)
2. ❌ **Use Web Client ID in code** (Need to add this after Firebase setup)

---

## Complete Step-by-Step (Following Your Friend's Guide)

### Step 1: Go to Firebase Console ✅

https://console.firebase.google.com/

Sign in and select/import your project: **yatrikerp**

---

### Step 2: Add Android App in Firebase ✅

1. Firebase Console → **⚙️ Settings** → **Project settings**
2. Scroll to **"Your apps"**
3. Click **"Add app"** → Select **Android**
4. Fill in:
   ```
   Package name: com.yatrik.erp.yatrik_mobile
   App nickname: YATRIK Mobile
   SHA-1: DD:BC:C9:63:C2:6C:28:E2:7B:18:E6:32:A9:50:02:BB:1C:48:A1:FC
   ```
5. Click **"Register app"**
6. **Download google-services.json**

---

### Step 3: ⚠️ ENABLE Google Sign-In in Firebase Authentication (YOU MISSED THIS!)

**This is the critical step your friend emphasized!**

1. Firebase Console → **Authentication** (left sidebar)
2. Click **"Sign-in method"** tab
3. Find **Google** in the list
4. Click on it
5. Toggle **"Enable"** switch to ON
6. Select a **support email** (your email)
7. Click **"Save"**

> ❌ **If you skip this step, Google Sign-In will fail silently!**

---

### Step 4: Place google-services.json ✅

Place the file at:
```
D:\YATRIK ERP\flutter\android\app\google-services.json
```

**Correct location:**
```
flutter/
└── android/
    └── app/
        └── google-services.json  ← HERE (not in android/ root!)
```

---

### Step 5: Gradle Configuration ✅ (Already Done)

I already configured this for you:
- ✅ `android/build.gradle` has Google Services plugin
- ✅ `android/app/build.gradle` applies the plugin

---

### Step 6: Get Web Client ID

**This is what your friend uses in his code!**

1. Go to: https://console.cloud.google.com/apis/credentials?project=yatrikerp
2. Look for **"Web client (auto created by Google Service)"**
3. Click on it
4. Copy the **Client ID** (looks like: `889305333159-xxxxx.apps.googleusercontent.com`)

**Alternative way:**
1. Firebase Console → **⚙️ Settings** → **Project settings**
2. Scroll to **"Your apps"** → Click your Android app
3. Scroll to **"Web API Key"** section
4. You'll see the Web Client ID there

---

### Step 7: Update Flutter Code with Web Client ID

Open: `flutter/lib/services/auth_service.dart`

Find this line:
```dart
clientId: 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',
```

Replace with your actual Web Client ID from Step 6:
```dart
clientId: '889305333159-xxxxx.apps.googleusercontent.com',  // Your actual Web Client ID
```

---

### Step 8: Rebuild App

```bash
cd D:\YATRIK ERP\flutter
flutter clean
flutter pub get
flutter build apk --debug
flutter install
```

---

### Step 9: Test

1. Open YATRIK app
2. Go to Login screen
3. Tap "Continue with Google"
4. Select Google account
5. Should work! ✅

---

## Complete Checklist (Based on Your Friend's Guide)

- [ ] Firebase project created/imported (yatrikerp)
- [ ] Android app registered in Firebase
- [ ] Package name: `com.yatrik.erp.yatrik_mobile`
- [ ] SHA-1 added: `DD:BC:C9:63:C2:6C:28:E2:7B:18:E6:32:A9:50:02:BB:1C:48:A1:FC`
- [ ] **Google Sign-In ENABLED in Firebase Authentication** ⚠️ CRITICAL!
- [ ] google-services.json downloaded (after adding SHA-1)
- [ ] google-services.json placed in `flutter/android/app/`
- [ ] Web Client ID obtained from Google Cloud Console
- [ ] Web Client ID added to `auth_service.dart`
- [ ] Ran `flutter clean && flutter pub get`
- [ ] Built APK: `flutter build apk --debug`
- [ ] Tested on device

---

## What Your Friend Does Differently

### Your Friend's Code:
```dart
final GoogleSignIn _googleSignIn = GoogleSignIn(
  scopes: ['email', 'profile'],
  clientId: 'WEB_CLIENT_ID.apps.googleusercontent.com',  // ← Uses Web Client ID
);
```

### What I Set Up Initially (Wrong):
```dart
final GoogleSignIn _googleSignIn = GoogleSignIn(
  scopes: ['email', 'profile'],
  // No clientId - this was the issue!
);
```

---

## Key Points from Your Friend's Guide

1. **SHA-1 must be added BEFORE downloading google-services.json**
   - If you add SHA-1 later, re-download the file!

2. **Enable Google Sign-In in Firebase Authentication**
   - This is mandatory, not optional!

3. **Use Web Client ID, NOT Android Client ID**
   - Common mistake: using wrong client ID

4. **google-services.json location is critical**
   - Must be in `android/app/`, not `android/`

---

## Common Errors (From Your Friend's Guide)

### `PlatformException(sign_in_failed)`
- SHA-1 not in Firebase → Add it
- google-services.json outdated → Re-download after adding SHA-1
- **Google Sign-In not enabled** → Enable in Firebase Authentication
- Package name mismatch → Check all match

### `ApiException: 10`
- SHA-1 mismatch
- Missing Google Services plugin (already fixed)

### `ApiException: 12500`
- **Google Sign-In not enabled in Firebase Authentication** ← Most likely your issue!
- Support email not configured

### Sign-In Button Does Nothing
- Wrong clientId (must be Web Client ID)
- Google Sign-In not enabled in Firebase

---

## Summary of What You Need to Do

### Already Done ✅:
- Flutter code structure
- Gradle configuration
- Login/Register screens with Google buttons

### You Need to Do ⚠️:
1. **Go to Firebase Console**
2. **Add Android app** (if not done)
3. **Download google-services.json**
4. **Place in flutter/android/app/**
5. **Enable Google Sign-In in Firebase Authentication** ← CRITICAL!
6. **Get Web Client ID from Google Cloud Console**
7. **Update auth_service.dart with Web Client ID**
8. **Rebuild app**

Total time: ~15 minutes

---

## Quick Commands

```bash
# 1. Clean project
cd D:\YATRIK ERP\flutter
flutter clean

# 2. Get dependencies
flutter pub get

# 3. Build APK
flutter build apk --debug

# 4. Install on device
flutter install

# 5. Check logs
flutter logs
```

---

## Next Steps

1. Follow Steps 1-9 above
2. Pay special attention to Step 3 (Enable Google Sign-In in Firebase)
3. Don't forget Step 6-7 (Get and add Web Client ID)
4. Test and check logs

Your friend's setup works because he did ALL these steps. You were missing Step 3 (Enable in Firebase) and Step 6-7 (Web Client ID).

Good luck! 🚀
