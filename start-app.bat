@echo off
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
    echo Node.js and npm were not found. Install Node.js 22.12 or newer, then try again.
    pause
    exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
    echo Installing app dependencies for the first run...
    call npm install
    if errorlevel 1 (
        echo Dependency installation failed.
        pause
        exit /b 1
    )
)

call npm run start
if errorlevel 1 (
    echo The app could not be started.
    pause
)
