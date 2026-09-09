param()

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "Stopping any existing backend on port 8000..."
$existing = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    Stop-Process -Id $existing.OwningProcess -Force -ErrorAction SilentlyContinue
}

Write-Host "Starting backend in a new window..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; .\venv\Scripts\Activate.ps1; python main.py"

# The backend and the frontend/Electron stack take a few seconds each to
# start up; running them one after another (waiting for the backend to
# fully respond before even starting Vite) just adds their times together.
# Kick off the frontend immediately so both start warming up in parallel —
# by the time Vite + Electron are ready, the backend usually is too.
Write-Host "Starting frontend + Electron..."
Set-Location $root
npm run dev
