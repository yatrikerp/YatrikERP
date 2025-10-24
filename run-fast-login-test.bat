@echo off
echo ================================================
echo  YATRIK ERP - FAST Simple Login Test
echo ================================================
echo.

REM Run tests with optimized settings
npx playwright test e2e/simple-login.spec.js --workers=1 --reporter=list,html,json

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo ✅ ALL TESTS PASSED!
    echo ================================================
) else (
    echo.
    echo ================================================
    echo ❌ SOME TESTS FAILED
    echo ================================================
)

echo.
echo Opening HTML report...
start playwright-report\index.html

echo.
echo Done!
pause
