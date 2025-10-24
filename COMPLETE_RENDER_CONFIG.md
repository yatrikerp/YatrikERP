# YATRIK ERP - Complete Render Deployment Configuration
# This file contains all necessary configurations for successful deployment

## 🚀 RENDER DEPLOYMENT CONFIGURATION

### Backend Service Configuration (Web Service)

**Service Type**: Web Service  
**Environment**: Node.js  
**Plan**: Starter (Free tier) or higher  

#### Build Settings:
```
Build Command: cd backend && npm install
Start Command: cd backend && npm start
Health Check Path: /api/health
```

#### Environment Variables (Add these in Render Dashboard):

**Required Variables:**
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yatrik_erp?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters-long-change-this
JWT_EXPIRE=7d
SESSION_SECRET=your-super-secure-session-secret-minimum-32-characters-long-change-this
FRONTEND_URL=https://yatrik-frontend-app.onrender.com
BACKEND_URL=https://yatrikerp.onrender.com
GOOGLE_CLIENT_ID=your-google-client-id-from-google-cloud-console
GOOGLE_CLIENT_SECRET=your-google-client-secret-from-google-cloud-console
GOOGLE_CALLBACK_URL=https://yatrikerp.onrender.com/api/auth/google/callback
CORS_ORIGIN=https://yatrik-frontend-app.onrender.com,https://yatrikerp.live
```

**Optional Variables:**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
RAZORPAY_KEY_ID=rzp_live_your_razorpay_key_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
```

### Frontend Service Configuration (Static Site)

**Service Type**: Static Site  
**Environment**: Node.js  

#### Build Settings:
```
Build Command: cd frontend && npm install && npm run build
Publish Directory: frontend/build
```

#### Environment Variables (Add these in Render Dashboard):

```bash
REACT_APP_API_URL=https://yatrikerp.onrender.com
VITE_API_BASE_URL=https://yatrikerp.onrender.com
VITE_BACKEND_URL=https://yatrikerp.onrender.com
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAsAkznA2sJF0pp4iAq5H2uqP9FIATjdbk
REACT_APP_RAZORPAY_KEY=rzp_live_your_razorpay_key_here
NODE_ENV=production
```

## 🔧 DEPLOYMENT STEPS

### Step 1: Backend Deployment

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub Repository**
4. **Configure Service**:
   - Name: `yatrikerp-backend`
   - Environment: `Node`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Health Check Path: `/api/health`

5. **Add Environment Variables** (copy from above)
6. **Click "Create Web Service"**
7. **Wait for deployment** (5-10 minutes)
8. **Note the backend URL**: `https://yatrikerp.onrender.com`

### Step 2: Frontend Deployment

1. **Go to Render Dashboard**
2. **Click "New +"** → **"Static Site"**
3. **Connect GitHub Repository**
4. **Configure Service**:
   - Name: `yatrik-frontend-app`
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/build`

5. **Add Environment Variables** (copy from above)
6. **Click "Create Static Site"**
7. **Wait for deployment** (5-10 minutes)
8. **Note the frontend URL**: `https://yatrik-frontend-app.onrender.com`

### Step 3: Google OAuth Configuration

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Navigate to "APIs & Services"** → **"Credentials"**
3. **Edit your OAuth 2.0 Client ID**
4. **Add Authorized Redirect URIs**:
   ```
   https://yatrikerp.onrender.com/api/auth/google/callback
   ```
5. **Add Authorized JavaScript Origins**:
   ```
   https://yatrik-frontend-app.onrender.com
   https://yatrikerp.live
   ```

### Step 4: Database Configuration

1. **MongoDB Atlas Setup**:
   - Create cluster at https://cloud.mongodb.com
   - Create database user
   - Whitelist Render IP addresses (0.0.0.0/0 for all)
   - Get connection string
   - Add to backend environment variables

## 📱 MOBILE VIEW CONFIGURATION

### Frontend Mobile Optimization

