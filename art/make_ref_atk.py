"""後ろ向き・前向きの攻撃を描かせるための見本（2026-11-24）。1段目に後ろ姿、2段目に前向き、3段目に横向きの攻撃（武器と動きの手本）を8倍にして並べる。
使い方: python -I art/make_ref_atk.py  → art/ref-atk-1.png 〜
"""
import os
from PIL import Image
from make_ref import GROUPS

ART = os.path.dirname(os.path.abspath(__file__))
K, GAP, BG = 6, 90, (200, 200, 204)
for gi, names in enumerate(GROUPS, 1):
    rows = [[f"{n}_back" for n in names], [f"{n}_front" for n in names], [f"{n}_atk" for n in names]]
    ims = [[Image.open(f"{ART}/sprites/{f}.png").convert("RGBA") for f in r] for r in rows]
    ims = [[i.resize((i.width * K, i.height * K), Image.NEAREST) for i in r] for r in ims]
    cw = max(i.width for r in ims for i in r) + GAP
    rh = [max(i.height for i in r) + 50 for r in ims]
    out = Image.new("RGB", (cw * len(names) + GAP, sum(rh) + 60), BG)
    y = 30
    for r, h in zip(ims, rh):
        for k, i in enumerate(r):
            out.paste(i, (GAP + k * cw + (cw - GAP - i.width) // 2, y + h - 25 - i.height), i)
        y += h
    out.save(f"{ART}/ref-atk-{gi}.png"); print(gi, out.size)
