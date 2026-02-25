@echo off
echo ========================================
echo Starting Backend Server with State Routes
echo ========================================
echo.

cd backend

echo Checking if server is already running...
netstat -ano | findstr :5000 >nul
if %errorlevel% == 0 (
    echo WARNING: Port 5000 is already in use!
    echo Please stop the existing server first (Ctrl+C in its terminal)
    echo.
    pause
    exit /b 1
)

echo.
echo Starting backend server...
echo Look for: "✅ State routes loaded successfully"
echo.
echo Press Ctrl+C to stop the server
echo.

npm start

pause
