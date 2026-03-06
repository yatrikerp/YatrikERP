@echo off
echo ========================================
echo YATRIK ERP - APP INSTALLER
echo ========================================
echo.
echo APK Location: flutter\build\app\outputs\flutter-apk\app-debug.apk
echo.
echo ========================================
echo STEP 1: Connect Your Phone
echo ========================================
echo 1. Connect phone via USB cable
echo 2. Enable USB Debugging on phone:
echo    - Settings ^> About Phone
echo    - Tap "Build Number" 7 times
echo    - Go back to Settings ^> Developer Options
echo    - Enable "USB Debugging"
echo 3. Allow USB debugging when prompted on phone
echo.
pause
echo.
echo ========================================
echo STEP 2: Checking Connected Devices...
echo ========================================
cd flutter
flutter devices
echo.
echo ========================================
echo STEP 3: Installing App...
echo ========================================
echo.
echo If phone is detected above, press any key to install...
pause
echo.
echo Installing app on your phone...
flutter install
echo.
echo ========================================
echo INSTALLATION COMPLETE!
echo ========================================
echo.
echo LOGIN CREDENTIALS:
echo.
echo CONDUCTOR:
echo   Email: conductor@yatrik.com
echo   Password: Conductor@123
echo.
echo PASSENGER:
echo   Email: test@gmail.com
echo   Password: Test@123
echo.
echo ADMIN:
echo   Email: admin@yatrik.com
echo   Password: Admin@123
echo.
echo ========================================
echo Open the app on your phone and login!
echo ========================================
pause
