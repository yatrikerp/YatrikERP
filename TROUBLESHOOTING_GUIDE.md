# YATRIK ERP - Complete Troubleshooting Guide

## 🚨 TROUBLESHOOTING GUIDE FOR PERFECT DEPLOYMENT

This guide covers **every possible issue** you might encounter during deployment and provides **exact solutions** to fix them.

## 🔧 QUICK FIXES (Most Common Issues)

### Issue 1: CORS Errors
**Error**: `Access to fetch at 'https://yatrikerp.onrender.com/api/...' from origin 'https://yatrik-frontend-app.onrender.com' has been blocked by CORS policy`

**Solution**:
1. **Check Backend Environment Variables**:
   ```bash
   CORS_ORIGIN=https://yatrik-frontend-app.onrender.com,https://yatrikerp.live
   ```

2. **Verify in Render Dashboard**:
   - Go to your backend service
   - Check Environment tab
   - Ensure CORS_ORIGIN includes your frontend URL

3. **Test CORS**:
   ```bash
   curl -H "Origin: https://yatrik-frontend-app.onrender.com" https://yatrikerp.onrender.com/api/health
   ```

### Issue 2: Google OAuth Not Working
**Error**: `OAuth callback mismatch` or Google login fails

**Solution**:
1. **Update Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to "APIs & Services" → "Credentials"
   - Edit your OAuth 2.0 Client ID
   - Add Authorized Redirect URIs:
     ```
     https://yatrikerp.onrender.com/api/auth/google/callback
     ```
   - Add Authorized JavaScript Origins:
     ```
     https://yatrik-frontend-app.onrender.com
     https://yatrikerp.live
     ```

2. **Check Backend Environment Variables**:
   ```bash
   GOOGLE_CLIENT_ID=your-actual-client-id
   GOOGLE_CLIENT_SECRET=your-actual-client-secret
   GOOGLE_CALLBACK_URL=https://yatrikerp.onrender.com/api/auth/google/callback
   ```

### Issue 3: Database Connection Failed
**Error**: `MongoServerError: connection failed` or database timeout

**Solution**:
1. **Check MongoDB Atlas**:
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Check Network Access: Add `0.0.0.0/0` (allow all IPs)
   - Check Database Access: Ensure user exists
   - Get correct connection string

2. **Update MONGODB_URI**:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yatrik_erp?retryWrites=true&w=majority
   ```

3. **Test Connection**:
   ```bash
   curl https://yatrikerp.onrender.com/api/health
   ```

### Issue 4: Frontend Not Loading
**Error**: Frontend shows blank page or build errors

**Solution**:
1. **Check Build Command**:
   ```
   Build Command: cd frontend && npm install && npm run build
   Publish Directory: frontend/build
   ```

2. **Check Environment Variables**:
   ```bash
   REACT_APP_API_URL=https://yatrikerp.onrender.com
   VITE_API_BASE_URL=https://yatrikerp.onrender.com
   VITE_BACKEND_URL=https://yatrikerp.onrender.com
   ```

3. **Check Build Logs**:
   - Go to Render Dashboard
   - Select your frontend service
   - Check "Logs" tab for build errors

### Issue 5: Mobile View Issues
**Error**: Mobile view not responsive or zoom issues

**Solution**:
1. **Check Viewport Meta Tag** in `frontend/public/index.html`:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
   ```

2. **Add Mobile CSS** to `frontend/src/index.css`:
   ```css
   input, select, textarea {
     font-size: 16px !important;
   }
   
   button {
     min-height: 44px;
     min-width: 44px;
   }
   ```

3. **Test on Mobile**:
   - Open Chrome DevTools
   - Toggle device toolbar
   - Test on different screen sizes

## 🔍 DETAILED TROUBLESHOOTING

### Backend Issues

#### Backend Won't Start
**Symptoms**: Backend service fails to start or crashes

**Diagnosis**:
1. Check Render logs for errors
2. Verify all required environment variables
3. Check Node.js version compatibility

**Solutions**:
```bash
# Check required environment variables
NODE_ENV=production
PORT=5000
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
FRONTEND_URL=https://yatrik-frontend-app.onrender.com
BACKEND_URL=https://yatrikerp.onrender.com
```

#### API Endpoints Not Working
**Symptoms**: API calls return 404 or 500 errors

**Diagnosis**:
1. Check if backend is running
2. Verify route definitions
3. Check middleware configuration

**Solutions**:
1. **Test Health Endpoint**:
   ```bash
   curl https://yatrikerp.onrender.com/api/health
   ```

2. **Check Route Files**:
   - Ensure all route files are properly imported
   - Check for syntax errors in route definitions

3. **Verify Middleware**:
   - Check CORS configuration
   - Verify authentication middleware

#### Database Queries Failing
**Symptoms**: Database operations fail or timeout

**Diagnosis**:
1. Check MongoDB Atlas connection
2. Verify database permissions
3. Check query syntax

**Solutions**:
1. **Test Database Connection**:
   ```bash
   # Check if backend can connect to database
   curl https://yatrikerp.onrender.com/api/health
   ```

2. **Check MongoDB Atlas**:
   - Network Access: Allow all IPs (0.0.0.0/0)
   - Database Access: Ensure user has read/write permissions
   - Connection String: Verify format

### Frontend Issues

#### Build Failures
**Symptoms**: Frontend build fails during deployment

**Diagnosis**:
1. Check build logs for specific errors
2. Verify all dependencies are installed
3. Check for syntax errors

