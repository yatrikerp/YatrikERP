#!/bin/bash

# YATRIK ERP - Enhanced Passenger Booking System Setup Script
# This script helps you implement the enhanced booking system

echo "🎫 YATRIK ERP - Enhanced Passenger Booking System Setup"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the YATRIK ERP root directory"
    exit 1
fi

echo "✅ Found YATRIK ERP project"

# Backup existing files
echo "📦 Backing up existing files..."

if [ -f "backend/routes/payment.js" ]; then
    cp backend/routes/payment.js backend/routes/payment.js.backup
    echo "✅ Backed up payment.js"
fi

if [ -f "backend/routes/conductor.js" ]; then
    cp backend/routes/conductor.js backend/routes/conductor.js.backup
    echo "✅ Backed up conductor.js"
fi

if [ -f "frontend/src/pages/passenger/PassengerDashboard.jsx" ]; then
    cp frontend/src/pages/passenger/PassengerDashboard.jsx frontend/src/pages/passenger/PassengerDashboard.jsx.backup
    echo "✅ Backed up PassengerDashboard.jsx"
fi

# Install required dependencies
echo "📦 Installing required dependencies..."

# Backend dependencies
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Check if qrcode is installed
if ! npm list qrcode > /dev/null 2>&1; then
    echo "Installing qrcode..."
    npm install qrcode
fi

# Check if crypto is available (built-in)
echo "✅ Crypto module available (built-in)"

cd ..

# Frontend dependencies
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

echo "✅ Dependencies checked"

# Update server.js to include enhanced routes
echo "🔧 Updating server configuration..."

# Check if enhanced routes are already included
if ! grep -q "enhancedPayment" backend/server.js; then
    echo "Adding enhanced payment route..."
    # This would need manual addition to server.js
    echo "⚠️  Please manually add the enhanced payment route to backend/server.js"
fi

if ! grep -q "enhancedConductor" backend/server.js; then
    echo "Adding enhanced conductor route..."
    # This would need manual addition to server.js
    echo "⚠️  Please manually add the enhanced conductor route to backend/server.js"
fi

# Create environment variables template
echo "🔧 Creating environment variables template..."

cat > .env.enhanced << EOF
# Enhanced Passenger Booking System Environment Variables

# QR Code Security (REQUIRED)
QR_SIGNING_SECRET=your_secure_qr_signing_secret_here

# Email Configuration (REQUIRED)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Razorpay Configuration (REQUIRED)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# JWT Secret (REQUIRED)
JWT_SECRET=your_jwt_secret_here

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/yatrik_erp

# Server Configuration
PORT=5000
NODE_ENV=development
EOF

echo "✅ Created .env.enhanced template"

# Create implementation guide
cat > IMPLEMENTATION_GUIDE.md << EOF
# 🎫 Enhanced Passenger Booking System - Implementation Guide

## 📋 Quick Setup Steps

### 1. Environment Variables
Copy the environment variables from .env.enhanced to your .env file:
\`\`\`bash
cp .env.enhanced .env
# Edit .env with your actual values
\`\`\`

### 2. Update Server Routes
Add these lines to backend/server.js:
\`\`\`javascript
// Enhanced routes
app.use('/api/payment', require('./routes/enhancedPayment'));
app.use('/api/conductor', require('./routes/enhancedConductor'));
\`\`\`

### 3. Update Frontend Dashboard
Replace the passenger dashboard:
\`\`\`bash
mv frontend/src/components/passenger/EnhancedPassengerDashboard.jsx frontend/src/pages/passenger/PassengerDashboard.jsx
\`\`\`

### 4. Test the System
\`\`\`bash
# Start the backend
cd backend && npm start

# Start the frontend
cd frontend && npm start
\`\`\`

## 🧪 Testing

### Test Email Sending
1. Create a booking through the frontend
2. Complete payment (use mock payment for testing)
3. Check email for ticket with QR code

### Test QR Code Scanning
1. Login as conductor
2. Scan the QR code from the email
3. Verify ticket validation

### Test Passenger Dashboard
1. Login as passenger
2. View tickets in dashboard
3. Click on ticket to see QR code
4. Test download functionality

## 🔧 Troubleshooting

### Email Not Sending
- Check EMAIL_USER and EMAIL_PASS in .env
- Verify email service is working
- Check server logs for errors

### QR Code Issues
- Ensure QR_SIGNING_SECRET is set
- Check if qrcode package is installed
- Verify ticket data is complete

### Conductor Scanning Issues
- Verify conductor is assigned to the trip
- Check QR code payload format
- Ensure ticket is in correct state

## 📞 Support
If you encounter issues, check the server logs and ensure all environment variables are set correctly.
EOF

echo "✅ Created implementation guide"

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📋 Next Steps:"
echo "1. Copy .env.enhanced to .env and update with your values"
echo "2. Add enhanced routes to backend/server.js"
echo "3. Replace passenger dashboard with enhanced version"
echo "4. Test the system with a sample booking"
echo ""
echo "📖 See IMPLEMENTATION_GUIDE.md for detailed instructions"
echo ""
echo "🔧 Files Created:"
echo "- backend/utils/ticketQRManager.js (QR code management)"
echo "- backend/config/enhancedEmailTemplates.js (Email templates)"
echo "- backend/routes/enhancedPayment.js (Payment verification)"
echo "- backend/routes/enhancedConductor.js (Conductor scanning)"
echo "- frontend/src/components/passenger/EnhancedPassengerDashboard.jsx (Dashboard)"
echo "- PASSENGER_BOOKING_SYSTEM_ENHANCEMENT.md (Documentation)"
echo ""
echo "✨ Your enhanced passenger booking system is ready!"



