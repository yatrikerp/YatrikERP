# 🔧 Fix Google Sign-In Not Working

## 🚨 Current Issue
Google sign-in is not working because the Google Client Secret in your `.env` file appears to be incomplete/truncated.

## 📋 Current .env Configuration
```
GOOGLE_CLIENT_ID=889305333159-938odo67058fepqktsd8ro7pvsp5c4lv.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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  # ❌ This is incomplete!
```

## 🔍 Root Cause
Google Client Secrets are typically 24+ characters long. Your current secret appears to be cut off.

## ✅ Solution Steps

### 1. Get Complete Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Go to "APIs & Services" > "Credentials"
4. Find your OAuth 2.0 Client ID or create a new one
5. **Copy the complete Client Secret** (should be ~24+ characters)

### 2. Update .env File
Replace the incomplete secret with the complete one:
```bash
# In backend/.env file
GOOGLE_CLIENT_ID=889305333159-938odo67058fepqktsd8ro7pvsp5c4lv.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-YourCompleteSecretHere  # ✅ Complete secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### 3. Verify Google OAuth App Settings
In Google Cloud Console, ensure your OAuth app has:
- ✅ **Authorized JavaScript origins**: `http://localhost:3000`
- ✅ **Authorized redirect URIs**: `http://localhost:5000/api/auth/google/callback`
- ✅ **Scopes**: `profile` and `email`

### 4. Restart Backend Server
```bash
cd backend
npm start
```

### 5. Test Google Sign-In
1. Go to `http://localhost:3000/login`
2. Click "Sign in with Google"
3. Should redirect to Google OAuth consent screen

## 🧪 Debug Commands
Run these to verify configuration:

```bash
cd backend
node test-oauth.js
```

## 🔗 Useful Links
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport Google Strategy](https://github.com/jaredhanson/passport-google-oauth20)

## 📞 If Still Not Working
1. Check browser console for errors
2. Check backend server logs
3. Verify MongoDB connection
4. Ensure all environment variables are loaded
