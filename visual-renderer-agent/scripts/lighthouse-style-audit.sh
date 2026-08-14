#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/rbx-responsive"
REPORT_FILE="$OUT_DIR/lighthouse-style-report.txt"
JSON_DIR="$OUT_DIR/lighthouse-json"
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

mkdir -p "$OUT_DIR" "$JSON_DIR"

if [[ ! -x "$CHROME_BIN" ]]; then
  echo "Chrome binary not found: $CHROME_BIN" >&2
  exit 1
fi

timestamp="$(date '+%Y-%m-%d %H:%M:%S %Z')"

find_free_port() {
  python3 - <<'PY'
import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()
PY
}

PORT="$(find_free_port)"
SERVER_LOG="$OUT_DIR/lighthouse-style-server.log"

python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT_DIR" >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

sleep 1

MOBILE_JSON="$JSON_DIR/network-guardian-mobile.json"
DESKTOP_JSON="$JSON_DIR/network-guardian-desktop.json"

lighthouse_ok=0

if command -v lighthouse >/dev/null 2>&1; then
  if lighthouse "http://127.0.0.1:${PORT}/network-guardian.html" \
    --quiet \
    --chrome-path="$CHROME_BIN" \
    --only-categories=performance \
    --form-factor=mobile \
    --output=json \
    --output-path="$MOBILE_JSON" >/dev/null 2>&1; then
    lighthouse_ok=1
  fi

  if lighthouse "http://127.0.0.1:${PORT}/network-guardian.html" \
    --quiet \
    --chrome-path="$CHROME_BIN" \
    --preset=desktop \
    --only-categories=performance \
    --output=json \
    --output-path="$DESKTOP_JSON" >/dev/null 2>&1; then
    lighthouse_ok=1
  fi
fi

python3 - "$ROOT_DIR" "$REPORT_FILE" "$MOBILE_JSON" "$DESKTOP_JSON" "$lighthouse_ok" "$timestamp" <<'PY'
import json
import os
import re
import sys
from pathlib import Path

root = Path(sys.argv[1])
report_file = Path(sys.argv[2])
mobile_json = Path(sys.argv[3])
desktop_json = Path(sys.argv[4])
lighthouse_ok = sys.argv[5] == "1"
timestamp = sys.argv[6]

def kib(path: Path) -> float:
    return path.stat().st_size / 1024.0 if path.exists() else 0.0

def summarize_lighthouse(path: Path):
    data = json.loads(path.read_text(encoding="utf-8"))
    audits = data.get("audits", {})
    cat = data.get("categories", {}).get("performance", {})
    score = cat.get("score")
    score = round(score * 100) if isinstance(score, (int, float)) else None
    def num(key):
        v = audits.get(key, {}).get("numericValue")
        return round(float(v), 1) if isinstance(v, (int, float)) else None
    return {
        "score": score,
        "fcp_ms": num("first-contentful-paint"),
        "lcp_ms": num("largest-contentful-paint"),
        "tbt_ms": num("total-blocking-time"),
        "cls": num("cumulative-layout-shift"),
        "si_ms": num("speed-index"),
    }

css = root / "network-guardian.css"
js = root / "script.js"
html = root / "network-guardian.html"
css_text = css.read_text(encoding="utf-8") if css.exists() else ""
js_text = js.read_text(encoding="utf-8") if js.exists() else ""
html_text = html.read_text(encoding="utf-8") if html.exists() else ""

png_refs = re.findall(r'(?:src|poster)="([^"]+\.png)"', html_text)
png_assets = []
for ref in png_refs:
    candidate = root / ref
    if candidate.exists() and candidate not in png_assets:
        png_assets.append(candidate)
png_total_kib = round(sum(kib(p) for p in png_assets), 1)

def pick_preferred_bytes(base_no_ext: Path):
    for ext in ("avif", "webp", "png"):
        candidate = base_no_ext.with_suffix(f".{ext}")
        if candidate.exists():
            return candidate.stat().st_size
    return 0

