@echo off
REM YATRIK ERP - Playwright Test Runner for Windows
REM This script runs the complete test suite

echo ========================================
echo YATRIK ERP - E2E Test Runner
echo ========================================
echo.

REM Check if frontend is running
echo [1/5] Checking if frontend is running...
curl -s http://localhost:5173 > nul
if %errorlevel% neq 0 (
    echo [ERROR] Frontend is not running on http://localhost:5173
    echo Please start the frontend server first:
    echo   cd frontend
    echo   npm start
    echo.
    pause
    exit /b 1
)
echo [OK] Frontend is running

REM Check if backend is running
echo [2/5] Checking if backend is running...
curl -s http://localhost:5000/api/health > nul
if %errorlevel% neq 0 (
    echo [ERROR] Backend is not running on http://localhost:5000
    echo Please start the backend server first:
    echo   cd backend
    echo   npm start
    echo.
    pause
    exit /b 1
)
echo [OK] Backend is running

REM Check if Playwright is installed
echo [3/5] Checking Playwright installation...
if not exist "node_modules\@playwright" (
    echo [WARNING] Playwright not installed. Installing...
    call npm install @playwright/test
    call npx playwright install
)
echo [OK] Playwright is installed

echo [4/6] Running Playwright tests on multiple browsers...
echo.

REM Run tests with all browsers and reporters
call npx playwright test --reporter=list,html,json,junit

set TEST_EXIT_CODE=%errorlevel%

echo.
echo [5/6] Generating comprehensive dashboard report...
echo.

REM Generate dashboard report
call node generate-playwright-dashboard.js

echo.
echo [6/6] Test execution completed
echo ========================================

if %TEST_EXIT_CODE% equ 0 (
    echo [SUCCESS] All tests passed!
    echo.
    echo 📊 Dashboard Report: PLAYWRIGHT_TEST_DASHBOARD.md
    echo 🌐 HTML Report:      playwright-report\index.html
    echo.
    echo View HTML report:
    echo   npm run test:playwright:report
) else (
    echo [FAILED] Some tests failed
    echo.
    echo 📊 Dashboard Report: PLAYWRIGHT_TEST_DASHBOARD.md
    echo 🌐 HTML Report:      playwright-report\index.html
    echo.
    echo View detailed report:
    echo   npm run test:playwright:report
    echo.
    echo Debug failed tests:
    echo   npx playwright test --debug
)

echo ========================================
echo.

REM Ask to open report
set /p OPEN_REPORT="Do you want to open the HTML test report? (Y/N): "
if /i "%OPEN_REPORT%"=="Y" (
    call npm run test:playwright:report
)

REM Ask to view dashboard
echo.
set /p OPEN_DASHBOARD="Do you want to view the dashboard report? (Y/N): "
if /i "%OPEN_DASHBOARD%"=="Y" (
    type PLAYWRIGHT_TEST_DASHBOARD.md
    echo.
    echo Opening in default markdown viewer...
    start PLAYWRIGHT_TEST_DASHBOARD.md
)

exit /b %TEST_EXIT_CODE%
