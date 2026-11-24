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
    # ガレス・ボルグ・エリン（2026-11-24、立ち絵の描き直しに合わせて描き直したもの。前の絵より後ろに置いて上書きする）
    ("more-heroes3-stand.png", 3, ["gareth", "borg", "erin"], "hero", ("h", 37), set()),
    ("more-heroes3-attack.png", 3, ["gareth", "borg", "erin"], "pose:atk", ("h", 32), set()),
    ("more-heroes3-down.png", 3, ["gareth", "borg", "erin"], "pose:down", ("w", 44), set()),
    ("more-heroes3-win.png", 3, ["gareth", "borg", "erin"], "pose:win", ("h", 41, 1), set()),
    # 町から来る信者（職ごとに一人。剣士・重騎士・魔術師・狩人・神官・盗賊の順）
    ("more-believers-stand.png", 6, ["b_sword", "b_tank", "b_mage", "b_hunter", "b_priest", "b_thief"], "hero", ("h", 37), set()),
    ("more-believers-attack.png", 6, ["b_sword", "b_tank", "b_mage", "b_hunter", "b_priest", "b_thief"], "pose:atk", ("h", 31), set()),
    ("more-believers-down.png", 6, ["b_sword", "b_tank", "b_mage", "b_hunter", "b_priest", "b_thief"], "pose:down", ("w", 40), set()),
    ("more-believers-win.png", 6, ["b_sword", "b_tank", "b_mage", "b_hunter", "b_priest", "b_thief"], "pose:win", ("h", 39, 3), set()),
    # 新しい名のある人物（2026-11-24）：3段（立ち・攻撃・倒れ）に描かせた絵を split_rows.py で分けたもの
    ("more-named-a-stand.png", 5, ["sigrun", "halvar", "toki", "hozuki", "zaid"], "hero", ("h", 38), set()),
    ("more-named-a-attack.png", 5, ["sigrun", "halvar", "toki", "hozuki", "zaid"], "pose:atk", ("h", 33), set()),
    ("more-named-a-down.png", 5, ["sigrun", "halvar", "toki", "hozuki", "zaid"], "pose:down", ("w", 44), set()),
    ("more-named-b-stand.png", 4, ["najma", "koko", "ilse", "dorn"], "hero", ("h", 37), set()),
    ("more-named-b-attack.png", 4, ["najma", "koko", "ilse", "dorn"], "pose:atk", ("h", 33), set()),
    ("more-named-b-down.png", 4, ["najma", "koko", "ilse", "dorn"], "pose:down", ("w", 42), set()),
    ("more-named-win-win1.png", 5, ["sigrun", "halvar", "toki", "hozuki", "zaid"], "pose:win", ("h", 41, 1), set()),
    ("more-named-win-win2.png", 4, ["najma", "koko", "ilse", "dorn"], "pose:win", ("h", 40, 3), set()),
    # 後ろ姿・前向き（2026-11-24）：いまの立ち姿を8倍にした見本（make_ref.py）を添えて、上の段に後ろ姿・下の段に前向きを描かせ、split_rows.py で分けたもの
    ("more-back-1-back.png", 5, ["gareth", "borg", "erin", "mira", "rio"], "pose:back", ("h", 37), set()),
    ("more-back-1-front.png", 5, ["gareth", "borg", "erin", "mira", "rio"], "pose:front", ("h", 37), set()),
    ("more-back-2-back.png", 5, ["raz", "aldo", "kei", "sera", "tohma"], "pose:back", ("h", 37), set()),
    ("more-back-2-front.png", 5, ["raz", "aldo", "kei", "sera", "tohma"], "pose:front", ("h", 37), set()),
    ("more-back-3-back.png", 5, ["noa", "sigrun", "halvar", "toki", "hozuki"], "pose:back", ("h", 37), set()),
    ("more-back-3-front.png", 5, ["noa", "sigrun", "halvar", "toki", "hozuki"], "pose:front", ("h", 37), set()),
    ("more-back-4-back.png", 5, ["zaid", "najma", "koko", "ilse", "dorn"], "pose:back", ("h", 37), set()),
    ("more-back-4-front.png", 5, ["zaid", "najma", "koko", "ilse", "dorn"], "pose:front", ("h", 37), set()),
    ("more-back-5-back.png", 6, ["b_sword", "b_tank", "b_mage", "b_hunter", "b_priest", "b_thief"], "pose:back", ("h", 37), set()),
    ("more-back-5-front.png", 6, ["b_sword", "b_tank", "b_mage", "b_hunter", "b_priest", "b_thief"], "pose:front", ("h", 37), set()),
    # 敵は2体目（野盗）の大きさで縮尺を決める（人間の背丈を仲間とそろえる）
    ("more-enemies-stand.png", 3, ["wolf", "bandit", "boss"], "enemy", ("h", 37, 1), set()),
    ("more-enemies-attack.png", 3, ["wolf_atk", "bandit_atk", "boss_atk"], "enemy", ("h", 38, 1), set()),
    ("more-enemies-down.png", 3, ["wolf_down", "bandit_down", "boss_down"], "enemy", ("w", 42, 1), set()),
    # はぐれオーガ：立ち・振りかぶり・叩きつけ・倒れを1枚に描いたもの。立ち姿の背丈で縮尺を決める
    ("more-strayogre.png", 4, ["strayogre", "strayogre_raise", "strayogre_atk", "strayogre_down"], "enemy", ("h", 50, 0), set()),
]
FLIP = {"more-heroes-attack.png": {"tohma"}, "more-named-a-stand.png": {"toki", "hozuki", "zaid"}, "more-named-b-stand.png": {"najma", "ilse", "dorn"}}   # 画像ごとの反転：生成で逆向きに描かれたもの


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
        sc = scale
        if kind in ("pose:back", "pose:front"):   # 後ろ姿・前向きは、一人ずつ いまの立ち姿と同じ背丈にそろえる（生成で背丈がばらつくため）
            try: sc = Image.open(f"{ART}/sprites/{name}.png").height / (b[3] - b[1])
            except FileNotFoundError: pass
        spr = shrink(a, m, b, sc, trim=4)
        if name.startswith("b_"):   # 信者の絵は明るい生成りの服が多く、フィールドで浮くので少し暗く・くすませる
            from PIL import ImageEnhance
            al = spr.getchannel("A"); rgb = spr.convert("RGB")
            rgb = ImageEnhance.Brightness(ImageEnhance.Color(rgb).enhance(0.8)).enhance(0.82)
            spr = rgb.convert("RGBA"); spr.putalpha(al)
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

