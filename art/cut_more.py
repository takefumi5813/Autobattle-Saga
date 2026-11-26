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
    # 後ろ向き・前向きの攻撃（2026-11-24、make_ref_atk.py の見本を添えて描かせたもの。上の段＝後ろ向き、下の段＝前向き）
    ("more-atk-1-atkB.png", 5, ["gareth", "borg", "erin", "mira", "rio"], "pose:atkB", ("h", 37), set()),
    ("more-atk-1-atkF.png", 5, ["gareth", "borg", "erin", "mira", "rio"], "pose:atkF", ("h", 37), set()),
    ("more-atk-2-atkB.png", 5, ["raz", "aldo", "kei", "sera", "tohma"], "pose:atkB", ("h", 37), set()),
    ("more-atk-2-atkF.png", 5, ["raz", "aldo", "kei", "sera", "tohma"], "pose:atkF", ("h", 37), set()),
    ("more-atk-3-atkB.png", 5, ["noa", "sigrun", "halvar", "toki", "hozuki"], "pose:atkB", ("h", 37), set()),
    ("more-atk-3-atkF.png", 5, ["noa", "sigrun", "halvar", "toki", "hozuki"], "pose:atkF", ("h", 37), set()),
    ("more-atk-4-atkB.png", 5, ["zaid", "najma", "koko", "ilse", "dorn"], "pose:atkB", ("h", 37), set()),
    ("more-atk-4-atkF.png", 5, ["zaid", "najma", "koko", "ilse", "dorn"], "pose:atkF", ("h", 37), set()),
    ("more-atk-5-atkB.png", 6, ["b_sword", "b_tank", "b_mage", "b_hunter", "b_priest", "b_thief"], "pose:atkB", ("h", 37), set()),
    ("more-atk-5-atkF.png", 6, ["b_sword", "b_tank", "b_mage", "b_hunter", "b_priest", "b_thief"], "pose:atkF", ("h", 37), set()),
    # 敵の前向き・後ろ姿・前向きの攻撃（2026-11-24、make_ref_en.py の見本を添えて3段に描かせ、split_rows.py で front,back,atkF に分けたもの）
    ("more-en-1-front.png", 4, ["goblin_front", "shaman_front", "wolf_front", "bandit_front"], "enemy4", ("h", 37), set()),
    ("more-en-1-back.png", 4, ["goblin_back", "shaman_back", "wolf_back", "bandit_back"], "enemy4", ("h", 37), set()),
    ("more-en-1-atkF.png", 4, ["goblin_atkF", "shaman_atkF", "wolf_atkF", "bandit_atkF"], "enemy4", ("h", 37), set()),
    ("more-en-2-front.png", 3, ["ogre_front", "strayogre_front", "boss_front"], "enemy4", ("h", 37), set()),
    ("more-en-2-back.png", 3, ["ogre_back", "strayogre_back", "boss_back"], "enemy4", ("h", 37), set()),
    ("more-en-2-atkF.png", 3, ["ogre_atkF", "strayogre_atkF", "boss_atkF"], "enemy4", ("h", 37), set()),
    # 敵は2体目（野盗）の大きさで縮尺を決める（人間の背丈を仲間とそろえる）
    ("more-enemies-stand.png", 3, ["wolf", "bandit", "boss"], "enemy", ("h", 37, 1), set()),
    ("more-enemies-attack.png", 3, ["wolf_atk", "bandit_atk", "boss_atk"], "enemy", ("h", 38, 1), set()),
    ("more-enemies-down.png", 3, ["wolf_down", "bandit_down", "boss_down"], "enemy", ("w", 42, 1), set()),
    # はぐれオーガ：立ち・振りかぶり・叩きつけ・倒れを1枚に描いたもの。立ち姿の背丈で縮尺を決める
    ("more-strayogre.png", 4, ["strayogre", "strayogre_raise", "strayogre_atk", "strayogre_down"], "enemy", ("h", 50, 0), set()),
]
FLIP = {"more-heroes-attack.png": {"tohma"}, "more-named-a-stand.png": {"toki", "hozuki", "zaid"}, "more-named-b-stand.png": {"najma", "ilse", "dorn"}}   # 画像ごとの反転：生成で逆向きに描かれたもの


