"""世界地図の地形（world-terrain.png）と場所の印（world-icons.png）を、モックの世界タブ用に作る。

使い方: python -I art/cut_world.py art
出力: art/sprites/world_terrain.png、art/sprites/wi_<名前>.png、art/sprites/world.js、art/sprites/_world_icons.png
地形は 1080×1080 → 幅256に縮め、上下を16画素ずつ切って 256×224（画面と同じ大きさ）にする。
"""
import base64, io, json, sys
from collections import deque

import numpy as np
from PIL import Image

ART = sys.argv[1]
ICON_NAMES = ["capital", "town", "village", "temple", "gate", "mine", "tower", "abbey", "burnt"]
ICON_W = 22  # いちばん横に広い印がこの幅になる縮尺で、全部そろえる


def enc(img):
    buf = io.BytesIO(); img.save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


# 地形
t = Image.open(f"{ART}/world-terrain.png").convert("RGB")
t = t.resize((256, 256), Image.LANCZOS).crop((0, 16, 256, 240))
t = t.quantize(colors=48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
t.save(f"{ART}/sprites/world_terrain.png")
data = {"terrain": enc(t), "icons": {}}

# 場所の印：明るい灰色の背景から、かたまりごとに切り出して3×3の順に並べる
im = Image.open(f"{ART}/world-icons.png").convert("RGB")
a = np.asarray(im).astype(int); H, W, _ = a.shape
edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]); bg = np.median(edge, axis=0)
fg = np.sqrt(((a - bg) ** 2).sum(axis=2)) > 30
small = fg[::3, ::3]; h3, w3 = small.shape
lab = np.zeros(small.shape, int); n = 0; comps = []
for y in range(h3):
    for x in range(w3):
        if small[y, x] and not lab[y, x]:
            n += 1; q = deque([(y, x)]); lab[y, x] = n; xs = [x]; ys = [y]
            while q:
                cy, cx = q.popleft()
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h3 and 0 <= nx < w3 and small[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = n; q.append((ny, nx)); xs.append(nx); ys.append(ny)
            comps.append((len(xs), (min(xs) * 3, min(ys) * 3, max(xs) * 3 + 3, max(ys) * 3 + 3)))
# 大きいかたまり9つ。焼けた森のように木が離れて別のかたまりになることがあるので、近いものは同じ区画にまとめる
cell = lambda b: (min(2, int(((b[1] + b[3]) / 2) / (H / 3))), min(2, int(((b[0] + b[2]) / 2) / (W / 3))))
groups = {}
for size, b in comps:
    if size < 40: continue
    k = cell(b); g = groups.get(k)
    groups[k] = b if g is None else (min(g[0], b[0]), min(g[1], b[1]), max(g[2], b[2]), max(g[3], b[3]))
if len(groups) != 9:
    print("印の数が合わない", len(groups), sorted(groups)); sys.exit(1)
boxes = [groups[(r, c)] for r in range(3) for c in range(3)]
scale = ICON_W / max(b[2] - b[0] for b in boxes)
sheet = []
for name, (x0, y0, x1, y1) in zip(ICON_NAMES, boxes):
    x0, y0, x1, y1 = max(0, x0 - 4), max(0, y0 - 4), min(W, x1 + 4), min(H, y1 + 4)
    rgb = im.crop((x0, y0, x1, y1)); alpha = Image.fromarray((fg[y0:y1, x0:x1] * 255).astype("uint8"))
    tw, th = max(1, round((x1 - x0) * scale)), max(1, round((y1 - y0) * scale))
    q = rgb.resize((tw, th), Image.LANCZOS).quantize(colors=32, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    op = np.asarray(alpha.resize((tw, th), Image.BOX)) >= 130
    out = np.zeros((th + 2, tw + 2, 4), "uint8"); out[1:-1, 1:-1, :3] = np.asarray(q); out[1:-1, 1:-1, 3] = op * 255
    o = out[:, :, 3] > 0; ring = np.zeros_like(o)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ring |= np.roll(np.roll(o, dy, 0), dx, 1)
    ring &= ~o; out[ring] = (20, 24, 38, 255)
    spr = Image.fromarray(out, "RGBA"); spr.save(f"{ART}/sprites/wi_{name}.png")
    data["icons"][name] = enc(spr); sheet.append(spr); print(name, spr.size)

with open(f"{ART}/sprites/world.js", "w", encoding="utf-8") as f:
    f.write("const WORLD_IMG=" + json.dumps(data) + ";\n")
S = 6; bw = sum(s.width for s in sheet) * S + 10 * 10; bh = max(s.height for s in sheet) * S + 20
board = Image.new("RGBA", (bw, bh), (58, 66, 84, 255)); x = 10
for s in sheet:
    big = s.resize((s.width * S, s.height * S), Image.NEAREST); board.alpha_composite(big, (x, bh - 10 - big.height)); x += big.width + 10
board.save(f"{ART}/sprites/_world_icons.png")
print("world.js bytes", len(data["terrain"]) + sum(len(v) for v in data["icons"].values()))
