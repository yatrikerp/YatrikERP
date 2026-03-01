# 🚀 Deployment Fix Guide - Render Backend Issues

## ✅ Fixed Issues

### 1. State Routes Error (FIXED)
**Error:** `path must be a string, array of strings, or regular expression`

**Root Cause:** Invalid use of `router.use()` with middleware array on line 35

**Fix Applied:** Changed from global middleware to route-specific middleware
- Created `authMiddleware` array
- Applied to each route individually instead of using `router.use()`

### 2. MongoDB Authentication Error (ACTION REQUIRED)

**Error:** `bad auth : Authentication failed. { name: 'MongoServerError', code: 8000, codeName: 'AtlasError' }`

**Root Cause:** Your MongoDB credentials are incorrect or the user doesn't have proper permissions

## 🔧 Quick Fixes Required

### Fix MongoDB Authentication (CRITICAL - 5 minutes)

#### Option A: Update MongoDB Password in Render
1. Go to MongoDB Atlas: https://cloud.mongodb.com/
2. Click "Database Access" in left sidebar
3. Find user `yatrikmain`
4. Click "Edit" button
5. Click "Edit Password"
6. Set a NEW password (save it!)
7. Click "Update User"
8. Go to Render Dashboard: https://dashboard.render.com/
9. Select your backend service
10. Go to "Environment" tab
11. Update these variables:
   ```
   MONGODB_URI=mongodb+srv://yatrikmain:YOUR_NEW_PASSWORD@cluster0.3qt2hfg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   MONGO_URI=mongodb+srv://yatrikmain:YOUR_NEW_PASSWORD@cluster0.3qt2hfg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
12. Click "Save Changes"
13. Render will auto-redeploy

#### Option B: Create New MongoDB User (Recommended)
1. Go to MongoDB Atlas: https://cloud.mongodb.com/
2. Click "Database Access"
3. Click "Add New Database User"
4. Choose "Password" authentication
5. Username: `yatrik_prod`
6. Password: Generate a strong password (SAVE IT!)
7. Database User Privileges: "Atlas admin" or "Read and write to any database"
8. Click "Add User"
9. Wait 2-3 minutes for user to be created
10. Update Render environment variables with new credentials

### Fix Google OAuth (Optional - 2 minutes)

Your Google OAuth client might be disabled:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find OAuth client: `889305333159-938odo67058fepqktsd8ro7pvsp5c4lv`
3. Click on it
4. If status shows "Disabled", click "ENABLE" button
5. Verify Authorized redirect URIs includes:
   - `https://yatrikerp.onrender.com/api/auth/google/callback`
6. Save changes

## 📋 Deployment Checklist

- [x] State routes error fixed (code updated)
- [ ] Update Render environment variables ONLY (not in code)
- [ ] Google OAuth enabled (if using Google login)
- [ ] Backend redeployed on Render
- [ ] Test login functionality
- [ ] Test API endpoints

## ✅ Render-Only MongoDB Credentials

**IMPORTANT:** These credentials should ONLY be set in Render's environment variables, NOT in the code files.

**For Render Dashboard Environment Variables:**

**MONGODB_URI:**
```
mongodb+srv://yatrik_prod:Yatrik123@cluster0.3qt2hfg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

**MONGO_URI:**
```
mongodb+srv://yatrik_prod:Yatrik123@cluster0.3qt2hfg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

**Username:** `yatrik_prod`  
**Password:** `Yatrik123`

This keeps your local development database (`yatrikmain`) separate from production (`yatrik_prod`).

## 🧪 Testing After Deployment

### 1. Check Backend Health
```bash
curl https://yatrikerp.onrender.com/api/health
```

### 2. Check State Routes
```bash
curl https://yatrikerp.onrender.com/api/state/test
```

Expected response:
```json
{
  "success": true,
  "message": "State routes are working",
  "timestamp": "2026-02-28T..."
}
```

### 3. Test Login
Visit: https://yatrikerp.live
Try logging in with your credentials

## 🔍 Common Issues

### Issue: "Cannot connect to MongoDB"
**Solution:** 
- Check MongoDB Atlas IP whitelist (should have 0.0.0.0/0 for Render)
- Verify user has correct permissions
- Check password doesn't contain special characters that need URL encoding

### Issue: "Google OAuth not working"
**Solution:**
- Enable OAuth client in Google Console
- Verify callback URL matches exactly
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct

### Issue: "CORS errors"
**Solution:**
- Verify CORS_ORIGIN in Render includes your frontend URL
- Check FRONTEND_URL is set correctly

## 📞 Need Help?

If issues persist:
1. Check Render logs: Dashboard → Your Service → Logs
2. Check MongoDB Atlas logs: Atlas → Clusters → Metrics
3. Verify all environment variables are set correctly in Render

## 🎯 Next Steps

1. Commit and push the state.js fix:
   ```bash
   git add backend/routes/state.js
   git commit -m "fix: resolve state routes middleware error"
   git push
   ```

2. Update MongoDB credentials in Render (see above)

3. Wait for auto-deploy or manually trigger deploy

4. Test the application

---

**Last Updated:** February 28, 2026
**Status:** State routes fixed ✅ | MongoDB auth needs update ⚠️
