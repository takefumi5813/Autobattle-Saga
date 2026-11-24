"""敵の前向き・後ろ姿・前向きの攻撃を描かせるための見本（2026-11-24）。1段目に横向きの立ち姿、2段目に横向きの攻撃を並べる。
使い方: python -I art/make_ref_en.py  → art/ref-en-1.png（ゴブリン・呪術師・狼・野盗）, art/ref-en-2.png（オーガ・はぐれオーガ・野盗の頭）
"""
import os
from PIL import Image

ART = os.path.dirname(os.path.abspath(__file__))
GROUPS = [
    [("goblin", "goblin_atk"), ("shaman", "shaman_atk"), ("wolf", "wolf_atk"), ("bandit", "bandit_atk")],
    [("ogre", "ogre_smash"), ("strayogre", "strayogre_atk"), ("boss", "boss_atk")],
]
K, GAP, BG = 6, 110, (200, 200, 204)
for gi, grp in enumerate(GROUPS, 1):
    rows = [[Image.open(f"{ART}/sprites/en_{a}.png").convert("RGBA") for a, _ in grp],
            [Image.open(f"{ART}/sprites/en_{b}.png").convert("RGBA") for _, b in grp]]
    rows = [[i.resize((i.width * K, i.height * K), Image.NEAREST) for i in r] for r in rows]
    cw = max(i.width for r in rows for i in r) + GAP
    rh = [max(i.height for i in r) + 60 for r in rows]
    out = Image.new("RGB", (cw * len(grp) + GAP, sum(rh) + 60), BG)
    y = 30
    for r, h in zip(rows, rh):
        for k, i in enumerate(r):
            out.paste(i, (GAP + k * cw + (cw - GAP - i.width) // 2, y + h - 30 - i.height), i)
        y += h
    out.save(f"{ART}/ref-en-{gi}.png"); print(gi, out.size)
