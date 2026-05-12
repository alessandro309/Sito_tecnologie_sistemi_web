@echo off
start "RetroShop" cmd /k "cd /d "%~dp0RetroShop" && npm run build && echo. && echo Build completato. Avvio server... && cd /d "%~dp0backend" && python3 -m uvicorn server.server:app --port 8000"
