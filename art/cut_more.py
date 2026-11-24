"""後から足したドット絵（トウマ・ノア、狼・野盗・野盗の頭、迷宮の床と物）を切り抜いて、モックに足す。
使い方: python -I art/cut_more.py art mock/ff6mock.html
そのあと python -I art/splice_field.py mock/ff6mock.html prototype/shintaku.html で試作にも写す。

JOBS の1行が生成画像1枚。人物は横のすき間で左から順に分ける（cut_extra.py と同じ切り抜き方）。
  size：('h', 画素) なら最初の1体の背丈、('w', 画素) なら最初の1体の横幅をそろえ、ほかは同じ縮尺
  flip：反転する id（立ち絵と敵は左向き、攻撃は右向き、倒れは頭が左にそろえる）
出力は art/sprites/<名前>.png と、モックの /*MORE-ART*/ の行（HERO_IMG / POSE_IMG / ENEMY_IMG / BG_IMG に足す）。
"""
import base64, io, json, os, re, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cut_extra_lib import mask, splitn, bbox, shrink, split_shapes   # noqa: E402

ART, MOCK = sys.argv[1], sys.argv[2]
JOBS = [
    # 画像, 何体, 名前, 種類(hero/pose:atk/pose:down/enemy), 大きさ, 反転するもの
    ("more-heroes-stand.png", 2, ["tohma", "noa"], "hero", ("h", 37), set()),
    ("more-heroes-attack.png", 2, ["tohma", "noa"], "pose:atk", ("h", 35), set()),
    ("more-heroes-down.png", 2, ["tohma", "noa"], "pose:down", ("w", 42), set()),
    ("more-heroes-win.png", 2, ["tohma", "noa"], "pose:win", ("h", 39, 1), set()),
    # 敵は2体目（野盗）の大きさで縮尺を決める（人間の背丈を仲間とそろえる）
    ("more-enemies-stand.png", 3, ["wolf", "bandit", "boss"], "enemy", ("h", 37, 1), set()),
    ("more-enemies-attack.png", 3, ["wolf_atk", "bandit_atk", "boss_atk"], "enemy", ("h", 38, 1), set()),
    ("more-enemies-down.png", 3, ["wolf_down", "bandit_down", "boss_down"], "enemy", ("w", 42, 1), set()),
    # はぐれオーガ：立ち・振りかぶり・叩きつけ・倒れを1枚に描いたもの。立ち姿の背丈で縮尺を決める
    ("more-strayogre.png", 4, ["strayogre", "strayogre_raise", "strayogre_atk", "strayogre_down"], "enemy", ("h", 50, 0), set()),
]
FLIP = {"more-heroes-attack.png": {"tohma"}}   # 画像ごとの反転：生成で逆向きに描かれたもの


def enc(img):
    buf = io.BytesIO(); img.save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


hero, pose, enemy = {}, {}, {}
for src, n, names, kind, size, _ in JOBS:
    axis, px, ref = (size + (0,))[:3]
    p = f"{ART}/{src}"
    try:
        im = Image.open(p)
    except FileNotFoundError:
        print("skip", src); continue
    a, fg = mask(im)
    shapes = split_shapes(fg, n)          # つながった形ごとに分ける
    boxes = [b for _, b in shapes]; masks = [m for m, _ in shapes]
    b0 = boxes[ref]
    scale = px / ((b0[3] - b0[1]) if axis == "h" else (b0[2] - b0[0]))
    for name, b, m in zip(names, boxes, masks):
        spr = shrink(a, m, b, scale, trim=4)
        if name in FLIP.get(src, set()): spr = spr.transpose(Image.FLIP_LEFT_RIGHT)
        spr.save(f"{ART}/sprites/{'en_' if kind == 'enemy' else ''}{name}{'' if kind in ('hero','enemy') else '_' + kind.split(':')[1]}.png")
        if kind == "hero": hero[name] = enc(spr)
        elif kind == "enemy": enemy[name] = enc(spr)
        else: pose.setdefault(name, {})[kind.split(":")[1]] = enc(spr)
        print(src, name, spr.size)

# 迷宮の床（つなぎ目のない模様）：真ん中を正方形に切り、160画素・16色にする
bg = {}
try:
    t = Image.open(f"{ART}/more-dungeon-floor.png").convert("RGB")
    s = min(t.size); t = t.crop(((t.width - s) // 2, (t.height - s) // 2, (t.width + s) // 2, (t.height + s) // 2))
    t = t.resize((160, 160), Image.LANCZOS).quantize(colors=16, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    t.save(f"{ART}/sprites/bg_dfloor.png"); bg["dfloor"] = enc(t); print("dfloor", t.size)
except FileNotFoundError:
    print("skip more-dungeon-floor.png")
# 迷宮の物：左から 壁・柱・松明・瓦礫・骨。大きさは横幅（壁）か背丈で決める
OBJ = [("dwall", "w", 96), ("dpillar", "h", 64), ("dtorch", "h", 30), ("drubble1", "w", 34), ("dbones", "w", 26)]
try:
    im = Image.open(f"{ART}/more-dungeon-objects.png")
    a, fg = mask(im)
    for (name, axis, px), r in zip(OBJ, splitn(fg, len(OBJ))):
        b = bbox(fg, *r)
        sc = px / ((b[2] - b[0]) if axis == "w" else (b[3] - b[1]))
        spr = shrink(a, fg, b, sc, trim=3)
        spr.save(f"{ART}/sprites/bg_{name}.png"); bg[name] = enc(spr); print(name, spr.size)
except FileNotFoundError:
    print("skip more-dungeon-objects.png")

line = "/*MORE-ART*/" + "Object.assign(HERO_IMG," + json.dumps(hero) + ");"
line2 = "/*MORE-ART*/" + "for(const [k,v] of Object.entries(" + json.dumps(pose) + "))POSE_IMG[k]=Object.assign(POSE_IMG[k]||{},v);"
line3 = "/*MORE-ART*/" + "Object.assign(ENEMY_IMG," + json.dumps(enemy) + ");"
html = open(MOCK, encoding="utf-8").read()
html = re.sub(r"^/\*MORE-ART\*/.*\n", "", html, flags=re.M)
anchor = html.index("function imgCanvas(")
line4 = "/*MORE-ART*/" + "Object.assign(BG_IMG," + json.dumps(bg) + ");"
html = html[:anchor] + "\n".join([line, line2, line3, line4]) + "\n" + html[anchor:]
open(MOCK, "w", encoding="utf-8", newline="").write(html)
print("mock updated", len(hero), len(pose), len(enemy))
