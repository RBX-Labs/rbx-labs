#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
RENDER_SCRIPT="$ROOT_DIR/visual-renderer-agent/scripts/visual-render-validate.sh"
if [[ -z "${CODEX_BIN:-}" ]]; then
  CODEX_BIN="$(command -v codex || true)"
fi

OUT_DIR="${TMPDIR:-/tmp}/rbx-responsive"
MANIFEST_FILE="$OUT_DIR/manifest.txt"
OVERRIDE_FILE="$ROOT_DIR/.git/.visual-qa-override"
OVERRIDE_LOG="$OUT_DIR/manual-override.txt"

BREAKPOINTS=(
  "mobile 390x844"
  "tablet 768x1024"
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
  echo "Report:"
  echo "- blocking issues first"
  echo "- layout overlap"
  echo "- broken stacking"
  echo "- spacing regressions"
  echo "- unreadable text"
  echo "- obvious alignment failures"
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

typeset -a codex_args
codex_args=(
  exec
  --full-auto
  --cd "$ROOT_DIR"
  --add-dir "$OUT_DIR"
  -
)

for image in "${images[@]}"; do
  codex_args+=(-i "$image")
done

"$CODEX_BIN" "${codex_args[@]}" < "$prompt_file"
