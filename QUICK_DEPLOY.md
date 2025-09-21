# 🚀 YATRIK ERP - Quick Deploy Guide

## ⚡ One-Click Free Hosting Setup

This guide will get your YATRIK ERP system live in under 10 minutes with **ZERO cost**!

---

## 🎯 What You Get FREE

- ✅ **Frontend**: Vercel (Free Forever)
- ✅ **Backend**: Railway (Free $5/month credit)
- ✅ **Database**: MongoDB Atlas (Free 512MB)
- ✅ **SSL**: Automatic HTTPS
- ✅ **CDN**: Global content delivery
- ✅ **Custom Domain**: Your own domain
- ✅ **Monitoring**: Built-in dashboards

**Total Cost: $0/month** 🎉

---

## 🚀 Automated Setup (Recommended)

### Option 1: Run the Auto-Setup Script

```bash
# Run the automated setup
node AUTO_SETUP_FREE_HOSTING.js

# Or use npm script
npm run setup:free
```

This will:
- ✅ Check all prerequisites
- ✅ Create environment files
- ✅ Install all dependencies
- ✅ Build the frontend
- ✅ Create deployment configs
- ✅ Generate deployment instructions

### Option 2: Manual Setup

```bash
# 1. Setup environment files
npm run free:env

# 2. Install dependencies
npm run install-all

# 3. Build frontend
npm run build:production

# 4. Show deployment instructions
npm run free:deploy
```

---

## 📋 Step-by-Step Deployment

### Step 1: Database (MongoDB Atlas) - 2 minutes

1. **Go to MongoDB Atlas**: https://www.mongodb.com/atlas
2. **Sign up** with Google/GitHub
3. **Create cluster**:
   - Choose "M0 Sandbox" (Free)
   - Select region closest to you
   - Name: `yatrik-erp`
4. **Create user**:
   - Username: `yatrik_admin`
   - Password: Generate strong password
5. **Whitelist IP**: Add `0.0.0.0/0` (allows all IPs)
6. **Get connection string**:
   ```
   mongodb+srv://yatrik_admin:YOUR_PASSWORD@yatrik-erp.xxxxx.mongodb.net/yatrik_erp
   ```

### Step 2: Backend (Railway) - 3 minutes

1. **Go to Railway**: https://railway.app
2. **Sign up** with GitHub
3. **New Project** → "Deploy from GitHub repo"
4. **Select** your YATRIK ERP repository
5. **Set root directory** to: `backend`
6. **Add environment variables**:
   ```
   MONGODB_URI=mongodb+srv://yatrik_admin:YOUR_PASSWORD@yatrik-erp.xxxxx.mongodb.net/yatrik_erp
   NODE_ENV=production
   JWT_SECRET=your-super-secure-jwt-secret-32-chars-minimum
   SESSION_SECRET=your-super-secure-session-secret-32-chars-minimum
   FRONTEND_URL=https://your-app.vercel.app
   PORT=5000
   ```
7. **Deploy** and wait for success
8. **Copy your backend URL**: `https://your-app.railway.app`

### Step 3: Frontend (Vercel) - 3 minutes

1. **Go to Vercel**: https://vercel.com
2. **Sign up** with GitHub
3. **New Project** → "Import Git Repository"
4. **Select** your YATRIK ERP repository
5. **Set root directory** to: `frontend`
6. **Add environment variables**:
   ```
   REACT_APP_API_URL=https://your-app.railway.app
   REACT_APP_RAZORPAY_KEY=your_razorpay_key
   ```
7. **Deploy** and wait for success
8. **Your app is live**: `https://your-app.vercel.app`

---

## 🔧 Quick Commands

```bash
# Complete setup
npm run free:setup

# Deploy frontend
npm run deploy:frontend

# Deploy backend
npm run deploy:backend

# Test locally
npm run dev

# Check health
npm run health
```

---

## 🎯 Success Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] Database connection working
- [ ] API endpoints responding
- [ ] Frontend can communicate with backend

---

## 🆘 Troubleshooting

### Common Issues:

1. **App not loading**: Check environment variables
2. **Database connection failed**: Verify MongoDB Atlas IP whitelist
3. **CORS errors**: Update FRONTEND_URL in backend
4. **Build failed**: Check all environment variables are set

### Quick Fixes:

```bash
# Check backend health
curl https://your-app.railway.app/api/health

# Check frontend
curl https://your-app.vercel.app

# View logs
# Railway: Dashboard → View Logs
# Vercel: Dashboard → Functions → View Logs
```

---

## 🌟 Pro Tips

1. **Use strong passwords** for database
2. **Save your URLs** somewhere safe
3. **Test all features** after deployment
4. **Set up monitoring** (UptimeRobot - Free)
5. **Use custom domain** (optional)

---

## 🎉 You're Live!

Your YATRIK ERP system is now:
- ✅ **Live on the internet**
- ✅ **Accessible worldwide**
- ✅ **SSL secured**
- ✅ **Auto-scaling**
- ✅ **Professional hosting**

**Total time**: 10 minutes  
**Total cost**: $0/month  
**Result**: Professional bus management system! 🚀

---

## 📞 Need Help?

- Check the logs in your hosting dashboards
- Verify all environment variables
- Test API endpoints individually
- Use browser developer tools

Your YATRIK ERP is ready for business! 🎊