MF = {"windup": 1.16, "strike": 1.02, "guard": .92, "dodge": 1.0, "hurt": .95, "cast": .98}
CAL = {}
# 攻撃と防御の動き（2026-11-26、make_ref_motion.py の見本を添えて、1枚目に 振りかぶり・振り抜き・防御、2枚目に かわす・被弾・詠唱 の3段で描かせ、split_rows.py で分けたもの）
_MG = [["gareth", "borg", "erin", "mira", "rio"], ["raz", "aldo", "kei", "sera", "tohma"], ["noa", "sigrun", "halvar", "toki", "hozuki"],
       ["zaid", "najma", "koko", "ilse", "dorn"], ["b_sword", "b_tank", "b_mage", "b_hunter", "b_priest", "b_thief"],
       ["wendel", "pippa", "osric", "lene", "bram"], ["ragna", "eirik", "solvi", "thora", "ulf"], ["kagari", "gonza", "sayo", "ukon", "ibuki"], ["farida", "rashid", "amin", "kahina", "hamza"], ["itzel", "cuauh", "xochi", "tecun", "yaretzi"], ["viktor", "lisette", "casimir", "agathe", "bastian"]]   # 6〜11：新しい名のある30人（大陸ごと）
for _gi, _ns in enumerate(_MG, 1):
    for _k in ("guard", "windup", "strike", "cast", "dodge", "hurt"):   # 物差しの防御・詠唱を先に
        if os.path.exists(os.path.join(ART, f"more-motion-{_gi}-{_k}.png")):
            JOBS.append((f"more-motion-{_gi}-{_k}.png", len(_ns), _ns, f"pose:{_k}", ("h", 37), set()))

# 一時的な仲間の見た目30（2026-11-26、art/temp_looks.json。大陸ごとに 剣士・重騎士・魔術師・狩人・神官。立ち・攻撃・倒れ の3段と、後ろ姿・前向きの2段を描かせ、split_rows.py で分けたもの）
for _c in ("c0", "c1", "c2", "c3", "c4", "c5"):
    _ns = [f"t_{_c}_{r}" for r in ("sword", "tank", "mage", "hunter", "priest")]
    for _row, _kind, _size in (("stand", "hero", ("h", 37)), ("attack", "pose:atk", ("h", 34)), ("down", "pose:down", ("w", 43)), ("back", "pose:back", ("h", 37)), ("front", "pose:front", ("h", 37))):
        if os.path.exists(os.path.join(ART, f"more-temp-{_c}-{_row}.png")):
            JOBS.append((f"more-temp-{_c}-{_row}.png", 5, _ns, _kind, _size, set()))
    # 立ち姿は左向きにそろえる。右向きに描かれてきたものだけ返す（目で見て決めた。中つ国と北は全員、密林は神官以外）
    FLIP[f"more-temp-{_c}-stand.png"] = set(_ns) if _c in ("c0", "c1") else {n for n in _ns if n != "t_c4_priest"} if _c == "c4" else set()

# 新しい名のある30人（2026-11-26、art/named3_looks.json。大陸ごとに5人。立ち・攻撃・倒れ の3段と、後ろ姿・前向きの2段）
NAMED3_FLIP = {"c0": {"wendel", "osric", "bram"}, "c1": {"eirik", "ulf"}, "c3": {"farida", "rashid", "amin"}}   # 立ち姿が右向きに描かれてきた人（目で見て決めた）
if os.path.exists(os.path.join(ART, "named3_looks.json")):
    _L = json.load(open(os.path.join(ART, "named3_looks.json"), encoding="utf-8"))
    _L = _L if isinstance(_L, list) else list(_L.values())
    for _c in ("c0", "c1", "c2", "c3", "c4", "c5"):
        _ns = [x["id"] for x in _L if x["cont"] == _c]
        for _row, _kind, _size in (("stand", "hero", ("h", 37)), ("attack", "pose:atk", ("h", 34)), ("down", "pose:down", ("w", 43)), ("back", "pose:back", ("h", 37)), ("front", "pose:front", ("h", 37))):
            if os.path.exists(os.path.join(ART, f"more-n3-{_c}-{_row}.png")):
                JOBS.append((f"more-n3-{_c}-{_row}.png", len(_ns), _ns, _kind, _size, set()))
        FLIP[f"more-n3-{_c}-stand.png"] = NAMED3_FLIP.get(_c, set())


