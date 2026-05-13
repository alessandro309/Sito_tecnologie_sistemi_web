#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

osascript -e "tell app \"Terminal\" to do script \"cd '$SCRIPT_DIR/backend' && python3 -m uvicorn server.server:app --reload\"" 2>/dev/null || \
gnome-terminal -- bash -c "cd '$SCRIPT_DIR/backend' && python3 -m uvicorn server.server:app --reload; exec bash" 2>/dev/null || \
xterm -title "Backend (uvicorn)" -e bash -c "cd '$SCRIPT_DIR/backend' && python3 -m uvicorn server.server:app --reload; exec bash" &

osascript -e "tell app \"Terminal\" to do script \"cd '$SCRIPT_DIR/RetroShop' && npm run dev -- --host\"" 2>/dev/null || \
gnome-terminal -- bash -c "cd '$SCRIPT_DIR/RetroShop' && npm run dev -- --host; exec bash" 2>/dev/null || \
xterm -title "React (vite)" -e bash -c "cd '$SCRIPT_DIR/RetroShop' && npm run dev -- --host; exec bash" &
