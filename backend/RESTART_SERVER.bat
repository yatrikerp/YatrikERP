@echo off
echo ========================================
echo   RESTARTING YATRIK BACKEND SERVER
echo ========================================
echo.

echo [1/3] Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo     ✓ Node processes stopped
) else (
    echo     ℹ No Node processes were running
)

echo.
echo [2/3] Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo.
echo [3/3] Starting backend server...
echo.
echo ========================================
echo   SERVER STARTING...
echo   Wait for: "Server running on port 5000"
echo ========================================
echo.

node server.js
