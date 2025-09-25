@echo off
echo ========================================
echo   YATRIK ERP - Sample Data Setup
echo ========================================
echo.
echo This will create sample depots, drivers, and conductors
echo with proper depot assignments for testing.
echo.
pause

cd backend
node setup-sample-data.js

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo You can now:
echo   - View the admin panel
echo   - See drivers and conductors in their management pages
echo   - Use bulk assignment features
echo   - Test the depot filtering
echo.
pause

