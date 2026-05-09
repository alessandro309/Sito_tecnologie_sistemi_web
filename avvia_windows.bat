@echo off
start "Backend (uvicorn)" cmd /k "cd /d "%~dp0backend" && python3 -m uvicorn server.server:app --reload"
start "Chat Server (node)" cmd /k "cd /d "%~dp0serverChat" && node server"
start "React (vite)"      cmd /k "cd /d "%~dp0RetroShop" && npm run dev"