preferred_assets = [
    root / "assets/branding/hero/networkguardian_hero",
    root / "assets/branding/hero/networkguardian_hero_light",
    root / "assets/branding/telemetry/telemetry_map",
    root / "assets/branding/telemetry/telemetry_map_light",
]
preferred_total_kib = round(sum(pick_preferred_bytes(p) for p in preferred_assets) / 1024.0, 1)

reduced_motion_ok = (
    "@media (prefers-reduced-motion: reduce)" in css_text
    and "scroll-behavior: auto;" in css_text
    and "hero-asset-fallback.hero-asset-light" in css_text
)
visibility_pause_ok = (
    'document.addEventListener("visibilitychange"' in js_text
    and "pauseManagedIntervals();" in js_text
    and "pauseTrackAutoplay();" in js_text
)
script_tags = re.findall(r"<script\\b([^>]*)>", html_text, flags=re.I)
head_blocking_scripts = sum(
    1 for attrs in script_tags
    if re.search(r"\\bsrc=", attrs, flags=re.I)
    and not re.search(r"\\b(?:defer|async)\\b", attrs, flags=re.I)
)

status = "PASS"
notes = []

if not reduced_motion_ok:
    status = "FAIL"
    notes.append("Reduced-motion light/dark fallback guard is incomplete.")
if not visibility_pause_ok:
    status = "FAIL"
    notes.append("Animation pause-on-hidden lifecycle guard is incomplete.")
if preferred_total_kib > 1600:
    status = "WARN" if status == "PASS" else status
    notes.append(f"Heavy preferred fallback payload ({preferred_total_kib} KiB) may hurt slow-network LCP.")
if head_blocking_scripts > 0:
    status = "WARN" if status == "PASS" else status
    notes.append(f"{head_blocking_scripts} potential head-blocking script tag(s) found.")

lines = []
lines.append("Lighthouse-Style Performance Report")
lines.append(f"Root: {root}")
lines.append(f"Generated: {timestamp}")
lines.append("")
if lighthouse_ok and mobile_json.exists() and desktop_json.exists():
    m = summarize_lighthouse(mobile_json)
    d = summarize_lighthouse(desktop_json)
    lines.append("Lighthouse Metrics (local)")
    lines.append(f"- Mobile score: {m['score']}")
    lines.append(f"- Mobile FCP/LCP/TBT/CLS/SI: {m['fcp_ms']}ms / {m['lcp_ms']}ms / {m['tbt_ms']}ms / {m['cls']} / {m['si_ms']}ms")
    lines.append(f"- Desktop score: {d['score']}")
    lines.append(f"- Desktop FCP/LCP/TBT/CLS/SI: {d['fcp_ms']}ms / {d['lcp_ms']}ms / {d['tbt_ms']}ms / {d['cls']} / {d['si_ms']}ms")
else:
    lines.append("Lighthouse Metrics (local)")
    lines.append("- Lighthouse CLI unavailable; used static Lighthouse-style checks only.")

lines.append("")
lines.append("Static Performance Guards")
lines.append(f"- Reduced-motion fallback guard: {'PASS' if reduced_motion_ok else 'FAIL'}")
lines.append(f"- Hidden-tab animation pause guard: {'PASS' if visibility_pause_ok else 'FAIL'}")
lines.append(f"- Preferred hero/telemetry payload (AVIF/WebP/PNG order): {preferred_total_kib} KiB")
lines.append(f"- Referenced PNG payload on Network Guardian page: {png_total_kib} KiB")
lines.append(f"- Head-blocking script tags: {head_blocking_scripts}")
lines.append("")
lines.append(f"Overall: {status}")
if notes:
    lines.append("Notes:")
    for n in notes:
        lines.append(f"- {n}")

report_file.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Lighthouse-style report generated: {report_file}")
PY
