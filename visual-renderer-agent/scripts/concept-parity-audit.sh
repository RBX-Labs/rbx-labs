#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/rbx-responsive"
REPORT_FILE="$OUT_DIR/concept-parity-report.txt"
HTML_FILE="$ROOT_DIR/network-guardian.html"
CSS_FILE="$ROOT_DIR/network-guardian.css"

mkdir -p "$OUT_DIR"

fail_count=0
typeset -a failures
typeset -a passes

check() {
  local description="$1"
  local condition="$2"
  if eval "$condition"; then
    passes+=("$description")
  else
    failures+=("$description")
    (( fail_count += 1 ))
  fi
}

# ---------- Hero / Header ----------
check "Hero headline keeps 3 explicit concept lines" \
  "rg -Fq '<span class=\"hero-line\">SEE EVERYTHING.</span>' \"$HTML_FILE\" && \
   rg -Fq '<span class=\"hero-line\">UNDERSTAND FASTER.</span>' \"$HTML_FILE\" && \
   rg -Fq '<span class=\"hero-line hero-line-accent\">ACT FIRST.</span>' \"$HTML_FILE\""

check "Hero typography avoids forced nowrap clipping" \
  "! rg -Fq 'white-space: nowrap;' \"$CSS_FILE\""

check "Nav labels remain compact for concept parity" \
  "rg -Fq 'font-size: 0.9rem;' \"$CSS_FILE\""

# ---------- Metric row ----------
check "Trust score metric is 78/100 with countup target 78" \
  "rg -Fq 'data-target=\"78\">78</span>/100' \"$HTML_FILE\""

check "Metric row preserves large emphasis typography" \
  "rg -Fq 'font-size: clamp(2.2rem, 5.4vw, 3.7rem);' \"$CSS_FILE\""

# ---------- How We Operate ----------
check "Operation icons are centered and visibly emphasized" \
  "rg -Fq '.operation-icon {' \"$CSS_FILE\" && \
   rg -Fq 'place-items: center;' \"$CSS_FILE\" && \
   rg -Fq 'width: 3rem;' \"$CSS_FILE\" && \
   rg -Fq 'height: 3rem;' \"$CSS_FILE\" && \
   rg -Fq '.operation-icon img {' \"$CSS_FILE\" && \
   rg -Fq 'width: 1.9rem;' \"$CSS_FILE\" && \
   rg -Fq 'height: 1.9rem;' \"$CSS_FILE\" && \
   rg -Fq 'object-position: center;' \"$CSS_FILE\""

# ---------- Live System Overview ----------
check "Incident cards use single explicit icon assets (no light/dark overlap)" \
  "rg -Fq 'class=\"incident-card-icon\" src=\"assets/branding/icons/ng_alert_light.png\"' \"$HTML_FILE\" && \
   rg -Fq 'class=\"incident-card-icon\" src=\"assets/branding/icons/ng_security_light.png\"' \"$HTML_FILE\" && \
   ! rg -Fq 'class=\"incident-card-icon\" src=\"assets/branding/icons/ng_alert.png\"' \"$HTML_FILE\" && \
   ! rg -Fq 'class=\"incident-card-icon\" src=\"assets/branding/icons/ng_security.png\"' \"$HTML_FILE\" && \
   ! rg -Fq 'ng_incident_light' \"$HTML_FILE\" && \
   ! rg -Fq 'ng_protected_light' \"$HTML_FILE\""

check "Incident icon size is readable (>=1.6rem style target)" \
  "rg -Fq '.incident-card-icon {' \"$CSS_FILE\" && rg -Fq 'width: 2rem;' \"$CSS_FILE\" && rg -Fq 'height: 2rem;' \"$CSS_FILE\""

check "Right column is widened to concept-like proportion" \
  "rg -Fq 'grid-template-columns: 252px minmax(0, 1fr) 226px;' \"$CSS_FILE\""

# ---------- Trust / Footer ----------
check "Trust row uses strong uppercase typography" \
  "rg -Fq 'font-size: 1.62rem;' \"$CSS_FILE\" && rg -Fq 'letter-spacing: 0.1em;' \"$CSS_FILE\""

check "Pilot CTA keeps two-button ending layout" \
  "rg -Fq '<section class=\"pilot-section reveal\" id=\"pilot\">' \"$HTML_FILE\" && \
   rg -Fq 'Book a pilot call' \"$HTML_FILE\" && \
   rg -Fq 'Email pilot interest' \"$HTML_FILE\""

{
  echo "Concept Parity Report"
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

echo "Concept parity report generated: $REPORT_FILE"
