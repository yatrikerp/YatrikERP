@echo off
REM YATRIK ERP Free Hosting Setup Script for Windows
REM This script helps you set up completely free hosting

setlocal enabledelayedexpansion

REM Colors for output (Windows doesn't support colors in batch, but we can use echo)
set "HEADER=[HEADER]"
set "INFO=[INFO]"
set "SUCCESS=[SUCCESS]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"
set "STEP=[STEP]"

REM Function to print header
:print_header
echo.
echo ================================
echo   YATRIK ERP FREE HOSTING SETUP
echo ================================
echo.
goto :eof

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

:print_step
echo %STEP% %~1
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
call :print_step "Checking prerequisites..."

call :command_exists node
if %errorlevel% neq 0 (
    call :print_error "Node.js is not installed. Please install Node.js 18 or later."
    call :print_status "Download from: https://nodejs.org/"
    exit /b 1
)

call :command_exists npm
if %errorlevel% neq 0 (
    call :print_error "npm is not installed. Please install npm."
    exit /b 1
)

call :command_exists git
if %errorlevel% neq 0 (
    call :print_error "Git is not installed. Please install Git."
    call :print_status "Download from: https://git-scm.com/"
    exit /b 1
)

call :print_success "Prerequisites check passed"
goto :eof

REM Function to setup environment files
:setup_environment
call :print_step "Setting up environment files..."

if not exist ".env" (
    copy env.production.template .env
    call :print_status "Created .env file"
) else (
    call :print_warning ".env file already exists"
)

if not exist "backend\.env" (
    copy backend\env.production.template backend\.env
    call :print_status "Created backend\.env file"
) else (
    call :print_warning "backend\.env file already exists"
)

if not exist "frontend\.env" (
    copy frontend\env.production.template frontend\.env
    call :print_status "Created frontend\.env file"
) else (
    call :print_warning "frontend\.env file already exists"
)

call :print_success "Environment files created"
call :print_warning "Please edit the .env files with your actual values before deploying"
goto :eof

REM Function to install dependencies
:install_dependencies
call :print_step "Installing dependencies..."

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
call :print_step "Building frontend..."

cd frontend
call npm run build
if %errorlevel% neq 0 (
    call :print_error "Failed to build frontend"
    exit /b 1
)
cd ..

call :print_success "Frontend built successfully"
goto :eof

REM Function to show deployment instructions
:show_deployment_instructions
call :print_step "Deployment Instructions"
echo.
echo 1. DATABASE SETUP (MongoDB Atlas - FREE):
echo    - Go to https://www.mongodb.com/atlas
echo    - Create free account
echo    - Create M0 Sandbox cluster
echo    - Get connection string
echo    - Update MONGODB_URI in backend\.env
echo.
echo 2. BACKEND DEPLOYMENT (Railway - FREE):
echo    - Go to https://railway.app
echo    - Sign up with GitHub
echo    - Create new project from GitHub repo
echo    - Set root directory to 'backend'
echo    - Add environment variables
echo    - Deploy
echo.
echo 3. FRONTEND DEPLOYMENT (Vercel - FREE):
echo    - Go to https://vercel.com
echo    - Sign up with GitHub
echo    - Import GitHub repository
echo    - Set root directory to 'frontend'
echo    - Add environment variables
echo    - Deploy
echo.
echo 4. ALTERNATIVE BACKEND OPTIONS:
echo    - Render: https://render.com (Free tier)
echo    - Cyclic: https://cyclic.sh (Free tier)
echo    - Fly.io: https://fly.io (Free tier)
echo.
echo Total Cost: $0/month
goto :eof

REM Function to show environment variables needed
:show_environment_variables
call :print_step "Required Environment Variables"
echo.
echo Backend (.env):
echo MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yatrik_erp
echo NODE_ENV=production
echo JWT_SECRET=your-super-secure-jwt-secret
echo SESSION_SECRET=your-super-secure-session-secret
echo FRONTEND_URL=https://your-app.vercel.app
echo PORT=5000
echo.
echo Frontend (.env):
echo REACT_APP_API_URL=https://your-app.railway.app
echo REACT_APP_RAZORPAY_KEY=your_razorpay_key
echo.
goto :eof

REM Function to show help
:show_help
call :print_header
echo YATRIK ERP Free Hosting Setup Script
echo.
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   setup       Complete setup for free hosting
echo   env         Setup environment files only
echo   install     Install dependencies only
echo   build       Build frontend only
echo   deploy      Show deployment instructions
echo   help        Show this help message
echo.
echo Examples:
echo   %0 setup     # Complete setup
echo   %0 env       # Setup environment files
echo   %0 deploy    # Show deployment instructions
goto :eof

REM Main script logic
call :print_header

if "%1"=="" goto :setup
if "%1"=="setup" goto :setup
if "%1"=="env" goto :env
if "%1"=="install" goto :install
if "%1"=="build" goto :build
if "%1"=="deploy" goto :deploy
if "%1"=="help" goto :show_help
if "%1"=="--help" goto :show_help
if "%1"=="-h" goto :show_help

call :print_error "Unknown command: %1"
call :show_help
exit /b 1

:setup
call :check_prerequisites
if %errorlevel% neq 0 exit /b 1
call :setup_environment
call :install_dependencies
call :build_frontend
call :show_environment_variables
call :show_deployment_instructions
call :print_success "Setup completed! Follow the deployment instructions above."
goto :eof

:env
call :setup_environment
call :show_environment_variables
goto :eof

:install
call :check_prerequisites
if %errorlevel% neq 0 exit /b 1
call :install_dependencies
goto :eof

:build
call :check_prerequisites
if %errorlevel% neq 0 exit /b 1
call :build_frontend
goto :eof

:deploy
call :show_deployment_instructions
call :show_environment_variables
goto :eof
