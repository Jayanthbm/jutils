#!/usr/bin/env python3

import pathlib
import subprocess
import sys

# ============================================================
# CONFIGURATION
# ============================================================

SOURCE_FOLDER = "/Users/jayanthbharadwajm/Downloads/Swarna Weds Jayanth/Photos/153ND750"


# ============================================================


def run(cmd):
    result = subprocess.run(cmd)
    return result.returncode == 0


def get_datetime(photo):
    try:
        out = subprocess.check_output(
            [
                "exiftool",
                "-s3",
                "-DateTimeOriginal",
                str(photo),
            ],
            text=True,
        ).strip()

        return out

    except Exception:
        return None


def process(photo):

    print(f"\nUpdating : {photo.name}")

    dt = get_datetime(photo)

    if not dt:
        print("No DateTimeOriginal")
        return

    print("Original :", dt)

    # --------------------------------------------------------
    # Step 1 - Reduce 28 minutes
    # --------------------------------------------------------

    # cmd = [
    #     "exiftool",
    #     "-overwrite_original",
    #     "-AllDates-=0:0:0 0:01:0",
    #     str(photo),
    # ]

    cmd = [
        "exiftool",
        "-overwrite_original",
        "-AllDates+=0:0:0 0:00:10",
        str(photo),
    ]

    if not run(cmd):
        print("FAILED STEP 1")
        return

    # --------------------------------------------------------
    # Step 2 - Update filesystem timestamp
    # --------------------------------------------------------

    cmd = [
        "exiftool",
        "-overwrite_original",
        "-FileModifyDate<DateTimeOriginal",
        str(photo),
    ]

    if not run(cmd):
        print("FAILED STEP 2")
        return

    print("✓ DONE")


def main():

    folder = pathlib.Path(SOURCE_FOLDER)

    if not folder.exists():
        print("Folder not found")
        sys.exit(1)

    files = sorted(folder.glob("*.JPG"))

    print(f"\nFound {len(files)} photos\n")

    for index, photo in enumerate(files, start=1):
        print("=" * 60)
        print(f"[{index}/{len(files)}]")
        process(photo)

    print("\nCompleted.")


if __name__ == "__main__":
    main()