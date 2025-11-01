#!/bin/bash

# Video Compression Script for Hero Videos
# This script compresses the hero videos to reduce file size by 50-70%
# Requires: ffmpeg (install with: brew install ffmpeg)

echo "🎬 Video Compression Script"
echo "============================"
echo ""

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ Error: ffmpeg is not installed"
    echo "📦 Install with: brew install ffmpeg"
    exit 1
fi

cd public

echo "📁 Current directory: $(pwd)"
echo ""

# Array of videos to compress
videos=("hero--cli.mp4" "hero--hmr.mp4" "hero--plugins.mp4" "hero--deploy.mp4")

for video in "${videos[@]}"; do
    if [ ! -f "$video" ]; then
        echo "⚠️  Skipping $video (not found)"
        continue
    fi
    
    echo "🎥 Processing: $video"
    
    # Get original size
    original_size=$(du -h "$video" | cut -f1)
    echo "   Original size: $original_size"
    
    # Backup original
    if [ ! -f "${video}.backup" ]; then
        cp "$video" "${video}.backup"
        echo "   ✅ Backup created: ${video}.backup"
    fi
    
    # Compress with H.264 (good quality, smaller size)
    # CRF 28 = good balance between quality and size
    # preset slow = better compression
    ffmpeg -i "${video}.backup" \
           -vcodec libx264 \
           -crf 28 \
           -preset slow \
           -movflags +faststart \
           -y \
           "$video" \
           2>&1 | grep -v "^frame=" | grep -v "^Stream" | grep -v "^Input" | grep -v "^Output"
    
    # Get new size
    new_size=$(du -h "$video" | cut -f1)
    echo "   ✅ New size: $new_size"
    echo ""
done

echo "✨ Compression complete!"
echo ""
echo "📊 Results:"
du -h hero--*.mp4 | grep -v ".backup"
echo ""
echo "💡 To restore originals: mv *.mp4.backup to remove .backup extension"
echo "💡 If happy with results, you can delete .backup files"

