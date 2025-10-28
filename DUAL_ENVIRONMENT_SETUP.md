# Dual Environment Setup Guide

This guide helps you run YATRIK ERP on both localhost (development) and yatrikerp.live (production).

## 🎯 Quick Start

### For Local Development (localhost:5173)

1. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB URI and other settings
   npm start
   # Backend will run on http://localhost:5000
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   cp env.development.template .env.development
   # The .env.development file is pre-configured for localhost
   npm run dev
   # Frontend will run on http://localhost:5173
   ```

### For Production Deployment (yatrikerp.live)

1. **Backend Setup (Render.com):**
   - Deploy backend to Render
   - Add all environment variables from `backend/env.production.template`
   - Backend URL: `https://yatrikerp.onrender.com`

2. **Frontend Setup:**
   ```bash
   cd frontend
   cp env.production.template .env.production
   # Edit .env.production with your actual production API keys
   npm run build
   # Deploy the 'dist' folder to your hosting
   ```

## 🔧 How Environment Detection Works

The app automatically detects which environment it's running in:

### Development Mode (localhost)
- **Frontend URL:** `http://localhost:5173`
- **Backend URL:** `http://localhost:5000`
- **Detected by:** Hostname = `localhost` or `127.0.0.1`
- **Proxy:** Vite proxy forwards `/api/*` to localhost:5000

### Production Mode (yatrikerp.live)
- **Frontend URL:** `https://yatrikerp.live`
- **Backend URL:** `https://yatrikerp.onrender.com`
- **Detected by:** Hostname contains `yatrikerp.live` or `onrender.com`
- **Direct API calls:** No proxy needed, direct API calls to Render backend

## 📁 Files Structure

```
frontend/
├── env.development.template  # Development environment template
├── env.production.template    # Production environment template
├── .env.development           # Your local development config (create from template)
├── .env.production            # Your production config (create from template)
└── vite.config.js            # Vite config with proxy for development

backend/
├── .env.example               # Backend environment template
├── .env                       # Your backend config (create from template)
└── server.js                  # Backend server with CORS configuration
```

## 🚀 Environment Variables

### Frontend Environment Variables

**Development (.env.development):**
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_API_BASE_URL=http://localhost:5000
REACT_APP_API_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your-key
REACT_APP_RAZORPAY_KEY=rzp_test_your_key
NODE_ENV=development
```

**Production (.env.production):**
```env
VITE_BACKEND_URL=https://yatrikerp.onrender.com
VITE_API_BASE_URL=https://yatrikerp.onrender.com
REACT_APP_API_URL=https://yatrikerp.onrender.com
VITE_GOOGLE_MAPS_API_KEY=your-key
REACT_APP_RAZORPAY_KEY=rzp_live_your_key
NODE_ENV=production
```

### Backend Environment Variables

**Development (.env):**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/yatrik_erp
JWT_SECRET=your-secret
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173
```

**Production (.env on Render):**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/yatrik_erp
JWT_SECRET=your-production-secret
CORS_ORIGIN=https://yatrikerp.live,https://yatrik-frontend-app.onrender.com
```

## 🔍 Troubleshooting

### Issue: 404 errors on API endpoints

**Solution:**
1. Check that your backend is running on port 5000
2. For development, ensure Vite proxy is working (check browser console)
3. For production, verify BACKEND_URL in .env.production

### Issue: CORS errors

**Solution:**
1. Add your frontend URL to backend's CORS_ORIGIN in .env
2. Restart the backend server
3. Clear browser cache

### Issue: Environment variables not loading

**Solution:**
1. Ensure .env file is in the correct directory (frontend/ for frontend, backend/ for backend)
2. Restart the development server after changing .env files
3. Variables starting with VITE_ or REACT_APP_ are exposed to frontend

## 📝 API Configuration Logic

The app uses intelligent environment detection in `frontend/src/utils/api.js`:

```javascript
// Automatically detects environment
const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
const isProduction = hostname.includes('yatrikerp.live');

// Uses appropriate backend URL
if (isDevelopment) {
  base = 'http://localhost:5000';
} else if (isProduction) {
  base = 'https://yatrikerp.onrender.com';
}
```

## ✅ Testing Both Environments

1. **Test Development:**
   - Run `npm run dev` in frontend
   - Open http://localhost:5173
   - Verify API calls go to localhost:5000

2. **Test Production:**
   - Deploy to hosting service
   - Open https://yatrikerp.live
   - Verify API calls go to yatrikerp.onrender.com

## 🎉 Success!

You should now have:
- ✅ Local development running on localhost:5173
- ✅ Production deployment at yatrikerp.live
- ✅ Automatic environment detection
- ✅ No more 404 errors
- ✅ Proper CORS configuration

