#!/bin/bash

URL="$1"

if [ -z "$URL" ]; then
  echo "❌ Error: No URL provided."
  echo "Usage: $0 <index-url>"
  exit 1
fi

echo "📥 Fetching file list from: $URL"
HTML=$(curl -s "$URL")

# Extract all hrefs
HREFS=$(echo "$HTML" | sed -n 's/.*href="\([^"]*\)".*/\1/p')

# Filter video files
FILES=$(echo "$HREFS" | grep -E '\.(mp4|mkv|avi|mov)$')

if [ -z "$FILES" ]; then
  echo "❌ No downloadable files found."
  exit 1
fi

echo "📄 Found files:"
echo "$FILES"
echo ""

# Create temporary download list
TMP_LIST="download_list.txt"
rm -f "$TMP_LIST"

for FILE in $FILES; do
  echo "${URL}${FILE}" >> "$TMP_LIST"
done

echo "🚀 Starting parallel multi-threaded downloads..."
echo "   • 16 threads per file"
echo "   • 5 files downloading concurrently"
echo ""

# Run aria2c with high-performance settings
aria2c \
  --input-file="$TMP_LIST" \
  --max-concurrent-downloads=5 \
  --split=16 \
  --min-split-size=1M \
  --continue=true \
  --summary-interval=1 \
  --console-log-level=warn \
  --file-allocation=falloc

echo ""
echo "🎉 Done! Files downloaded to: $(pwd)"
