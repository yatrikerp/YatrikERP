@echo off
echo ================================================
echo  YATRIK ERP - Quick Simple Login Test
echo ================================================
echo.

echo Running Playwright tests...
npx playwright test e2e/simple-login.spec.js --reporter=list,html

echo.
echo ================================================
echo Test Execution Complete!
echo ================================================
echo.

echo Opening HTML Report...
start playwright-report\index.html

echo.
echo Report generated successfully!
pause
