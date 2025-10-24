# YATRIK ERP - CORS Fix for Render Deployment

## 🚨 IMMEDIATE CORS FIX

Your CORS errors are caused by missing environment variables in Render. Here's the **exact fix**:

### Step 1: Update Backend Environment Variables in Render

Go to your Render backend service dashboard and add/update these environment variables:

```bash
CORS_ORIGIN=https://yatrik-frontend-app.onrender.com,https://yatrikerp.live
FRONTEND_URL=https://yatrik-frontend-app.onrender.com
BACKEND_URL=https://yatrikerp.onrender.com
```

### Step 2: Verify All Required Environment Variables

Make sure these are set in your Render backend service:

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d
SESSION_SECRET=your-session-secret
FRONTEND_URL=https://yatrik-frontend-app.onrender.com
BACKEND_URL=https://yatrikerp.onrender.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://yatrikerp.onrender.com/api/auth/google/callback
CORS_ORIGIN=https://yatrik-frontend-app.onrender.com,https://yatrikerp.live
```

### Step 3: Redeploy Backend

After updating environment variables:
1. Go to your backend service in Render
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait for deployment to complete

### Step 4: Test CORS Fix

After deployment, test with these commands:

```bash
# Test CORS with your frontend origin
curl -H "Origin: https://yatrik-frontend-app.onrender.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://yatrikerp.onrender.com/api/routes/cities

# Test actual API call
curl -H "Origin: https://yatrik-frontend-app.onrender.com" \
     https://yatrikerp.onrender.com/api/routes/cities
```

## 🔧 Alternative Quick Fix (If Above Doesn't Work)

If you still get CORS errors, add this temporary fix to your backend:

### Temporary CORS Override

Add this to your backend environment variables in Render:

```bash
CORS_ALLOW_ALL=true
```

Then update your backend code to handle this:

```javascript
// In server.js, replace the CORS configuration with:
const allowAllCors = process.env.CORS_ALLOW_ALL === 'true';

app.use(cors({
  origin: allowAllCors ? true : corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  optionsSuccessStatus: 200
}));
```

## 🎯 Root Cause Analysis

The CORS errors occur because:

1. **Missing CORS_ORIGIN**: Render doesn't have the CORS_ORIGIN environment variable
2. **Preflight Requests**: Browser sends OPTIONS requests that need proper handling
3. **Environment Variables**: Backend can't read the frontend URL for CORS

## ✅ Expected Results After Fix

After applying the fix, you should see:

- ✅ No more CORS errors in browser console
- ✅ API calls work from frontend
- ✅ Google OAuth works properly
- ✅ All features function correctly

## 🚀 Quick Deploy Commands

```bash
# Commit the CORS fix
git add backend/server.js
git commit -m "Fix CORS configuration for production"
git push origin main

# The backend will auto-deploy on Render
# Update environment variables in Render dashboard
# Test the fix
```

## 📞 If Issues Persist

If you still have CORS issues after this fix:

1. **Check Render Logs**: Go to backend service → Logs tab
2. **Verify Environment Variables**: Ensure all variables are set correctly
3. **Test Backend Health**: `curl https://yatrikerp.onrender.com/api/health`
4. **Check CORS Headers**: Use browser DevTools → Network tab

---

**This fix will resolve all CORS errors and make your deployment work perfectly!** 🚀
