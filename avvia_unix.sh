SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

osascript -e "tell application \"Terminal\" to do script \"cd '$SCRIPT_DIR/backend' && python3 -m uvicorn server.server:app --reload\"" 2>/dev/null \
|| gnome-terminal -- bash -c "cd '$SCRIPT_DIR/backend' && python3 -m uvicorn server.server:app --reload; exec bash" 2>/dev/null \
|| xterm -e "cd '$SCRIPT_DIR/backend' && python3 -m uvicorn server.server:app --reload" &

osascript -e "tell application \"Terminal\" to do script \"cd '$SCRIPT_DIR/serverChat' && node server\"" 2>/dev/null \
|| gnome-terminal -- bash -c "cd '$SCRIPT_DIR/serverChat' && node server; exec bash" 2>/dev/null \
|| xterm -e "cd '$SCRIPT_DIR/serverChat' && node server" &

osascript -e "tell application \"Terminal\" to do script \"cd '$SCRIPT_DIR/RetroShop' && npm run dev -- --host\"" 2>/dev/null \
|| gnome-terminal -- bash -c "cd '$SCRIPT_DIR/RetroShop' && npm run dev -- --host; exec bash" 2>/dev/null \
|| xterm -e "cd '$SCRIPT_DIR/RetroShop' && npm run dev -- --host" &
