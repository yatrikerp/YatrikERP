@echo off
REM Quick Playwright Dashboard Generator
REM Run this after tests complete to generate dashboard report

echo.
echo ============================================================
echo   PLAYWRIGHT TEST DASHBOARD GENERATOR
echo ============================================================
echo.

REM Check if results file exists
if not exist "playwright-report\results.json" (
    echo [WARNING] No test results found!
    echo.
    echo Please run tests first:
    echo   npm run test:playwright
    echo   or
    echo   run-complete-playwright-test.bat
    echo.
    pause
    exit /b 1
)

echo [1/2] Generating comprehensive dashboard report...
echo.

call node generate-playwright-dashboard.js

if %errorlevel% equ 0 (
    echo.
    echo [2/2] Dashboard generated successfully!
    echo.
    echo ============================================================
    echo   REPORTS AVAILABLE
    echo ============================================================
    echo.
    echo 📊 Dashboard:  PLAYWRIGHT_TEST_DASHBOARD.md
    echo 🌐 HTML:       playwright-report\index.html
    echo 📄 JSON:       playwright-report\results.json
    echo 📋 JUnit:      playwright-report\results.xml
    echo.
    
    set /p OPEN_DASHBOARD="Open dashboard report? (Y/N): "
    if /i "!OPEN_DASHBOARD!"=="Y" (
        start PLAYWRIGHT_TEST_DASHBOARD.md
    )
    
    echo.
    set /p OPEN_HTML="Open HTML report? (Y/N): "
    if /i "!OPEN_HTML!"=="Y" (
        call npm run test:playwright:report
    )
) else (
    echo.
    echo [ERROR] Failed to generate dashboard
    echo Check the error messages above
)

echo.
echo ============================================================
pause
