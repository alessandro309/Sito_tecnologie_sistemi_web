#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

osascript -e "tell app \"Terminal\" to do script \"cd '$SCRIPT_DIR/RetroShop' && npm run build && echo '' && echo 'Build completato. Avvio server...' && cd '$SCRIPT_DIR/backend' && python3 -m uvicorn server.server:app --port 8000\"" 2>/dev/null || \
gnome-terminal -- bash -c "cd '$SCRIPT_DIR/RetroShop' && npm run build && echo '' && echo 'Build completato. Avvio server...' && cd '$SCRIPT_DIR/backend' && python3 -m uvicorn server.server:app --port 8000; exec bash" 2>/dev/null || \
xterm -title "RetroShop" -e bash -c "cd '$SCRIPT_DIR/RetroShop' && npm run build && echo '' && echo 'Build completato. Avvio server...' && cd '$SCRIPT_DIR/backend' && python3 -m uvicorn server.server:app --port 8000; exec bash" &
