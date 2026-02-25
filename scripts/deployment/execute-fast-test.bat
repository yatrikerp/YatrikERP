@echo off
cls
echo ================================================
echo  🚀 YATRIK ERP - FAST LOGIN TEST EXECUTION
echo ================================================
echo.
echo Starting test execution...
echo.

REM Execute Playwright tests
call npx playwright test e2e/simple-login.spec.js --workers=1 --reporter=list,html,json

echo.
echo ================================================
echo  📊 Generating Test Report...
echo ================================================
echo.

REM Generate detailed report
node generate-login-test-report.js

echo.
echo ================================================
echo  ✅ Test Execution Complete!
echo ================================================
echo.

REM Show HTML report
echo Opening browser report...
start playwright-report\index.html

REM Show markdown report
echo.
echo Opening detailed report...
start SIMPLE_LOGIN_TEST_REPORT.md

echo.
echo All reports generated successfully!
echo.
pause
