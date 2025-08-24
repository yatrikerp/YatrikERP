# 🔐 Google OAuth Sign-In Fix Guide

## 🚨 **Current Issue: Google Sign-In Not Working**

The Google OAuth sign-in is not working because the **Google Client Secret** is not configured.

## ✅ **What's Already Working:**

- ✅ Backend server running on port 3000
- ✅ Google OAuth routes configured
- ✅ Frontend OAuth callback handling
- ✅ User authentication system
- ✅ Role-based routing

## 🔧 **What Needs to be Fixed:**

### 1. **Google OAuth Client Secret Missing**
The backend needs your Google OAuth client secret to authenticate with Google.

### 2. **Environment Variables Not Set**
The following environment variables need to be configured:
- `GOOGLE_CLIENT_SECRET` (required)
- `GOOGLE_CLIENT_ID` (optional - using default)
- `FRONTEND_URL` (optional - using default)

## 🚀 **Quick Fix Steps:**

### **Option 1: Set Environment Variables (Recommended)**

1. **Create a `.env` file** in the `backend` folder:
```bash
cd backend
# Create .env file with your Google OAuth credentials
```

2. **Add your Google OAuth credentials:**
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=889305333159-938odo67058fepqktsd8ro7pvsp5c4lv.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-actual-google-client-secret-here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Frontend URL
FRONTEND_URL=http://localhost:5173

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/yatrik_erp
```

3. **Restart the backend server:**
```bash
# Stop current server (Ctrl+C)
npm start
```

### **Option 2: Update Config File Directly**

1. **Edit `backend/config/oauth.js`:**
```javascript
google: {
  clientID: '889305333159-938odo67058fepqktsd8ro7pvsp5c4lv.apps.googleusercontent.com',
  clientSecret: 'GOCSPX-your-actual-google-client-secret-here', // Replace with your actual secret
  callbackURL: 'http://localhost:3000/api/auth/google/callback',
  scope: ['profile', 'email']
}
```

2. **Restart the backend server**

## 🔍 **How to Get Your Google OAuth Credentials:**

### 1. **Go to Google Cloud Console:**
- Visit: https://console.cloud.google.com/
- Sign in with your Google account

### 2. **Create or Select a Project:**
- Create a new project or select existing one
- Enable Google+ API if not already enabled

### 3. **Configure OAuth Consent Screen:**
- Go to "APIs & Services" > "OAuth consent screen"
- Fill in app information
- Add your domain (localhost for development)

### 4. **Create OAuth Credentials:**
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth 2.0 Client IDs"
- Choose "Web application"
- Add authorized redirect URIs:
  - `http://localhost:3000/api/auth/google/callback`
  - `http://localhost:5173/oauth/callback`

### 5. **Copy Your Credentials:**
- **Client ID**: Already configured
- **Client Secret**: Copy this and add to your config

## 🧪 **Testing the Fix:**

### 1. **Check Configuration:**
```bash
cd backend
node scripts/testGoogleOAuth.js
```

### 2. **Test Google OAuth Endpoint:**
```bash
curl -I "http://localhost:3000/api/auth/google"
# Should return 302 redirect (working)
```

### 3. **Test Frontend Integration:**
- Open your frontend (should be on port 5173)
- Click "Sign in with Google"
- Should redirect to Google OAuth

## 🚨 **Common Issues & Solutions:**

### **Issue: "Invalid redirect_uri"**
- **Solution**: Check that your callback URL in Google Console matches exactly:
  - `http://localhost:3000/api/auth/google/callback`

### **Issue: "Client ID not found"**
- **Solution**: Verify your Google Client ID is correct in the config

### **Issue: "Client secret invalid"**
- **Solution**: Make sure you copied the entire client secret correctly

### **Issue: Frontend not redirecting**
- **Solution**: Check that frontend is running on port 5173 and backend on 3000

## 📱 **Frontend Configuration:**

The frontend is already configured correctly:
- **Backend OAuth URL**: `http://localhost:3000/api/auth/google`
- **Frontend Callback**: `http://localhost:5173/oauth/callback`
- **OAuth Callback Route**: `/oauth/callback` in App.js

## 🔒 **Security Notes:**

- ✅ OAuth users are restricted to 'passenger' role only
- ✅ JWT tokens are properly validated
- ✅ Callback URLs are properly configured
- ✅ User data is sanitized before storage

## 🎯 **Expected Result:**

After fixing the Google Client Secret:
1. ✅ Google OAuth strategy loads successfully
2. ✅ Users can click "Sign in with Google"
3. ✅ Redirects to Google OAuth consent screen
4. ✅ After consent, redirects back to your app
5. ✅ User is automatically logged in and redirected to dashboard

## 🆘 **Still Having Issues?**

1. **Check server logs** for OAuth strategy loading messages
2. **Verify environment variables** are loaded correctly
3. **Test OAuth endpoint** with curl
4. **Check Google Console** for correct redirect URIs
5. **Ensure ports match** (backend: 3000, frontend: 5173)

---

**The main issue is the missing Google Client Secret. Once you add that, Google OAuth should work perfectly!** 🎉
