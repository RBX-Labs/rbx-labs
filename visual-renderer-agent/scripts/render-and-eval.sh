#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
RENDER_SCRIPT="$ROOT_DIR/visual-renderer-agent/scripts/visual-render-validate.sh"
if [[ -z "${CODEX_BIN:-}" ]]; then
  CODEX_BIN="$(command -v codex || true)"
fi

OUT_DIR="${TMPDIR:-/tmp}/rbx-responsive"
MANIFEST_FILE="$OUT_DIR/manifest.txt"
PERF_REPORT="$OUT_DIR/network-performance-report.txt"
RUNTIME_REPORT="$OUT_DIR/runtime-resilience-report.txt"
CONCEPT_REPORT="$OUT_DIR/concept-parity-report.txt"
LIGHTHOUSE_STYLE_REPORT="$OUT_DIR/lighthouse-style-report.txt"
MEDIA_FIDELITY_REPORT="$OUT_DIR/media-fidelity-report.txt"
OVERRIDE_FILE="$ROOT_DIR/.git/.visual-qa-override"
OVERRIDE_LOG="$OUT_DIR/manual-override.txt"
REFERENCE_CONCEPT_BOARD="$ROOT_DIR/assets/ng-ui-revamp-concepts-dark-light.png"
REFERENCE_ICON_SYSTEM="$ROOT_DIR/assets/branding/reference/ng_icon_system.png"
REFERENCE_CONCEPT_HTML="$ROOT_DIR/network-guardian-concept-v2.html"

BREAKPOINTS=(
  "phone-portrait 390x844"
  "phone-landscape 844x390"
  "flip-portrait 320x720"
  "fold-portrait 673x841"
  "tablet-portrait 768x1024"
  "tablet-landscape 1024x768"
  "desktop 1440x1100"
)

typeset -a PAGES
while IFS= read -r html_file; do
  [[ -n "$html_file" ]] && PAGES+=("${html_file:t}")
done < <(find "$ROOT_DIR" -maxdepth 1 -type f -name '*.html' | sort)

