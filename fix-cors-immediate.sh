#!/bin/bash

# YATRIK ERP - Immediate CORS Fix Script
# This script fixes the CORS errors you're experiencing

echo "🚨 YATRIK ERP - IMMEDIATE CORS FIX"
echo "=================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_info "Fixing CORS configuration for production deployment..."

# Step 1: Commit the CORS fix
print_info "Committing CORS fix to git..."

git add backend/server.js
git commit -m "Fix CORS configuration for production deployment" || {
    print_warning "No changes to commit or git not initialized"
}

# Step 2: Push to trigger deployment
print_info "Pushing changes to trigger Render deployment..."

git push origin main || {
    print_error "Failed to push to git. Please check your git configuration."
    exit 1
}

print_status "Code changes pushed successfully"

# Step 3: Display environment variables to set in Render
echo ""
print_info "🔧 CRITICAL: Update these environment variables in Render Dashboard"
echo "=================================================================="
echo ""
print_warning "Go to your Render backend service dashboard and add/update these:"
echo ""
echo "CORS_ORIGIN=https://yatrik-frontend-app.onrender.com,https://yatrikerp.live"
echo "FRONTEND_URL=https://yatrik-frontend-app.onrender.com"
echo "BACKEND_URL=https://yatrikerp.onrender.com"
echo ""
print_info "Steps to update in Render:"
echo "1. Go to https://dashboard.render.com"
echo "2. Select your backend service (yatrikerp-backend)"
echo "3. Click 'Environment' tab"
echo "4. Add/update the variables above"
echo "5. Click 'Save Changes'"
echo "6. Wait for automatic redeployment"
echo ""

# Step 4: Test commands
print_info "🧪 Test commands to verify the fix:"
echo "======================================"
echo ""
echo "# Test CORS preflight request:"
echo "curl -H \"Origin: https://yatrik-frontend-app.onrender.com\" \\"
echo "     -H \"Access-Control-Request-Method: GET\" \\"
echo "     -H \"Access-Control-Request-Headers: Content-Type\" \\"
echo "     -X OPTIONS \\"
echo "     https://yatrikerp.onrender.com/api/routes/cities"
echo ""
echo "# Test actual API call:"
echo "curl -H \"Origin: https://yatrik-frontend-app.onrender.com\" \\"
echo "     https://yatrikerp.onrender.com/api/routes/cities"
echo ""
echo "# Test backend health:"
echo "curl https://yatrikerp.onrender.com/api/health"
echo ""

# Step 5: Wait and verify
print_info "⏳ Next steps:"
echo "==============="
echo ""
print_info "1. Update environment variables in Render (see above)"
print_info "2. Wait 5-10 minutes for deployment to complete"
print_info "3. Test your frontend - CORS errors should be gone"
print_info "4. If issues persist, check Render logs"
echo ""

print_status "CORS fix applied! Your deployment should work perfectly after updating environment variables."
echo ""
print_warning "Remember: The most important step is updating the CORS_ORIGIN environment variable in Render!"
