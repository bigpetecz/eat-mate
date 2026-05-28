#!/bin/sh

set -e

if ! command -v magick >/dev/null 2>&1; then
  echo "ImageMagick 7+ is required. Install with: brew install imagemagick"
  exit 1
fi

TMPDIR="./tmp-favicon"
PNG_OUT="$TMPDIR/logo.png"
ICON_PNG_OUT="./apps/frontend/public/icon.png"
APPLE_TOUCH_ICON_OUT="./apps/frontend/public/apple-touch-icon.png"
FAVICON_OUT="./apps/frontend/public/favicon.ico"

mkdir -p "$TMPDIR"

# 1. Draw a square brand mark directly so the output does not depend on SVG rendering.
magick -size 256x256 xc:none \
  -fill '#d97a38' -draw 'circle 128,128 128,24' \
  -fill '#e28a4f' -draw 'circle 128,128 110,24' \
  -fill none -stroke white -strokewidth 12 \
  -draw 'line 68,126 188,126' \
  -draw 'path "M88,126 V162 A18,18 0 0 0 106,180 H150 A18,18 0 0 0 168,162 V126"' \
  -draw 'line 86,96 170,74' \
  -draw 'path "M104,88 L102,80 A18,18 0 0 1 115,60 L128,57 A18,18 0 0 1 150,70 L153,82"' \
  "$PNG_OUT"

# 2. Export standard browser PNG assets.
magick "$PNG_OUT" -resize 512x512 "$ICON_PNG_OUT"
magick "$PNG_OUT" -resize 180x180 "$APPLE_TOUCH_ICON_OUT"

# 3. Create favicon.ico with multiple sizes.
magick "$PNG_OUT" -define icon:auto-resize=256,128,64,48,32,16 "$FAVICON_OUT"

rm -rf "$TMPDIR"

echo "Favicon generated at $FAVICON_OUT"