#!/bin/bash
# Usage: ./copy_exif.sh /path/to/reference.heic /path/to/folder

ref_image="$1"
target_folder="$2"

if [[ ! -f "$ref_image" ]]; then
  echo "❌ Reference image not found: $ref_image"
  exit 1
fi

if [[ ! -d "$target_folder" ]]; then
  echo "❌ Target folder not found: $target_folder"
  exit 1
fi

echo "📸 Using reference image: $ref_image"
echo "📂 Updating images in: $target_folder"

for file in "$target_folder"/IMG_*.jpeg; do
  base=$(basename "$file" .jpeg)
  IFS="_" read -r prefix dd mm yyyy HH MM <<< "$base"

  # Build IST datetime from filename
  datetime_local="${yyyy}:${mm}:${dd} ${HH}:${MM}:00"

  # Convert IST → UTC for GPS timestamp
  datetime_utc=$(date -u -j -f "%Y:%m:%d %H:%M:%S" \
    "$datetime_local" +"%Y:%m:%d %H:%M:%S" -v-5H -v-30M)

  gps_date=$(echo "$datetime_utc" | cut -d' ' -f1)
  gps_time=$(echo "$datetime_utc" | cut -d' ' -f2)

  echo "➡️  Updating $file (local=$datetime_local, utc=$datetime_utc)"

  # Copy EXIF (camera, GPS, etc) from reference
  exiftool -overwrite_original -TagsFromFile "$ref_image" \
    -Make -Model -Lens* -GPS* -Software -Orientation -ResolutionUnit \
    -XResolution -YResolution -ColorSpace -Exposure* -FNumber -ISO \
    -ShutterSpeedValue -ApertureValue -WhiteBalance -Flash \
    -FocalLength -FocalLengthIn35mmFormat \
    "$file"

  # Now update date/time fields based on filename
  exiftool -overwrite_original \
    -DateTimeOriginal="$datetime_local" \
    -CreateDate="$datetime_local" \
    -ModifyDate="$datetime_local" \
    -OffsetTimeOriginal="+05:30" \
    -GPSDateStamp="$gps_date" \
    -GPSTimeStamp="$gps_time" \
    "$file"

done
