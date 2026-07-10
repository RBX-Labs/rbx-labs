#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/rbx-responsive"
MOCKUP_DIR="$ROOT_DIR/assets/mockups"
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TARGET_PAGE="$ROOT_DIR/network-guardian.html"
TMP_IMAGE="/tmp/network-guardian-mockup-full.png"
TMP_CAPTURE_HTML="$ROOT_DIR/.network-guardian-capture-static.html"

mkdir -p "$MOCKUP_DIR"

TODAY="$(date '+%Y-%m-%d')"
CANONICAL="$MOCKUP_DIR/network-guardian-mockup-desktop.png"
VERSIONED="$MOCKUP_DIR/network-guardian-mockup-desktop-$TODAY.png"
CANONICAL_FULL="$MOCKUP_DIR/network-guardian-mockup-desktop-full.png"
VERSIONED_FULL="$MOCKUP_DIR/network-guardian-mockup-desktop-full-$TODAY.png"

if [[ ! -x "$CHROME_BIN" ]]; then
  echo "Chrome binary not found: $CHROME_BIN" >&2
  exit 1
fi

# Build a static capture page so reveal/JS state cannot blank sections.
perl -0777 -pe '
  s#<script[^>]*src="script\.js"[^>]*></script>##g;
  s#</head>#<style>
  .reveal{opacity:1!important;transform:none!important;animation:none!important}
  html[data-js="ready"] .reveal{opacity:1!important;transform:none!important;animation:none!important}
  </style></head>#s;
' "$TARGET_PAGE" > "$TMP_CAPTURE_HTML"

"$CHROME_BIN" \
  --headless \
  --disable-gpu \
  --hide-scrollbars \
  --virtual-time-budget=6000 \
  --window-size=1440,9000 \
  --screenshot="$TMP_IMAGE" \
  "file://$TMP_CAPTURE_HTML" >/dev/null 2>&1

if [[ ! -f "$TMP_IMAGE" ]]; then
  echo "Failed to generate screenshot: $TMP_IMAGE" >&2
  exit 1
fi

# Keep legacy top-fold exports from renderer output when available.
if [[ -f "$OUT_DIR/network-guardian-desktop.html.png" ]]; then
  cp "$OUT_DIR/network-guardian-desktop.html.png" "$CANONICAL"
  cp "$OUT_DIR/network-guardian-desktop.html.png" "$VERSIONED"
fi

cp "$TMP_IMAGE" "$CANONICAL_FULL"
cp "$TMP_IMAGE" "$VERSIONED_FULL"
rm -f "$TMP_CAPTURE_HTML"

echo "Mockup exported:"
[[ -f "$CANONICAL" ]] && echo "- $CANONICAL"
[[ -f "$VERSIONED" ]] && echo "- $VERSIONED"
echo "- $CANONICAL_FULL"
echo "- $VERSIONED_FULL"
