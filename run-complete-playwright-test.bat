@echo off
REM ============================================================
REM YATRIK ERP - Complete Playwright Test Suite Runner
REM Runs comprehensive E2E tests across all browsers with dashboard
REM ============================================================

SETLOCAL EnableDelayedExpansion

echo.
echo ============================================================
echo   YATRIK ERP - COMPREHENSIVE TEST SUITE
echo   Testing entire project with Playwright
echo ============================================================
echo.

REM Color codes for better output (Windows 10+)
SET "GREEN=[92m"
SET "RED=[91m"
SET "YELLOW=[93m"
SET "BLUE=[94m"
SET "CYAN=[96m"
SET "RESET=[0m"

echo %CYAN%[STEP 1/8] Checking Prerequisites%RESET%
echo ============================================================
echo.

REM Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[ERROR] Node.js is not installed!%RESET%
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo %GREEN%[OK]%RESET% Node.js is installed
node --version

REM Check if npm is installed
echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[ERROR] npm is not installed!%RESET%
    pause
    exit /b 1
)
echo %GREEN%[OK]%RESET% npm is installed
npm --version

echo.
echo %CYAN%[STEP 2/8] Checking Playwright Installation%RESET%
echo ============================================================
echo.

REM Check if Playwright is installed
if not exist "node_modules\@playwright" (
    echo %YELLOW%[WARNING] Playwright not found. Installing...%RESET%
    call npm install @playwright/test --save-dev
    if %errorlevel% neq 0 (
        echo %RED%[ERROR] Failed to install Playwright%RESET%
        pause
        exit /b 1
    )
)
echo %GREEN%[OK]%RESET% Playwright is installed

REM Install browser binaries
echo.
echo Installing/updating browser binaries...
call npx playwright install
if %errorlevel% neq 0 (
    echo %YELLOW%[WARNING] Browser installation had issues, continuing...%RESET%
)
echo %GREEN%[OK]%RESET% Browsers are ready

echo.
echo %CYAN%[STEP 3/8] Checking Services%RESET%
echo ============================================================
echo.

REM Check if frontend is running
echo Checking frontend (port 5173)...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[ERROR] Frontend is not running on http://localhost:5173%RESET%
    echo.
    echo Please start the frontend server in a separate terminal:
    echo   cd frontend
    echo   npm run dev
    echo.
    echo Or use the unified start script:
    echo   npm run dev
    echo.
    set /p START_SERVICES="Do you want me to start services automatically? (Y/N): "
    if /i "!START_SERVICES!"=="Y" (
        echo %YELLOW%Please run 'npm run dev' in another terminal and press any key when ready...%RESET%
        pause >nul
    ) else (
        pause
        exit /b 1
    )
)
echo %GREEN%[OK]%RESET% Frontend is running at http://localhost:5173

REM Check if backend is running
echo Checking backend (port 5000)...
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[ERROR] Backend is not running on http://localhost:5000%RESET%
    echo.
    echo Please start the backend server in a separate terminal:
    echo   cd backend
    echo   npm start
    echo.
    pause
    exit /b 1
)
echo %GREEN%[OK]%RESET% Backend is running at http://localhost:5000

echo.
echo %CYAN%[STEP 4/8] Pre-Test Cleanup%RESET%
echo ============================================================
echo.

REM Clean up old reports
if exist "playwright-report" (
    echo Cleaning old test reports...
    rd /s /q playwright-report 2>nul
    echo %GREEN%[OK]%RESET% Old reports cleaned
)

if exist "PLAYWRIGHT_TEST_DASHBOARD.md" (
    del /q PLAYWRIGHT_TEST_DASHBOARD.md 2>nul
)

echo %GREEN%[OK]%RESET% Ready for fresh test run

echo.
echo %CYAN%[STEP 5/8] Running Playwright Tests%RESET%
echo ============================================================
echo.
echo Testing on multiple browsers: Chromium, Firefox, WebKit
echo This may take several minutes...
echo.

REM Run Playwright tests with all browsers
call npx playwright test --reporter=list,html,json,junit

SET TEST_EXIT_CODE=%errorlevel%

echo.
echo %CYAN%[STEP 6/8] Generating Dashboard Report%RESET%
echo ============================================================
echo.

REM Generate comprehensive dashboard
if exist "playwright-report\results.json" (
    call node generate-playwright-dashboard.js
    if %errorlevel% equ 0 (
        echo %GREEN%[OK]%RESET% Dashboard report generated successfully
    ) else (
        echo %YELLOW%[WARNING]%RESET% Dashboard generation had issues
    )
) else (
    echo %YELLOW%[WARNING]%RESET% No JSON results file found, skipping dashboard generation
)

echo.
echo %CYAN%[STEP 7/8] Test Results Summary%RESET%
echo ============================================================
echo.

if %TEST_EXIT_CODE% equ 0 (
    echo %GREEN%
    echo ╔════════════════════════════════════════════════════════╗
    echo ║                                                        ║
    echo ║              ✓ ALL TESTS PASSED!                       ║
    echo ║                                                        ║
    echo ╚════════════════════════════════════════════════════════╝
    echo %RESET%
) else (
    echo %RED%
    echo ╔════════════════════════════════════════════════════════╗
    echo ║                                                        ║
    echo ║           ✗ SOME TESTS FAILED                          ║
    echo ║                                                        ║
    echo ╚════════════════════════════════════════════════════════╝
    echo %RESET%
)

echo.
echo %CYAN%Generated Reports:%RESET%
echo   📊 Dashboard:  PLAYWRIGHT_TEST_DASHBOARD.md
echo   🌐 HTML:       playwright-report\index.html
echo   📄 JSON:       playwright-report\results.json
echo   📋 JUnit:      playwright-report\results.xml
echo.

echo %CYAN%[STEP 8/8] Opening Reports%RESET%
echo ============================================================
echo.

REM Ask to view HTML report
set /p OPEN_HTML="Open interactive HTML report? (Y/N): "
if /i "%OPEN_HTML%"=="Y" (
    echo Opening HTML report in browser...
    call npm run test:playwright:report
)

REM Ask to view dashboard
echo.
set /p OPEN_DASHBOARD="Open dashboard report? (Y/N): "
if /i "%OPEN_DASHBOARD%"=="Y" (
    if exist "PLAYWRIGHT_TEST_DASHBOARD.md" (
        echo Opening dashboard report...
        start PLAYWRIGHT_TEST_DASHBOARD.md
    ) else (
        echo %YELLOW%[WARNING]%RESET% Dashboard file not found
    )
)

echo.
echo ============================================================
echo   TEST EXECUTION COMPLETE
echo ============================================================
echo.

REM Show next steps
echo %CYAN%Next Steps:%RESET%
echo.
if %TEST_EXIT_CODE% neq 0 (
    echo %YELLOW%To debug failed tests:%RESET%
    echo   npx playwright test --debug
    echo.
    echo %YELLOW%To run specific test:%RESET%
    echo   npx playwright test --grep "test name"
    echo.
    echo %YELLOW%To run in UI mode:%RESET%
    echo   npm run test:playwright:ui
    echo.
)

echo %CYAN%To re-run tests:%RESET%
echo   run-complete-playwright-test.bat
echo   or
echo   npm run test:playwright
echo.

echo %CYAN%To view reports later:%RESET%
echo   npm run test:playwright:report
echo   or
echo   start PLAYWRIGHT_TEST_DASHBOARD.md
echo.

ENDLOCAL
exit /b %TEST_EXIT_CODE%
