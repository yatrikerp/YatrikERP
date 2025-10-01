# 🎨 Frontend Deployment to Vercel - Step by Step

## Backend URL (Use This!)
```
https://yatrik-erp-production-075e.up.railway.app
```

---

## 🚀 Deploy Frontend to Vercel

### Method 1: Vercel Dashboard (Recommended - No CLI)

#### Step 1: Go to Vercel
1. Visit **https://vercel.com**
2. Click **"Sign Up"** or **"Login"**
3. Choose **"Continue with GitHub"**

#### Step 2: Import Your Project
1. Click **"Add New"** → **"Project"**
2. Click **"Import Git Repository"**
3. Find and select **YATRIK ERP** repository
4. Click **"Import"**

#### Step 3: Configure Project Settings
```
Framework Preset: Create React App
Root Directory: frontend
Build Command: npm run build
Output Directory: build
Install Command: npm install
Node.js Version: 18.x (default is fine)
```

#### Step 4: Add Environment Variables

Click **"Environment Variables"** and add these:

**Variable 1:**
```
Name: REACT_APP_API_URL
Value: https://yatrik-erp-production-075e.up.railway.app
```

**Variable 2:** (Get from Mapbox.com)
```
Name: REACT_APP_MAPBOX_TOKEN
Value: pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJ5b3VyLXRva2VuIn0.xxxxx
```

**Variable 3:** (Use your Razorpay key)
```
Name: REACT_APP_RAZORPAY_KEY_ID
Value: rzp_test_xxxxxxxxxxxxx
```

#### Step 5: Deploy!
1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Get your URL: `https://yatrik-erp.vercel.app`

---

### Method 2: Vercel CLI

If you prefer command line:

#### Install Vercel CLI
```bash
npm install -g vercel
```

#### Deploy
```bash
cd frontend
vercel login
vercel --prod
```

Follow the prompts and add environment variables when asked.

---

## 📋 Environment Variables Checklist

Before deploying, ensure you have:

- [ ] **REACT_APP_API_URL** - Your Railway backend URL
- [ ] **REACT_APP_MAPBOX_TOKEN** - Get from https://mapbox.com
- [ ] **REACT_APP_RAZORPAY_KEY_ID** - Get from Razorpay dashboard

---

## 🗺️ Getting Mapbox Token (If you don't have it)

1. Go to **https://account.mapbox.com/auth/signup/**
2. Sign up for free account
3. Go to **"Access tokens"** page
4. Copy your **"Default public token"**
5. Or create a new token with these scopes:
   - ✅ styles:read
   - ✅ fonts:read
   - ✅ datasets:read

Token format: `pk.eyJ1Ijoi...`

---

## 💳 Getting Razorpay Key (If you don't have it)

1. Go to **https://razorpay.com**
2. Sign up for account
3. Go to **Settings** → **API Keys**
4. Generate **Test Mode Keys** for testing
5. Copy **Key ID** (starts with `rzp_test_`)

---

## 🔗 After Frontend Deployment

### Step 1: Update Railway Environment Variable

Add your Vercel URL to Railway:

1. Go to Railway Dashboard
2. Click on **Variables** tab
3. Add new variable:
   ```
   Name: FRONTEND_URL
   Value: https://your-app.vercel.app
   ```
4. Railway will automatically redeploy

### Step 2: Test Your Application

Visit your Vercel URL and test:

1. ✅ Landing page loads
2. ✅ Login page works
3. ✅ Can search trips
4. ✅ All pages accessible
5. ✅ API calls work (check browser console)

---

## 🧪 Testing Checklist

### Frontend Tests:
- [ ] Landing page loads
- [ ] Login/Signup forms work
- [ ] Trip search functional
- [ ] Can view routes
- [ ] Images load correctly
- [ ] No console errors

### Backend Connection Tests:
- [ ] API calls succeed (check Network tab)
- [ ] Can authenticate
- [ ] Data loads from backend
- [ ] CORS working (no CORS errors)

### Full Flow Tests:
- [ ] User can register
- [ ] User can login
- [ ] Can search trips
- [ ] Can select seats
- [ ] Payment integration loads
- [ ] Real-time features work

---

## 🔍 Troubleshooting

### Frontend Build Fails
**Error:** Build command failed
**Fix:** 
- Check if `frontend/package.json` exists
- Verify root directory is set to `frontend`
- Check build command is `npm run build`

### API Not Connecting
**Error:** Network error or CORS
**Fix:**
1. Verify `REACT_APP_API_URL` in Vercel environment variables
2. Check Railway backend CORS settings
3. Ensure `FRONTEND_URL` is set in Railway

### Environment Variables Not Working
**Error:** undefined variables
**Fix:**
- Variable names must start with `REACT_APP_`
- Redeploy after adding variables
- Check spelling of variable names

### Mapbox Not Loading
**Error:** Map doesn't show
**Fix:**
- Verify Mapbox token is valid
- Check token has correct permissions
- Ensure token starts with `pk.`

---

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ Vercel deployment shows "Ready"
2. ✅ Frontend URL is accessible
3. ✅ No errors in browser console
4. ✅ API calls to Railway backend succeed
5. ✅ Can login and use the application
6. ✅ Real-time features operational

---

## 📞 URLs Summary

After deployment, you'll have:

| Service | URL | Purpose |
|---------|-----|---------|
| **Backend API** | https://yatrik-erp-production-075e.up.railway.app | Railway (Already deployed ✅) |
| **Frontend** | https://yatrik-erp.vercel.app | Vercel (Deploy now) |
| **Database** | MongoDB Atlas | Already connected ✅ |

---

## 🎯 Final Steps

1. **Deploy frontend to Vercel** (15 minutes)
2. **Add `FRONTEND_URL` to Railway** (2 minutes)
3. **Test the application** (10 minutes)
4. **You're LIVE!** 🚀

---

**Total deployment time: ~30 minutes**

Your complete YATRIK ERP system will be live and accessible to users worldwide! 🌍

