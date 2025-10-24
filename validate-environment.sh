#!/bin/bash

# YATRIK ERP - Environment Validation Script
# This script validates all environment variables for perfect deployment

echo "🔍 YATRIK ERP - Environment Validation"
echo "====================================="

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

# Function to validate environment variable
validate_env() {
    local var_name=$1
    local var_value=$2
    local required=${3:-true}
    local min_length=${4:-0}
    
    if [ -z "$var_value" ]; then
        if [ "$required" = true ]; then
            print_error "$var_name is required but not set"
            return 1
        else
            print_warning "$var_name is optional and not set"
            return 0
        fi
    fi
    
    if [ ${#var_value} -lt $min_length ]; then
        print_error "$var_name is too short (minimum $min_length characters)"
        return 1
    fi
    
    print_status "$var_name is valid"
    return 0
}

# Function to validate URL format
validate_url() {
    local var_name=$1
    local var_value=$2
    
    if [[ $var_value =~ ^https?:// ]]; then
        print_status "$var_name has valid URL format"
        return 0
    else
        print_error "$var_name is not a valid URL (should start with http:// or https://)"
        return 1
    fi
}

# Function to validate MongoDB URI
validate_mongodb_uri() {
    local var_name=$1
    local var_value=$2
    
    if [[ $var_value =~ ^mongodb\+srv:// ]]; then
        print_status "$var_name has valid MongoDB Atlas format"
        return 0
    elif [[ $var_value =~ ^mongodb:// ]]; then
        print_warning "$var_name uses local MongoDB (not recommended for production)"
        return 0
    else
        print_error "$var_name is not a valid MongoDB URI"
        return 1
    fi
}

# Function to validate email format
validate_email() {
    local var_name=$1
    local var_value=$2
    
    if [[ $var_value =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        print_status "$var_name has valid email format"
        return 0
    else
        print_error "$var_name is not a valid email format"
        return 1
    fi
}

# Function to validate Google OAuth credentials
validate_google_oauth() {
    local client_id=$1
    local client_secret=$2
    
    if [[ $client_id =~ ^[0-9]+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$ ]]; then
        print_status "Google Client ID has valid format"
    else
        print_error "Google Client ID format is invalid"
        return 1
    fi
    
    if [ ${#client_secret} -ge 20 ]; then
        print_status "Google Client Secret has valid length"
    else
        print_error "Google Client Secret is too short"
        return 1
    fi
    
    return 0
}

# Function to validate Razorpay credentials
validate_razorpay() {
    local key_id=$1
    local key_secret=$2
    
    if [[ $key_id =~ ^rzp_(live|test)_ ]]; then
        print_status "Razorpay Key ID has valid format"
    else
        print_error "Razorpay Key ID format is invalid (should start with rzp_live_ or rzp_test_)"
        return 1
    fi
    
    if [ ${#key_secret} -ge 20 ]; then
        print_status "Razorpay Key Secret has valid length"
    else
        print_error "Razorpay Key Secret is too short"
        return 1
    fi
    
    return 0
}

# Load environment variables
print_info "Loading environment variables..."

# Backend environment variables
if [ -f "backend/.env" ]; then
    source backend/.env
    print_status "Backend .env file loaded"
else
    print_error "Backend .env file not found"
    exit 1
fi

# Frontend environment variables
if [ -f "frontend/.env" ]; then
    source frontend/.env
    print_status "Frontend .env file loaded"
else
    print_error "Frontend .env file not found"
    exit 1
fi

print_info "Validating environment variables..."

# Validation results
validation_errors=0

# Backend validations
echo ""
echo "🔧 BACKEND VALIDATION"
echo "===================="

validate_env "NODE_ENV" "$NODE_ENV" true 3
if [ $? -ne 0 ]; then ((validation_errors++)); fi

validate_env "PORT" "$PORT" true 1
if [ $? -ne 0 ]; then ((validation_errors++)); fi

validate_mongodb_uri "MONGODB_URI" "$MONGODB_URI"
if [ $? -ne 0 ]; then ((validation_errors++)); fi

validate_env "JWT_SECRET" "$JWT_SECRET" true 32
if [ $? -ne 0 ]; then ((validation_errors++)); fi

validate_env "SESSION_SECRET" "$SESSION_SECRET" true 32
if [ $? -ne 0 ]; then ((validation_errors++)); fi

validate_url "FRONTEND_URL" "$FRONTEND_URL"
if [ $? -ne 0 ]; then ((validation_errors++)); fi

validate_url "BACKEND_URL" "$BACKEND_URL"
if [ $? -ne 0 ]; then ((validation_errors++)); fi

validate_google_oauth "$GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_SECRET"
if [ $? -ne 0 ]; then ((validation_errors++)); fi

validate_url "GOOGLE_CALLBACK_URL" "$GOOGLE_CALLBACK_URL"
if [ $? -ne 0 ]; then ((validation_errors++)); fi

validate_env "CORS_ORIGIN" "$CORS_ORIGIN" true 10
if [ $? -ne 0 ]; then ((validation_errors++)); fi

# Optional backend validations
if [ -n "$EMAIL_USER" ]; then
    validate_email "EMAIL_USER" "$EMAIL_USER"
    if [ $? -ne 0 ]; then ((validation_errors++)); fi
fi

if [ -n "$RAZORPAY_KEY_ID" ] && [ -n "$RAZORPAY_KEY_SECRET" ]; then
    validate_razorpay "$RAZORPAY_KEY_ID" "$RAZORPAY_KEY_SECRET"
    if [ $? -ne 0 ]; then ((validation_errors++)); fi
fi

# Frontend validations
echo ""
echo "🎨 FRONTEND VALIDATION"
echo "====================="

validate_env "NODE_ENV" "$NODE_ENV" true 3
if [ $? -ne 0 ]; then ((validation_errors++)); fi

validate_url "REACT_APP_API_URL" "$REACT_APP_API_URL"
if [ $? -ne 0 ]; then ((validation_errors++)); fi

validate_url "VITE_API_BASE_URL" "$VITE_API_BASE_URL"
if [ $? -ne 0 ]; then ((validation_errors++)); fi

validate_url "VITE_BACKEND_URL" "$VITE_BACKEND_URL"
if [ $? -ne 0 ]; then ((validation_errors++)); fi

validate_env "VITE_GOOGLE_MAPS_API_KEY" "$VITE_GOOGLE_MAPS_API_KEY" true 30
if [ $? -ne 0 ]; then ((validation_errors++)); fi

validate_url "REACT_APP_FRONTEND_URL" "$REACT_APP_FRONTEND_URL"
if [ $? -ne 0 ]; then ((validation_errors++)); fi

validate_url "VITE_FRONTEND_URL" "$VITE_FRONTEND_URL"
if [ $? -ne 0 ]; then ((validation_errors++)); fi

# Cross-validation
echo ""
echo "🔗 CROSS-VALIDATION"
echo "=================="

# Check if frontend API URL matches backend URL
if [ "$REACT_APP_API_URL" = "$BACKEND_URL" ]; then
    print_status "Frontend API URL matches backend URL"
else
    print_error "Frontend API URL ($REACT_APP_API_URL) doesn't match backend URL ($BACKEND_URL)"
    ((validation_errors++))
fi

# Check if CORS includes frontend URL
if [[ "$CORS_ORIGIN" == *"$FRONTEND_URL"* ]]; then
    print_status "CORS includes frontend URL"
else
    print_error "CORS doesn't include frontend URL ($FRONTEND_URL)"
    ((validation_errors++))
fi

# Check if Google callback URL matches backend URL
if [[ "$GOOGLE_CALLBACK_URL" == "$BACKEND_URL"* ]]; then
    print_status "Google callback URL matches backend URL"
else
    print_error "Google callback URL ($GOOGLE_CALLBACK_URL) doesn't match backend URL ($BACKEND_URL)"
    ((validation_errors++))
fi

# Security validations
echo ""
echo "🔒 SECURITY VALIDATION"
echo "====================="

# Check for default/weak secrets
if [ "$JWT_SECRET" = "your-super-secure-jwt-secret-minimum-32-characters-long-change-this" ]; then
    print_error "JWT_SECRET is using default value - CHANGE THIS!"
    ((validation_errors++))
else
    print_status "JWT_SECRET is customized"
fi

if [ "$SESSION_SECRET" = "your-super-secure-session-secret-minimum-32-characters-long-change-this" ]; then
    print_error "SESSION_SECRET is using default value - CHANGE THIS!"
    ((validation_errors++))
else
    print_status "SESSION_SECRET is customized"
fi

# Check for production environment
if [ "$NODE_ENV" = "production" ]; then
    print_status "NODE_ENV is set to production"
else
    print_warning "NODE_ENV is not set to production"
fi

# Final validation summary
echo ""
echo "📊 VALIDATION SUMMARY"
echo "===================="

if [ $validation_errors -eq 0 ]; then
    print_status "All environment variables are valid!"
    echo ""
    print_info "Your environment is ready for deployment:"
    echo "  • Backend URL: $BACKEND_URL"
    echo "  • Frontend URL: $FRONTEND_URL"
    echo "  • Database: MongoDB Atlas configured"
    echo "  • OAuth: Google OAuth configured"
    echo "  • Security: All secrets customized"
    echo ""
    print_status "🚀 Ready to deploy to Render!"
    exit 0
else
    print_error "Found $validation_errors validation errors"
    echo ""
    print_info "Please fix the errors above before deploying"
    echo ""
    print_info "Common fixes:"
    echo "  • Update default secret values"
    echo "  • Ensure all URLs are correct"
    echo "  • Verify MongoDB connection string"
    echo "  • Check Google OAuth credentials"
    echo ""
    exit 1
fi
