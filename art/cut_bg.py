"""背景の素材（bg-objects.png・bg-grass.png・bg-dirt.png）から、モックの地図に使う絵を作る。

使い方: python -I art/cut_bg.py art
出力: art/sprites/bg_<名前>.png、art/sprites/bg.js（モックに貼るデータ）、art/sprites/_bg_sheet.png
"""
import base64, io, json, sys
from collections import deque

import numpy as np
from PIL import Image

ART = sys.argv[1]
OBJ_SCALE = 80 / 522      # 丸い木（元画像で約522px）が80画素になる縮尺。ほかの物も同じ縮尺で、大きさの比を保つ
LANTERN_SCALE = 44 / 360  # 灯籠だけは人物より少し低く（44画素）
TEX_SIZE = 160            # 地面の模様：1080px → 160px（敷き詰めて使うので小さくてよい）


def outline(img):
    a = np.asarray(img).copy()
    op = a[:, :, 3] > 0
    pad = np.zeros((a.shape[0] + 2, a.shape[1] + 2, 4), "uint8")
    pad[1:-1, 1:-1] = a
    o = pad[:, :, 3] > 0
    ring = np.zeros_like(o)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ring |= np.roll(np.roll(o, dy, 0), dx, 1)
    ring &= ~o
    pad[ring] = (20, 24, 38, 255)
    return Image.fromarray(pad, "RGBA")


def shrink(rgb, alpha, scale, colors=32):
    tw, th = max(1, round(rgb.width * scale)), max(1, round(rgb.height * scale))
    small = rgb.resize((tw, th), Image.LANCZOS).quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    op = np.asarray(alpha.resize((tw, th), Image.BOX)) >= 120
    out = np.zeros((th, tw, 4), "uint8")
    out[:, :, :3] = np.asarray(small); out[:, :, 3] = op * 255
    return outline(Image.fromarray(out, "RGBA"))


# ---- 物（木・岩など）：明るい灰色の背景から、かたまりごとに切り出す ----
im = Image.open(f"{ART}/bg-objects.png").convert("RGB")
a = np.asarray(im).astype(int)
H, W, _ = a.shape
edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
bg = np.median(edge, axis=0)
fg = np.sqrt(((a - bg) ** 2).sum(axis=2)) > 30
# かたまり探しは4分の1に縮めた図で行う（速さのため）
small = fg[::4, ::4]
h4, w4 = small.shape
lab = np.zeros(small.shape, int); n = 0; boxes = []
for y in range(h4):
    for x in range(w4):
        if small[y, x] and not lab[y, x]:
            n += 1; q = deque([(y, x)]); lab[y, x] = n; ys = [y]; xs = [x]; cnt = 0
            while q:
                cy, cx = q.popleft(); cnt += 1
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h4 and 0 <= nx < w4 and small[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = n; q.append((ny, nx)); ys.append(ny); xs.append(nx)
            if cnt > 60:
                boxes.append((min(xs) * 4, min(ys) * 4, max(xs) * 4 + 4, max(ys) * 4 + 4))
# 名前をつける：灯籠（右端で縦に長いもの）を除き、上・中・下の段ごとに左から並べる
is_lantern = lambda b: b[0] > 1950 and (b[1] + b[3]) / 2 > 700
lantern = [b for b in boxes if is_lantern(b)]
others = [b for b in boxes if not is_lantern(b)]
rows = {0: [], 1: [], 2: []}
for b in others:
    cy = (b[1] + b[3]) / 2
    rows[0 if cy < 700 else 1 if cy < 1030 else 2].append(b)
NAMES = [["tree1", "tree2", "tree3", "pine1", "pine2"],
         ["bush1", "bush2", "bush3", "rock1", "rock2", "rock3"],
         ["grass1", "grass2", "flowers", "fence", "sign"]]
named = {}
for r in range(3):
    lst = sorted(rows[r], key=lambda b: b[0])
    if len(lst) != len(NAMES[r]):
        print("段", r, "の数が合わない", len(lst), lst); sys.exit(1)
    named.update(zip(NAMES[r], lst))
if len(lantern) != 1:
    print("灯籠が見つからない", lantern); sys.exit(1)
named["lantern"] = lantern[0]

data = {}
sheet = []
for name, (x0, y0, x1, y1) in named.items():
    x0, y0, x1, y1 = max(0, x0 - 6), max(0, y0 - 6), min(W, x1 + 6), min(H, y1 + 6)
    rgb = im.crop((x0, y0, x1, y1))
    alpha = Image.fromarray((fg[y0:y1, x0:x1] * 255).astype("uint8"))
    spr = shrink(rgb, alpha, LANTERN_SCALE if name == "lantern" else OBJ_SCALE)
    spr.save(f"{ART}/sprites/bg_{name}.png")
    buf = io.BytesIO(); spr.save(buf, "PNG")
    data[name] = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    sheet.append(spr); print(name, spr.size)

# ---- 地面の模様：縮めて色数を絞る。道は轍が横に流れるよう90度回す ----
for name, fname, rot in (("grass", "bg-grass.png", False), ("dirt", "bg-dirt.png", True)):
    t = Image.open(f"{ART}/{fname}").convert("RGB")
    if rot: t = t.rotate(90, expand=True)
    s = TEX_SIZE
    t = t.resize((s, s), Image.LANCZOS).quantize(colors=12, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    t.save(f"{ART}/sprites/bg_{name}.png")
    buf = io.BytesIO(); t.save(buf, "PNG")
    data[name] = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    print(name, t.size)

with open(f"{ART}/sprites/bg.js", "w", encoding="utf-8") as f:
    f.write("const BG_IMG=" + json.dumps(data) + ";\n")
S = 3
bw = sum(s.width for s in sheet) * S + 8 * (len(sheet) + 1)
bh = max(s.height for s in sheet) * S + 16
board = Image.new("RGBA", (bw, bh), (58, 66, 84, 255)); x = 8
for s in sheet:
    big = s.resize((s.width * S, s.height * S), Image.NEAREST)
    board.alpha_composite(big, (x, bh - 8 - big.height)); x += big.width + 8
board.save(f"{ART}/sprites/_bg_sheet.png")
print("bg.js bytes", sum(len(v) for v in data.values()))
