#!/bin/bash

# YATRIK ERP Free Hosting Setup Script
# This script helps you set up completely free hosting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}  YATRIK ERP FREE HOSTING SETUP  ${NC}"
    echo -e "${PURPLE}================================${NC}"
    echo ""
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18 or later."
        print_status "Download from: https://nodejs.org/"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    if ! command_exists git; then
        print_error "Git is not installed. Please install Git."
        print_status "Download from: https://git-scm.com/"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to setup environment files
setup_environment() {
    print_step "Setting up environment files..."
    
    # Create .env files from templates
    if [ ! -f ".env" ]; then
        cp env.production.template .env
        print_status "Created .env file"
    else
        print_warning ".env file already exists"
    fi
    
    if [ ! -f "backend/.env" ]; then
        cp backend/env.production.template backend/.env
        print_status "Created backend/.env file"
    else
        print_warning "backend/.env file already exists"
    fi
    
    if [ ! -f "frontend/.env" ]; then
        cp frontend/env.production.template frontend/.env
        print_status "Created frontend/.env file"
    else
        print_warning "frontend/.env file already exists"
    fi
    
    print_success "Environment files created"
    print_warning "Please edit the .env files with your actual values before deploying"
}

# Function to install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install backend dependencies
    cd backend
    npm install
    cd ..
    
    # Install frontend dependencies
    cd frontend
    npm install
    cd ..
    
    print_success "Dependencies installed successfully"
}

# Function to build frontend
build_frontend() {
    print_step "Building frontend..."
    
    cd frontend
    npm run build
    cd ..
    
    print_success "Frontend built successfully"
}

# Function to show deployment instructions
show_deployment_instructions() {
    print_step "Deployment Instructions"
    echo ""
    echo -e "${YELLOW}1. DATABASE SETUP (MongoDB Atlas - FREE):${NC}"
    echo "   - Go to https://www.mongodb.com/atlas"
    echo "   - Create free account"
    echo "   - Create M0 Sandbox cluster"
    echo "   - Get connection string"
    echo "   - Update MONGODB_URI in backend/.env"
    echo ""
    echo -e "${YELLOW}2. BACKEND DEPLOYMENT (Railway - FREE):${NC}"
    echo "   - Go to https://railway.app"
    echo "   - Sign up with GitHub"
    echo "   - Create new project from GitHub repo"
    echo "   - Set root directory to 'backend'"
    echo "   - Add environment variables"
    echo "   - Deploy"
    echo ""
    echo -e "${YELLOW}3. FRONTEND DEPLOYMENT (Vercel - FREE):${NC}"
    echo "   - Go to https://vercel.com"
    echo "   - Sign up with GitHub"
    echo "   - Import GitHub repository"
    echo "   - Set root directory to 'frontend'"
    echo "   - Add environment variables"
    echo "   - Deploy"
    echo ""
    echo -e "${YELLOW}4. ALTERNATIVE BACKEND OPTIONS:${NC}"
    echo "   - Render: https://render.com (Free tier)"
    echo "   - Cyclic: https://cyclic.sh (Free tier)"
    echo "   - Fly.io: https://fly.io (Free tier)"
    echo ""
    echo -e "${GREEN}Total Cost: $0/month${NC}"
}

# Function to show environment variables needed
show_environment_variables() {
    print_step "Required Environment Variables"
    echo ""
    echo -e "${YELLOW}Backend (.env):${NC}"
    echo "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yatrik_erp"
    echo "NODE_ENV=production"
    echo "JWT_SECRET=your-super-secure-jwt-secret"
    echo "SESSION_SECRET=your-super-secure-session-secret"
    echo "FRONTEND_URL=https://your-app.vercel.app"
    echo "PORT=5000"
    echo ""
    echo -e "${YELLOW}Frontend (.env):${NC}"
    echo "REACT_APP_API_URL=https://your-app.railway.app"
    echo "REACT_APP_RAZORPAY_KEY=your_razorpay_key"
    echo ""
}

# Function to test local setup
test_local() {
    print_step "Testing local setup..."
    
    # Check if MongoDB is running locally
    if command_exists mongod; then
        print_status "MongoDB detected locally"
    else
        print_warning "MongoDB not found locally. You'll need to use MongoDB Atlas for free hosting."
    fi
    
    # Test if backend can start
    print_status "Testing backend startup..."
    cd backend
    timeout 10s npm start || print_warning "Backend startup test failed (this is normal if MongoDB is not running)"
    cd ..
    
    print_success "Local setup test completed"
}

# Function to show help
show_help() {
    print_header
    echo "YATRIK ERP Free Hosting Setup Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup       Complete setup for free hosting"
    echo "  env         Setup environment files only"
    echo "  install     Install dependencies only"
    echo "  build       Build frontend only"
    echo "  test        Test local setup"
    echo "  deploy      Show deployment instructions"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup     # Complete setup"
    echo "  $0 env       # Setup environment files"
    echo "  $0 deploy    # Show deployment instructions"
}

# Main script logic
print_header

case "${1:-setup}" in
    setup)
        check_prerequisites
        setup_environment
        install_dependencies
        build_frontend
        show_environment_variables
        show_deployment_instructions
        print_success "Setup completed! Follow the deployment instructions above."
        ;;
    env)
        setup_environment
        show_environment_variables
        ;;
    install)
        check_prerequisites
        install_dependencies
        ;;
    build)
        check_prerequisites
        build_frontend
        ;;
    test)
        test_local
        ;;
    deploy)
        show_deployment_instructions
        show_environment_variables
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
