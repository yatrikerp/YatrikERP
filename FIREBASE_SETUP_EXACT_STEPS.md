# Firebase Setup - Exact Step-by-Step Guide

## IMPORTANT: Use Your Existing Project!

**DO NOT create a new project!** You already have project `yatrikerp` in Google Cloud Console. Firebase will show the same project.

---

## Step-by-Step Instructions

### Step 1: Go to Firebase Console

Open your browser and go to:
```
https://console.firebase.google.com/
```

---

### Step 2: Sign In

Sign in with the same Google account you used for Google Cloud Console.

---

### Step 3: Look for Your Existing Project

You should see a list of projects. Look for:
- **Project name**: `yatrikerp` or `YatrikERP`
- **Project ID**: `yatrikerp`

**If you see it**: Click on it → Go to Step 4

**If you DON'T see it**: 
- Click **"Add project"**
- You'll see an option: **"Import a Google Cloud project"**
- Select your project: `yatrikerp`
- Click **Continue**
- Accept terms → Click **Continue**
- Wait for Firebase to set up (takes 30 seconds)

---

### Step 4: You're Now in Your Project Dashboard

You should see:
```
Project Overview
├── Get started by adding Firebase to your app
└── [Icons for iOS, Android, Web, Unity, Flutter]
```

---

### Step 5: Click the Android Icon

Look for the Android robot icon (🤖) and click it.

OR if you don't see icons:
- Click the **⚙️ gear icon** (Settings) next to "Project Overview"
- Click **"Project settings"**
- Scroll down to **"Your apps"** section
- Click **"Add app"** → Select **Android**

---

### Step 6: Register Android App

Fill in the form with these EXACT values:

```
Android package name: com.yatrik.erp.yatrik_mobile
```
(This MUST match exactly - copy and paste it)

```
App nickname (optional): YATRIK Mobile
```
(You can type anything here or leave it blank)

```
Debug signing certificate SHA-1 (optional): DD:BC:C9:63:C2:6C:28:E2:7B:18:E6:32:A9:50:02:BB:1C:48:A1:FC
```
(Copy and paste this SHA-1)

Click **"Register app"**

---

### Step 7: Download google-services.json

After registering, you'll see:

```
Download google-services.json
[Download google-services.json button]
```

Click the **"Download google-services.json"** button.

The file will download to your Downloads folder.

---

### Step 8: Place the File in Your Flutter Project

Move the downloaded file to:
```
D:\YATRIK ERP\flutter\android\app\google-services.json
```

**Important**: The file MUST be in the `app` folder, not the `android` folder!

Correct location:
```
flutter/
└── android/
    └── app/
        └── google-services.json  ← HERE
```

---

### Step 9: Click "Next" Through Remaining Steps

Firebase will show you SDK setup instructions. You can skip these because I already configured them.

Just click:
- **"Next"** (Add Firebase SDK)
- **"Next"** (Add initialization code)
- **"Continue to console"**

---

### Step 10: Verify SHA-1 is Added

Back in Firebase Console:
1. Click **⚙️ gear icon** → **"Project settings"**
2. Scroll down to **"Your apps"** section
3. Click on your Android app (YATRIK Mobile)
4. Scroll to **"SHA certificate fingerprints"**
5. You should see your SHA-1 listed: `DD:BC:C9:63:C2:6C:28:E2:7B:18:E6:32:A9:50:02:BB:1C:48:A1:FC`

**If it's NOT there**:
- Click **"Add fingerprint"**
- Paste: `DD:BC:C9:63:C2:6C:28:E2:7B:18:E6:32:A9:50:02:BB:1C:48:A1:FC`
- Click **"Save"**

---

### Step 11: Rebuild Your Flutter App

Open terminal/command prompt:

```bash
cd D:\YATRIK ERP\flutter
flutter clean
flutter pub get
flutter build apk --debug
```

---

### Step 12: Install and Test

Install on your device:
```bash
flutter install
```

Or manually install the APK from:
```
D:\YATRIK ERP\flutter\build\app\outputs\flutter-apk\app-debug.apk
```

---

### Step 13: Test Google Sign-In

1. Open YATRIK app
2. Go to Login screen
3. Tap **"Continue with Google"**
4. Select your Google account
5. Should redirect to home screen ✅

---

## Visual Guide

### What You'll See in Firebase Console:

**Step 3 - Project List:**
```
┌─────────────────────────────────┐
│ Your Firebase projects          │
├─────────────────────────────────┤
│ ○ yatrikerp                     │  ← Click this!
│   Project ID: yatrikerp         │
└─────────────────────────────────┘
```

**Step 5 - Add App:**
```
┌─────────────────────────────────┐
│ Get started by adding Firebase  │
│ to your app                     │
├─────────────────────────────────┤
│  [iOS]  [Android]  [Web]        │  ← Click Android
└─────────────────────────────────┘
```

**Step 6 - Register Form:**
```
┌─────────────────────────────────────────┐
│ Add Firebase to your Android app       │
├─────────────────────────────────────────┤
│ Android package name *                  │
│ [com.yatrik.erp.yatrik_mobile]         │
│                                         │
│ App nickname (optional)                 │
│ [YATRIK Mobile]                         │
│                                         │
│ Debug signing certificate SHA-1         │
│ [DD:BC:C9:63:C2:6C:28:E2:7B:18:E6:32...│
│                                         │
│         [Register app]                  │
└─────────────────────────────────────────┘
```

---

## Common Questions

### Q: Do I create a new Firebase project?
**A**: NO! Use your existing project `yatrikerp`

### Q: What if I don't see my project in Firebase?
**A**: Click "Add project" → "Import a Google Cloud project" → Select `yatrikerp`

### Q: Can I use a different project name?
**A**: NO! You must use the same project to keep everything connected

### Q: What if I already created a new Firebase project by mistake?
**A**: Delete it and use the existing `yatrikerp` project instead

### Q: Where exactly do I put google-services.json?
**A**: `D:\YATRIK ERP\flutter\android\app\google-services.json`

### Q: Do I need to change any code?
**A**: NO! I already updated all the code. Just add the file and rebuild.

---

## Checklist

- [ ] Opened Firebase Console
- [ ] Found/imported existing project: `yatrikerp`
- [ ] Clicked Android icon to add app
- [ ] Entered package name: `com.yatrik.erp.yatrik_mobile`
- [ ] Entered SHA-1: `DD:BC:C9:63:C2:6C:28:E2:7B:18:E6:32:A9:50:02:BB:1C:48:A1:FC`
- [ ] Downloaded google-services.json
- [ ] Placed file in: `flutter/android/app/google-services.json`
- [ ] Verified SHA-1 is in Firebase settings
- [ ] Ran `flutter clean && flutter pub get`
- [ ] Built APK: `flutter build apk --debug`
- [ ] Installed and tested app

---

## Summary

1. Go to Firebase Console
2. Use EXISTING project: `yatrikerp` (don't create new!)
3. Add Android app with package: `com.yatrik.erp.yatrik_mobile`
4. Add SHA-1: `DD:BC:C9:63:C2:6C:28:E2:7B:18:E6:32:A9:50:02:BB:1C:48:A1:FC`
5. Download google-services.json
6. Place in: `flutter/android/app/google-services.json`
7. Rebuild: `flutter clean && flutter build apk`
8. Test!

That's it! 🚀
