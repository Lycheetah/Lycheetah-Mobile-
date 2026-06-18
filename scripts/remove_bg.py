#!/usr/bin/env python3
"""
Batch background removal for companion art.
Drop Grok-generated JPGs into assets/companions/raw/
Run this script → transparent PNGs land in assets/companions/

Usage:
  python3 scripts/remove_bg.py

Expects:
  assets/companions/raw/*.jpg  (or .png)

Outputs:
  assets/companions/[filename].png  (transparent background)
"""

import os
from pathlib import Path
from rembg import remove
from PIL import Image
import io

RAW_DIR = Path(__file__).parent.parent / "assets" / "companions" / "raw"
OUT_DIR = Path(__file__).parent.parent / "assets" / "companions"

def process():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    inputs = list(RAW_DIR.glob("*.jpg")) + list(RAW_DIR.glob("*.jpeg")) + list(RAW_DIR.glob("*.png"))

    if not inputs:
        print(f"No images found in {RAW_DIR}")
        print("Drop your Grok-generated JPGs into assets/companions/raw/ then re-run.")
        return

    print(f"Found {len(inputs)} images. Processing...")

    for path in sorted(inputs):
        out_path = OUT_DIR / (path.stem + ".png")
        print(f"  {path.name} → {out_path.name}", end="", flush=True)

        with open(path, "rb") as f:
            data = f.read()

        result = remove(data)
        img = Image.open(io.BytesIO(result)).convert("RGBA")
        img.save(out_path, "PNG")
        print(" ✓")

    print(f"\nDone. {len(inputs)} transparent PNGs in assets/companions/")
    print("File naming must match: [companion_id]_stage[1-3].png")
    print("e.g. solara_stage1.png, noctis_stage2.png, lyca_stage3.png")

if __name__ == "__main__":
    process()