HIK = 3   # 細かい絵（2026-11-26）：同じ切り抜きを3倍の細かさでも作り、prototype/data/sprites_hi.js に入れる（顔の目や口・武器の刃が見えるように）


def shrink_k(a, fg, box, scale, k, trim=0, colors=96):
    """shrink と同じ切り抜きを k 倍の細かさで。大きさは 1倍の絵のちょうど k 倍（縁取りの分も k 倍）"""
    import numpy as np
    from PIL import ImageEnhance
    from cut_extra_lib import erode
    x0, y0, x1, y1 = box
    if trim:
        fg = erode(fg, trim)
        a = a.copy(); a[~fg] = (20, 24, 38)
    rgb = Image.fromarray(a[y0:y1, x0:x1].astype("uint8"))
    rgb = ImageEnhance.Contrast(ImageEnhance.Color(rgb).enhance(1.08)).enhance(1.2)
    alpha = Image.fromarray((fg[y0:y1, x0:x1] * 255).astype("uint8"))
    tw, th = max(1, round((x1 - x0) * scale)) * k, max(1, round((y1 - y0) * scale)) * k
    q = rgb.resize((tw, th), Image.LANCZOS)
    q = ImageEnhance.Sharpness(q).enhance(1.6).quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    op = np.asarray(alpha.resize((tw, th), Image.BOX)) >= 120
    out = np.zeros((th + 2 * k, tw + 2 * k, 4), "uint8")
    out[k:-k, k:-k, :3] = np.asarray(q); out[k:-k, k:-k, 3] = op * 255
    o = out[:, :, 3] > 0; ring = np.zeros_like(o)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (2, 0), (-2, 0), (0, 2), (0, -2), (1, 1), (-1, -1), (1, -1), (-1, 1)):
        ring |= np.roll(np.roll(o, dy, 0), dx, 1)
    ring &= ~o; out[ring] = (20, 24, 38, 255)
    return Image.fromarray(out, "RGBA")


def encw(img):
    buf = io.BytesIO(); img.save(buf, "WEBP", lossless=True, quality=100, method=6)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


# 斜めの向き（2026-11-26、make_ref_diag.py の見本で、上の段＝斜め前（右下へ向く）、下の段＝斜め後ろ（右上へ向く）を描かせ、split_rows.py で dfront,dback に分けたもの）
try:
    import importlib.util as _iu
    _sp = _iu.spec_from_file_location("mrd_groups", os.path.join(ART, "make_ref_diag.py"))
    _src = open(os.path.join(ART, "make_ref_diag.py"), encoding="utf-8").read()
    _g = {}; exec(_src[_src.index("MG = "):_src.index("K, GAP")], _g)   # 組の名前だけ読む（絵は作らない）
    for _gi, _ns in enumerate(_g["GROUPS"], 1):
        _en = _gi > 11 + 6
        for _k in ("dfront", "dback"):
            if os.path.exists(os.path.join(ART, f"more-diag-{_gi}-{_k}.png")):
                if _en: JOBS.append((f"more-diag-{_gi}-{_k}.png", len(_ns), [f"{n}_{_k}" for n in _ns], "enemy4", ("h", 30), set()))
                else: JOBS.append((f"more-diag-{_gi}-{_k}.png", len(_ns), _ns, f"pose:{_k}", ("h", 37), set()))
except Exception as _e:
    print("diag groups skipped", _e)


def enc(img):
    buf = io.BytesIO(); img.save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


