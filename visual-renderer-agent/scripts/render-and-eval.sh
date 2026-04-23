#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
RENDER_SCRIPT="$ROOT_DIR/visual-renderer-agent/scripts/visual-render-validate.sh"
CODEX_BIN="${CODEX_BIN:-/Users/bangabot/.vscode/extensions/openai.chatgpt-26.417.40842-darwin-arm64/bin/macos-aarch64/codex}"
OUT_DIR="${TMPDIR:-/tmp}/rbx-responsive"
MANIFEST_FILE="$OUT_DIR/manifest.txt"
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

if [[ ! -x "$CODEX_BIN" ]]; then
  echo "Codex CLI not found at: $CODEX_BIN" >&2
  exit 1
fi

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
    echo "  Comments: <one concise sentence covering mobile, tablet, and desktop>"
  done
  echo
  echo "Rules for output:"
  echo "- list every HTML file exactly once"
  echo "- use PASS only when there is no blocking issue for that file"
  echo "- use FAIL when any breakpoint for that file has a blocking issue"
  echo "- keep comments concise and human-readable"
  echo "- after the per-file list, add an Optional Notes section only if there are minor non-blocking issues"
  echo "- do not treat a viewport snapshot ending mid-section or mid-card as a layout issue by itself"
  echo "- do not narrate your process"
  echo "- do not omit any file"
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
