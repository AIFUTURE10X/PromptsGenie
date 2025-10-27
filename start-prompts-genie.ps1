# PromptsGenie Startup Script
Write-Host "Starting PromptsGenie Application..." -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Set location to PromptsGenie directory
Set-Location "C:\PromptsGenie"

# Kill any existing Node processes to avoid conflicts
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Check if npm is available
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: npm not found. Please install Node.js" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

# Start the application using the enhanced script
Write-Host "Starting PromptsGenie servers..." -ForegroundColor Green
npm run start

# Keep the window open
Write-Host "PromptsGenie is running!" -ForegroundColor Green
Write-Host "Access at: http://localhost:5173/" -ForegroundColor Cyan
Read-Host "Press Enter to close"