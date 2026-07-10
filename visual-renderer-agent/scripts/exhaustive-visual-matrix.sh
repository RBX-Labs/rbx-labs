#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/rbx-responsive/exhaustive"
REPORT_FILE="$OUT_DIR/exhaustive-visual-report.txt"
MANIFEST_FILE="$OUT_DIR/manifest.csv"
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PAGE_FILE="$ROOT_DIR/network-guardian.html"

if [[ ! -x "$CHROME_BIN" ]]; then
  echo "Chrome binary not found: $CHROME_BIN" >&2
  exit 1
fi

if [[ ! -f "$PAGE_FILE" ]]; then
  echo "Page not found: $PAGE_FILE" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
echo "pass_id,viewport,theme,contrast,mode,visual,width,height,path,bytes,status" > "$MANIFEST_FILE"

VIEWPORTS=(
  "phone-portrait 390 844"
  "phone-landscape 844 390"
  "flip-portrait 320 720"
  "fold-portrait 673 841"
  "tablet-portrait 768 1024"
  "tablet-landscape 1024 768"
  "desktop 1440 1100"
)
THEMES=("dark" "light")
CONTRASTS=("standard" "high")
MODES=("static" "live")
VISUALS=("svg" "png")

pass_id=0
ok=0
fail=0

for vp in "${VIEWPORTS[@]}"; do
  set -- ${=vp}
  vp_name="$1"
  w="$2"
  h="$3"

  for theme in "${THEMES[@]}"; do
    for contrast in "${CONTRASTS[@]}"; do
      for mode in "${MODES[@]}"; do
        for visual in "${VISUALS[@]}"; do
          (( pass_id += 1 ))
          qa_static=0
          if [[ "$mode" == "static" ]]; then
            qa_static=1
          fi

          out_png="$OUT_DIR/network-guardian-${vp_name}-${theme}-${contrast}-${mode}-${visual}.png"
          url="file://${PAGE_FILE}?qa_theme=${theme}&qa_contrast=${contrast}&qa_static=${qa_static}&qa_visual=${visual}"

          "$CHROME_BIN" \
            --headless \
            --disable-gpu \
            --hide-scrollbars \
            --virtual-time-budget=7000 \
            --window-size="${w},${h}" \
            --screenshot="$out_png" \
            "$url" >/dev/null 2>&1 || true

          if [[ -f "$out_png" ]]; then
            size_bytes="$(wc -c < "$out_png" | tr -d ' ')"
          else
            size_bytes=0
          fi

          result_status="FAIL"
          if [[ -f "$out_png" && "$size_bytes" -gt 10000 ]]; then
            result_status="PASS"
            (( ok += 1 ))
          else
            (( fail += 1 ))
          fi

          echo "${pass_id},${vp_name},${theme},${contrast},${mode},${visual},${w},${h},${out_png},${size_bytes},${result_status}" >> "$MANIFEST_FILE"
        done
      done
    done
  done
done

total=$((ok + fail))
{
  echo "Exhaustive Visual Matrix Report"
  echo "Root: $ROOT_DIR"
  echo "Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo
  echo "Total passes: $total"
  echo "Passed captures: $ok"
  echo "Failed captures: $fail"
  echo
  echo "Matrix dimensions"
  echo "- Viewports: ${#VIEWPORTS[@]}"
  echo "- Themes: ${#THEMES[@]}"
  echo "- Contrasts: ${#CONTRASTS[@]}"
  echo "- Modes (static/live): ${#MODES[@]}"
  echo "- Heavy visual variants (svg/png): ${#VISUALS[@]}"
  echo
  echo "Expected total = ${#VIEWPORTS[@]} x ${#THEMES[@]} x ${#CONTRASTS[@]} x ${#MODES[@]} x ${#VISUALS[@]}"
  echo "Expected total = $(( ${#VIEWPORTS[@]} * ${#THEMES[@]} * ${#CONTRASTS[@]} * ${#MODES[@]} * ${#VISUALS[@]} ))"
  echo
  echo "Manifest: $MANIFEST_FILE"
  if (( fail > 0 )); then
    echo "Overall: FAIL"
  else
    echo "Overall: PASS"
  fi
} > "$REPORT_FILE"

echo "Exhaustive matrix complete: $REPORT_FILE"
