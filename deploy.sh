#!/bin/bash

# YATRIK ERP Deployment Script
# This script helps deploy the application to various platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18 or later."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
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
    print_status "Building frontend..."
    
    cd frontend
    npm run build
    cd ..
    
    print_success "Frontend built successfully"
}

# Function to start development servers
start_dev() {
    print_status "Starting development servers..."
    
    # Check if .env files exist
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Please create it from env.production.template"
        exit 1
    fi
    
    if [ ! -f "backend/.env" ]; then
        print_warning "backend/.env file not found. Please create it from backend/env.production.template"
        exit 1
    fi
    
    if [ ! -f "frontend/.env" ]; then
        print_warning "frontend/.env file not found. Please create it from frontend/env.production.template"
        exit 1
    fi
    
    # Start development servers
    npm run dev
}

# Function to start production servers
start_production() {
    print_status "Starting production servers..."
    
    # Build frontend first
    build_frontend
    
    # Start backend
    cd backend
    npm start &
    BACKEND_PID=$!
    cd ..
    
    # Serve frontend (you might want to use a proper web server like nginx)
    cd frontend
    npx serve -s build -l 3000 &
    FRONTEND_PID=$!
    cd ..
    
    print_success "Production servers started"
    print_status "Backend PID: $BACKEND_PID"
    print_status "Frontend PID: $FRONTEND_PID"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend API: http://localhost:5000"
}

# Function to deploy with Docker
deploy_docker() {
    print_status "Deploying with Docker..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose."
        exit 1
    fi
    
    # Build and start containers
    docker-compose up -d --build
    
    print_success "Docker deployment completed"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend API: http://localhost:5000"
    print_status "MongoDB: localhost:27017"
}

# Function to stop Docker deployment
stop_docker() {
    print_status "Stopping Docker deployment..."
    
    docker-compose down
    
    print_success "Docker deployment stopped"
}

# Function to show logs
show_logs() {
    print_status "Showing application logs..."
    
    docker-compose logs -f
}

# Function to show help
show_help() {
    echo "YATRIK ERP Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  install     Install all dependencies"
    echo "  dev         Start development servers"
    echo "  build       Build frontend for production"
    echo "  start       Start production servers"
    echo "  docker      Deploy with Docker"
    echo "  stop        Stop Docker deployment"
    echo "  logs        Show Docker logs"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 install    # Install dependencies"
    echo "  $0 dev        # Start development"
    echo "  $0 docker     # Deploy with Docker"
}

# Main script logic
case "${1:-help}" in
    install)
        check_prerequisites
        install_dependencies
        ;;
    dev)
        check_prerequisites
        start_dev
        ;;
    build)
        check_prerequisites
        build_frontend
        ;;
    start)
        check_prerequisites
        start_production
        ;;
    docker)
        check_prerequisites
        deploy_docker
        ;;
    stop)
        stop_docker
        ;;
    logs)
        show_logs
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
