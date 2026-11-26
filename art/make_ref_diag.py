"""斜めの向きを描かせるための見本と頼み方（2026-11-26、オーナー「斜めを入れて細かい動きを作る」）。
人物ごとに 横向き（右向きに返す）・前向き・後ろ姿 を6倍にして3段に並べた見本（art/ref-diag-<組>.png）と、
組ごとの頼み方（art/diag_prompts.json）を作る。組は 1〜11＝攻撃と防御の動きと同じ組（名のある50人と信者）、12〜17＝一時的な仲間、18〜19＝敵。
使い方: python -I art/make_ref_diag.py
描かせた絵は 2段（上＝斜め前・右下へ向く、下＝斜め後ろ・右上へ向く）。取り込みは take_field.py → split_rows.py（dfront,dback）→ cut_more.py
"""
import json, os, re
from PIL import Image, ImageOps
ART = os.path.dirname(os.path.abspath(__file__))
MG = [["gareth", "borg", "erin", "mira", "rio"], ["raz", "aldo", "kei", "sera", "tohma"], ["noa", "sigrun", "halvar", "toki", "hozuki"],
      ["zaid", "najma", "koko", "ilse", "dorn"], ["b_sword", "b_tank", "b_mage", "b_hunter", "b_priest", "b_thief"],
      ["wendel", "pippa", "osric", "lene", "bram"], ["ragna", "eirik", "solvi", "thora", "ulf"], ["kagari", "gonza", "sayo", "ukon", "ibuki"],
      ["farida", "rashid", "amin", "kahina", "hamza"], ["itzel", "cuauh", "xochi", "tecun", "yaretzi"], ["viktor", "lisette", "casimir", "agathe", "bastian"]]
TEMP = [[f"t_{c}_{r}" for r in ("sword", "tank", "mage", "hunter", "priest")] for c in ("c0", "c1", "c2", "c3", "c4", "c5")]
EN = [["goblin", "shaman", "wolf", "bandit"], ["boss", "ogre", "strayogre"]]
GROUPS = MG + TEMP + EN
K, GAP, BG = 6, 90, (200, 200, 204)


def spr(n, kind):
    pre = "en_" if n in sum(EN, []) else ""
    p = {"side": f"{ART}/sprites/{pre}{n}.png", "front": f"{ART}/sprites/{pre}{n}_front.png", "back": f"{ART}/sprites/{pre}{n}_back.png"}[kind]
    im = Image.open(p).convert("RGBA")
    return ImageOps.mirror(im) if kind == "side" else im   # 立ち姿は左向きなので右向きに返す


P = json.load(open(f"{ART}/motion_prompts.json", encoding="utf-8"))
TL = json.load(open(f"{ART}/temp_looks.json", encoding="utf-8"))
EN_DESC = {"goblin": "a small green goblin with a crude dagger", "shaman": "a goblin shaman in a hooded robe with a bone staff", "wolf": "a grey wolf",
           "bandit": "a human bandit in a dark red hood with a short sword", "boss": "a bandit chief in heavy leather armor with a big axe",
           "ogre": "a huge brown ogre with a club", "strayogre": "a huge purple-grey rogue ogre with a spiked club"}
out = {}
for gi, names in enumerate(GROUPS, 1):
    rows = [[spr(n, k) for n in names] for k in ("side", "front", "back")]
    rows = [[i.resize((i.width * K, i.height * K), Image.NEAREST) for i in r] for r in rows]
    cw = max(i.width for r in rows for i in r) + GAP
    rh = [max(i.height for i in r) + 50 for r in rows]
    im = Image.new("RGB", (cw * len(names) + GAP, sum(rh) + 60), BG)
    y = 30
    for r, h in zip(rows, rh):
        for k, i in enumerate(r):
            im.paste(i, (GAP + k * cw + (cw - GAP - i.width) // 2, y + h - 25 - i.height), i)
        y += h
    im.save(f"{ART}/ref-diag-{gi}.png")
    if gi <= 11:
        a = P[f"g{gi}A"]; desc = a[a.index("The characters, left to right, are:"):a.index("Draw a NEW sprite sheet")].strip()
    elif gi <= 17:
        c = ["c0", "c1", "c2", "c3", "c4", "c5"][gi - 12]
        desc = "The characters, left to right, are: " + "; ".join(f"({i+1}) {d}" for i, d in enumerate(TL[c])) + "."
    else:
        desc = "The creatures, left to right, are: " + "; ".join(f"({i+1}) {EN_DESC[n]}" for i, n in enumerate(names)) + "."
    n = len(names)
    out[str(gi)] = ("Please generate an image. The attached image shows " + str(n) + " characters from my game (16-bit SNES-era JRPG pixel art). "
        "For each character (one column each) the top row is the side view facing right, the middle row is the front view, the bottom row is the back view. " + desc +
        f" Draw a NEW sprite sheet of these exact same {n} characters in the same order left to right (one column per character), keeping each one's exact outfit, colors, hair, weapon and proportions, in exactly the same pixel art style and the same height. "
        "Draw 2 rows: Row 1 = THREE-QUARTER FRONT VIEW: standing, body turned 45 degrees so they face diagonally toward the viewer and to the RIGHT (we see their face and chest, and their right side); "
        "Row 2 = THREE-QUARTER BACK VIEW: standing, body turned 45 degrees so they face diagonally away from the viewer and to the RIGHT (we see their back and their right side, face hidden). "
        "Neutral standing pose with the weapon held as in the side view. Every figure separate with wide empty spacing, all figures about the same height, on a perfectly flat solid light grey #C8C8CC background, "
        "no ground, no shadows, no text, no labels, no grid. Crisp hard pixel edges. Landscape 1536x1024.")
    print(gi, names, im.size)
json.dump(out, open(f"{ART}/diag_prompts.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
