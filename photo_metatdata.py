#!/usr/bin/env python3

import pathlib
import subprocess
import sys
import os

# ============================================================
# CONFIGURATION
# ============================================================

SOURCE_FOLDER = "/Users/jayanthbharadwajm/Downloads/Swarna Weds Jayanth/Photos/154ND750"

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

def process(photo):

    print(f"Updating : {photo.name}")

    # Preserve original file timestamp
    original_mtime = photo.stat().st_mtime

    cmd = [
        "exiftool",
        "-overwrite_original",

        # --------------------------------------------------------
        # XMP Metadata
        # --------------------------------------------------------

        f"-XMP:Title={TITLE}",
        f"-XMP:Event={EVENT}",
        f"-XMP:Location={VENUE}",
        f"-XMP:City={CITY}",
        f"-XMP:State={STATE}",
        f"-XMP:Country={COUNTRY}",

        # --------------------------------------------------------
        # EXIF GPS
        # --------------------------------------------------------

        f"-GPSLatitude={LAT}",
        "-GPSLatitudeRef=N",

        f"-GPSLongitude={LON}",
        "-GPSLongitudeRef=E",

        # --------------------------------------------------------
        # XMP Keywords
        # --------------------------------------------------------

        "-XMP:Subject=Wedding",
        "-XMP:Subject+=Swarna",
        "-XMP:Subject+=Jayanth",

        # --------------------------------------------------------
        # IPTC Keywords
        # --------------------------------------------------------

        "-IPTC:Keywords=Wedding",
        "-IPTC:Keywords+=Swarna",
        "-IPTC:Keywords+=Jayanth",

        str(photo)
    ]

    if not run(cmd):
        print("FAILED")
        return

    # Restore original modification timestamp
    os.utime(photo, (original_mtime, original_mtime))

    print("✓ DONE")

def main():

    
    folder = pathlib.Path(SOURCE_FOLDER)

    if not folder.exists():
        print("Folder not found")
        sys.exit(1)

    files = sorted(
        list(folder.rglob("*.JPG")) +
        list(folder.rglob("*.jpg")) +
        list(folder.rglob("*.JPEG")) +
        list(folder.rglob("*.jpeg"))
    )

    print()
    print(f"Found {len(files)} photos")
    print()

    for index, photo in enumerate(files, start=1):

        print("=" * 60)
        print(f"[{index}/{len(files)}]")
        process(photo)

    print()
    print("Completed.")


if __name__ == "__main__":
    main()