"""勝利のポーズ（poses-win.png：6人、extra-win.png：3人）を切り抜く。

使い方: python -I art/cut_win.py art
出力: art/sprites/<id>_win.png、art/sprites/win.js（モックに貼るデータ）、art/sprites/_win_sheet.png
ほぼ正面向きの絵なので反転はしない。縮尺は、まっすぐ立っている人の背丈を立ち絵にそろえて決める
（6人の絵はリオ、3人の絵はケイ）。
"""
import base64, io, json, sys
from collections import deque

import numpy as np
from PIL import Image, ImageEnhance

ART = sys.argv[1]
SETS = [("poses-win.png", ["gareth", "borg", "erin", "mira", "rio", "raz"], "rio"),
        ("extra-win.png", ["aldo", "kei", "sera"], "kei")]


def mask(img):
    a = np.asarray(img.convert("RGB")).astype(int); h, w, _ = a.shape
    edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]); bg = np.median(edge, axis=0)
    near = np.sqrt(((a - bg) ** 2).sum(axis=2)) < 22
    bgm = np.zeros((h, w), bool); q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near[y, x] and not bgm[y, x]: bgm[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near[y, x] and not bgm[y, x]: bgm[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and near[ny, nx] and not bgm[ny, nx]:
                bgm[ny, nx] = True; q.append((ny, nx))
    return a, ~bgm


def split(fg, n):
    """列ごとの前景から、いちばん広い n-1 個のすき間で n 人に分ける"""
    xs = np.where(fg.sum(axis=0) > 2)[0]
    gaps = sorted([(xs[i] - xs[i - 1], xs[i - 1], xs[i]) for i in range(1, len(xs)) if xs[i] - xs[i - 1] > 1], reverse=True)[:n - 1]
    if len(gaps) < n - 1:
        print("すき間が足りない", len(gaps)); sys.exit(1)
    cuts = [xs[0]] + sorted((g[1] + g[2]) // 2 for g in gaps) + [xs[-1] + 1]
    return [(cuts[i], cuts[i + 1]) for i in range(n)]


def bbox(fg, x0, x1):
    ys, xs = np.where(fg[:, x0:x1]); return x0 + xs.min(), ys.min(), x0 + xs.max() + 1, ys.max() + 1


def shrink(a, fg, box, scale):
    x0, y0, x1, y1 = box
    rgb = ImageEnhance.Contrast(ImageEnhance.Color(Image.fromarray(a[y0:y1, x0:x1].astype("uint8"))).enhance(1.08)).enhance(1.2)
    alpha = Image.fromarray((fg[y0:y1, x0:x1] * 255).astype("uint8"))
    tw, th = max(1, round((x1 - x0) * scale)), max(1, round((y1 - y0) * scale))
    q = rgb.resize((tw, th), Image.LANCZOS).quantize(colors=48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    op = np.asarray(alpha.resize((tw, th), Image.BOX)) >= 120
    out = np.zeros((th + 2, tw + 2, 4), "uint8"); out[1:-1, 1:-1, :3] = np.asarray(q); out[1:-1, 1:-1, 3] = op * 255
    o = out[:, :, 3] > 0; ring = np.zeros_like(o)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ring |= np.roll(np.roll(o, dy, 0), dx, 1)
    ring &= ~o; out[ring] = (20, 24, 38, 255)
    return Image.fromarray(out, "RGBA")


data, sheet = {}, []
for fname, ids, ref in SETS:
    a, fg = mask(Image.open(f"{ART}/{fname}"))
    boxes = [bbox(fg, *r) for r in split(fg, len(ids))]
    ref_h = Image.open(f"{ART}/sprites/{ref}.png").height - 2   # 立ち絵の背丈（輪郭を除く）
    rb = boxes[ids.index(ref)]
    scale = ref_h / (rb[3] - rb[1])
    for cid, b in zip(ids, boxes):
        spr = shrink(a, fg, b, scale)
        spr.save(f"{ART}/sprites/{cid}_win.png")
        buf = io.BytesIO(); spr.save(buf, "PNG")
        data[cid] = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
        sheet.append(spr); print(cid, "win", spr.size)

with open(f"{ART}/sprites/win.js", "w", encoding="utf-8") as f:
    f.write("/* 勝利のポーズ（art/poses-win.png・art/extra-win.png を art/cut_win.py で切り抜いたもの） */\n")
    f.write("for(const [k,v] of Object.entries(" + json.dumps(data) + "))(POSE_IMG[k]=POSE_IMG[k]||{}).win=v;\n")
S = 5; bw = sum(s.width for s in sheet) * S + 10 * (len(sheet) + 1); bh = max(s.height for s in sheet) * S + 20
board = Image.new("RGBA", (bw, bh), (58, 66, 84, 255)); x = 10
for s in sheet:
    big = s.resize((s.width * S, s.height * S), Image.NEAREST); board.alpha_composite(big, (x, bh - 10 - big.height)); x += big.width + 10
board.save(f"{ART}/sprites/_win_sheet.png")
print("win.js bytes", sum(len(v) for v in data.values()))
