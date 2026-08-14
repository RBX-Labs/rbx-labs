#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/rbx-responsive/nested"
REPORT_FILE="$OUT_DIR/nested-responsive-report.txt"
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

[[ -x "$CHROME_BIN" ]] || { echo "Chrome binary not found: $CHROME_BIN" >&2; exit 1; }
mkdir -p "$OUT_DIR"

PORT="$(python3 - <<'PY'
import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()
PY
)"
SERVER_LOG="$OUT_DIR/server.log"
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT_DIR" >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" >/dev/null 2>&1 || true' EXIT
sleep 1

PAGES=(
  "wekamp/index.html"
  "wekamp/events.html"
  "wekamp/feed.html"
  "wekamp/reviews/index.html"
  "wekamp/reviews/v1-signal-control.html"
  "wekamp/reviews/v2-community-studio.html"
  "wekamp/reviews/v3-operator-console.html"
  "GAIL/index.html"
  "GAIL/GAIL_Thursday_One_Day_Program.html"
  "fossy-runtime-trust-kit/index.html"
  "research/index.html"
  "network-guardian/privacy/index.html"
  "network-guardian/data-safety/index.html"
  "network-guardian/permissions/index.html"
  "network-guardian/account-deletion/index.html"
)
VIEWPORTS=("phone-portrait 320 720" "phone 390 844" "tablet 768 1024" "desktop 1440 1100")

total=0
passed=0
failed=0
for page in "${PAGES[@]}"; do
  [[ -f "$ROOT_DIR/$page" ]] || { echo "Missing page: $page" >&2; exit 1; }
  slug="${page//\//--}"
  for viewport in "${VIEWPORTS[@]}"; do
    set -- ${=viewport}
    name="$1"; width="$2"; height="$3"
    (( total += 1 ))
    out="$OUT_DIR/${slug%.html}-${name}.png"
    "$CHROME_BIN" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=5000 \
      --window-size="${width},${height}" --screenshot="$out" \
      "http://127.0.0.1:${PORT}/${page}" >/dev/null 2>&1 || true
    if [[ -s "$out" ]] && (( $(wc -c < "$out") > 10000 )); then
      (( passed += 1 ))
    else
      (( failed += 1 ))
    fi
  done
done

{
  echo "Nested Responsive Matrix"
  echo "Root: $ROOT_DIR"
  echo "Pages: ${#PAGES[@]}"
  echo "Viewports: ${#VIEWPORTS[@]}"
  echo "Captures: $total"
  echo "Passed captures: $passed"
  echo "Failed captures: $failed"
  echo "Overall: $([[ "$failed" -eq 0 ]] && echo PASS || echo FAIL)"
} > "$REPORT_FILE"
cat "$REPORT_FILE"
[[ "$failed" -eq 0 ]]
