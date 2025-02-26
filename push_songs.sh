#!/bin/bash

# Define the source and destination directories
SOURCE_DIR="/Users/jayanthbharadwajm/development/jiosaavn-dl/Downloads/songs_to_push"
DEST_DIR="/sdcard/Music"

# Check if adb is installed and the device is connected
if ! command -v adb &> /dev/null; then
    echo "adb command not found. Please install adb and try again."
    exit 1
fi

# Verify if the device is connected
adb devices | grep -w "device" &> /dev/null
if [ $? -ne 0 ]; then
    echo "No Android device detected. Please connect your device and enable USB debugging."
    exit 1
fi

# Loop through all files in the source directory and push them to the destination directory on the Android device
for file in "$SOURCE_DIR"/*; do
    if [ -f "$file" ]; then
        echo "Pushing $file to Android device..."
        adb push "$file" "$DEST_DIR/"
        if [ $? -eq 0 ]; then
            echo "$file pushed successfully!"
        else
            echo "Failed to push $file."
        fi
    fi
done

echo "All files pushed to $DEST_DIR on the Android device."
