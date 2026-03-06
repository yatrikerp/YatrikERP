# Google Sign-In Flutter Setup Guide

## Issues Found & Fixed

### Code Issues (FIXED ✅)
1. ✅ Missing `auth_service.dart` - Created with Google Sign-In integration
2. ✅ Incomplete Google Sign-In in register screen - Now properly integrated with backend
3. ✅ Missing Google Sign-In button in login screen - Added with full functionality
4. ✅ No backend route for Google auth - Added `/api/auth/google` endpoint
5. ✅ AuthProvider missing Google Sign-In method - Added `signInWithGoogle()`

### Configuration Issues (NEEDS YOUR ACTION ⚠️)
1. ⚠️ Missing `google-services.json` for Android
2. ⚠️ OAuth client type mismatch (using "installed" instead of "web")
3. ⚠️ Need to configure SHA-1 fingerprint in Google Cloud Console

---

## What Was Fixed in Code

### 1. Created `flutter/lib/services/auth_service.dart`
- Handles Google Sign-In flow
- Sends authentication data to backend
- Manages Google Sign-Out

### 2. Updated `flutter/lib/providers/auth_provider.dart`
- Added `signInWithGoogle()` method
- Integrates with AuthService
- Handles token storage and user data

### 3. Updated `flutter/lib/screens/auth/login_screen.dart`
- Added "Continue with Google" button
- Handles role-based navigation (passenger/conductor only)
- Shows appropriate error messages

### 4. Updated `flutter/lib/screens/auth/register_screen.dart`
- Fixed Google Sign-Up button to use backend integration
- Removed placeholder code
- Proper error handling

### 5. Added Backend Route `backend/routes/auth.js`
- New endpoint: `POST /api/auth/google`
- Handles both login and registration
- Creates passenger accounts automatically
- Sends welcome emails

---

## Google Cloud Console Setup (REQUIRED)

### Step 1: Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `yatrikerp`
3. Navigate to: **APIs & Services** → **Credentials**

### Step 2: Create Android OAuth Client

1. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
2. Select **Application type**: **Android**
3. Fill in:
   - **Name**: `YATRIK Android App`
   - **Package name**: `com.yatrik.erp.yatrik_mobile`
   - **SHA-1 certificate fingerprint**: (see below how to get it)

### Step 3: Get SHA-1 Fingerprint

#### For Debug Build (Development):
```bash
cd flutter/android
./gradlew signingReport
```

Or on Windows:
```cmd
cd flutter\android
gradlew.bat signingReport
```

Look for the **SHA-1** under `Variant: debug` and copy it.

#### For Release Build (Production):
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Step 4: Create Web OAuth Client (for serverClientId)

1. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
2. Select **Application type**: **Web application**
3. Fill in:
   - **Name**: `YATRIK Web Client`
   - **Authorized redirect URIs**: `http://localhost:5000/api/auth/google/callback`
4. Click **CREATE**
5. **IMPORTANT**: Copy the **Client ID** (looks like: `889305333159-xxxxx.apps.googleusercontent.com`)

### Step 5: Download google-services.json

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Click the **Android icon** to add Android app
4. Enter package name: `com.yatrik.erp.yatrik_mobile`
5. Download `google-services.json`
6. Place it in: `flutter/android/app/google-services.json`

---

## Update Flutter Configuration

### 1. Update `auth_service.dart` with Web Client ID

Open `flutter/lib/services/auth_service.dart` and replace the `serverClientId`:

```dart
final GoogleSignIn _googleSignIn = GoogleSignIn(
  scopes: ['email', 'profile'],
  serverClientId: 'YOUR_WEB_CLIENT_ID_HERE', // Replace with Web OAuth Client ID from Step 4
);
```

### 2. Add google-services.json

Place the downloaded `google-services.json` in:
```
flutter/android/app/google-services.json
```

### 3. Update build.gradle (if needed)

Check `flutter/android/build.gradle` has Google Services plugin:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

Check `flutter/android/app/build.gradle` applies the plugin:

