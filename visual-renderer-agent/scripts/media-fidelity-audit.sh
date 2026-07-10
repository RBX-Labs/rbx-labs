#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/rbx-responsive"
REPORT_FILE="$OUT_DIR/media-fidelity-report.txt"

mkdir -p "$OUT_DIR"

if ! command -v ffprobe >/dev/null 2>&1 || ! command -v ffmpeg >/dev/null 2>&1; then
  {
    echo "Media Fidelity Report"
    echo "Root: $ROOT_DIR"
    echo "Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
    echo
    echo "Overall: FAIL"
    echo "Reason: ffprobe/ffmpeg is required for media fidelity checks."
  } > "$REPORT_FILE"
  echo "Media fidelity report generated: $REPORT_FILE"
  exit 0
fi

fail_count=0
typeset -a passes
typeset -a failures

check_file() {
  local label="$1"
  local file_path="$2"
  local expected_w="$3"
  local expected_h="$4"
  local min_luma="$5"
  local max_luma="$6"

  if [[ ! -f "$file_path" ]]; then
    failures+=("$label exists")
    (( fail_count += 1 ))
    return
  fi
  passes+=("$label exists")

  local dims
  dims="$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$file_path" 2>/dev/null || true)"
  local got_w="${dims%%,*}"
  local got_h="${dims##*,}"
  if [[ "$got_w" == "$expected_w" && "$got_h" == "$expected_h" ]]; then
    passes+=("$label dimensions ${expected_w}x${expected_h}")
  else
    failures+=("$label dimensions expected ${expected_w}x${expected_h}, got ${got_w}x${got_h}")
    (( fail_count += 1 ))
  fi

  local yavg
  yavg="$(ffmpeg -v error -i "$file_path" -vf "signalstats,metadata=print:file=-" -frames:v 1 -f null - 2>/dev/null | awk -F= '/YAVG/ {print $2; exit}')"
  if [[ -z "$yavg" ]]; then
    failures+=("$label first-frame luminance readable")
    (( fail_count += 1 ))
    return
  fi

  local in_range
  in_range="$(awk -v y="$yavg" -v lo="$min_luma" -v hi="$max_luma" 'BEGIN { if (y >= lo && y <= hi) print "yes"; else print "no"; }')"
  if [[ "$in_range" == "yes" ]]; then
    passes+=("$label first-frame luma ${yavg} in [${min_luma},${max_luma}]")
  else
    failures+=("$label first-frame luma ${yavg} outside [${min_luma},${max_luma}]")
    (( fail_count += 1 ))
  fi
}

check_file "Hero dark WebM" "$ROOT_DIR/assets/branding/hero/networkguardian_hero.webm" 1920 1080 20 235
check_file "Hero light WebM" "$ROOT_DIR/assets/branding/hero/networkguardian_hero_light.webm" 1920 1080 80 250
check_file "Telemetry dark WebM" "$ROOT_DIR/assets/branding/telemetry/telemetry_map.webm" 1920 1080 15 235
check_file "Telemetry light WebM" "$ROOT_DIR/assets/branding/telemetry/telemetry_map_light.webm" 1920 1080 100 253

{
  echo "Media Fidelity Report"
  echo "Root: $ROOT_DIR"
  echo "Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo
  echo "Passes: ${#passes[@]}"
  for item in "${passes[@]}"; do
    echo "- PASS: $item"
  done
  echo
  echo "Failures: $fail_count"
  for item in "${failures[@]}"; do
    echo "- FAIL: $item"
  done
  echo
  if (( fail_count > 0 )); then
    echo "Overall: FAIL"
  else
    echo "Overall: PASS"
  fi
} > "$REPORT_FILE"

echo "Media fidelity report generated: $REPORT_FILE"
