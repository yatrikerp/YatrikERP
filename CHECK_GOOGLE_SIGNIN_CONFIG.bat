@echo off
echo ========================================
echo Google Sign-In Configuration Checker
echo ========================================
echo.

echo [1/5] Checking backend .env file...
findstr /C:"GOOGLE_CLIENT_ID=your_google_client_id_here" backend\.env >nul
if %errorlevel%==0 (
    echo ✅ Backend .env has correct Client ID
) else (
    echo ❌ Backend .env missing or incorrect Client ID
)
echo.

echo [2/5] Checking Flutter pubspec.yaml...
findstr /C:"google_sign_in" flutter\pubspec.yaml >nul
if %errorlevel%==0 (
    echo ✅ google_sign_in package found in pubspec.yaml
) else (
    echo ❌ google_sign_in package missing from pubspec.yaml
)
echo.

echo [3/5] Checking Flutter login_screen.dart...
findstr /C:"your_google_client_id_here" flutter\lib\screens\auth\login_screen.dart >nul
if %errorlevel%==0 (
    echo ✅ login_screen.dart has correct Client ID
) else (
    echo ❌ login_screen.dart missing or incorrect Client ID
)
echo.

echo [4/5] Checking package name in build.gradle...
findstr /C:"com.yatrik.erp.yatrik_mobile" flutter\android\app\build.gradle >nul
if %errorlevel%==0 (
    echo ✅ Package name is correct: com.yatrik.erp.yatrik_mobile
) else (
    echo ❌ Package name incorrect in build.gradle
)
echo.

echo [5/5] Checking if gradlew exists...
if exist "flutter\android\gradlew.bat" (
    echo ✅ gradlew.bat found - can get SHA-1
) else (
    echo ❌ gradlew.bat not found
)
echo.

echo ========================================
echo Configuration Summary
echo ========================================
echo.
echo ✅ = Ready
echo ❌ = Needs attention
echo.
echo Next Steps:
echo 1. Run: GET_SHA1_FINGERPRINT.bat
echo 2. Create Android OAuth client in Google Cloud Console
echo 3. Add SHA-1 fingerprint to the OAuth client
echo 4. Enable Google Sign-In API
echo 5. Test: flutter run
echo.
echo Detailed guide: GOOGLE_SIGNIN_QUICK_FIX.md
echo.
pause