hero, pose, enemy = {}, {}, {}
HI = {"hero": {}, "pose": {}, "enemy": {}}
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
        if kind in ("pose:back", "pose:front", "pose:atkB", "pose:atkF", "pose:dfront", "pose:dback"):   # 後ろ姿・前向き（とその攻撃）は、一人ずつ いまの立ち姿と同じ背丈にそろえる（生成で背丈がばらつくため。攻撃は武器を振り上げるので少し高め）
            try: sc = Image.open(f"{ART}/sprites/{name}.png").height * (1.08 if "atk" in kind else 1) / (b[3] - b[1])
            except FileNotFoundError: pass
        mk = kind.split(":")[-1]
        if mk in MF:   # 攻撃と防御の動き（2026-11-26）：同じ1枚の絵の中では、人物ごとに縮尺を一つにする。
            # 背丈が立ち姿に近い「防御」（1枚目）と「詠唱」（2枚目）を物差しにして、立ち姿の背丈×割合から縮尺を決め、同じ人のほかの動きにも同じ縮尺を使う
            #（動きごとに背丈をそろえると、かがんだ姿が引き伸ばされて大きくなりすぎた）
            sheet = "A" if mk in ("windup", "strike", "guard") else "B"
            if mk in ("guard", "cast"):
                try: CAL[(src.split("-")[2], sheet, name)] = Image.open(f"{ART}/sprites/{name}.png").height * MF[mk] / (b[3] - b[1])
                except FileNotFoundError: pass
            sc = CAL.get((src.split("-")[2], sheet, name), sc)
        if kind == "enemy4":   # 敵の前向き・後ろ姿・前向きの攻撃：一体ずつ、横向きの立ち姿と同じ背丈に（狼は正面だと背が高く見えるので少し大きめ）
            base = name.rsplit("_", 1)[0]
            try: sc = Image.open(f"{ART}/sprites/en_{base}.png").height * (1.25 if base == "wolf" else 1) * (1.08 if name.endswith("atkF") else 1) / (b[3] - b[1])
            except FileNotFoundError: pass
        spr = shrink(a, m, b, sc, trim=4)
        sprH = shrink_k(a, m, b, sc, HIK, trim=4)
        if name.startswith("b_"):   # 信者の絵は明るい生成りの服が多く、フィールドで浮くので少し暗く・くすませる
            from PIL import ImageEnhance
            al = spr.getchannel("A"); rgb = spr.convert("RGB")
            rgb = ImageEnhance.Brightness(ImageEnhance.Color(rgb).enhance(0.8)).enhance(0.82)
            spr = rgb.convert("RGBA"); spr.putalpha(al)
            alH = sprH.getchannel("A"); rgbH = ImageEnhance.Brightness(ImageEnhance.Color(sprH.convert("RGB")).enhance(0.8)).enhance(0.82)
            sprH = rgbH.convert("RGBA"); sprH.putalpha(alH)
        if name in FLIP.get(src, set()): spr = spr.transpose(Image.FLIP_LEFT_RIGHT); sprH = sprH.transpose(Image.FLIP_LEFT_RIGHT)
        spr.save(f"{ART}/sprites/{'en_' if kind in ('enemy', 'enemy4') else ''}{name}{'' if kind in ('hero','enemy','enemy4') else '_' + kind.split(':')[1]}.png")
        if kind == "hero": hero[name] = enc(spr); HI["hero"][name] = encw(sprH)
        elif kind in ("enemy", "enemy4"): enemy[name] = enc(spr); HI["enemy"][name] = encw(sprH)
        else: pose.setdefault(name, {})[kind.split(":")[1]] = enc(spr); HI["pose"].setdefault(name, {})[kind.split(":")[1]] = encw(sprH)
        print(src, name, spr.size)

