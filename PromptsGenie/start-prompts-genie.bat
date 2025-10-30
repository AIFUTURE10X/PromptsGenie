@echo off
echo Starting PromptsGenie with correct configuration...
echo.

REM Kill any existing processes on these ports
echo Cleaning up any existing servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Navigate to the correct directory
cd /d "C:\PromptsGenie"

REM Start the backend server
echo Starting backend server...
start "PromptsGenie Backend" cmd /k "node server.js"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start the frontend development server
echo Starting frontend server...
start "PromptsGenie Frontend" cmd /k "npm run dev"

REM Wait for servers to start
timeout /t 5 /nobreak >nul

REM Open the application in browser
echo Opening PromptsGenie in browser...
start http://localhost:5173/

echo.
echo PromptsGenie is starting up!
echo Frontend: http://localhost:5173/
echo Backend: Running on configured port
echo.
echo Press any key to close this window...
pause >nul