@echo off
REM Start ML Service with Python 3.9
REM This ensures the correct Python version with all packages is used

set PYTHON39=C:\Users\akhil\AppData\Local\Programs\Python\Python39\python.exe

echo.
echo ============================================================
echo  Starting YATRIK ML Service
echo ============================================================
echo.

REM Check if Python 3.9 exists
if not exist "%PYTHON39%" (
    echo ERROR: Python 3.9 not found at:
    echo %PYTHON39%
    echo.
    echo Please update the PYTHON39 path in this script
    echo or install Python 3.9
    pause
    exit /b 1
)

echo Using Python 3.9: %PYTHON39%
echo.

REM Start ML service
echo Starting ML service on port 5001...
echo Press Ctrl+C to stop
echo.

%PYTHON39% ml_service.py

pause
