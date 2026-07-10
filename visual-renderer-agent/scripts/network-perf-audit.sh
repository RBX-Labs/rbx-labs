#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/rbx-responsive"
REPORT_FILE="$OUT_DIR/network-performance-report.txt"

LOW_MEGABITS=1.6
FAST_MEGABITS=30

bytes_to_kib() {
  awk -v b="$1" 'BEGIN { printf "%.1f", b / 1024 }'
}

transfer_seconds() {
  awk -v bytes="$1" -v mbps="$2" 'BEGIN { printf "%.2f", (bytes * 8) / (mbps * 1000000) }'
}

typeset -a FILES
while IFS= read -r file; do
  [[ -n "$file" ]] && FILES+=("$file")
done < <(
  find "$ROOT_DIR/assets/branding" -maxdepth 3 -type f \
    \( -name '*.svg' -o -name '*.png' \) | sort
)

if (( ${#FILES[@]} == 0 )); then
  echo "No branding SVG/PNG assets found under $ROOT_DIR/assets/branding" >&2
  exit 1
fi

typeset -A SVG_BY_BASE
typeset -A PNG_BY_BASE

for file in "${FILES[@]}"; do
  base_name="${file:t}"
  no_ext="${base_name:r}"
  ext="${base_name:e:l}"
  if [[ "$ext" == "svg" ]]; then
    SVG_BY_BASE["$no_ext"]="$file"
  elif [[ "$ext" == "png" ]]; then
    PNG_BY_BASE["$no_ext"]="$file"
  fi
done

{
  echo "Network Performance Report"
  echo "Root: $ROOT_DIR"
  echo "Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo
  echo "Assumptions"
  echo "- Low network throughput: ${LOW_MEGABITS} Mbps"
  echo "- Fast network throughput: ${FAST_MEGABITS} Mbps"
  echo "- Times below are transfer-only estimates (not DNS/TLS/parse/decode)."
  echo
  printf "%-34s %10s %11s %11s %10s\n" "Asset Pair" "SVG KiB" "PNG KiB" "Savings" "Low/Fast"
  echo "----------------------------------------------------------------------------------------------"

  total_svg=0
  total_png=0
  total_savings=0

  for key in ${(ok)SVG_BY_BASE}; do
    svg_file="${SVG_BY_BASE[$key]}"
    png_file="${PNG_BY_BASE[$key]-}"
    [[ -z "$png_file" ]] && continue
    svg_bytes="$(wc -c < "$svg_file" | tr -d ' ')"
    png_bytes="$(wc -c < "$png_file" | tr -d ' ')"
    (( total_svg += svg_bytes ))
    (( total_png += png_bytes ))
    savings=$((png_bytes - svg_bytes))
    (( total_savings += savings ))
    if (( png_bytes > 0 )); then
      savings_pct="$(awk -v s="$savings" -v p="$png_bytes" 'BEGIN { printf "%.1f%%", (s / p) * 100 }')"
    else
      savings_pct="n/a"
    fi
    svg_low="$(transfer_seconds "$svg_bytes" "$LOW_MEGABITS")"
    svg_fast="$(transfer_seconds "$svg_bytes" "$FAST_MEGABITS")"
    printf "%-34s %10s %11s %11s %10s\n" \
      "$key" \
      "$(bytes_to_kib "$svg_bytes")" \
      "$(bytes_to_kib "$png_bytes")" \
      "$savings_pct" \
      "${svg_low}s/${svg_fast}s"
  done

  echo
  echo "Aggregate (paired SVG vs PNG)"
  echo "- Total SVG payload: $(bytes_to_kib "$total_svg") KiB"
  echo "- Total PNG payload: $(bytes_to_kib "$total_png") KiB"
  if (( total_png > 0 )); then
    total_savings_pct="$(awk -v s="$total_savings" -v p="$total_png" 'BEGIN { printf "%.1f%%", (s / p) * 100 }')"
  else
    total_savings_pct="n/a"
  fi
  echo "- SVG savings vs PNG: $total_savings_pct"
  echo "- SVG transfer estimate (low/fast): $(transfer_seconds "$total_svg" "$LOW_MEGABITS")s / $(transfer_seconds "$total_svg" "$FAST_MEGABITS")s"
  echo "- PNG transfer estimate (low/fast): $(transfer_seconds "$total_png" "$LOW_MEGABITS")s / $(transfer_seconds "$total_png" "$FAST_MEGABITS")s"
} > "$REPORT_FILE"

echo "Performance report generated: $REPORT_FILE"
