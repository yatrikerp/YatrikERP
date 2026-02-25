@echo off
echo ========================================
echo Starting Complete YATRIK ERP System
echo State Command Dashboard Ready
echo ========================================
echo.

echo [1/3] Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

echo.
echo Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo [2/3] Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo [3/3] System Starting...
echo.
echo ========================================
echo System Status:
echo ========================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo State Command Dashboard:
echo   URL: http://localhost:3000/state-command
echo   Login: stateadmin@yatrik.com
echo   Password: Yatrik123
echo.
echo Test Backend Routes:
echo   http://localhost:5000/api/state/test
echo.
echo ========================================
echo Both servers are starting in separate windows
echo Close this window when done
echo ========================================
echo.
pause
