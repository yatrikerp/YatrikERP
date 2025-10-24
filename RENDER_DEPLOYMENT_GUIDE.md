# YATRIK ERP - Render Deployment Guide

This guide will help you deploy your YATRIK ERP MERN application to Render for production.

## 🚀 Deployment Overview

- **Frontend**: Deploy to Render Static Site
- **Backend**: Deploy to Render Web Service
- **Database**: MongoDB Atlas (cloud)
- **Domain**: Custom domains configured

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **MongoDB Atlas**: Set up MongoDB Atlas database
3. **Google OAuth**: Configure Google OAuth credentials
4. **Environment Variables**: Prepare all required environment variables

## 🔧 Backend Deployment (Web Service)

### 1. Create Backend Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

```
Name: yatrikerp-backend
Environment: Node
Build Command: npm install
Start Command: npm start
```

### 2. Environment Variables for Backend

Add these environment variables in Render dashboard:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yatrik_erp?retryWrites=true&w=majority

# Server Configuration
NODE_ENV=production
PORT=5000

# Security (CHANGE THESE!)
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters-long
JWT_EXPIRE=7d
SESSION_SECRET=your-super-secure-session-secret-minimum-32-characters-long

# Frontend URLs
FRONTEND_URL=https://yatrik-frontend-app.onrender.com
BACKEND_URL=https://yatrikerp.onrender.com

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://yatrikerp.onrender.com/api/auth/google/callback

# CORS Configuration
CORS_ORIGIN=https://yatrik-frontend-app.onrender.com,https://yatrikerp.live

# Optional: Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Optional: Razorpay Configuration
RAZORPAY_KEY_ID=rzp_live_your_razorpay_key_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
```

### 3. Deploy Backend

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note the backend URL: `https://yatrikerp.onrender.com`

## 🎨 Frontend Deployment (Static Site)

### 1. Create Frontend Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure the service:

```
Name: yatrik-frontend-app
Build Command: cd frontend && npm install && npm run build
Publish Directory: frontend/build
```

### 2. Environment Variables for Frontend

Add these environment variables in Render dashboard:

```bash
# API Configuration
REACT_APP_API_URL=https://yatrikerp.onrender.com
VITE_API_BASE_URL=https://yatrikerp.onrender.com
VITE_BACKEND_URL=https://yatrikerp.onrender.com

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAsAkznA2sJF0pp4iAq5H2uqP9FIATjdbk

# Razorpay Configuration
REACT_APP_RAZORPAY_KEY=rzp_live_your_razorpay_key_here

# Production Configuration
NODE_ENV=production
```

### 3. Deploy Frontend

1. Click "Create Static Site"
2. Wait for build and deployment to complete
3. Note the frontend URL: `https://yatrik-frontend-app.onrender.com`

## 🔐 Google OAuth Configuration

### 1. Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "APIs & Services" → "Credentials"
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URIs:

```
https://yatrikerp.onrender.com/api/auth/google/callback
```

### 2. Update Authorized JavaScript Origins

```
https://yatrik-frontend-app.onrender.com
https://yatrikerp.live
```

## 🌐 Custom Domain Setup

### 1. Configure Custom Domain on Render

1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain: `yatrikerp.live`
4. Follow DNS configuration instructions

### 2. Update CORS Configuration

After setting up custom domain, update CORS_ORIGIN:

```bash
CORS_ORIGIN=https://yatrik-frontend-app.onrender.com,https://yatrikerp.live
```

## 📊 Health Checks

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

### Frontend Health Check

Visit: `https://yatrik-frontend-app.onrender.com`

Should load the YATRIK ERP landing page.

## 🔄 Deployment Process

### 1. Backend Deployment

```bash
# Local testing
cd backend
npm install
npm start

# Deploy to Render (automatic on git push)
git add .
git commit -m "Deploy backend to production"
git push origin main
```

### 2. Frontend Deployment

```bash
# Local testing
cd frontend
npm install
npm run build
npm run serve

# Deploy to Render (automatic on git push)
git add .
git commit -m "Deploy frontend to production"
git push origin main
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS_ORIGIN environment variable
   - Ensure frontend URL is included

2. **OAuth Redirect Issues**
   - Verify GOOGLE_CALLBACK_URL matches Google Cloud Console
   - Check FRONTEND_URL configuration

3. **Database Connection Issues**
   - Verify MONGODB_URI format
   - Check MongoDB Atlas network access settings

4. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed

### Debug Commands

```bash
# Check backend logs
# Go to Render dashboard → Your service → Logs

# Check frontend build logs
# Go to Render dashboard → Your static site → Logs

# Test API endpoints
curl -X GET https://yatrikerp.onrender.com/api/health
curl -X GET https://yatrikerp.onrender.com/api/routes
```

## 📈 Performance Optimization

### Backend Optimizations

1. **Enable Compression**: Already configured in server.js
2. **Set Cache Headers**: Configured for API responses
3. **Database Indexing**: Ensure MongoDB indexes are optimized

### Frontend Optimizations

1. **Build Optimization**: React build is optimized for production
2. **Static Assets**: Served via CDN on Render
3. **Environment Variables**: Properly configured for production

## 🔒 Security Checklist

- [ ] JWT_SECRET is secure and unique
- [ ] SESSION_SECRET is secure and unique
- [ ] MongoDB connection uses SSL
- [ ] CORS is properly configured
- [ ] Google OAuth credentials are secure
- [ ] Environment variables are not exposed in code
- [ ] HTTPS is enforced on all domains

## 📞 Support

For deployment issues:

1. Check Render service logs
2. Verify environment variables
3. Test API endpoints manually
4. Check Google Cloud Console OAuth settings

## 🎉 Success Indicators

Your deployment is successful when:

1. ✅ Backend health check returns 200 OK
2. ✅ Frontend loads without errors
3. ✅ Google OAuth login works
4. ✅ API calls from frontend succeed
5. ✅ Database operations work correctly
6. ✅ Custom domain (if configured) works

---

**Last Updated**: 2024-01-01  
**Version**: 1.0.0  
**Maintainer**: YATRIK ERP Team
