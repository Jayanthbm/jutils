#!/bin/bash
# Usage: ./copy_video_exif.sh /path/to/reference.mov /path/to/folder

ref_video="$1"
target_folder="$2"

if [[ ! -f "$ref_video" ]]; then
  echo "❌ Reference video not found: $ref_video"
  exit 1
fi

if [[ ! -d "$target_folder" ]]; then
  echo "❌ Target folder not found: $target_folder"
  exit 1
fi

echo "🎥 Using reference video: $ref_video"
echo "📂 Updating videos in: $target_folder"

for file in "$target_folder"/IMG_*.mp4; do
  filename=$(basename "$file" .mp4)
  # Expected format: IMG_DD_MM_YYYY_HH_MM
  IFS="_" read -r prefix dd mm yyyy HH MM <<< "$filename"

  if [[ -z "$dd" || -z "$mm" || -z "$yyyy" ]]; then
    echo "⚠️ Skipping $file (bad filename format)"
    continue
  fi

  # Build IST datetime
  datetime_local="${yyyy}:${mm}:${dd} ${HH}:${MM}:00"

  # Convert IST → UTC (for MP4 tags + GPS)
  datetime_utc=$(date -u -j -f "%Y:%m:%d %H:%M:%S" \
    "$datetime_local" +"%Y:%m:%d %H:%M:%S" -v-5H -v-30M)

  gps_date=$(echo "$datetime_utc" | cut -d' ' -f1)
  gps_time=$(echo "$datetime_utc" | cut -d' ' -f2)

  echo "➡️  Updating $file (IST=$datetime_local, UTC=$datetime_utc)"

  # 1. Copy camera/GPS metadata from reference MOV
  exiftool -overwrite_original -TagsFromFile "$ref_video" \
    -Make -Model -GPS* -Software -Orientation \
    "$file"

  # 2. Apply UTC times (required by iOS)
  exiftool -overwrite_original \
    -CreateDate="$datetime_utc" \
    -ModifyDate="$datetime_utc" \
    -TrackCreateDate="$datetime_utc" \
    -TrackModifyDate="$datetime_utc" \
    -MediaCreateDate="$datetime_utc" \
    -MediaModifyDate="$datetime_utc" \
    -GPSDateStamp="$gps_date" \
    -GPSTimeStamp="$gps_time" \
    "$file"

done
