# Fix Google Services Error - Quick Solution

## ❌ Current Error
```
File google-services.json is missing.
The Google Services Plugin cannot function without it.
```

## 🎯 Quick Fix Options

### Option 1: Remove Google Sign-In (Run App Immediately) ⚡

This will let you run the app RIGHT NOW without Google Sign-In.

**Step 1: Comment out Google Services plugin**

Edit `flutter/android/app/build.gradle`:

Find this line (around line 2-3):
```gradle
apply plugin: 'com.google.gms.google-services'
```

Comment it out:
```gradle
// apply plugin: 'com.google.gms.google-services'
```

**Step 2: Run the app**
```bash
cd flutter
flutter run
```

✅ App will run without Google Sign-In
✅ Email/password login will still work
✅ All other features work normally

---

### Option 2: Get google-services.json from Firebase (Proper Fix) 🔧

**Step 1: Go to Firebase Console**
1. Visit: https://console.firebase.google.com/
2. Select project: `yatrikerp`
3. Click the gear icon ⚙️ → Project settings

**Step 2: Add Android App (if not already added)**
1. Click "Add app" → Android icon
2. Android package name: `com.example.yatrik_erp` (check your build.gradle)
3. App nickname: "Yatrik ERP"
4. Click "Register app"

**Step 3: Download google-services.json**
1. Click "Download google-services.json"
2. Save the file

**Step 4: Place the file**
Copy `google-services.json` to:
```
flutter/android/app/google-services.json
```

**Step 5: Run the app**
```bash
cd flutter
flutter run
```

---

## 🚀 Recommended: Option 1 (Quick Fix)

Since you want to test the autonomous scheduling system, I recommend Option 1 to get the app running immediately. You can add Google Sign-In later.

### Quick Commands:

```bash
# Navigate to flutter directory
cd flutter

# Edit build.gradle (comment out the google services line)
# Then run:
flutter clean
flutter pub get
flutter run
```

---

## 📱 What You'll Have After Option 1:

✅ Flutter app runs on your phone
✅ Login with email/password works
✅ All features accessible:
   - Passenger booking
   - Conductor dashboard
   - Admin dashboard
   - AI scheduling features
✅ No Google Sign-In (can add later)

---

## 🔍 Check Your Package Name

Before Option 2, verify your package name in:
`flutter/android/app/build.gradle`

Look for:
```gradle
defaultConfig {
    applicationId "com.example.yatrik_erp"  // ← This is your package name
}
```

Use this exact package name when adding the Android app in Firebase.

---

## ⚡ Do This NOW:

1. Open `flutter/android/app/build.gradle`
2. Find line: `apply plugin: 'com.google.gms.google-services'`
3. Comment it: `// apply plugin: 'com.google.gms.google-services'`
4. Save file
5. Run: `flutter run`

Your app will start immediately! 🎉

---

**Status**: Quick fix ready
**Time to fix**: 30 seconds
**Impact**: App runs without Google Sign-In
