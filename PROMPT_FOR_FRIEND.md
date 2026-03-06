# Prompt to Send to Your Friend

Copy and paste this to your friend:

---

Hey! I need help setting up Google Sign-In in my Flutter Android app. It's not working for me but you said yours works. Can you help me understand your exact setup?

Here's my current situation:

**My Flutter App Details:**
- Package name: `com.yatrik.erp.yatrik_mobile`
- I have `google_sign_in: ^6.2.1` in pubspec.yaml
- My SHA-1 fingerprint: `DD:BC:C9:63:C2:6C:28:E2:7B:18:E6:32:A9:50:02:BB:1C:48:A1:FC`
- Project ID: `yatrikerp`

**What I need to know:**

1. **Firebase Setup:**
   - Did you create a Firebase project or use an existing Google Cloud project?
   - Where did you download `google-services.json` from?
   - Where exactly did you place the `google-services.json` file in your Flutter project?

2. **SHA-1 Configuration:**
   - Where did you add your SHA-1 fingerprint? (Firebase Console or Google Cloud Console?)
   - Did you add it during Android app registration or separately?

3. **OAuth Clients:**
   - Did you create any OAuth clients in Google Cloud Console?
   - If yes, what type? (Android, Web, or both?)
   - Do you use `serverClientId` parameter in your GoogleSignIn configuration?

4. **Code Setup:**
   - Can you share your `GoogleSignIn` initialization code?
   - Do you have any special configuration in `android/build.gradle` or `android/app/build.gradle`?

5. **Testing:**
   - When you tap the Google Sign-In button, what happens?
   - Does it open Google account selector immediately?
   - Any specific steps you did that made it work?

**My Current Error:**
[Describe your error here - e.g., "PlatformException: sign_in_failed" or "Button doesn't do anything"]

**What I've Already Done:**
- Added `google_sign_in` package to pubspec.yaml
- Created Android OAuth client in Google Cloud Console
- Got my SHA-1 fingerprint using keytool

**What I'm Confused About:**
- Do I need to set up Firebase separately even though I have Google Cloud Console OAuth?
- Is `google-services.json` mandatory or optional?
- Should I use `serverClientId` parameter or leave it empty?

Can you walk me through your exact setup step-by-step? Even small details would help!

Thanks! 🙏

---

## Alternative Shorter Version

If you want a shorter prompt:

---

Hey! Your Flutter Google Sign-In works but mine doesn't. Can you help?

**Quick questions:**
1. Where did you get `google-services.json`? (Firebase or Google Cloud Console?)
2. Where did you place it in your project? (exact folder path)
3. Did you add SHA-1 to Firebase or Google Cloud Console?
4. Do you use `serverClientId` in your GoogleSignIn code?
5. Any special gradle configuration?

My package: `com.yatrik.erp.yatrik_mobile`
My SHA-1: `DD:BC:C9:63:C2:6C:28:E2:7B:18:E6:32:A9:50:02:BB:1C:48:A1:FC`

Can you share your exact setup steps? Thanks! 🙏

---

## What to Ask For

Ask your friend to share:

1. **Screenshot of Firebase Console** showing:
   - Project settings → Your apps → Android app configuration
   - SHA certificate fingerprints section

2. **File location** of google-services.json:
   - Ask: "Can you show me the exact folder path where you placed google-services.json?"

3. **Code snippet** of GoogleSignIn initialization:
   ```dart
   final GoogleSignIn _googleSignIn = GoogleSignIn(
     // What parameters do you have here?
   );
   ```

4. **build.gradle files**:
   - Ask: "Can you share your android/build.gradle and android/app/build.gradle files?"

5. **Step-by-step process**:
   - Ask: "Can you write down the exact steps you followed from start to finish?"

---

## Expected Answers

Based on working setups, your friend probably did:

1. ✅ Created/used Firebase project
2. ✅ Added Android app in Firebase Console
3. ✅ Downloaded google-services.json from Firebase
4. ✅ Placed it in `android/app/google-services.json`
5. ✅ Added SHA-1 in Firebase Console
6. ✅ Added Google Services plugin to build.gradle
7. ✅ Used GoogleSignIn without serverClientId (or with Web Client ID)

---

## How to Use This

1. Copy the prompt above
2. Send to your friend via WhatsApp/Telegram/Email
3. Wait for their response
4. Share their answers with me
5. I'll help you match their working setup!

Good luck! 🚀
