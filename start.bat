@echo off
title GC Assist — AI Campus Assistant
color 5F

:: Navigate to script directory
cd /d "%~dp0"

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo   [ERROR] Node.js is not installed.
    echo   Please install it from https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo   [1/2] Installing dependencies...
    npm install
    echo.
)

:: Start the dev server and open browser
echo   [2/2] Starting GC Assist...
echo.
echo   App will open at: http://localhost:5173/
echo   Press Ctrl+C to stop the server.
echo.

start "" http://localhost:5173/
npm run dev
