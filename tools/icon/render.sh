#!/bin/sh
# Render the app icon: art.mjs -> art.svg -> 1024 PNG (headless Chrome) -> macOS tile + Dock image.
# Then: pnpm tauri icon "$OUT/dock-1024.png" && cp "$OUT/dock-512.png" src-tauri/icons/dock/tinkerterm.png
set -e
cd "$(dirname "$0")"
OUT="${1:-/tmp/tinkerterm-icons}"; mkdir -p "$OUT"
node art.mjs > "$OUT/art.svg"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir="$(mktemp -d)" --window-size=1024,1024 --force-device-scale-factor=1 --virtual-time-budget=4000 \
  --screenshot="$OUT/art.png" "file://$OUT/art.svg" >/dev/null 2>&1

# shrink to the 824px macOS tile, round it, soft shadow -> icon source and Dock image
magick -size 1024x1024 xc:none -fill white -draw "roundrectangle 100,100 923,923 185,185" "$OUT/mask.png"
magick "$OUT/art.png" -resize 824x824 -background none -gravity center -extent 1024x1024 -alpha set "$OUT/mask.png" \
  -compose CopyOpacity -composite +compose "$OUT/tile.png"
magick "$OUT/tile.png" \( +clone -background black -shadow 45x14+0+14 \) +swap -background none -layers merge +repage \
  -gravity center -extent 1024x1024 "$OUT/dock-1024.png"
magick "$OUT/dock-1024.png" -resize 512x512 "$OUT/dock-512.png"
