@echo off
echo ========================================
echo  YATRIK ERP - Simple Login Test
echo ========================================
echo.

echo Starting Playwright test...
echo.

npx playwright test e2e/simple-login.spec.js --reporter=html,list

echo.
echo ========================================
echo Test completed!
echo Opening HTML report...
echo ========================================

npx playwright show-report

pause
