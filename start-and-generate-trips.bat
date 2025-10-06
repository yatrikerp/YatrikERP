@echo off
echo ========================================
echo    YATRIK ERP - Trip Generation Setup
echo ========================================
echo.

echo Step 1: Starting Backend Server...
echo.
cd backend
start "Backend Server" cmd /k "npm run dev"
echo Backend server starting in new window...
echo.

echo Step 2: Starting Frontend Server...
echo.
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"
echo Frontend server starting in new window...
echo.

echo ========================================
echo    Servers are starting...
echo ========================================
echo.
echo Please wait for both servers to start completely.
echo.
echo Once both servers are running:
echo 1. Open your browser and go to: http://localhost:5173
echo 2. Login as admin
echo 3. Navigate to: Admin Panel > Trip Management
echo 4. Click the "Bulk Scheduler" button (marked with HOT badge)
echo 5. Configure and generate your 6000+ trips!
echo.
echo ========================================
echo    Quick Access URLs:
echo ========================================
echo Trip Management: http://localhost:5173/admin/streamlined-trips
echo Bus Management:  http://localhost:5173/admin/streamlined-buses
echo Route Management: http://localhost:5173/admin/streamlined-routes
echo.
echo ========================================
echo    Trip Generation Instructions:
echo ========================================
echo 1. In the Bulk Trip Scheduler modal:
echo    - Set "Days to Schedule": 30
echo    - Set "Trips per Depot per Day": 20
echo    - Choose your start date
echo    - Enable "Auto-assign Crew" and "Auto-assign Buses"
echo.
echo 2. Click "Generate Trips" button
echo.
echo 3. Wait for completion (this may take a few minutes)
echo.
echo 4. You should see 6000+ trips generated!
echo.
echo ========================================
pause
