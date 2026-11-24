"""後ろ姿・前向きを描かせるための見本（2026-11-24）。いまの立ち姿のドット絵を8倍にして、明るい灰色の上に左から並べる。
使い方: python -I art/make_ref.py
出力は art/ref-back-1.png 〜（GROUPS の順）。ChatGPT に添えて「同じ並びで、上の段に後ろ姿、下の段に前向き」と頼む。
"""
import os
from PIL import Image

ART = os.path.dirname(os.path.abspath(__file__))
GROUPS = [
    ["gareth", "borg", "erin", "mira", "rio"],
    ["raz", "aldo", "kei", "sera", "tohma"],
    ["noa", "sigrun", "halvar", "toki", "hozuki"],
    ["zaid", "najma", "koko", "ilse", "dorn"],
    ["b_sword", "b_tank", "b_mage", "b_hunter", "b_priest", "b_thief"],
]
K, GAP, BG = 8, 120, (200, 200, 204)
for gi, names in enumerate(GROUPS, 1):
    ims = [Image.open(f"{ART}/sprites/{n}.png").convert("RGBA") for n in names]
    ims = [i.resize((i.width * K, i.height * K), Image.NEAREST) for i in ims]
    W = sum(i.width for i in ims) + GAP * (len(ims) + 1); H = max(i.height for i in ims) + 160
    out = Image.new("RGB", (W, H), BG); x = GAP
    for i in ims:
        out.paste(i, (x, H - 80 - i.height), i); x += i.width + GAP
    out.save(f"{ART}/ref-back-{gi}.png"); print(gi, out.size)