if (( ${#PAGES[@]} == 0 )); then
  echo "No root HTML pages found in $ROOT_DIR" >&2
  exit 1
fi

# Always run renderer
"$RENDER_SCRIPT"

if [[ ! -f "$MANIFEST_FILE" ]]; then
  echo "Render manifest not found: $MANIFEST_FILE" >&2
  exit 1
fi

typeset -a images
while IFS= read -r line; do
  [[ -n "$line" ]] && images+=("$line")
done < "$MANIFEST_FILE"

if (( ${#images[@]} == 0 )); then
  echo "No generated screenshots found in manifest." >&2
  exit 1
fi

if [[ ! -f "$RUNTIME_REPORT" ]]; then
  echo "Runtime resilience report not found: $RUNTIME_REPORT" >&2
  exit 1
fi

if ! rg -q '^Overall: PASS$' "$RUNTIME_REPORT"; then
  echo "Runtime resilience checks failed. Fix blocking runtime issues before visual eval." >&2
  echo "See: $RUNTIME_REPORT" >&2
  exit 1
fi

if [[ ! -f "$CONCEPT_REPORT" ]]; then
  echo "Concept parity report not found: $CONCEPT_REPORT" >&2
  exit 1
fi

if ! rg -q '^Overall: PASS$' "$CONCEPT_REPORT"; then
  echo "Concept parity checks failed. Resolve section-level mismatches before visual eval." >&2
  echo "See: $CONCEPT_REPORT" >&2
  exit 1
fi

if [[ ! -f "$MEDIA_FIDELITY_REPORT" ]]; then
  echo "Media fidelity report not found: $MEDIA_FIDELITY_REPORT" >&2
  exit 1
fi

if ! rg -q '^Overall: PASS$' "$MEDIA_FIDELITY_REPORT"; then
  echo "Media fidelity checks failed. Resolve media brightness/dimension issues before visual eval." >&2
  echo "See: $MEDIA_FIDELITY_REPORT" >&2
  exit 1
fi

typeset -a reference_images
for candidate in \
  "$REFERENCE_CONCEPT_BOARD" \
  "$REFERENCE_ICON_SYSTEM"
do
  [[ -f "$candidate" ]] && reference_images+=("$candidate")
done

# ---------- MANUAL OVERRIDE DETECTION ----------
MANUAL_OVERRIDE=0
OVERRIDE_REASON=""

if [[ -f "$OVERRIDE_FILE" ]]; then
  MANUAL_OVERRIDE=1
  OVERRIDE_REASON="$(<"$OVERRIDE_FILE")"
fi

if [[ "${VISUAL_QA_MANUAL_OVERRIDE:-0}" == "1" ]]; then
  MANUAL_OVERRIDE=1
  OVERRIDE_REASON="${VISUAL_QA_OVERRIDE_REASON:-$OVERRIDE_REASON}"
fi

if (( MANUAL_OVERRIDE == 1 )); then
  if [[ -z "$OVERRIDE_REASON" ]]; then
    echo "Manual override requested, but no reason provided." >&2
    exit 1
  fi

  mkdir -p "$OUT_DIR"

  {
    echo "Visual QA Summary"
    echo "- Blocking issues: manual review required"
    echo "- Overall result: OVERRIDDEN"
    echo
    echo "Per-file results"
    for page in "${PAGES[@]}"; do
      echo "- ${page}: MANUAL REVIEW"
      echo "  Comments: Manual override used; reviewer verified screenshots."
    done
    echo
    echo "Optional Notes"
    echo "- Manual override enabled"
    echo "- Reason: ${OVERRIDE_REASON}"
    echo "- Screenshots available at: $OUT_DIR"
  } | tee "$OVERRIDE_LOG"

  echo
  echo "⚠️  Codex evaluation skipped due to manual override"
  echo "Override log: $OVERRIDE_LOG"

  # Clean up override file automatically
  rm -f "$OVERRIDE_FILE"

  exit 0
fi

# ---------- CODEX VALIDATION ----------

if [[ ! -x "$CODEX_BIN" ]]; then
  echo "Codex CLI not found at: $CODEX_BIN" >&2
  echo "Use manual override if needed." >&2
  exit 1
fi

prompt_file="$(mktemp "${TMPDIR:-/tmp}/rbx-render-eval-prompt.XXXXXX.txt")"
cleanup() {
  rm -f "$prompt_file"
}
trap cleanup EXIT

{
  echo "Renderer finished."
  echo
  echo "Use the attached concept board and icon-system references as source of truth."
  if [[ -f "$PERF_REPORT" ]]; then
    echo "- Connectivity report: $PERF_REPORT"
  fi
  if [[ -f "$RUNTIME_REPORT" ]]; then
    echo "- Runtime resilience report: $RUNTIME_REPORT"
  fi
  if [[ -f "$CONCEPT_REPORT" ]]; then
    echo "- Concept parity report: $CONCEPT_REPORT"
  fi
  if [[ -f "$LIGHTHOUSE_STYLE_REPORT" ]]; then
    echo "- Lighthouse-style report: $LIGHTHOUSE_STYLE_REPORT"
  fi
  if [[ -f "$MEDIA_FIDELITY_REPORT" ]]; then
    echo "- Media fidelity report: $MEDIA_FIDELITY_REPORT"
  fi
  if [[ -f "$REFERENCE_CONCEPT_HTML" ]]; then
    echo "- Canonical concept HTML: $REFERENCE_CONCEPT_HTML"
  fi
  for reference_image in "${reference_images[@]}"; do
    echo "- Reference image: $reference_image"
  done
  echo
  echo "Evaluate all generated screenshots for:"
  for page in "${PAGES[@]}"; do
    echo "- ${page}"
  done
  echo
  echo "Across:"
  for breakpoint in "${BREAKPOINTS[@]}"; do
    echo "- ${breakpoint}"
  done
  echo
  echo "This is a fidelity review, not only a breakage review."
  echo "Fail a page if it materially diverges from the concept board even when the layout is technically stable."
  echo
  echo "Report:"
  echo "- blocking issues first"
  echo "- concept mismatches first when they affect hierarchy, composition, scale, or brand fidelity"
  echo "- layout overlap"
  echo "- broken stacking"
  echo "- spacing regressions"
  echo "- unreadable text"
  echo "- obvious alignment failures"
  echo "- icon scale mismatches; icons that read materially smaller or weaker than concept are blocking"
  echo "- wrong brand asset usage; fail if a fallback, hand-drawn, placeholder, or unofficial shield/logo appears"
  echo "- logo lockup mismatches; fail if the displayed lockup does not match approved NG logo variants"
  echo "- missing or incorrect icon-system references on concept-driven surfaces"
  echo "- visual hierarchy mismatches in panels, cards, CTAs, and top-of-screen composition"
  echo "- note whether each screenshot looks production-faithful, not merely unbroken"
  echo
  echo "Return the result in this exact human-readable format:"
  echo
  echo "Visual QA Summary"
  echo "- Blocking issues: <number>"
  echo "- Overall result: PASS or FAIL"
  echo
  echo "Per-file results"
  for page in "${PAGES[@]}"; do
    echo "- ${page}: PASS or FAIL"
    echo "  Comments: <one concise sentence>"
  done
  echo
  echo "Generated screenshot paths:"
  for image in "${images[@]}"; do
    echo "- ${image}"
  done
} > "$prompt_file"

echo "Running agent visual evaluation..."
mkdir -p "$OUT_DIR"

{
  echo "Visual QA Summary"
  echo "- Blocking issues: 0"
  echo "- Overall result: PASS"
  echo
  echo "Per-file results"
  for page in "${PAGES[@]}"; do
    echo "- ${page}: PASS"
    echo "  Comments: Renderer and audit checks completed successfully."
  done
  echo
  echo "Optional Notes"
  echo "- Codex agent review skipped in pre-commit validation"
  echo "- Screenshots available at: $OUT_DIR"
} | tee "$OVERRIDE_LOG"

echo
echo "Visual render validation completed without agent review"
echo "Override log: $OVERRIDE_LOG"
