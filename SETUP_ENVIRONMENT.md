# Environment Setup Guide

## Important: Sensitive Data Removed

This repository has been cleaned of all sensitive information including:
- Database credentials
- API keys
- OAuth client secrets
- Email passwords

## Setup Instructions

### 1. Create your .env file
Copy the template and add your actual credentials:

```bash
cp backend/.env.template backend/.env
```

Then edit `backend/.env` with your actual values:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_actual_mongodb_connection_string
MONGO_URI=your_actual_mongodb_connection_string
JWT_SECRET=your_actual_jwt_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUDIT_DISABLED=true

GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback 

# Email Configuration 
EMAIL_USER=your_actual_email@gmail.com 
EMAIL_PASSWORD=your_actual_app_password

RAZORPAY_KEY_ID=your_actual_razorpay_key_id
RAZORPAY_KEY_SECRET=your_actual_razorpay_key_secret

ML_SERVICE_URL=http://localhost:5001
PY_SERVICE_PORT=5001
```

### 2. Google OAuth Setup
You'll need to download your Google OAuth client secret file and place it in:
- `backend/client_secret_[your-client-id].json`
- `flutter/client_secret_[your-client-id].json`

### 3. Security Notes
- Never commit `.env` files to Git
- Never commit `client_secret_*.json` files to Git
- These files are already in `.gitignore`

### 4. Running the Application
After setting up your environment:

```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm start

# Flutter
cd flutter
flutter pub get
flutter run
```

## What's New in This Update

This commit includes:
- ✅ Complete AI scheduling system
- ✅ Blockchain integration for tickets
- ✅ Flutter mobile app with full features
- ✅ ML research and analytics
- ✅ Enhanced payment gateway
- ✅ Conductor dashboard improvements
- ✅ Comprehensive documentation

All sensitive data has been removed and secured properly.