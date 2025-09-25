@echo off
echo Stopping frontend development server...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul
echo Starting frontend development server with updated proxy...
cd frontend
npm run dev
pause