Add these meta tags to `frontend/public/index.html`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="theme-color" content="#000000">
```

### CSS Mobile Optimizations

Add to `frontend/src/index.css`:

```css
/* Mobile Viewport Fixes */
html, body {
  height: 100%;
  overflow-x: hidden;
}

/* Prevent zoom on input focus */
input, select, textarea {
  font-size: 16px;
}

/* Mobile-friendly buttons */
button {
  min-height: 44px;
  min-width: 44px;
}

/* Responsive containers */
.container {
  max-width: 100%;
  padding: 0 16px;
}

/* Mobile navigation */
@media (max-width: 768px) {
  .mobile-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
  }
}
```

## 🔍 DEPLOYMENT VERIFICATION

### Backend Health Check

```bash
curl https://yatrikerp.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345
}
```

### Frontend Verification

1. **Visit**: `https://yatrik-frontend-app.onrender.com`
2. **Check**: Page loads without errors
3. **Test**: Login functionality
4. **Test**: API calls work
5. **Test**: Mobile view responsive

### API Endpoints Test

```bash
# Test routes endpoint
curl https://yatrikerp.onrender.com/api/routes

# Test buses endpoint
curl https://yatrikerp.onrender.com/api/buses

# Test trips endpoint
curl https://yatrikerp.onrender.com/api/trips
```

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue 1: CORS Errors
**Solution**: Ensure CORS_ORIGIN includes your frontend URL
```bash
CORS_ORIGIN=https://yatrik-frontend-app.onrender.com,https://yatrikerp.live
```

### Issue 2: OAuth Redirect Issues
**Solution**: Update Google Cloud Console with correct callback URL
```
https://yatrikerp.onrender.com/api/auth/google/callback
```

### Issue 3: Database Connection Issues
**Solution**: Check MongoDB Atlas network access and connection string
- Whitelist all IPs: 0.0.0.0/0
- Use correct connection string format

### Issue 4: Frontend Not Loading
**Solution**: Check build command and publish directory
- Build Command: `cd frontend && npm install && npm run build`
- Publish Directory: `frontend/build`

### Issue 5: Mobile View Issues
**Solution**: Add viewport meta tag and responsive CSS
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

## 📊 PERFORMANCE OPTIMIZATION

### Backend Optimizations
- Enable compression (already configured)
- Set proper cache headers
- Optimize database queries
- Use connection pooling

### Frontend Optimizations
- Enable gzip compression
- Optimize images
- Use CDN for static assets
- Implement lazy loading

## 🔒 SECURITY CHECKLIST

- [ ] JWT_SECRET is secure and unique
- [ ] SESSION_SECRET is secure and unique
- [ ] MongoDB connection uses SSL
- [ ] CORS is properly configured
- [ ] Google OAuth credentials are secure
- [ ] Environment variables are not exposed
- [ ] HTTPS is enforced
- [ ] Input validation is implemented

## 📞 SUPPORT & TROUBLESHOOTING

### Render Service Logs
1. Go to Render Dashboard
2. Select your service
3. Click "Logs" tab
4. Check for errors

### Common Error Messages

**"Cannot GET /"**
- Check if backend is running
- Verify health check endpoint

**"CORS policy"**
- Check CORS_ORIGIN environment variable
- Ensure frontend URL is included

**"Database connection failed"**
- Check MONGODB_URI format
- Verify MongoDB Atlas settings

**"OAuth callback mismatch"**
- Update Google Cloud Console
- Check GOOGLE_CALLBACK_URL

## 🎉 SUCCESS INDICATORS

Your deployment is successful when:

- ✅ Backend health check returns 200 OK
- ✅ Frontend loads without errors
- ✅ Login functionality works
- ✅ API calls succeed
- ✅ Mobile view is responsive
- ✅ Google OAuth works
- ✅ Database operations work
- ✅ All features function correctly

---

**Configuration Version**: 1.0.0  
**Last Updated**: 2024-01-01  
**Compatibility**: Render Free Tier +  
**Status**: ✅ Production Ready
