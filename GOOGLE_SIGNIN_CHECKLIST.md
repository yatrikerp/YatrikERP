# Google Sign-In Setup Checklist ✅

## Your Details (Copy-Paste Ready)

```
SHA-1: DD:BC:C9:63:C2:6C:28:E2:7B:18:E6:32:A9:50:02:BB:1C:48:A1:FC
Package: com.yatrik.erp.yatrik_mobile
Project: yatrikerp
```

---

## 🎯 Task 1: Create Android OAuth Client (5 minutes)

### Step-by-Step:

1. **Open this link**: https://console.cloud.google.com/apis/credentials?project=yatrikerp
   - [ ] Link opened

2. **Click**: Blue "+ CREATE CREDENTIALS" button
   - [ ] Clicked

3. **Select**: "OAuth client ID"
   - [ ] Selected

4. **Choose**: Application type = "Android"
   - [ ] Selected Android

5. **Fill Name**: `Yatrik Android App`
   - [ ] Name entered

6. **Copy-Paste Package Name**:
   ```
   com.yatrik.erp.yatrik_mobile
   ```
   - [ ] Package name pasted

7. **Copy-Paste SHA-1**:
   ```
   DD:BC:C9:63:C2:6C:28:E2:7B:18:E6:32:A9:50:02:BB:1C:48:A1:FC
   ```
   - [ ] SHA-1 pasted

8. **Click**: "CREATE" button
   - [ ] Created successfully

9. **Verify**: You see "OAuth client created" message
   - [ ] Message appeared

---

## 🎯 Task 2: Enable Google Sign-In API (2 minutes)

### Step-by-Step:

1. **Open this link**: https://console.cloud.google.com/apis/library?project=yatrikerp
   - [ ] Link opened

2. **Search**: Type "Google Sign-In API" in search box
   - [ ] Searched

3. **Click**: On "Google Sign-In API" result
   - [ ] Clicked

4. **Click**: Blue "ENABLE" button
   - [ ] Enabled

5. **Verify**: Button changes to "MANAGE" or "API enabled"
   - [ ] Verified enabled

---

## 🎯 Task 3: Rebuild Flutter App (3 minutes)

### Commands to Run:

```cmd
cd flutter
flutter clean
flutter pub get
flutter run
```

### Checklist:

- [ ] Navigated to flutter directory
- [ ] Ran `flutter clean`
- [ ] Ran `flutter pub get`
- [ ] Ran `flutter run`
- [ ] App launched successfully

---

## 🎯 Task 4: Test Google Sign-In (1 minute)

### In the App:

1. **Open**: Login screen
   - [ ] Login screen visible

2. **Click**: "Sign in with Google" button
   - [ ] Button clicked

3. **Select**: Your Google account
   - [ ] Account selected

4. **Verify**: Success message appears
   - [ ] Success!

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Google account picker appears
- ✅ You can select an account
- ✅ App shows "Google Sign-In coming soon!" message
- ✅ No error messages

---

## ❌ Troubleshooting

### If you see "PlatformException(sign_in_failed)":
- Wait 5-10 minutes (Google needs time to propagate)
- Run `flutter clean` again
- Rebuild and test

### If you see "Error 10: Developer Error":
- Go back to Google Cloud Console
- Verify SHA-1 matches exactly: `DD:BC:C9:63:C2:6C:28:E2:7B:18:E6:32:A9:50:02:BB:1C:48:A1:FC`
- Verify package name: `com.yatrik.erp.yatrik_mobile`

### If you see "API not enabled":
- Go back to Task 2
- Make sure Google Sign-In API is enabled

---

## 📊 Progress Tracker

**Total Time**: ~11 minutes

- [ ] Task 1: Create Android OAuth Client (5 min)
- [ ] Task 2: Enable Google Sign-In API (2 min)
- [ ] Task 3: Rebuild Flutter App (3 min)
- [ ] Task 4: Test Google Sign-In (1 min)

---

## 🎉 When Complete

Once all tasks are checked:
1. Google Sign-In will work in your app
2. You can move to backend integration
3. Full authentication flow will be ready

---

## 📝 Notes

- Your backend .env is already configured ✅
- Your Flutter app already has the client ID ✅
- Only missing: Android OAuth client with SHA-1 ✅ (Task 1)

---

**Ready to start?** Begin with Task 1! 🚀