# 町の建物と、区画ごとの物（左から1列に並べて描いたもの）。名前・縮める軸・画素
BGJOBS = [
    ("more-town.png", [("house1", "h", 70), ("house2", "h", 92), ("house3", "h", 80), ("inn", "h", 92), ("chapel", "h", 104), ("tgate", "h", 76)]),
    ("more-plain.png", [("well", "h", 34), ("stall", "h", 40), ("hay", "h", 30), ("cart", "w", 40), ("scare", "h", 44), ("mile", "h", 22)]),
    ("more-wild.png", [("bigtree", "h", 96), ("mush", "h", 20), ("log", "w", 56), ("deadtree", "h", 86), ("reeds", "h", 34), ("cattail", "h", 28)]),
    ("more-pass.png", [("cliff", "h", 96), ("deadtree2", "h", 80), ("cairn", "h", 30), ("shrine", "h", 40), ("crag", "h", 54)]),
]
for src, objs in BGJOBS:
    try:
        im = Image.open(f"{ART}/{src}")
    except FileNotFoundError:
        print("skip", src); continue
    a, fg = mask(im)
    for (name, axis, px), (m, b) in zip(objs, split_shapes(fg, len(objs))):
        sc = px / ((b[2] - b[0]) if axis == "w" else (b[3] - b[1]))
        spr = shrink(a, m, b, sc, trim=3)
        spr.save(f"{ART}/sprites/bg_{name}.png"); bg[name] = enc(spr); print(name, spr.size)
# 区画ごとの地面の模様（森の土・岩場・湿地の泥）。1枚に3つの正方形を並べて描いたもの（more-tex.png）か、1枚ずつの画像。160画素・16色
try:
    im = Image.open(f"{ART}/more-tex.png").convert("RGB")
    a, fg = mask(im)
    for name, (m, b) in zip(["tforest", "trock", "tmud"], split_shapes(fg, 3)):
        x0, y0, x1, y1 = b; s = min(x1 - x0, y1 - y0) - 16; cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
        t = im.crop((cx - s // 2, cy - s // 2, cx + s // 2, cy + s // 2)).resize((160, 160), Image.LANCZOS)
        t = t.quantize(colors=16, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
        t.save(f"{ART}/sprites/bg_{name}.png"); bg[name] = enc(t); print(name, t.size)
except FileNotFoundError:
    print("skip more-tex.png")
for src, name in [("more-tex-forest.png", "tforest"), ("more-tex-rock.png", "trock"), ("more-tex-mud.png", "tmud")]:
    try:
        t = Image.open(f"{ART}/{src}").convert("RGB")
    except FileNotFoundError:
        print("skip", src); continue
    s = min(t.size); t = t.crop(((t.width - s) // 2, (t.height - s) // 2, (t.width + s) // 2, (t.height + s) // 2))
    t = t.resize((160, 160), Image.LANCZOS).quantize(colors=16, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    t.save(f"{ART}/sprites/bg_{name}.png"); bg[name] = enc(t); print(name, t.size)

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
