"""敵の絵（enemies.png）から、ゴブリン・ゴブリン呪術師・オーガ（立ち・振りかぶり）を切り抜く。

使い方: python -I art/cut_enemies.py art
出力: art/sprites/en_<名前>.png、art/sprites/enemies.js（モックに貼るデータ）、art/sprites/_enemies_sheet.png
4体とも左向き（一行のいる左を向く）。縮尺は全員共通で、立ったオーガが74画素になるようにする。
"""
import base64, io, json, sys
from collections import deque

import numpy as np
from PIL import Image, ImageEnhance

ART = sys.argv[1]
NAMES = ["goblin", "shaman", "ogre", "ogre_raise"]
OGRE_PX = 74

im = Image.open(f"{ART}/enemies.png").convert("RGB")
a = np.asarray(im).astype(int)
H, W, _ = a.shape
edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
bg = np.median(edge, axis=0)
fg = np.sqrt(((a - bg) ** 2).sum(axis=2)) > 30

# かたまり探し（4分の1の図で）。大きい順に4つ取り、左から並べる
small = fg[::4, ::4]; h4, w4 = small.shape
lab = np.zeros(small.shape, int); n = 0; comps = []
for y in range(h4):
    for x in range(w4):
        if small[y, x] and not lab[y, x]:
            n += 1; q = deque([(y, x)]); lab[y, x] = n; xs = [x]; ys = [y]
            while q:
                cy, cx = q.popleft()
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h4 and 0 <= nx < w4 and small[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = n; q.append((ny, nx)); xs.append(nx); ys.append(ny)
            comps.append((len(xs), (min(xs) * 4, min(ys) * 4, max(xs) * 4 + 4, max(ys) * 4 + 4)))
boxes = sorted([b for _, b in sorted(comps, reverse=True)[:4]], key=lambda b: b[0])
ogre_h = boxes[2][3] - boxes[2][1]
scale = OGRE_PX / ogre_h

data, sheet = {}, []
for name, (x0, y0, x1, y1) in zip(NAMES, boxes):
    x0, y0, x1, y1 = max(0, x0 - 6), max(0, y0 - 6), min(W, x1 + 6), min(H, y1 + 6)
    rgb = ImageEnhance.Contrast(im.crop((x0, y0, x1, y1))).enhance(1.15)
    alpha = Image.fromarray((fg[y0:y1, x0:x1] * 255).astype("uint8"))
    tw, th = max(1, round(rgb.width * scale)), max(1, round(rgb.height * scale))
    q = rgb.resize((tw, th), Image.LANCZOS).quantize(colors=40, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    op = np.asarray(alpha.resize((tw, th), Image.BOX)) >= 140
    out = np.zeros((th + 2, tw + 2, 4), "uint8")
    out[1:-1, 1:-1, :3] = np.asarray(q); out[1:-1, 1:-1, 3] = op * 255
    o = out[:, :, 3] > 0; ring = np.zeros_like(o)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ring |= np.roll(np.roll(o, dy, 0), dx, 1)
    ring &= ~o; out[ring] = (20, 24, 38, 255)
    spr = Image.fromarray(out, "RGBA")
    spr.save(f"{ART}/sprites/en_{name}.png")
    buf = io.BytesIO(); spr.save(buf, "PNG")
    data[name] = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    sheet.append(spr); print(name, spr.size)

with open(f"{ART}/sprites/enemies.js", "w", encoding="utf-8") as f:
    f.write("const ENEMY_IMG=" + json.dumps(data) + ";\n")
S = 4
bw = sum(s.width for s in sheet) * S + 12 * 5; bh = max(s.height for s in sheet) * S + 24
board = Image.new("RGBA", (bw, bh), (58, 66, 84, 255)); x = 12
for s in sheet:
    big = s.resize((s.width * S, s.height * S), Image.NEAREST)
    board.alpha_composite(big, (x, bh - 12 - big.height)); x += big.width + 12
board.save(f"{ART}/sprites/_enemies_sheet.png")
print("enemies.js bytes", sum(len(v) for v in data.values()))
