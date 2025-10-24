@echo off
REM YATRIK ERP - ML Integration Test Script (Windows)
REM Tests all ML components and integration

set PYTHON39=C:\Users\akhil\AppData\Local\Programs\Python\Python39\python.exe

echo.
echo ======================================
echo   YATRIK ERP ML Integration Tests
echo ======================================
echo.

REM Check Python 3.9
if not exist "%PYTHON39%" (
    echo [FAIL] Python 3.9 not found at %PYTHON39%
    echo Please install Python 3.9 or update the PYTHON39 path in this script
    exit /b 1
)
echo [PASS] Python 3.9 found

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Node.js is not installed
    exit /b 1
)
echo [PASS] Node.js found

REM Test Python packages
echo.
echo Testing Python packages...
%PYTHON39% -c "import pandas, numpy, sklearn, matplotlib, seaborn, pymongo, flask" 2>nul
if %errorlevel% neq 0 (
    echo [FAIL] Missing Python packages
    echo Run: %PYTHON39% -m pip install -r backend\ml_models\requirements.txt
    exit /b 1
)
echo [PASS] Python packages installed

REM Test MongoDB connection
echo.
echo Testing MongoDB connection...
%PYTHON39% backend\ml_models\config.py 2>nul
if %errorlevel% neq 0 (
    echo [WARN] Could not verify MongoDB (check MONGO_URI in .env)
) else (
    echo [PASS] MongoDB configuration found
)

REM Check if ML service is running
echo.
echo Testing ML service health...
curl -s http://localhost:5001/health >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] ML service is not running on port 5001
    echo Start it with: cd backend ^&^& %PYTHON39% ml_service.py
) else (
    echo [PASS] ML service is running on port 5001
)

REM Check if Node backend is running
echo.
echo Testing Node.js backend...
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Node.js backend is not running
    echo Start it with: cd backend ^&^& npm start
) else (
    echo [PASS] Node.js backend is running
)

echo.
echo ======================================
echo   Test Summary
echo ======================================
echo.
echo Run comprehensive tests with:
echo   cd backend
echo   %PYTHON39% test-ml-integration.py
echo.
echo Start all services with:
echo   start-all-services.bat
echo.
echo Note: Using Python 3.9 for ML components
echo.
echo ======================================
