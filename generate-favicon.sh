#!/bin/sh

set -e

if ! command -v inkscape >/dev/null 2>&1; then
  echo "Inkscape is required. Install with: brew install --cask inkscape"
  exit 1
fi
if ! command -v magick >/dev/null 2>&1; then
  echo "ImageMagick 7+ is required. Install with: brew install imagemagick"
  exit 1
fi

TMPDIR="./tmp-favicon"
SVG_IN="logo.svg"
PNG_ICON="$TMPDIR/logo-icon.png"
PNG_BG="$TMPDIR/logo-bg.png"
PNG_OUT="$TMPDIR/logo.png"
FAVICON_OUT="./apps/frontend/public/favicon.ico"

mkdir -p "$TMPDIR"

# 1. Render SVG to 192x192 PNG (icon only, transparent background)
inkscape "$SVG_IN" --export-type=png --export-filename="$PNG_ICON" -w 192 -h 192

# 2. Create a 256x256 white circle background
magick -size 256x256 xc:none -fill white -draw "circle 128,128 128,0" "$PNG_BG"

# 3. Composite the icon onto the white circle, centered
magick composite -gravity center "$PNG_ICON" "$PNG_BG" "$PNG_OUT"

# 4. Create favicon.ico with multiple sizes
magick "$PNG_OUT" -define icon:auto-resize=256,128,64,48,32,16 "$FAVICON_OUT"

rm -rf "$TMPDIR"

echo "Favicon generated at $FAVICON_OUT"