#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${TMPDIR:-/tmp}/rbx-responsive"
SPECS=(
  "mobile 390 844 0.85"
  "tablet 768 1024 0.70"
  "desktop 1440 1100 0.52"
)
MANIFEST_FILE="$OUT_DIR/manifest.txt"

typeset -a PAGES
while IFS= read -r html_file; do
  [[ -n "$html_file" ]] && PAGES+=("${html_file:t:r}")
done < <(find "$ROOT_DIR" -maxdepth 1 -type f -name '*.html' | sort)

if (( ${#PAGES[@]} == 0 )); then
  echo "No root HTML pages found in $ROOT_DIR" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
: > "$MANIFEST_FILE"

render_page() {
  local page="$1"
  local label="$2"
  local width="$3"
  local height="$4"
  local scale="$5"
  local wrapper="$OUT_DIR/${page}-${label}.html"

  cat > "$wrapper" <<HTML
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
html,body{margin:0;background:#061224;height:100%;overflow:hidden}
.viewport{width:1600px;height:1600px;overflow:hidden;position:relative;background:#061224}
.device{width:${width}px;height:${height}px;transform:scale(${scale});transform-origin:top left;box-shadow:0 0 0 1px rgba(255,255,255,.08),0 24px 80px rgba(0,0,0,.35);border-radius:24px;overflow:hidden;position:absolute;left:40px;top:40px;background:#061224}
iframe{width:${width}px;height:${height}px;border:0;display:block}
.label{position:absolute;right:40px;top:40px;color:#dbe7f4;font:600 28px/1.2 Arial,sans-serif;text-align:right}
.label small{display:block;color:#8ea3b8;font:400 18px/1.4 Arial,sans-serif;margin-top:8px}
</style>
</head>
<body>
<div class="viewport">
  <div class="device"><iframe src="file://${ROOT_DIR}/${page}.html"></iframe></div>
  <div class="label">${page}.html<br><small>${label} ${width}x${height}</small></div>
</div>
</body>
</html>
HTML

  qlmanage -t -s 1600 -o "$OUT_DIR" "$wrapper" >/dev/null
}

for page in "${PAGES[@]}"; do
  for spec in "${SPECS[@]}"; do
    render_page "$page" ${=spec}
    set -- ${=spec}
    echo "$OUT_DIR/${page}-${1}.html.png" >> "$MANIFEST_FILE"
  done
done

echo "Responsive previews generated in: $OUT_DIR"
echo "Review these files:"
for page in "${PAGES[@]}"; do
  for spec in "${SPECS[@]}"; do
    set -- ${=spec}
    echo "  $OUT_DIR/${page}-${1}.html.png"
  done
done
echo "Manifest: $MANIFEST_FILE"
