#!/bin/bash
set -e

# === CONFIG ===
SOURCE_DIR=~/Music/Music/Media.localized/Music/
STAGING_DIR=/Users/jayanthbharadwajm/Downloads/MusicTemp
PHONE_DIR=/sdcard/Music/
LOG_FILE=/Users/jayanthbharadwajm/Downloads/music_sync.log

# === START ===
echo "🎵 Starting Apple Music → Android sync..."
echo "Log file: $LOG_FILE"
echo "=== Sync Run: $(date) ===" >> "$LOG_FILE"

# 1. Sync Mac → Temp staging folder
echo "📂 Syncing local Music to staging folder..."
rsync -av --delete --progress "$SOURCE_DIR" "$STAGING_DIR/" | tee -a "$LOG_FILE"

# 2. Push Temp → Phone
echo "📱 Syncing staging folder to Android..."
adb push --sync "$STAGING_DIR" "$PHONE_DIR" | tee -a "$LOG_FILE"

echo "✅ Sync complete! See details in $LOG_FILE"
