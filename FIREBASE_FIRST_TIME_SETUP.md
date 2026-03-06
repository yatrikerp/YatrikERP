# Firebase First-Time Setup - Step by Step

## You're at the Firebase Console Homepage

If you only see "Create new Firebase project", it means you haven't set up Firebase yet.

---

## Option 1: Import Your Existing Google Cloud Project (RECOMMENDED)

### Step 1: Click "Add project" or "Create a project"

You'll see a button that says **"Add project"** or **"Create a project"**. Click it.

### Step 2: You'll See Two Options

Firebase will show you:

**Option A: Create a new project**
- Enter a new project name

**Option B: Import a Google Cloud project** ← CHOOSE THIS!
- You'll see a dropdown with existing projects

### Step 3: Select Your Existing Project

1. Click the dropdown under "Import a Google Cloud project"
2. Look for **yatrikerp** in the list
3. Select it
4. Click **Continue**

### Step 4: Confirm Firebase Setup

1. You'll see: "Confirm Firebase billing plan"
2. Select **Spark plan (Free)** ← This is free!
3. Check the box: "I confirm..."
4. Click **Continue**

### Step 5: Enable Google Analytics (Optional)

1. You'll see: "Enable Google Analytics for this project?"
2. You can toggle it OFF (not needed for Google Sign-In)
3. Click **Continue**

### Step 6: Wait for Setup

Firebase will set up your project (takes 30 seconds).

You'll see: "Your new project is ready"

Click **Continue**

---

## Option 2: Create a New Firebase Project (NOT RECOMMENDED)

If you don't see your project in the import list, you can create a new one, but this will create a separate project from your Google Cloud Console setup.

**Only do this if Option 1 doesn't work!**

1. Click "Create a project"
2. Enter project name: **YatrikERP**
3. Click Continue
4. Disable Google Analytics (optional)
5. Click Create project
6. Wait for setup

---

## After Project is Created/Imported

You should now see the Firebase Console with your project dashboard.

On the left sidebar, you'll see:
- 🏠 Project Overview
- 🔥 **Authentication** ← This is what you need!
- 📊 Analytics
- 🔨 Build
- etc.

---

## Now Enable Google Sign-In

### Step 1: Click "Authentication" in Left Sidebar

You should see it in the left menu. Click it.

### Step 2: Click "Get Started" (if first time)

If this is your first time using Authentication, you'll see a button: **"Get started"**

Click it.

### Step 3: Click "Sign-in method" Tab

You'll see tabs at the top:
- Users
- **Sign-in method** ← Click this
- Templates
- Usage

### Step 4: Enable Google

You'll see a list of sign-in providers:

```
Provider                Status
Email/Password          Disabled
Phone                   Disabled
Google                  Disabled  ← Click this row
Facebook                Disabled
...
```

Click on the **Google** row.

### Step 5: Toggle Enable

A popup will appear:

1. Toggle the **Enable** switch to ON (it will turn blue/green)
2. **Project support email**: Select your email from dropdown
3. Click **Save**

### Step 6: Verify It's Enabled

Back on the Sign-in method page, you should see:

```
Provider                Status
Google                  Enabled ✅
```

---

## Complete Visual Guide

### What You See Now:
```
┌─────────────────────────────────────┐
│ Firebase Console                    │
├─────────────────────────────────────┤
│                                     │
│   Welcome to Firebase               │
│                                     │
│   [Create a project]                │  ← You're here
│                                     │
└─────────────────────────────────────┘
```

### After Importing Project:
```
┌─────────────────────────────────────┐
│ Firebase Console - yatrikerp        │
├─────────────────────────────────────┤
│ ☰ Menu                              │
│   🏠 Project Overview               │
│   🔥 Authentication    ← Click here │
│   📊 Analytics                      │
│   🔨 Build                          │
└─────────────────────────────────────┘
```

### In Authentication:
```
┌─────────────────────────────────────┐
│ Authentication                      │
├─────────────────────────────────────┤
│ [Users] [Sign-in method] [Templates]│
│                                     │
│ Sign-in providers:                  │
│ ○ Email/Password    Disabled        │
│ ○ Google            Disabled  ← Click│
│ ○ Phone             Disabled        │
└─────────────────────────────────────┘
```

### Enable Google Popup:
```
┌─────────────────────────────────────┐
│ Google                              │
├─────────────────────────────────────┤
│ Enable: [Toggle ON] ← Turn this on  │
│                                     │
│ Project support email:              │
│ [your-email@gmail.com ▼]            │
│                                     │
│         [Cancel]  [Save]            │
└─────────────────────────────────────┘
```

---

## Troubleshooting

### "I don't see my project in the import list"

**Possible reasons:**
1. You're signed in with a different Google account
2. The project was created by someone else
3. You don't have permission to access it

**Solution:**
- Make sure you're signed in with the same Google account you used for Google Cloud Console
- Check: https://console.cloud.google.com/ - can you see the `yatrikerp` project there?
- If yes, go back to Firebase and try importing again

### "I can't find Authentication in the sidebar"

**Solution:**
- Make sure you've completed the project setup
- Refresh the page
- Look for a menu icon (☰) if the sidebar is collapsed
- Click "Build" → "Authentication"

### "Authentication says 'Get started' but nothing happens"

**Solution:**
- Click the "Get started" button
- Wait a few seconds for it to initialize
- Refresh the page if needed

---

## Quick Summary

1. **Go to**: https://console.firebase.google.com/
2. **Click**: "Add project" or "Create a project"
3. **Select**: "Import a Google Cloud project" → Choose `yatrikerp`
4. **Click**: Continue through the setup (choose free plan)
5. **Wait**: 30 seconds for setup to complete
6. **Click**: "Authentication" in left sidebar
7. **Click**: "Get started" (if first time)
8. **Click**: "Sign-in method" tab
9. **Click**: "Google" row
10. **Toggle**: Enable ON
11. **Select**: Your email as support email
12. **Click**: Save

Done! Now you can proceed with adding your Android app and downloading google-services.json.

---

## Next Steps After Enabling Google Sign-In

1. Add Android app in Firebase (Project Settings → Your apps → Add app → Android)
2. Enter package name: `com.yatrik.erp.yatrik_mobile`
3. Enter SHA-1: `DD:BC:C9:63:C2:6C:28:E2:7B:18:E6:32:A9:50:02:BB:1C:48:A1:FC`
4. Download google-services.json
5. Place in `flutter/android/app/`
6. Get Web Client ID from Google Cloud Console
7. Update auth_service.dart
8. Rebuild app

You're almost there! 🚀
