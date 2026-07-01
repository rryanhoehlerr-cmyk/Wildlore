#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"; cd "$DIR" || exit 1
PORT=8080
if command -v nc >/dev/null 2>&1; then for p in 8080 8137 8222 8345; do if ! nc -z localhost "$p" >/dev/null 2>&1; then PORT="$p"; break; fi; done; fi
echo "Wildlore: http://localhost:$PORT/index.html  (keep window open, Ctrl-C to stop)"
( sleep 1.3; open "http://localhost:$PORT/index.html" ) &
python3 -m http.server "$PORT" --directory "$DIR"
