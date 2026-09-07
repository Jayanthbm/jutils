#!/bin/bash

SOURCE="/Volumes/Jayanth/Swarna Weds Jayanth_original/Photos"
DEST="/Users/jayanthbharadwajm/Downloads/missing"
LIST="/tmp/missing_photos.txt"

mkdir -p "$DEST"

count=0
missing=0

while IFS= read -r filename
do
    file=$(find "$SOURCE" -type f -iname "$filename" -print -quit)

    if [ -n "$file" ]; then
        echo "Copying: $filename"
        cp -p "$file" "$DEST/"
        ((count++))
    else
        echo "NOT FOUND: $filename"
        ((missing++))
    fi

done < "$LIST"

echo
echo "==========================="
echo "Copied : $count"
echo "Missing: $missing"
echo "Destination: $DEST"
echo "==========================="