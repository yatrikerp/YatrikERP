@echo off
echo.
echo ========================================
echo   YATRIK ERP - LOGIN TEST
echo ========================================
echo.

echo Installing Playwright if needed...
call npm install @playwright/test --no-save

echo.
echo Installing browsers...
call npx playwright install chromium

echo.
echo ========================================
echo   Starting Login Test
echo ========================================
echo.

echo Test will open browser and perform:
echo 1. Navigate to http://localhost:3008/signIn
echo 2. Enter email: akhilshijo8@gmail.com
echo 3. Enter password: Akhil@123
echo 4. Click login button
echo 5. Verify success
echo.

call npx playwright test tests/login.spec.js --headed --project=chromium --reporter=list --timeout=60000

echo.
echo ========================================
echo   Test Complete!
echo ========================================
echo.

echo Screenshots saved in: tests\screenshots\
echo.
pause



