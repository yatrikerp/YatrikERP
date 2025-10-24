@echo off
REM YATRIK ERP - Start All Services (Windows)
REM Starts Node.js backend and Flask ML microservice concurrently

set PYTHON39=C:\Users\akhil\AppData\Local\Programs\Python\Python39\python.exe

echo ======================================
echo YATRIK ERP - Starting All Services
echo ======================================

REM Check if Python 3.9 is installed
if not exist "%PYTHON39%" (
    echo Python 3.9 not found at %PYTHON39%
    echo Please install Python 3.9 or update the PYTHON39 path in this script.
    exit /b 1
)

echo Python found: 
%PYTHON39% --version

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js first.
    exit /b 1
)

echo Node.js found:
node --version

REM Install Python dependencies if needed
if not exist "backend\ml_models\__pycache__" (
    echo Installing Python ML dependencies...
    cd backend\ml_models
    %PYTHON39% -m pip install -r requirements.txt
    cd ..\..
)

REM Create log directory
if not exist "logs" mkdir logs

REM Start Flask ML Service in background
echo Starting Flask ML Service on port 5001...
cd backend
start /B %PYTHON39% ml_service.py > ..\logs\ml_service.log 2>&1
cd ..

REM Wait for ML service to start
timeout /t 3 /nobreak >nul

echo Flask ML Service started on port 5001

REM Start Node.js Backend
echo Starting Node.js Backend...
cd backend
npm start
