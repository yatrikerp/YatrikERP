# 🚂 Railway Deployment - Error Fix Guide

## ❌ Error You're Seeing

```
sh: 1: react-scripts: not found
Failed to build an image
```

**Cause:** Railway was trying to build the entire project (frontend + backend) from the root directory, but the frontend build requires `react-scripts` which isn't installed globally.

---

## ✅ Solution Applied

I've created **3 configuration files** to fix this:

### 1. **railway.toml** - Main Railway Configuration
Tells Railway to only build and deploy the backend.

### 2. **nixpacks.toml** - Build Configuration
Specifies exact build commands for the backend only.

### 3. **.railwayignore** - Ignore Frontend
Tells Railway to ignore frontend directory during deployment.

### 4. **Updated package.json**
Changed the root `build` script to not try building frontend.

---

## 🚀 How to Deploy Now

### Option 1: Push to Git and Redeploy (Easiest)

1. **Commit the changes:**
```bash
git add .
git commit -m "Fix Railway deployment configuration"
git push
```

2. **Railway will automatically redeploy** with the new configuration!

---

### Option 2: Redeploy from Railway Dashboard

1. Go to your Railway dashboard
2. Click on your **yatrik-erp** service
3. Click **"Deployments"** tab
4. Click **"Redeploy"** or **"Deploy"** button
5. Wait for the build to complete

---

### Option 3: Manual Railway Settings (If above doesn't work)

In your Railway dashboard:

1. **Click on your service** → **Settings**

2. **Root Directory:** Leave empty OR set to `/`

3. **Build Command:** 
```bash
cd backend && npm install
```

4. **Start Command:**
```bash
cd backend && npm start
```

5. **Watch Paths:** (Optional)
```
backend/**
```

6. Click **"Save"**

7. **Redeploy**

---

## 🔧 Environment Variables to Set

Make sure these are set in Railway → Variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yatrik
JWT_SECRET=8a95b93b86ebfcf404a320d8978fad5c0a509fe3c45160dfa4987989df636921e58e2883a333018afde338209eca25e5fa203d52f68149cb5591ead3e7b2d0a2
SESSION_SECRET=2f3f9673d4e742bfeec70e16cd112fad4fa6c68cc503c63b6468f0f1eabae3f507da1af72fd8deb329ae64844e221f6279a0c05a2bf77b50462ead3bf60fe08e
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend.vercel.app
```

**Note:** Use the secrets generated earlier or generate new ones with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## ✅ What Should Happen Now

After applying the fix:

1. ✅ **Build Phase:** Railway will only install backend dependencies
2. ✅ **No Frontend Build:** Railway won't try to build frontend
3. ✅ **Start Command:** Only starts the backend server
4. ✅ **Health Check:** Railway checks `/api/health` endpoint
5. ✅ **Deployment Success:** Your backend API will be live!

---

## 🧪 Testing After Deployment

Once deployed successfully:

### 1. Get Your Railway URL
It will look like: `https://yatrik-erp-production.up.railway.app`

### 2. Test Health Endpoint
```bash
curl https://your-railway-url.railway.app/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "database": "connected",
  "api": "running",
  "timestamp": "2025-10-01T..."
}
```

### 3. Check Logs
In Railway dashboard → **Deployments** → Click on latest deployment → **View Logs**

You should see:
```
✅ Connected to Atlas MongoDB successfully
🚀 Server running on port 5000
```

---

## 🎯 Next Step: Deploy Frontend

Once backend is deployed successfully:

### Deploy Frontend to Vercel:

1. **Go to https://vercel.com**
2. **Import** your repository
3. **Configure:**
   - Framework: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
4. **Environment Variables:**
   ```
   REACT_APP_API_URL=https://your-railway-url.railway.app
   REACT_APP_MAPBOX_TOKEN=your_mapbox_token
   REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key
   ```
5. **Deploy!**

---

## 🔍 Troubleshooting

### If Build Still Fails:

**Check 1: Verify Files Exist**
```bash
ls -la railway.toml
ls -la nixpacks.toml
ls -la .railwayignore
```

**Check 2: View Railway Build Logs**
Look for which command is failing in the Railway dashboard logs.

**Check 3: Try Railway CLI** (if you have it)
```bash
cd backend
railway up
```

**Check 4: Verify backend package.json**
```bash
cd backend
cat package.json
```
Make sure it has a `start` script.

### If Database Connection Fails:

1. Check MongoDB Atlas **Network Access**
2. Add `0.0.0.0/0` to IP whitelist
3. Verify `MONGODB_URI` is correct in Railway variables

### If Environment Variables Missing:

Railway Dashboard → Your Service → Variables → Add all required variables

---

## 📋 Quick Checklist

Before redeploying:

- [ ] `railway.toml` file created in root
- [ ] `nixpacks.toml` file created in root
- [ ] `.railwayignore` file created in root
- [ ] `package.json` updated (build script changed)
- [ ] All environment variables set in Railway
- [ ] MongoDB Atlas IP whitelist allows all (0.0.0.0/0)
- [ ] Git changes committed and pushed

---

## 🆘 Alternative: Start Fresh

If you want to start completely fresh in Railway:

1. **Delete current service** in Railway
2. **Create new service** → **"Empty Project"**
3. **Add from GitHub** → Select your repo
4. **Set Root Directory:** `backend`
5. **Add Environment Variables**
6. **Deploy**

Railway will use the new configuration files automatically!

---

## 📞 Need More Help?

- Review Railway Logs for specific errors
- Check [Railway Documentation](https://docs.railway.app)
- Verify all environment variables are set correctly
- Ensure MongoDB connection string is valid

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ Build completes without errors
2. ✅ Deployment shows "Active" status
3. ✅ Health endpoint returns 200 OK
4. ✅ Logs show "Connected to MongoDB"
5. ✅ You can access your Railway URL

---

**Your backend should deploy successfully now!** 🚀

After backend is live, deploy the frontend to Vercel and you're all set!

