#!/bin/sh
# Render the 1024px icon candidates with headless Chrome. Usage: tools/icon/render.sh [outdir]
set -e
cd "$(dirname "$0")"
OUT="${1:-/tmp/tinkerterm-icons}"; mkdir -p "$OUT"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for v in tinker prompt sky; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files --user-data-dir="$(mktemp -d)" \
    --window-size=1024,1024 --force-device-scale-factor=1 --virtual-time-budget=4000 \
    --screenshot="$OUT/icon-$v.png" "file://$PWD/icon.html?v=$v" >/dev/null 2>&1
done