**Solutions**:
1. **Check Build Command**:
   ```
   cd frontend && npm install && npm run build
   ```

2. **Verify Dependencies**:
   - Check `package.json` for missing dependencies
   - Ensure all imports are correct

3. **Check for Errors**:
   - Look for TypeScript errors
   - Check for missing files
   - Verify environment variables

#### Environment Variables Not Loading
**Symptoms**: Frontend can't access environment variables

**Diagnosis**:
1. Check if variables are prefixed correctly
2. Verify variable names
3. Check if variables are set in Render

**Solutions**:
1. **React Variables** (must start with `REACT_APP_`):
   ```bash
   REACT_APP_API_URL=https://yatrikerp.onrender.com
   REACT_APP_RAZORPAY_KEY=your-key
   ```

2. **Vite Variables** (must start with `VITE_`):
   ```bash
   VITE_API_BASE_URL=https://yatrikerp.onrender.com
   VITE_BACKEND_URL=https://yatrikerp.onrender.com
   VITE_GOOGLE_MAPS_API_KEY=your-key
   ```

#### API Calls Failing
**Symptoms**: Frontend can't connect to backend

**Diagnosis**:
1. Check API URL configuration
2. Verify CORS settings
3. Check network connectivity

**Solutions**:
1. **Check API Configuration**:
   ```javascript
   // In your API calls, ensure you're using the correct base URL
   const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
   ```

2. **Test API Connection**:
   ```bash
   curl https://yatrikerp.onrender.com/api/health
   ```

3. **Check CORS**:
   - Ensure backend CORS includes frontend URL
   - Verify CORS_ORIGIN environment variable

### Mobile Issues

#### Mobile View Not Responsive
**Symptoms**: Mobile view doesn't adapt to screen size

**Solutions**:
1. **Add Viewport Meta Tag**:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
   ```

2. **Add Responsive CSS**:
   ```css
   @media (max-width: 768px) {
     .container {
       padding: 16px;
     }
     
     .card {
       margin: 8px;
     }
   }
   ```

#### Touch Issues
**Symptoms**: Buttons not responding to touch or too small

**Solutions**:
1. **Increase Touch Targets**:
   ```css
   button {
     min-height: 44px;
     min-width: 44px;
   }
   ```

2. **Add Touch Styles**:
   ```css
   .touch-friendly {
     -webkit-tap-highlight-color: transparent;
     touch-action: manipulation;
   }
   ```

#### Zoom Issues
**Symptoms**: Page zooms when focusing on inputs

**Solutions**:
1. **Prevent Input Zoom**:
   ```css
   input, select, textarea {
     font-size: 16px !important;
   }
   ```

2. **Add Viewport Meta Tag**:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
   ```

## 🛠️ DEBUGGING TOOLS

### Render Service Logs
1. Go to Render Dashboard
2. Select your service
3. Click "Logs" tab
4. Look for error messages

### Browser Developer Tools
1. Open Chrome DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Check Application tab for environment variables

### API Testing
```bash
# Test backend health
curl https://yatrikerp.onrender.com/api/health

# Test specific endpoints
curl https://yatrikerp.onrender.com/api/routes
curl https://yatrikerp.onrender.com/api/buses
curl https://yatrikerp.onrender.com/api/trips

# Test CORS
curl -H "Origin: https://yatrik-frontend-app.onrender.com" https://yatrikerp.onrender.com/api/health
```

### Environment Variable Testing
```bash
# Run environment validation
./validate-environment.sh

# Check specific variables
echo $REACT_APP_API_URL
echo $MONGODB_URI
echo $GOOGLE_CLIENT_ID
```

## 🚨 EMERGENCY FIXES

### Complete Redeployment
If nothing else works:

1. **Delete Services**:
   - Delete both frontend and backend services in Render
   - Wait 5 minutes

2. **Redeploy**:
   - Deploy backend first (Web Service)
   - Wait for backend to be healthy
   - Deploy frontend (Static Site)

3. **Verify**:
   ```bash
   ./verify-deployment.sh
   ```

### Reset Environment Variables
If environment variables are corrupted:

1. **Export Current Variables**:
   ```bash
   # Backend
   cat backend/.env > backend-env-backup.txt
   
   # Frontend
   cat frontend/.env > frontend-env-backup.txt
   ```

2. **Recreate Environment Files**:
   ```bash
   ./perfect-deploy.sh
   ```

3. **Update with Your Values**:
   - Copy values from backup files
   - Update with your actual credentials

## 📞 SUPPORT CONTACTS

### Render Support
- **Documentation**: https://render.com/docs
- **Status Page**: https://status.render.com
- **Support**: https://render.com/support

### MongoDB Atlas Support
- **Documentation**: https://docs.atlas.mongodb.com
- **Support**: https://support.mongodb.com

### Google Cloud Support
- **Documentation**: https://cloud.google.com/docs
- **Support**: https://cloud.google.com/support

## 🎯 SUCCESS CHECKLIST

After fixing issues, verify:

- [ ] Backend health check passes
- [ ] Frontend loads without errors
- [ ] Login functionality works
- [ ] Google OAuth works
- [ ] API calls succeed
- [ ] Mobile view is responsive
- [ ] All features function correctly
- [ ] No console errors
- [ ] Fast loading times
- [ ] Secure configuration

---

**Troubleshooting Guide Version**: 1.0.0  
**Last Updated**: 2024-01-01  
**Status**: ✅ Complete  
**Coverage**: 100% of Common Issues
