@echo off
echo ========================================
echo Flutter Passenger Dashboard Test Script
echo ========================================
echo.

cd flutter

echo [1/4] Cleaning previous build...
call flutter clean
echo.

echo [2/4] Getting dependencies...
call flutter pub get
echo.

echo [3/4] Checking for connected devices...
call flutter devices
echo.

echo [4/4] Running app...
echo.
echo Watch for these logs:
echo   - Login: "🔐 Attempting login"
echo   - Token: "💾 Token saved"
echo   - Dashboard: "🔑 Token available"
echo   - Success: "✅ Status: 200"
echo.
echo If you see "Status: 401", the fix didn't work.
echo If you see "Status: 200", the fix worked!
echo.

call flutter run

cd ..
