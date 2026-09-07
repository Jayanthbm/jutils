#!/usr/bin/env python3

import subprocess
import pathlib
import sys
import os
from datetime import datetime
# ============================================================
# CONFIGURATION
# ============================================================

SOURCE_FOLDER = "/Users/jayanthbharadwajm/Downloads/Swarna Weds Jayanth/Video/Varapooja"

# SOURCE_FOLDER = "/Users/jayanthbharadwajm/Downloads/test"

DELETE_ORIGINAL = True

VIDEO_PRESET = "medium"
VIDEO_CRF = "22"

AUDIO_BITRATE = "96k"

# ============================================================

# ============================================================
# Wedding Metadata
# ============================================================

TITLE = "Swarna & Jayanth Wedding"
EVENT = "Wedding"
VENUE = "Chandra Sagara Kalyana Mahal"
CITY = "Bengaluru"
STATE = "Karnataka"
COUNTRY = "India"

LAT = "12.942059217001367"
LON = "77.58512209743388"
             # ============================================================


def run(cmd):
    result = subprocess.run(cmd)
    return result.returncode == 0


def exif_datetime(src):
    try:
        out = subprocess.check_output(
            [
                "exiftool",
                "-s3",
                "-DateTimeOriginal",
                str(src)
            ],
            text=True
        ).strip()

        if not out:
            return None

        # Remove any timezone ExifTool appended
        out = out.split("+")[0].split("-")[0]

        # Convert:
        # 2026:07:01 11:15:25
        # ->
        # 2026-07-01T11:15:25+05:30
        date, time = out.split(" ")
        date = date.replace(":", "-", 2)

        return f"{date}T{time}+05:30"

    except Exception as e:
        print(e)
        return None

def file_datetime(src):
    """
    Fallback to file modification time (local IST)
    """
    ts = os.path.getmtime(src)
    dt = datetime.fromtimestamp(ts)

    return dt.strftime("%Y-%m-%dT%H:%M:%S+05:30")

def video_info(src):
    """
    Returns:
        codec_name (str)
        field_order (str)
    """

    try:
        codec = subprocess.check_output(
            [
                "ffprobe",
                "-v", "error",
                "-select_streams", "v:0",
                "-show_entries", "stream=codec_name",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(src)
            ],
            text=True
        ).strip()

        field = subprocess.check_output(
            [
                "ffprobe",
                "-v", "error",
                "-select_streams", "v:0",
                "-show_entries", "stream=field_order",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(src)
            ],
            text=True
        ).strip()

        return codec.lower(), field.lower()

    except Exception:
        return None, None


def convert(src: pathlib.Path):

    dst = src.with_suffix(".mp4")

    if dst.exists():
        print(f"SKIP : {dst.name}")
        return

    print(f"Converting : {src.name}")

    codec, field = video_info(src)
    print(f"Video Codec : {codec}")
    print(f"Field Order : {field}")


    creation = exif_datetime(src)

    if creation:
        print(f"creation_time (EXIF): {creation}")
    else:
        creation = file_datetime(src)
        print(f"creation_time (FILE): {creation}")
    
    

    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-stats",
        "-loglevel",
        "info",
        "-i",
        str(src),
        "-map_metadata",
        "0",
    ]

    if creation:
        cmd += [
            "-metadata",
            f"creation_time={creation}"
        ]

        cmd += [
            "-movflags",
            "+faststart",
        ]

    # ---------------------------------------------------------
    # Video pipeline
    # ---------------------------------------------------------

    if field in ("tt", "bb", "tb", "bt"):

        print("Detected interlaced AVCHD -> applying bwdif deinterlacing")

        cmd += [
            "-vf",
            "bwdif=mode=send_field",
        ]

    else:

        print("Detected progressive video -> no deinterlacing")

    cmd += [
        "-c:v",
        "libx264",

        "-preset",
        VIDEO_PRESET,

        "-crf",
        VIDEO_CRF,

        "-pix_fmt",
        "yuv420p",

        "-c:a",
        "aac",

        "-b:a",
        AUDIO_BITRATE,

        str(dst)
    ]
    ok = run(cmd)

    if not ok:
        print("FAILED")
        if dst.exists():
            dst.unlink()
        return

    # --------------------------------------------------------

    cmd = [
        "exiftool",
        "-overwrite_original",

        # XMP metadata
        f"-XMP:Title={TITLE}",
        f"-XMP:Event={EVENT}",
        f"-XMP:Location={VENUE}",
        f"-XMP:City={CITY}",
        f"-XMP:State={STATE}",
        f"-XMP:Country={COUNTRY}",

        # Standard GPS metadata
        f"-GPSLatitude={LAT}",
        "-GPSLatitudeRef=N",
        f"-GPSLongitude={LON}",
        "-GPSLongitudeRef=E",

        # Samsung Gallery / QuickTime UserData GPS
        f"-UserData:GPSCoordinates={LAT} {LON}",

        # Keywords
        "-XMP:Subject=Wedding",
        "-XMP:Subject+=Swarna",
        "-XMP:Subject+=Jayanth",

        str(dst)
    ]

    run(cmd)

    # Preserve modification timestamp
    run(["touch", "-r", str(src), str(dst)])

    if DELETE_ORIGINAL:
        print(f"Deleting : {src.name}")
        src.unlink()

    print("✓ DONE")


def main():

    folder = pathlib.Path(SOURCE_FOLDER)

    if not folder.exists():
        print(f"Folder not found: {folder}")
        sys.exit(1)

    files = sorted(
        list(folder.rglob("*.MTS")) +
        list(folder.rglob("*.mts"))
    )

    print()
    print(f"Found {len(files)} videos")
    print()

    total = len(files)

    for index, file in enumerate(files, start=1):

        print("=" * 60)
        print(f"[{index}/{total}]")
        convert(file)

    print()
    print("Completed.")


if __name__ == "__main__":
    main()