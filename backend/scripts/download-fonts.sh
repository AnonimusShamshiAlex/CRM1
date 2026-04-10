#!/bin/bash
# Скачивание шрифтов DejaVuSans для корректного отображения кириллицы в PDF
FONTS_DIR="$(dirname "$0")/../fonts"
mkdir -p "$FONTS_DIR"

echo "Скачиваю DejaVuSans.ttf..."
curl -L -o "$FONTS_DIR/DejaVuSans.ttf" \
  "https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans.ttf"

echo "Скачиваю DejaVuSans-Bold.ttf..."
curl -L -o "$FONTS_DIR/DejaVuSans-Bold.ttf" \
  "https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans-Bold.ttf"

echo "Готово! Шрифты сохранены в $FONTS_DIR"
