#!/usr/bin/env python3
"""Rebuild the self-hosted pixel fonts in site/assets/fonts/.

The site uses Fusion Pixel Font by TakWolf (SIL OFL 1.1) at 8, 10 and 12 px.
OFL reserves the name "Fusion Pixel", so these subsets are renamed
"Squeek Pixel 8/10/12". Each size is split in two files:
  *-latin.woff2  Latin, punctuation, arrows and shapes (always loaded)
  *-cjk.woff2    GB2312 level 1 Chinese plus every CJK character the game
                 (src/) and the site (site/src/, site/public/) use
The browser fetches a CJK file only when a page shows Chinese text.

Usage (needs Python 3 with fonttools and brotli):
  npm pack @fontsource/fusion-pixel-12px-proportional-sc@5.3.0 (and 10px, 8px)
  python3 site/subset-fonts.py <dir with the three fusion-pixel-*-latin-400-normal.woff2 files>
Run it again after adding Chinese copy that uses rare characters.

Each size also bundles glyphs from other free pixel fonts, so the three
notices differ. Copy each package's LICENSE to site/assets/fonts/LICENSE-<size>px.txt.
"""
import glob
import io
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

SITE = Path(__file__).resolve().parent
REPO = SITE.parent
SOURCE_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else None
LATIN_RANGES = [(0x20, 0x7E), (0xA0, 0x24F), (0x2000, 0x206F), (0x20A0, 0x20BF),
                (0x2100, 0x214F), (0x2190, 0x21FF), (0x2200, 0x22FF), (0x2460, 0x24FF),
                (0x2500, 0x25FF), (0x2600, 0x26FF)]
CJK_RANGES = [(0x2E80, 0x2FFF), (0x3000, 0x303F), (0xFF00, 0xFFEF)]
# Chinese shown on English pages too: the language button and the skip link.
# Keep these in sync with the Latin unicode-range in site/src/styles.css.
ALWAYS = "中文跳至内容"


def gb2312_level1():
    chars = []
    for hi in range(0xB0, 0xD8):
        for lo in range(0xA1, 0xFF):
            try:
                chars.append(bytes([hi, lo]).decode("gb2312"))
            except UnicodeDecodeError:
                pass
    return chars


def used_characters():
    text = ""
    paths = glob.glob(str(SITE / "src" / "**" / "*.js"), recursive=True)
    paths += glob.glob(str(REPO / "src" / "**" / "*.ts"), recursive=True)
    paths += glob.glob(str(SITE / "public" / "**" / "*.html"), recursive=True)
    for path in paths:
        try:
            text += Path(path).read_text(encoding="utf-8")
        except FileNotFoundError:
            pass
    return {c for c in text if ord(c) >= 0x2E80}


def rename(font, family):
    ps = family.replace(" ", "")
    for record in font["name"].names:
        if record.nameID in (1, 16):
            record.string = family
        elif record.nameID == 4:
            record.string = f"{family} Regular"
        elif record.nameID == 3:
            record.string = f"{ps}-Regular;subset"
        elif record.nameID == 6:
            record.string = f"{ps}-Regular"
    # Drop typographic names that still say Fusion Pixel.
    font["name"].names = [r for r in font["name"].names if r.nameID not in (17, 18, 21, 22)]


def write(source, unicodes, family, out):
    font = TTFont(source)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_legacy = True
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=sorted(unicodes))
    subsetter.subset(font)
    rename(font, family)
    font.flavor = "woff2"
    buffer = io.BytesIO()
    font.save(buffer)
    out.write_bytes(buffer.getvalue())
    return len(buffer.getvalue())


def main():
    if SOURCE_DIR is None:
        sys.exit(__doc__)
    cjk = set(gb2312_level1()) | used_characters()
    cjk_codes = {ord(c) for c in cjk} | {cp for a, b in CJK_RANGES for cp in range(a, b + 1)}
    latin_codes = {cp for a, b in LATIN_RANGES for cp in range(a, b + 1)} | {ord(c) for c in ALWAYS}
    for size in (12, 10, 8):
        source = SOURCE_DIR / f"fusion-pixel-{size}px-proportional-sc-latin-400-normal.woff2"
        family = f"Squeek Pixel {size}"
        for part, codes in (("latin", latin_codes), ("cjk", cjk_codes)):
            out = SITE / "assets" / "fonts" / f"squeek-pixel-{size}-{part}.woff2"
            size_bytes = write(source, codes, family, out)
            print(f"{out.relative_to(REPO)}  {size_bytes / 1024:.1f} KB")


if __name__ == "__main__":
    main()
