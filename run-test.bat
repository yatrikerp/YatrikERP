@echo off
echo.
echo ================================
echo   YATRIK ERP Login Test
echo ================================
echo.
echo Prerequisites:
echo 1. Make sure your frontend is running on http://localhost:3008
echo 2. Install Playwright: npm install @playwright/test
echo 3. Install browsers: npx playwright install chromium
echo.
echo ================================
echo.
pause

echo Running login test...
npx playwright test tests/login.spec.js --headed --project=chromium --reporter=list

echo.
echo ================================
echo Test completed!
echo ================================
echo.
echo View detailed report: npx playwright show-report
echo Screenshots saved in: tests/screenshots\
echo.
pause



