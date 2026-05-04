@echo off
echo ==========================================
echo       Starting Datify Services...
echo ==========================================

:: Start Python Backend
echo Starting Python Brain (FastAPI)...
start "Datify - Python Backend" cmd /k "cd /d "%~dp0backend" && uvicorn app:app --reload"

:: Start Node.js API Gateway
echo Starting Node API Gateway...
start "Datify - Node Backend" cmd /k "cd /d "%~dp0node_backend" && npm start"

:: Wait for servers to spin up before opening the browser
echo Waiting for servers to initialize...
timeout /t 3 /nobreak > NUL

:: Open Frontend
echo Opening Datify Frontend...
start "" "%~dp0frontend\index.html"

echo All services launched successfully!
