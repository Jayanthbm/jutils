#!/usr/bin/env python3

from pathlib import Path

# ==========================================================
# CONFIGURATION
# ==========================================================

ORIGINAL = Path(
    "/Volumes/Jayanth/Swarna Weds Jayanth_original/Video/Varapooja"
)

CONVERTED = Path(
    "/Users/jayanthbharadwajm/Downloads/Swarna Weds Jayanth/Video/Varapooja"
)

# Only show files increased by more than this many MB
THRESHOLD_MB = 20

# ==========================================================

total_original = 0
total_converted = 0

matched = 0
missing = 0

results = []

print(f"{'File':35} {'Original':>10} {'MP4':>10} {'Diff':>10} {'%':>8}")
print("-" * 85)

for mts in sorted(ORIGINAL.glob("*")):

    if mts.suffix.lower() != ".mts":
        continue

    mp4 = CONVERTED / (mts.stem + ".mp4")

    if not mp4.exists():
        print(f"Missing : {mp4.name}")
        missing += 1
        continue

    orig = mts.stat().st_size
    conv = mp4.stat().st_size

    total_original += orig
    total_converted += conv

    matched += 1

    diff = conv - orig
    pct = diff / orig * 100

    results.append({
        "file": mts.stem,
        "orig": orig,
        "conv": conv,
        "diff": diff,
        "pct": pct
    })

    print(
        f"{mts.stem:35} "
        f"{orig/1024/1024:9.1f}M "
        f"{conv/1024/1024:9.1f}M "
        f"{diff/1024/1024:+9.1f}M "
        f"{pct:+7.1f}%"
    )

print("-" * 85)

print(f"Matched files : {matched}")
print(f"Missing MP4   : {missing}")
print()

print(f"Original Total : {total_original/1024/1024/1024:.2f} GB")
print(f"Converted Total: {total_converted/1024/1024/1024:.2f} GB")

diff = total_converted - total_original
pct = diff / total_original * 100 if total_original else 0

print(f"Difference     : {diff/1024/1024/1024:+.2f} GB ({pct:+.2f}%)")

# ==========================================================
# Largest Reductions
# ==========================================================

print("\n")
print("=" * 85)
print("Largest Reductions")
print("=" * 85)

for r in sorted(results, key=lambda x: x["diff"])[:20]:

    print(
        f'{r["file"]:8} '
        f'{r["orig"]/1024/1024:8.1f}M -> '
        f'{r["conv"]/1024/1024:8.1f}M   '
        f'{r["diff"]/1024/1024:+8.1f}M '
        f'({r["pct"]:+6.1f}%)'
    )

# ==========================================================
# Largest Increases
# ==========================================================

print("\n")
print("=" * 85)
print("Largest Increases")
print("=" * 85)

for r in sorted(results, key=lambda x: x["diff"], reverse=True)[:20]:

    print(
        f'{r["file"]:8} '
        f'{r["orig"]/1024/1024:8.1f}M -> '
        f'{r["conv"]/1024/1024:8.1f}M   '
        f'+{r["diff"]/1024/1024:7.1f}M '
        f'({r["pct"]:+6.1f}%)'
    )

# ==========================================================
# Files That Increased
# ==========================================================

print("\n")
print("=" * 85)
print("Files That Increased")
print("=" * 85)

increase_count = 0
increase_size = 0

for r in sorted(results, key=lambda x: x["diff"], reverse=True):

    if r["diff"] <= 0:
        continue

    increase_count += 1
    increase_size += r["diff"]

    print(
        f'{r["file"]:8} '
        f'{r["orig"]/1024/1024:8.1f}M -> '
        f'{r["conv"]/1024/1024:8.1f}M   '
        f'+{r["diff"]/1024/1024:7.1f}M '
        f'({r["pct"]:+6.1f}%)'
    )

print()
print(f"Total Increased Files : {increase_count}")
print(f"Extra Space           : {increase_size/1024/1024/1024:.2f} GB")

# ==========================================================
# Increased More Than Threshold
# ==========================================================

print("\n")
print("=" * 85)
print(f"Files Increased More Than {THRESHOLD_MB} MB")
print("=" * 85)

threshold_bytes = THRESHOLD_MB * 1024 * 1024

count = 0
space = 0

for r in sorted(results, key=lambda x: x["diff"], reverse=True):

    if r["diff"] < threshold_bytes:
        continue

    count += 1
    space += r["diff"]

    print(
        f'{r["file"]:8} '
        f'{r["orig"]/1024/1024:8.1f}M -> '
        f'{r["conv"]/1024/1024:8.1f}M   '
        f'+{r["diff"]/1024/1024:7.1f}M '
        f'({r["pct"]:+6.1f}%)'
    )

print()
print(f"Files : {count}")
print(f"Extra : {space/1024/1024/1024:.2f} GB")