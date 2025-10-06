# 🚀 YATRIK ERP - Quick Deployment Guide

## Table of Contents
1. [Pre-Deployment Setup](#pre-deployment-setup)
2. [Environment Configuration](#environment-configuration)
3. [Local Testing](#local-testing)
4. [Production Deployment](#production-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)

---

## Pre-Deployment Setup

### System Requirements
- **Node.js:** 18.x or later
- **npm:** 9.x or later
- **MongoDB Atlas:** Account with cluster
- **Git:** Version control

### 1. Install Dependencies

```bash
# Install all dependencies (root, backend, frontend)
npm run install-all
```

### 2. Verify Installation

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check if all packages installed
cd backend && npm list --depth=0
cd ../frontend && npm list --depth=0
```

---

## Environment Configuration

### 1. Create Environment Files

```bash
# Automated setup (recommended)
npm run setup:env

# OR manual setup
copy env.production.template .env
copy backend\env.production.template backend\.env
copy frontend\env.production.template frontend\.env
```

### 2. Configure MongoDB

**Get MongoDB Atlas Connection String:**
1. Login to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create/Select cluster
3. Click "Connect" → "Connect your application"
4. Copy connection string
5. Replace `<password>` with your database password

**Update backend/.env:**
```env
MONGODB_URI=mongodb+srv://username:<password>@cluster.mongodb.net/yatrik-erp?retryWrites=true&w=majority
```

### 3. Configure JWT Secrets

**Generate secure secrets:**
```bash
# On Windows (PowerShell)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# On Linux/Mac
openssl rand -hex 64
```

**Update backend/.env:**
```env
JWT_SECRET=<your-generated-secret-1>
SESSION_SECRET=<your-generated-secret-2>
```

### 4. Configure Payment Gateway (Razorpay)

1. Sign up at [Razorpay](https://razorpay.com)
2. Get API Keys from Dashboard
3. Update backend/.env:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

### 5. Configure Email Service

**For Gmail:**
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=<app-specific-password>
```

**To get Gmail App Password:**
1. Enable 2-Factor Authentication
2. Go to Google Account → Security → App Passwords
3. Generate password for "Mail"
4. Use generated password in EMAIL_PASSWORD

### 6. Configure Maps (Mapbox)

1. Sign up at [Mapbox](https://mapbox.com)
2. Get access token
3. Update frontend/.env:
```env
REACT_APP_MAPBOX_TOKEN=pk.xxxxxxxxxxxxxxxxxxxxx
```

### 7. Configure OAuth (Optional)

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project → Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
5. Update backend/.env:
```env
GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

### 8. Set Frontend URL

**Update backend/.env:**
```env
FRONTEND_URL=http://localhost:5173
```

**Update frontend/.env:**
```env
REACT_APP_API_URL=http://localhost:5000
```

---

## Local Testing

### 1. Start Development Servers

```bash
# Start both frontend and backend
npm run dev
```

**OR start separately:**
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

### 2. Verify Services

**Check Backend:**
- Open: http://localhost:5000/api/health
- Expected: `{"status":"OK","database":"connected"}`

**Check Frontend:**
- Open: http://localhost:5173
- Expected: Landing page loads

### 3. Test User Roles

**Create Admin User:**
```bash
cd backend
node scripts/create-admin.js
```

**Test Login:**
1. Go to http://localhost:5173/login
2. Login as admin
3. Verify dashboard access

### 4. Run Tests

```bash
# All tests
npm test

# Role-based tests
npm run test:login

# E2E tests
npm run test:e2e
```

---

## Production Deployment

### Option 1: Deploy to Railway (Recommended for Backend)

#### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

#### 2. Login to Railway

```bash
railway login
```

#### 3. Deploy Backend

```bash
cd backend
railway init
railway up
```

#### 4. Set Environment Variables

```bash
# Set each variable
railway variables set MONGODB_URI="your-mongodb-uri"
railway variables set JWT_SECRET="your-jwt-secret"
railway variables set SESSION_SECRET="your-session-secret"
# ... add all other variables
```

#### 5. Get Deployment URL

```bash
railway domain
# Note the URL (e.g., https://yatrik-backend.railway.app)
```

---

### Option 2: Deploy to Fly.io

#### 1. Install Fly CLI

```bash
# Windows (PowerShell)
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Mac/Linux
curl -L https://fly.io/install.sh | sh
```

#### 2. Login and Deploy

```bash
cd backend
fly auth login
fly launch
fly deploy
```

#### 3. Set Environment Variables

```bash
fly secrets set MONGODB_URI="your-mongodb-uri"
fly secrets set JWT_SECRET="your-jwt-secret"
# ... add all other secrets
```

---

### Option 3: Deploy with Docker

#### 1. Install Docker

Download from [Docker.com](https://www.docker.com/get-started)

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - SESSION_SECRET=${SESSION_SECRET}
    volumes:
      - ./backend:/app
    
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
```

#### 3. Deploy

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

### Frontend Deployment

#### Option 1: Vercel (Recommended)

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Option 2: Netlify

```bash
cd frontend

# Build
npm run build

# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=build
```

#### Option 3: Same Server as Backend

```bash
cd frontend
npm run build

# Serve static files
npx serve -s build -l 3000
```

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# Check backend health
curl https://your-backend-url.com/api/health

# Expected response:
# {"status":"OK","database":"connected","api":"running"}
```

### 2. Test Critical Flows

**✅ Authentication:**
- [ ] User registration works
- [ ] Login successful
- [ ] JWT token generated
- [ ] Role-based access working

**✅ Booking Flow:**
- [ ] Search trips
- [ ] Select seats
- [ ] Process payment
- [ ] Generate ticket

**✅ Real-time Features:**
- [ ] GPS tracking updates
- [ ] Socket connection stable
- [ ] Notifications deliver

**✅ Payment:**
- [ ] Razorpay integration working
- [ ] Payment success callback
- [ ] Transaction recorded

### 3. Monitor Logs

**Railway:**
```bash
railway logs
```

**Fly.io:**
```bash
fly logs
```

**Docker:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 4. Performance Check

**Test API Response Time:**
```bash
curl -w "@-" -o /dev/null -s https://your-api.com/api/health << 'EOF'
    time_namelookup:  %{time_namelookup}\n
    time_connect:  %{time_connect}\n
    time_total:  %{time_total}\n
EOF
```

### 5. Security Verification

- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] JWT validation working
- [ ] Password encryption verified

---

## Environment Variables Checklist

### Backend (.env)

```env
# Database
✅ MONGODB_URI=

# Authentication
✅ JWT_SECRET=
✅ SESSION_SECRET=

# Server
✅ PORT=5000
✅ NODE_ENV=production
✅ FRONTEND_URL=

# Payment
✅ RAZORPAY_KEY_ID=
✅ RAZORPAY_KEY_SECRET=

# Email
✅ EMAIL_SERVICE=
✅ EMAIL_USER=
✅ EMAIL_PASSWORD=

# OAuth (Optional)
⬜ GOOGLE_CLIENT_ID=
⬜ GOOGLE_CLIENT_SECRET=
⬜ TWITTER_CONSUMER_KEY=
⬜ TWITTER_CONSUMER_SECRET=
```

### Frontend (.env)

```env
# API
✅ REACT_APP_API_URL=

# Maps
✅ REACT_APP_MAPBOX_TOKEN=

# Payment
✅ REACT_APP_RAZORPAY_KEY_ID=
```

---

## Troubleshooting

### MongoDB Connection Failed

**Error:** `MongooseServerSelectionError`

**Solution:**
1. Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0)
2. Verify connection string is correct
3. Check database user credentials
4. Ensure network access in MongoDB Atlas

### JWT Authentication Error

**Error:** `JsonWebTokenError: invalid token`

**Solution:**
1. Ensure JWT_SECRET is same in all deployments
2. Check token expiry (24h default)
3. Clear browser cookies and login again

### Payment Integration Not Working

**Error:** Payment callback fails

**Solution:**
1. Use correct Razorpay keys (test vs live)
2. Verify webhook URL in Razorpay dashboard
3. Check CORS settings for payment domain
4. Enable payment methods in Razorpay

### Real-time Tracking Not Updating

**Error:** Socket connection fails

**Solution:**
1. Check WebSocket support on hosting platform
2. Verify FRONTEND_URL in backend .env
3. Check CORS for Socket.IO
4. Enable sticky sessions if using load balancer

### Email Not Sending

**Error:** Email delivery fails

**Solution:**
1. Check Gmail app password (not regular password)
2. Enable "Less secure app access" (if using Gmail)
3. Verify EMAIL_SERVICE configuration
4. Check email queue processing

---

## Quick Commands Reference

```bash
# Development
npm run dev                    # Start dev servers
npm run server                 # Backend only
npm run client                 # Frontend only

# Build
npm run build                  # Build frontend
npm run build:production       # Production build

# Testing
npm test                       # Run all tests
npm run test:login             # Test authentication
npm run health                 # Check API health

# Deployment
npm run deploy:docker          # Deploy with Docker
npm run deploy:fly             # Deploy to Fly.io
npm run deploy:backend         # Deploy backend to Railway
npm run deploy:frontend        # Deploy frontend to Vercel

# Setup
npm run install-all            # Install dependencies
npm run setup:env              # Setup env files
npm run auto:setup             # Automated setup
```

---

## Support & Resources

### Documentation
- 📄 Project Report: `PROJECT_DEPLOYMENT_REPORT.md`
- 🚀 This Guide: `DEPLOYMENT_GUIDE.md`
- 🔧 Environment Template: `env.production.template`

### External Resources
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
- [Railway Docs](https://docs.railway.app)
- [Fly.io Docs](https://fly.io/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Razorpay Docs](https://razorpay.com/docs)

### Get Help
- Check error logs first
- Review environment variables
- Test locally before deployment
- Verify third-party service status

---

## ✅ Deployment Complete!

After successful deployment:
1. ✅ Backend running and healthy
2. ✅ Frontend accessible
3. ✅ Database connected
4. ✅ All environment variables set
5. ✅ Payment integration working
6. ✅ Email service active
7. ✅ Real-time features operational
8. ✅ All user roles functional

**Your YATRIK ERP is now LIVE! 🎉**

Access your deployed application and start managing bus operations!

---

*Last Updated: October 1, 2025*

