@echo off
REM YATRIK ERP Deployment Script for Windows
REM This script helps deploy the application to various platforms

setlocal enabledelayedexpansion

REM Colors for output (Windows doesn't support colors in batch, but we can use echo)
set "INFO=[INFO]"
set "SUCCESS=[SUCCESS]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"

REM Function to print status
:print_status
echo %INFO% %~1
goto :eof

:print_success
echo %SUCCESS% %~1
goto :eof

:print_warning
echo %WARNING% %~1
goto :eof

:print_error
echo %ERROR% %~1
goto :eof

REM Function to check if command exists
:command_exists
where %1 >nul 2>&1
if %errorlevel%==0 (
    exit /b 0
) else (
    exit /b 1
)

REM Function to check prerequisites
:check_prerequisites
call :print_status "Checking prerequisites..."

call :command_exists node
if %errorlevel% neq 0 (
    call :print_error "Node.js is not installed. Please install Node.js 18 or later."
    exit /b 1
)

call :command_exists npm
if %errorlevel% neq 0 (
    call :print_error "npm is not installed. Please install npm."
    exit /b 1
)

call :print_success "Prerequisites check passed"
goto :eof

REM Function to install dependencies
:install_dependencies
call :print_status "Installing dependencies..."

REM Install root dependencies
call npm install
if %errorlevel% neq 0 (
    call :print_error "Failed to install root dependencies"
    exit /b 1
)

REM Install backend dependencies
cd backend
call npm install
if %errorlevel% neq 0 (
    call :print_error "Failed to install backend dependencies"
    exit /b 1
)
cd ..

REM Install frontend dependencies
cd frontend
call npm install
if %errorlevel% neq 0 (
    call :print_error "Failed to install frontend dependencies"
    exit /b 1
)
cd ..

call :print_success "Dependencies installed successfully"
goto :eof

REM Function to build frontend
:build_frontend
call :print_status "Building frontend..."

cd frontend
call npm run build
if %errorlevel% neq 0 (
    call :print_error "Failed to build frontend"
    exit /b 1
)
cd ..

call :print_success "Frontend built successfully"
goto :eof

REM Function to start development servers
:start_dev
call :print_status "Starting development servers..."

REM Check if .env files exist
if not exist ".env" (
    call :print_warning ".env file not found. Please create it from env.production.template"
    exit /b 1
)

if not exist "backend\.env" (
    call :print_warning "backend\.env file not found. Please create it from backend\env.production.template"
    exit /b 1
)

if not exist "frontend\.env" (
    call :print_warning "frontend\.env file not found. Please create it from frontend\env.production.template"
    exit /b 1
)

REM Start development servers
call npm run dev
goto :eof

REM Function to start production servers
:start_production
call :print_status "Starting production servers..."

REM Build frontend first
call :build_frontend
if %errorlevel% neq 0 (
    exit /b 1
)

REM Start backend
cd backend
start "YATRIK Backend" cmd /k "npm start"
cd ..

REM Wait a moment for backend to start
timeout /t 5 /nobreak >nul

REM Serve frontend (you might want to use a proper web server like nginx)
cd frontend
start "YATRIK Frontend" cmd /k "npx serve -s build -l 3000"
cd ..

call :print_success "Production servers started"
call :print_status "Frontend: http://localhost:3000"
call :print_status "Backend API: http://localhost:5000"
goto :eof

REM Function to deploy with Docker
:deploy_docker
call :print_status "Deploying with Docker..."

call :command_exists docker
if %errorlevel% neq 0 (
    call :print_error "Docker is not installed. Please install Docker Desktop."
    exit /b 1
)

call :command_exists docker-compose
if %errorlevel% neq 0 (
    call :print_error "Docker Compose is not installed. Please install Docker Compose."
    exit /b 1
)

REM Build and start containers
docker-compose up -d --build
if %errorlevel% neq 0 (
    call :print_error "Failed to start Docker containers"
    exit /b 1
)

call :print_success "Docker deployment completed"
call :print_status "Frontend: http://localhost:3000"
call :print_status "Backend API: http://localhost:5000"
call :print_status "MongoDB: localhost:27017"
goto :eof

REM Function to stop Docker deployment
:stop_docker
call :print_status "Stopping Docker deployment..."

docker-compose down
if %errorlevel% neq 0 (
    call :print_error "Failed to stop Docker containers"
    exit /b 1
)

call :print_success "Docker deployment stopped"
goto :eof

REM Function to show logs
:show_logs
call :print_status "Showing application logs..."

docker-compose logs -f
goto :eof

REM Function to show help
:show_help
echo YATRIK ERP Deployment Script
echo.
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   install     Install all dependencies
echo   dev         Start development servers
echo   build       Build frontend for production
echo   start       Start production servers
echo   docker      Deploy with Docker
echo   stop        Stop Docker deployment
echo   logs        Show Docker logs
echo   help        Show this help message
echo.
echo Examples:
echo   %0 install    # Install dependencies
echo   %0 dev        # Start development
echo   %0 docker     # Deploy with Docker
goto :eof

REM Main script logic
if "%1"=="" goto :show_help
if "%1"=="help" goto :show_help
if "%1"=="--help" goto :show_help
if "%1"=="-h" goto :show_help

if "%1"=="install" (
    call :check_prerequisites
    if %errorlevel% neq 0 exit /b 1
    call :install_dependencies
    if %errorlevel% neq 0 exit /b 1
    goto :eof
)

if "%1"=="dev" (
    call :check_prerequisites
    if %errorlevel% neq 0 exit /b 1
    call :start_dev
    goto :eof
)

if "%1"=="build" (
    call :check_prerequisites
    if %errorlevel% neq 0 exit /b 1
    call :build_frontend
    if %errorlevel% neq 0 exit /b 1
    goto :eof
)

if "%1"=="start" (
    call :check_prerequisites
    if %errorlevel% neq 0 exit /b 1
    call :start_production
    goto :eof
)

if "%1"=="docker" (
    call :check_prerequisites
    if %errorlevel% neq 0 exit /b 1
    call :deploy_docker
    if %errorlevel% neq 0 exit /b 1
    goto :eof
)

if "%1"=="stop" (
    call :stop_docker
    if %errorlevel% neq 0 exit /b 1
    goto :eof
)

if "%1"=="logs" (
    call :show_logs
    goto :eof
)

call :print_error "Unknown command: %1"
call :show_help
exit /b 1
