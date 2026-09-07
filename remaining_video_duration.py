#!/usr/bin/env python3

import subprocess
from pathlib import Path
from datetime import datetime, timedelta


# ============================================================
# CONFIGURATION
# ============================================================

FOLDERS = [
    (
        "Muhurtham",
        "/Users/jayanthbharadwajm/Downloads/Swarna Weds Jayanth/Video/Muhurtham",
        0.922,
    ),
]

# ============================================================

# ============================================================


def get_duration(file: Path):
    try:
        out = subprocess.check_output(
            [
                "ffprobe",
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(file),
            ],
            text=True,
        ).strip()

        return float(out)

    except Exception:
        print(f"Failed : {file}")
        return 0.0


def format_time(seconds):

    seconds = int(seconds)

    days = seconds // 86400
    seconds %= 86400

    hours = seconds // 3600
    seconds %= 3600

    minutes = seconds // 60
    seconds %= 60

    if days:
        return f"{days}d {hours:02d}h {minutes:02d}m {seconds:02d}s"

    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


def main():

    print("=" * 100)
    print("Remaining Video Conversion Status")
    print("=" * 100)
    print()

    longest_eta = 0
    longest_name = ""

    for name, folder_path, speed in FOLDERS:

        folder = Path(folder_path)

        if not folder.exists():
            print(f"{name}: Folder not found")
            print()
            continue

        files = sorted(
            list(folder.rglob("*.MTS")) +
            list(folder.rglob("*.mts"))
        )

        total_seconds = 0.0

        for file in files:
            total_seconds += get_duration(file)

        print(f"{name}")
        print("-" * 80)
        print(f"Folder              : {folder}")
        print(f"Remaining Files     : {len(files)}")
        print(f"Video Duration      : {format_time(total_seconds)}")

        if speed > 0:

            eta = total_seconds / speed
            completion = datetime.now() + timedelta(seconds=eta)

            print(f"Encoder Speed       : {speed:.3f}x")
            print(f"Estimated Time      : {format_time(eta)}")
            print(f"Estimated Complete  : {completion.strftime('%A, %d %b %Y %I:%M:%S %p')}")

            if eta > longest_eta:
                longest_eta = eta
                longest_name = name

        print()

    print("=" * 100)
    print("Overall")
    print("=" * 100)

    if longest_eta > 0:
        completion = datetime.now() + timedelta(seconds=longest_eta)

        print(f"Longest Running Folder : {longest_name}")
        print(f"Overall ETA            : {format_time(longest_eta)}")
        print(f"Overall Completion     : {completion.strftime('%A, %d %b %Y %I:%M:%S %p')}")

    print("=" * 100)


if __name__ == "__main__":
    main()