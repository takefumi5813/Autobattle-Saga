"""攻撃・防御の動きを描かせるための見本（2026-11-26、オーナー「攻撃のモーションがしょぼい。ちゃんと敵に向けて武器を振って。盾も構えて」「防御するなら防御の体勢をとるとかの自然なモーションを、たくさん」）。
いまの横向きの立ち姿（右向きに返す）と攻撃の絵を6倍にして、明るい灰色の上に2段に並べる。
使い方: python -I art/make_ref_motion.py  → art/ref-motion-1.png 〜（make_ref.py の GROUPS の順）
"""
import os, sys
from PIL import Image, ImageOps
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
ART = os.path.dirname(os.path.abspath(__file__))
GROUPS = [
    ["gareth", "borg", "erin", "mira", "rio"],
    ["raz", "aldo", "kei", "sera", "tohma"],
    ["noa", "sigrun", "halvar", "toki", "hozuki"],
    ["zaid", "najma", "koko", "ilse", "dorn"],
    ["b_sword", "b_tank", "b_mage", "b_hunter", "b_priest", "b_thief"],
]
K, GAP, BG = 6, 90, (200, 200, 204)
for gi, names in enumerate(GROUPS, 1):
    rows = [[ImageOps.mirror(Image.open(f"{ART}/sprites/{n}.png").convert("RGBA")) for n in names],
            [Image.open(f"{ART}/sprites/{n}_atk.png").convert("RGBA") for n in names]]
    rows = [[i.resize((i.width * K, i.height * K), Image.NEAREST) for i in r] for r in rows]
    cw = max(i.width for r in rows for i in r) + GAP
    rh = [max(i.height for i in r) + 50 for r in rows]
    out = Image.new("RGB", (cw * len(names) + GAP, sum(rh) + 60), BG)
    y = 30
    for r, h in zip(rows, rh):
        for k, i in enumerate(r):
            out.paste(i, (GAP + k * cw + (cw - GAP - i.width) // 2, y + h - 25 - i.height), i)
        y += h
    out.save(f"{ART}/ref-motion-{gi}.png"); print(gi, out.size)
