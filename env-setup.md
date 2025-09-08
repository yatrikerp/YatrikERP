# Environment Setup Instructions

## Issue Identified
The authentication errors are occurring because the project is missing environment configuration files. The backend server cannot connect to MongoDB and the frontend cannot connect to the backend API.

## Required Environment Files

### 1. Create `.env` in the root directory:
```bash
# YATRIK ERP - Main Environment Configuration

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/yatrik_erp

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Session Configuration
SESSION_SECRET=your-session-secret-key-change-this-in-production

# Frontend Configuration
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Email Configuration (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Razorpay Configuration (Optional - for payments)
RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here

# Google OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth Configuration (Optional)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

### 2. Create `frontend/.env`:
```bash
# YATRIK ERP Frontend Environment Configuration

# API Configuration
REACT_APP_API_URL=http://localhost:5000

# Razorpay Configuration
REACT_APP_RAZORPAY_KEY=rzp_test_your_razorpay_key_here

# Backend URL for Vite proxy
BACKEND_URL=http://localhost:5000

# Development Configuration
PORT=5173
```

### 3. Create `backend/.env`:
```bash
# YATRIK ERP Backend Environment Configuration

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/yatrik_erp

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Session Configuration
SESSION_SECRET=your-session-secret-key-change-this-in-production

# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# Email Configuration (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Razorpay Configuration (Optional - for payments)
RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here

# Google OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth Configuration (Optional)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

## Steps to Fix the Authentication Issues:

1. **Create the environment files** as shown above
2. **Start MongoDB** (if not already running):
   ```bash
   # On Windows (if MongoDB is installed as a service)
   net start MongoDB
   
   # Or start MongoDB manually
   mongod
   ```

3. **Start the backend server**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

4. **Start the frontend** (in a new terminal):
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Verification Steps:

1. Check if backend is running: http://localhost:5000/api/health
2. Check if frontend is running: http://localhost:5173
3. Try logging in with test credentials

## Common Issues and Solutions:

- **404 errors**: Backend server not running or wrong port
- **400 errors**: Missing environment variables or database connection issues
- **Network errors**: Frontend cannot reach backend (check REACT_APP_API_URL)

## Test Credentials:
You may need to create test users first. Check the backend scripts for creating sample data.
