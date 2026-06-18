#!/usr/bin/env python3
"""
Batch background removal for enemy art.
Drop images into assets/enemies/raw/
Run: python3 scripts/remove_bg_enemies.py
Output: transparent PNGs in assets/enemies/
"""
from pathlib import Path
from rembg import remove
from PIL import Image
import io

RAW_DIR = Path(__file__).parent.parent / "assets" / "enemies" / "raw"
OUT_DIR  = Path(__file__).parent.parent / "assets" / "enemies"

def process():
    inputs = list(RAW_DIR.glob("*.jpg")) + list(RAW_DIR.glob("*.jpeg")) + list(RAW_DIR.glob("*.png"))
    if not inputs:
        print(f"No images in {RAW_DIR}")
        return
    print(f"Processing {len(inputs)} enemy images...")
    for path in sorted(inputs):
        out = OUT_DIR / (path.stem + ".png")
        print(f"  {path.name} → {out.name}", end="", flush=True)
        with open(path, "rb") as f: data = f.read()
        result = remove(data)
        img = Image.open(io.BytesIO(result)).convert("RGBA")
        img.save(out, "PNG")
        print(" ✓")
    print(f"\nDone. {len(inputs)} PNGs in assets/enemies/")
    print("Wire them into ENEMY_IMAGES in companion.tsx when you know which enemy each file maps to.")

if __name__ == "__main__":
    process()
