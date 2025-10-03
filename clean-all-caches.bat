@echo off
setlocal enableextensions

echo ==============================================
echo   YATRIK ERP - CLEAN ALL CACHES (Windows)
echo ==============================================
echo.
echo This will:
echo  1) Stop node processes
echo  2) Clear frontend Vite/Webpack caches
echo  3) Clear backend caches
echo  4) Clear npm cache
echo  5) (Optional) Reinstall dependencies
echo.

REM Stop any running node processes to release file locks
echo Stopping running node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Frontend caches
if exist frontend (
  pushd frontend
  echo Clearing frontend caches...
  rd /s /q .vite 2>nul
  rd /s /q node_modules\.vite 2>nul
  rd /s /q node_modules\.cache 2>nul
  rd /s /q .cache 2>nul
  popd
) else (
  echo Skipping: frontend directory not found
)

REM Backend caches (generic)
if exist backend (
  pushd backend
  echo Clearing backend caches...
  rd /s /q node_modules\.cache 2>nul
  rd /s /q .cache 2>nul
  popd
) else (
  echo Skipping: backend directory not found
)

REM Root level caches (rare but safe)
echo Clearing root level caches (if any)...
rd /s /q node_modules\.cache 2>nul
rd /s /q .cache 2>nul

REM NPM cache
echo Clearing npm cache...
npm cache clean --force 1>nul 2>nul

echo.
echo ==============================================
echo   OPTIONAL: Reinstall dependencies (faster dev)
echo ==============================================
set /p REINSTALL=Reinstall all dependencies with npm ci? (y/N): 
if /I "%REINSTALL%"=="Y" (
  echo Reinstalling dependencies. This may take a few minutes...
  if exist backend (
    pushd backend
    if exist package-lock.json (
      call npm ci || call npm install
    ) else (
      call npm install
    )
    popd
  )
  if exist frontend (
    pushd frontend
    if exist package-lock.json (
      call npm ci || call npm install
    ) else (
      call npm install
    )
    popd
  )
) else (
  echo Skipping dependency reinstall.
)

echo.
echo ==============================================
echo   DONE. Suggestions for faster dev startup
echo ==============================================
echo - Use Vite dev server for frontend:
echo     cd frontend && npm run dev:vite
echo - Close unused terminals/tabs to free memory/CPU.
echo - Use production build for demos: cd frontend && npm run build && npm run preview:vite
echo.
echo All caches cleared successfully.
pause


