"""立ち絵の見本（比較ボード）から6人を切り抜き、ゲーム用の大きさに縮めたスプライトを作る。

使い方: python -I cut_sprites.py <ボードPNG> <出力フォルダ> <背丈px>
出力: <id>.png（透過）, <id>_x8.png（確認用の8倍）, sprites.js（データURL）
"""
import base64, io, json, sys
from collections import deque

import numpy as np
from PIL import Image

src, outdir, H = sys.argv[1], sys.argv[2], int(sys.argv[3])
IDS = ["gareth", "borg", "erin", "mira", "rio", "raz"]

im = Image.open(src).convert("RGB")
# 一行の立ち絵が入っている帯（ボードの上半分の枠の内側）
band = im.crop((300, 205, 1640, 568))
a = np.asarray(band).astype(int)
h, w, _ = a.shape

# 背景色：帯の四隅付近の中央値
corners = np.concatenate([a[:6, :6].reshape(-1, 3), a[:6, -6:].reshape(-1, 3), a[-6:, :6].reshape(-1, 3), a[-6:, -6:].reshape(-1, 3)])
bg = np.median(corners, axis=0)
dist = np.sqrt(((a - bg) ** 2).sum(axis=2))
near = dist < 18

# 縁からつながっている背景だけを塗りつぶす（人物の中の暗い色を消さないため）
bgmask = np.zeros((h, w), bool)
q = deque()
for x in range(w):
    for y in (0, h - 1):
        if near[y, x] and not bgmask[y, x]:
            bgmask[y, x] = True; q.append((y, x))
for y in range(h):
    for x in (0, w - 1):
        if near[y, x] and not bgmask[y, x]:
            bgmask[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and near[ny, nx] and not bgmask[ny, nx]:
            bgmask[ny, nx] = True; q.append((ny, nx))
fg = ~bgmask

# 列ごとの前景の量から、6人の境目（すき間）を探す
col = fg.sum(axis=0)
runs, inrun = [], False
for x in range(w):
    if col[x] > 3 and not inrun:
        start, inrun = x, True
    elif col[x] <= 3 and inrun:
        runs.append([start, x]); inrun = False
if inrun:
    runs.append([start, w])
# 細かい切れ端は隣とつなぐ
merged = []
for r in runs:
    if merged and (r[0] - merged[-1][1] < 12 or r[1] - r[0] < 25):
        merged[-1][1] = r[1]
    else:
        merged.append(r)
if len(merged) != 6:
    # ガレスのマントとボルグの盾がつながることがあるので、そのときは確かめ済みの範囲を使う
    merged = [[44, 252], [255, 494], [529, 716], [745, 921], [943, 1093], [1121, 1275]]
    print("自動の区切りが合わないので、固定の範囲を使う")

js = {}
boxes = []
for x0, x1 in merged:
    rows = np.where(fg[:, x0:x1].any(axis=1))[0]
    boxes.append((x0, x1, rows.min(), rows.max() + 1))
# 背丈の差を残すため、全員に同じ縮小率をかける（いちばん背の高い人が H 画素）
scale = H / max(y1 - y0 for _, _, y0, y1 in boxes)
for cid, (x0, x1, y0, y1) in zip(IDS, boxes):
    rgb = band.crop((x0, y0, x1, y1))
    alpha = Image.fromarray((fg[y0:y1, x0:x1] * 255).astype("uint8"))
    rgba = rgb.copy(); rgba.putalpha(alpha)
    tw, th = max(1, round(rgba.width * scale)), max(1, round(rgba.height * scale))
    # 縮めると色がにごるので、先に鮮やかさとメリハリを少し上げる
    from PIL import ImageEnhance
    rgb_e = ImageEnhance.Contrast(ImageEnhance.Color(rgb).enhance(1.08)).enhance(1.2)
    small_rgb = rgb_e.resize((tw, th), Image.LANCZOS)
    small_a = alpha.resize((tw, th), Image.BOX)
    # 透明度ははっきり二値に、色は32色に絞ってドットらしくする
    opaque = np.asarray(small_a) >= 120
    # 本体から離れた小さな点（4画素未満のかたまり）を消す
    lab = np.zeros(opaque.shape, int); n = 0
    for sy in range(th):
        for sx in range(tw):
            if opaque[sy, sx] and not lab[sy, sx]:
                n += 1; comp = [(sy, sx)]; lab[sy, sx] = n; k = 0
                while k < len(comp):
                    cy, cx = comp[k]; k += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        yy, xx = cy + dy, cx + dx
                        if 0 <= yy < th and 0 <= xx < tw and opaque[yy, xx] and not lab[yy, xx]:
                            lab[yy, xx] = n; comp.append((yy, xx))
                if len(comp) < 12:
                    for cy, cx in comp: opaque[cy, cx] = False
    rgb_s = small_rgb.quantize(colors=32, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    out = np.zeros((th + 2, tw + 2, 4), "uint8")
    out[1:-1, 1:-1, :3] = np.asarray(rgb_s)
    out[1:-1, 1:-1, 3] = opaque * 255
    # 外側に1画素の濃紺の輪郭（作風の決まり：真っ黒ではなく濃紺）
    op = out[:, :, 3] > 0
    ring = np.zeros_like(op)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ring |= np.roll(np.roll(op, dy, 0), dx, 1)
    ring &= ~op
    out[ring] = (20, 24, 38, 255)
    img = Image.fromarray(out, "RGBA")
    img.save(f"{outdir}/{cid}.png")
    img.resize((img.width * 8, img.height * 8), Image.NEAREST).save(f"{outdir}/{cid}_x8.png")
    buf = io.BytesIO(); img.save(buf, "PNG")
    js[cid] = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    print(cid, img.size, f"crop x{x0}-{x1} y{y0}-{y1}")

with open(f"{outdir}/sprites.js", "w", encoding="utf-8") as f:
    f.write("const HERO_IMG=" + json.dumps(js) + ";\n")
print("sprites.js bytes", sum(len(v) for v in js.values()))