```gradle
apply plugin: 'com.google.gms.google-services'
```

---

## Testing Google Sign-In

### 1. Clean and Rebuild
```bash
cd flutter
flutter clean
flutter pub get
flutter build apk --debug
```

### 2. Install on Device
```bash
flutter install
```

### 3. Test Flow

1. Open the app
2. Go to Login or Register screen
3. Tap "Continue with Google" or "Sign up with Google"
4. Select your Google account
5. Grant permissions
6. Should redirect to home screen

### 4. Check Backend Logs

The backend should log:
```
📧 Welcome email queued for passenger: user@gmail.com
```

---

## Troubleshooting

### Error: "Sign in failed: PlatformException"

**Cause**: SHA-1 fingerprint not configured or wrong package name

**Fix**:
1. Get SHA-1 fingerprint: `cd flutter/android && ./gradlew signingReport`
2. Add it to Google Cloud Console OAuth Android client
3. Wait 5-10 minutes for changes to propagate
4. Rebuild app: `flutter clean && flutter build apk`

### Error: "Google Sign-In cancelled"

**Cause**: User cancelled the sign-in flow

**Fix**: This is normal user behavior, no action needed

### Error: "serverAuthCode is null"

**Cause**: Missing or wrong `serverClientId` in `auth_service.dart`

**Fix**:
1. Get Web OAuth Client ID from Google Cloud Console
2. Update `serverClientId` in `auth_service.dart`
3. Rebuild app

### Error: "API not enabled"

**Cause**: Google Sign-In API not enabled in Google Cloud Console

**Fix**:
1. Go to Google Cloud Console
2. Navigate to **APIs & Services** → **Library**
3. Search for "Google Sign-In API"
4. Click **ENABLE**

### Error: "Invalid audience"

**Cause**: Using wrong OAuth client type

**Fix**:
1. Make sure you created **Android** OAuth client (not iOS or Web)
2. Package name must match: `com.yatrik.erp.yatrik_mobile`
3. SHA-1 must be from your debug keystore

---

## Quick Checklist

- [ ] Created Android OAuth Client in Google Cloud Console
- [ ] Added SHA-1 fingerprint to Android OAuth Client
- [ ] Created Web OAuth Client for serverClientId
- [ ] Downloaded google-services.json from Firebase
- [ ] Placed google-services.json in `flutter/android/app/`
- [ ] Updated serverClientId in `auth_service.dart`
- [ ] Ran `flutter clean && flutter pub get`
- [ ] Rebuilt app: `flutter build apk --debug`
- [ ] Tested Google Sign-In on device

---

## Current Configuration

### Backend (.env)
```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### Flutter Package
```yaml
google_sign_in: ^6.2.1
```

### Android Package Name
```
com.yatrik.erp.yatrik_mobile
```

---

## What Happens When User Signs In

1. User taps "Continue with Google"
2. Google Sign-In dialog opens
3. User selects account and grants permissions
4. Flutter receives: `idToken`, `accessToken`, `email`, `name`, `photoUrl`
5. Flutter sends data to: `POST http://localhost:5000/api/auth/google`
6. Backend checks if user exists:
   - **Exists**: Login user, return token
   - **New**: Create passenger account, send welcome email, return token
7. Flutter saves token and user data
8. Navigate to home screen (passenger) or conductor dashboard

---

## Support

If you encounter issues:

1. Check backend logs: `cd backend && npm start`
2. Check Flutter logs: `flutter logs`
3. Verify Google Cloud Console configuration
4. Ensure SHA-1 fingerprint matches your keystore
5. Wait 5-10 minutes after making changes in Google Cloud Console

---

## Next Steps

1. Complete Google Cloud Console setup (Steps 1-5 above)
2. Update `serverClientId` in `auth_service.dart`
3. Add `google-services.json` to `flutter/android/app/`
4. Clean and rebuild: `flutter clean && flutter build apk`
5. Test on device

Your Google Sign-In implementation is now complete! 🎉
