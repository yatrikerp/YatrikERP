@echo off
echo ========================================
echo   CLEAR CACHE AND RESTART FRONTEND
echo ========================================
echo.
echo This will:
echo  1. Clear Vite build cache
echo  2. Restart the frontend server
echo  3. Fix the toast.info errors
echo.
pause

cd frontend

echo.
echo Clearing Vite cache...
rd /s /q .vite 2>nul
rd /s /q node_modules\.vite 2>nul
echo Cache cleared!

echo.
echo Stopping any running processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting frontend server...
npm run dev

pause

