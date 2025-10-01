@echo off
echo ========================================
echo   RESTARTING FRONTEND SERVER
echo ========================================
echo.
echo This will restart the Vite dev server
echo to load the new booking routes.
echo.
echo Press Ctrl+C to cancel, or
pause

cd frontend

echo.
echo Stopping any running Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting frontend server...
npm run dev

pause

