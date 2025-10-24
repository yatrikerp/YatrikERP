@echo off
REM Test ML Integration - Uses Python 3.9 which has all required packages

set PYTHON39=C:\Users\akhil\AppData\Local\Programs\Python\Python39\python.exe

echo.
echo ============================================================
echo  YATRIK ERP - ML Integration Test
echo ============================================================
echo.
echo Using Python 3.9 (all packages installed)
echo.

%PYTHON39% test-ml-integration.py

pause