# 歩きのコマ（2026-11-26、オーナー「やっぱり歩行がひどい。体の向きの画像が少なすぎる」）：make_ref_walk.py の見本で、向きごとに一人一段×4コマを描かせ、
# split_rows.py で人物ごとに分けたもの（more-walk-<組>-<向き>-<id>.png）。一人の4コマは同じ縮尺（4コマの背丈の中ほどを、その向きの立ち姿の背丈に合わせる）。
# 名前は POSE_IMG[id].w<向き><コマ>（敵は ENEMY_IMG[<敵>_w<向き><コマ>]）。どれも右向き（横・斜め）
import glob as _glob
_WD = {"S": "", "F": "_front", "B": "_back", "DF": "_dfront", "DB": "_dback"}
for _p in sorted(_glob.glob(f"{ART}/more-walk-*-*-*.png")):
    _m = re.match(r"more-walk-(\d+)-(S|F|B|DF|DB)-(.+)\.png$", os.path.basename(_p))
    if not _m: continue
    _g, _d, _id = _m.groups(); _en = int(_g) >= 18
    try:
        a, fg = mask(Image.open(_p))
        shapes = split_shapes(fg, 4)
    except Exception as _e:
        print("walk skip", _p, _e); continue
    if len(shapes) < 4: print("walk skip (few)", _p, len(shapes)); continue
    try: _sh = Image.open(f"{ART}/sprites/{'en_' if _en else ''}{_id}{_WD[_d]}.png").height
    except FileNotFoundError: print("walk skip (no stand)", _p); continue
    _hs = sorted(b[3] - b[1] for _, b in shapes)
    sc = _sh / ((_hs[1] + _hs[2]) / 2)
    # 向きの確かめ：生成で左右逆に描かれることがあるので、横と斜めは立ち姿（右向き）と見比べ、左右を返したほうが似ていれば4コマとも返す
    _flip = False
    if _d in ("DF", "DB"):   # 横向きの立ち姿はもともと斜めに近く見比べがあてにならないので、斜めだけ
        import numpy as _np
        _ref = Image.open(f"{ART}/sprites/{'en_' if _en else ''}{_id}{_WD[_d]}.png").convert("RGBA")
        if _d == "S": _ref = _ref.transpose(Image.FLIP_LEFT_RIGHT)   # 立ち姿は左向き
        def _sig(im):
            im = im.crop((0, 0, im.width, int(im.height * .7))).resize((16, 22), Image.BILINEAR)
            bg = Image.new("RGBA", im.size, (128, 128, 128, 255)); bg.alpha_composite(im)
            return _np.asarray(bg.convert("RGB")).astype(float)
        _r = _sig(_ref); _votes = 0
        for m, b in shapes:
            f0 = shrink(a, m, b, sc, trim=4)
            d0 = abs(_sig(f0) - _r).mean(); d1 = abs(_sig(f0.transpose(Image.FLIP_LEFT_RIGHT)) - _r).mean()
            _votes += 1 if d1 < d0 * .88 else 0
        _flip = _votes >= 3
        if _flip: print("walk flip", _g, _d, _id, _votes)
    # 手で直す一覧（art/walk_flip.json の "<組>-<向き>": [id…]）：横向きで左を向いて描かれた人など
    try: _WF = json.load(open(f"{ART}/walk_flip.json", encoding="utf-8"))
    except FileNotFoundError: _WF = {}
    if _id in _WF.get(f"{_g}-{_d}", []): _flip = not _flip; print("walk flip (list)", _g, _d, _id)
    for _k, (m, b) in enumerate(shapes):
        spr = shrink(a, m, b, sc, trim=4); sprH = shrink_k(a, m, b, sc, HIK, trim=4)
        if _id.startswith("b_"):   # 信者は立ち姿と同じく少し暗く・くすませる
            from PIL import ImageEnhance
            for _v in ("spr", "sprH"):
                _im = locals()[_v]; _al = _im.getchannel("A")
                _rgb = ImageEnhance.Brightness(ImageEnhance.Color(_im.convert("RGB")).enhance(0.8)).enhance(0.82).convert("RGBA"); _rgb.putalpha(_al)
                if _v == "spr": spr = _rgb
                else: sprH = _rgb
        if _flip: spr = spr.transpose(Image.FLIP_LEFT_RIGHT); sprH = sprH.transpose(Image.FLIP_LEFT_RIGHT)
        key = f"w{_d}{_k}"
        spr.save(f"{ART}/sprites/{'en_' if _en else ''}{_id}_{key}.png")
        if _en: enemy[f"{_id}_{key}"] = enc(spr); HI["enemy"][f"{_id}_{key}"] = encw(sprH)
        else: pose.setdefault(_id, {})[key] = enc(spr); HI["pose"].setdefault(_id, {})[key] = encw(sprH)
    print("walk", _g, _d, _id, [s.size for s in [spr]])

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
# 細かい絵：試作が読む prototype/data/sprites_hi.js（フィールドと町は、この絵を1倍の絵と同じ場所・大きさで描く）
_hp = os.path.join(os.path.dirname(os.path.abspath(MOCK)), "..", "prototype", "data", "sprites_hi.js")
with open(_hp, "w", encoding="utf-8") as fp:
    fp.write("/* 細かい絵（2026-11-26、art/cut_more.py が作る）。HERO_IMG / POSE_IMG / ENEMY_IMG と同じ名前で、3倍の細かさ。フィールドと町は 1倍の絵と同じ場所・大きさに、この絵を描く */\n")
    fp.write("const SPR_HI=" + json.dumps(HI, separators=(",", ":")) + ";\n")
print("hi", sum(len(v) for v in HI.values()), os.path.getsize(_hp) // 1024, "KB")
