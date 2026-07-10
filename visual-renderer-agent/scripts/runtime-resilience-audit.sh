#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/rbx-responsive"
REPORT_FILE="$OUT_DIR/runtime-resilience-report.txt"

mkdir -p "$OUT_DIR"

typeset -a HTML_PAGES
while IFS= read -r f; do
  [[ -n "$f" ]] && HTML_PAGES+=("$f")
done < <(find "$ROOT_DIR" -maxdepth 1 -type f -name '*.html' | sort)

if (( ${#HTML_PAGES[@]} == 0 )); then
  echo "No root HTML pages found" >&2
  exit 1
fi

missing_count=0
asset_count=0

typeset -a missing_assets

normalize_path() {
  local p="$1"
  p="${p%%\?*}"
  p="${p%%#*}"
  echo "$p"
}

for page in "${HTML_PAGES[@]}"; do
  while IFS= read -r raw; do
    [[ -z "$raw" ]] && continue
    local_path="$(normalize_path "$raw")"

    # Ignore empty, external/special schemes and anchors.
    if [[ -z "$local_path" || "$local_path" == "/" || "$local_path" == "." || "$local_path" == "./" || "$local_path" == "../" || "$local_path" == http://* || "$local_path" == https://* || "$local_path" == data:* || "$local_path" == mailto:* || "$local_path" == tel:* || "$local_path" == javascript:* || "$local_path" == \#* ]]; then
      continue
    fi

    # Site-root absolute path
    if [[ "$local_path" == /* ]]; then
      fs_path="$ROOT_DIR$local_path"
    else
      fs_path="$ROOT_DIR/${local_path}"
    fi

    (( asset_count += 1 ))
    if [[ ! -f "$fs_path" ]]; then
      # Support clean route links that omit extension.
      if [[ "$fs_path" != *.* && -f "${fs_path}.html" ]]; then
        continue
      fi
      (( missing_count += 1 ))
      missing_assets+=("${page:t}: $local_path")
    fi
  done < <(rg --pcre2 -oN '(?<=src=")[^"]+|(?<=href=")[^"]+|(?<=poster=")[^"]+' "$page" || true)
done

# Guard checks focused on known regressions.
script_file="$ROOT_DIR/script.js"
css_file="$ROOT_DIR/network-guardian.css"

guard_reveal_js="missing"
guard_reveal_css="missing"
guard_theme_icons="missing"
guard_motion_theme_fallback="missing"
guard_visibility_pause="missing"

if [[ -f "$script_file" ]]; then
  if rg -Fq 'querySelectorAll(".reveal")' "$script_file" && \
     rg -Fq 'function revealAllContentFallback' "$script_file" && \
     rg -Fq 'removeAttribute("data-js")' "$script_file" && \
     rg -Fq 'setTimeout(' "$script_file" && \
     rg -Fq 'catch (error)' "$script_file"; then
    guard_reveal_js="present"
  fi
fi

if [[ -f "$css_file" ]]; then
  if rg -Fq 'html[data-js="ready"] .reveal' "$css_file" && rg -Fq '@keyframes reveal-failsafe' "$css_file"; then
    guard_reveal_css="present"
  fi
  if rg -q '\.theme-icon' "$css_file" && rg -q 'data-theme="light"' "$css_file"; then
    guard_theme_icons="present"
  fi
  if rg -Fq '@media (prefers-reduced-motion: reduce)' "$css_file" && \
     rg -Fq 'hero-asset-fallback.hero-asset-light' "$css_file" && \
     rg -Fq 'scroll-behavior: auto;' "$css_file"; then
    guard_motion_theme_fallback="present"
  fi
fi

if [[ -f "$script_file" ]]; then
  if rg -Fq 'document.addEventListener("visibilitychange"' "$script_file" && \
     rg -Fq 'pauseTrackAutoplay();' "$script_file" && \
     rg -Fq 'pauseManagedIntervals();' "$script_file"; then
    guard_visibility_pause="present"
  fi
fi

{
  echo "Runtime Resilience Report"
  echo "Root: $ROOT_DIR"
  echo "Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo
  echo "Asset Integrity"
  echo "- Checked references: $asset_count"
  echo "- Missing local assets: $missing_count"
  if (( missing_count > 0 )); then
    echo "- Missing list:"
    for item in "${missing_assets[@]}"; do
      echo "  - $item"
    done
  fi
  echo
  echo "Runtime Guardrails"
  echo "- JS reveal fail-safe: $guard_reveal_js"
  echo "- CSS reveal fail-safe: $guard_reveal_css"
  echo "- Theme icon exclusivity rules: $guard_theme_icons"
  echo "- Reduced-motion light/dark fallback guard: $guard_motion_theme_fallback"
  echo "- Hidden-tab animation pause guard: $guard_visibility_pause"

  overall_status="PASS"
  if (( missing_count > 0 )) || [[ "$guard_reveal_js" != "present" ]] || [[ "$guard_reveal_css" != "present" ]] || [[ "$guard_theme_icons" != "present" ]] || [[ "$guard_motion_theme_fallback" != "present" ]] || [[ "$guard_visibility_pause" != "present" ]]; then
    overall_status="FAIL"
  fi
  echo
  echo "Overall: $overall_status"
} > "$REPORT_FILE"

echo "Runtime resilience report generated: $REPORT_FILE"
