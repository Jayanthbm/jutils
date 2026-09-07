#!/usr/bin/env python3

from pathlib import Path
import shutil

# ============================================================
# CONFIGURATION
# ============================================================

original_folder = Path("/Users/jayanthbharadwajm/Downloads/Swarna Weds Jayanth/Photos/154ND750")
copied_folder = Path("/Users/jayanthbharadwajm/Downloads/share/Me")

recopy = True

# ============================================================

# Get filenames from original folder
original_files = {
    f.name for f in original_folder.iterdir() if f.is_file()
}

# Get filenames from copied folder
copied_files = {
    f.name for f in copied_folder.iterdir() if f.is_file()
}

# Files present in both folders
matched = sorted(original_files & copied_files)

print(f"Original folder files : {len(original_files)}")
print(f"Copied folder files   : {len(copied_files)}")
print(f"Matched files         : {len(matched)}")
print()

for name in matched:
    print(name)

if recopy:
    print("\nRecopying matched files...\n")

    for name in matched:
        src = original_folder / name
        dst = copied_folder / name

        shutil.copy2(src, dst)  # Overwrites if destination exists
        print(f"✓ {name}")

    print(f"\nCompleted. Re-copied {len(matched)} files.")