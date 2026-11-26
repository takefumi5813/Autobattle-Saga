"""歩きのコマを描かせるための見本と頼み方（2026-11-26、オーナー「やっぱり歩行がひどい。体の向きの画像が少なすぎる」）。
前の歩きは、立ち姿の腰から下を切って前後にずらす切り絵だった。いまは向きごとに本当の歩きを4コマ描かせる。
組は斜めの向きと同じ（make_ref_diag.py の 1〜19）。向きは S＝横（右向き）・F＝前向き・B＝後ろ姿・DF＝斜め前（右下）・DB＝斜め後ろ（右上）。
見本 art/ref-walk-<組>-<向き>.png は、その向きの立ち姿を一人一段で縦に並べたもの。頼み方は art/walk_prompts/<組>-<向き>.txt。
描かせた絵は 一人一段×4コマ。取り込みは take_field.py → split_rows.py（段＝人物）→ cut_more.py（more-walk-<組>-<向き>-<id>.png）
使い方: python -I art/make_ref_walk.py
"""
import json, os
from PIL import Image, ImageOps
ART = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(ART, "make_ref_diag.py"), encoding="utf-8").read()
ns = {}
exec(src[src.index("MG = "):src.index("K, GAP, BG")], ns)
GROUPS, EN = ns["GROUPS"], ns["EN"]
ENS = sum(EN, [])
DIRS = {"S": "side", "F": "front", "B": "back", "DF": "dfront", "DB": "dback"}
DESC_DIR = {
    "S": "SIDE VIEW walking to the RIGHT (profile, facing right)",
    "F": "FRONT VIEW walking straight toward the viewer (facing the camera)",
    "B": "BACK VIEW walking straight away from the viewer (we see their back, face hidden)",
    "DF": "THREE-QUARTER FRONT VIEW walking diagonally toward the viewer and to the RIGHT (we see their face and chest and their right side)",
    "DB": "THREE-QUARTER BACK VIEW walking diagonally away from the viewer and to the RIGHT (we see their back and their right side, face hidden)",
}
VIEWN = {'S': 'side (facing right)', 'F': 'front', 'B': 'back', 'DF': 'three-quarter front', 'DB': 'three-quarter back'}
K, BG = 4, (200, 200, 204)
P = json.load(open(f"{ART}/motion_prompts.json", encoding="utf-8"))
TL = json.load(open(f"{ART}/temp_looks.json", encoding="utf-8"))
EN_DESC = {"goblin": "a small green goblin with a crude dagger", "shaman": "a goblin shaman in a hooded robe with a bone staff", "wolf": "a grey wolf (four-legged trot)",
           "bandit": "a human bandit in a dark red hood with a short sword", "boss": "a bandit chief in heavy leather armor with a big axe",
           "ogre": "a huge brown ogre with a club", "strayogre": "a huge purple-grey rogue ogre with a spiked club"}


def spr(n, d):
    pre = "en_" if n in ENS else ""
    p = f"{ART}/sprites/{pre}{n}{'' if d == 'S' else '_' + DIRS[d]}.png"
    im = Image.open(p).convert("RGBA")
    return ImageOps.mirror(im) if d == "S" else im   # 立ち姿は左向きなので右向きに返す


def desc_of(gi, names):
    if gi <= 11:
        a = P[f"g{gi}A"]; d = a[a.index("The characters, left to right, are:"):a.index("Draw a NEW sprite sheet")].strip()
        return d.replace("left to right", "top to bottom")
    if gi <= 17:
        c = ["c0", "c1", "c2", "c3", "c4", "c5"][gi - 12]
        return "The characters, top to bottom, are: " + "; ".join(f"({i+1}) {d}" for i, d in enumerate(TL[c])) + "."
    return "The creatures, top to bottom, are: " + "; ".join(f"({i+1}) {EN_DESC[n]}" for i, n in enumerate(names)) + "."


os.makedirs(f"{ART}/walk_prompts", exist_ok=True)
for gi, names in enumerate(GROUPS, 1):
    n = len(names)
    for d in DIRS:
        ims = [spr(x, d) for x in names]
        ims = [i.resize((i.width * K, i.height * K), Image.NEAREST) for i in ims]
        rh = max(i.height for i in ims) + 24
        W = max(i.width for i in ims) + 120
        im = Image.new("RGB", (W, rh * n + 24), BG)
        for k, i in enumerate(ims):
            im.paste(i, ((W - i.width) // 2, 12 + k * rh + rh - 12 - i.height), i)
        im.save(f"{ART}/ref-walk-{gi}-{d}.png")
        crea = "creature" if gi >= 18 else "character"
        txt = ("Please generate an image. The attached image shows " + str(n) + f" {crea}s from my game (16-bit SNES-era JRPG pixel art), one per row, top to bottom, "
               f"each drawn in {VIEWN[d]} view. " + desc_of(gi, names) +
               f" Draw a NEW sprite sheet: a WALK CYCLE ANIMATION of these exact same {n} {crea}s. Exactly {n} rows, one row per {crea} in the same order top to bottom, "
               f"and exactly 4 frames per row from left to right, all in {DESC_DIR[d]}. "
               + ("The 4 frames for the two-legged creatures: (1) right foot stepping forward, left foot behind; (2) passing pose, one leg lifted; (3) left foot stepping forward, right foot behind; (4) passing pose, the other leg lifted. "
                  + ("For the four-legged wolf: (1) right front leg and left hind leg forward, (2) legs gathered under the body, (3) left front leg and right hind leg forward, (4) legs gathered again. " if "wolf" in names else "")
                  if gi >= 18 else
                  "The 4 frames: (1) right foot stepping forward, left foot behind, arms swinging opposite; (2) passing pose, right foot planted, left leg lifted and passing; "
                  "(3) left foot stepping forward, right foot behind, arms swinging the other way; (4) passing pose, left foot planted, right leg lifted and passing. ")
               + f"Keep each one's exact outfit, colors, hair, weapon (carried as in the attached image) and proportions, in exactly the same pixel art style and the same height as in the attached image. "
               "Every figure separate with wide empty spacing, all figures about the same height, on a perfectly flat solid light grey #C8C8CC background, "
               "no ground, no shadows, no text, no labels, no grid, no frame borders. Crisp hard pixel edges. Landscape 1536x1024.")
        open(f"{ART}/walk_prompts/{gi}-{d}.txt", "w", encoding="utf-8").write(txt)
    print(gi, names)
