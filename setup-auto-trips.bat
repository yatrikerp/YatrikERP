@echo off
echo ========================================
echo   AUTO-SCHEDULE TRIPS FOR 30 DAYS
echo ========================================
echo.
echo This will create trips for all routes
echo for the next 30 days (8 trips/day/route)
echo.
echo Press Ctrl+C to cancel, or
pause

cd backend
node auto-schedule-trips-30days.js

echo.
echo ========================================
echo   DONE! Check the output above.
echo ========================================
pause

