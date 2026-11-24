"""敵の倒れた姿（enemies-down.png）を切り抜く：ゴブリン・呪術師・オーガ。

使い方: python -I art/cut_enemy_down.py art
出力: art/sprites/en_<名前>_down.png、art/sprites/enemy_down.js（モックに貼るデータ）、art/sprites/_enemy_down_sheet.png
- 落とした武器が体と離れて描かれているので、かたまりではなく横のすき間で3体に分ける
- 生成では頭が左に描かれた。敵は一行（左）に打たれて後ろへ倒れるので、反転して頭を右にする
- 大きさは横たわった長さで決める（立ち姿の背丈の約1.2倍）
"""
import base64, io, json, sys

import numpy as np
from PIL import Image, ImageEnhance

ART = sys.argv[1]
TARGETS = [("goblin_down", 40), ("shaman_down", 44), ("ogre_down", 72)]   # 横の長さ（画素）

im = Image.open(f"{ART}/enemies-down.png").convert("RGB")
a = np.asarray(im).astype(int); H, W, _ = a.shape
edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]); bg = np.median(edge, axis=0)
fg = np.sqrt(((a - bg) ** 2).sum(axis=2)) > 30
xs = np.where(fg.sum(axis=0) > 2)[0]
gaps = sorted([(xs[i] - xs[i - 1], xs[i - 1], xs[i]) for i in range(1, len(xs)) if xs[i] - xs[i - 1] > 1], reverse=True)[:2]
cuts = [xs[0]] + sorted((g[1] + g[2]) // 2 for g in gaps) + [xs[-1] + 1]

data, sheet = {}, []
for i, (name, tw_px) in enumerate(TARGETS):
    c0, c1 = cuts[i], cuts[i + 1]
    ys, xx = np.where(fg[:, c0:c1])
    x0, x1, y0, y1 = c0 + xx.min(), c0 + xx.max() + 1, ys.min(), ys.max() + 1
    scale = (tw_px - 2) / (x1 - x0)
    rgb = ImageEnhance.Contrast(im.crop((x0, y0, x1, y1))).enhance(1.15)
    alpha = Image.fromarray((fg[y0:y1, x0:x1] * 255).astype("uint8"))
    tw, th = max(1, round(rgb.width * scale)), max(1, round(rgb.height * scale))
    q = rgb.resize((tw, th), Image.LANCZOS).quantize(colors=40, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    op = np.asarray(alpha.resize((tw, th), Image.BOX)) >= 140
    out = np.zeros((th + 2, tw + 2, 4), "uint8"); out[1:-1, 1:-1, :3] = np.asarray(q); out[1:-1, 1:-1, 3] = op * 255
    o = out[:, :, 3] > 0; ring = np.zeros_like(o)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ring |= np.roll(np.roll(o, dy, 0), dx, 1)
    ring &= ~o; out[ring] = (20, 24, 38, 255)
    spr = Image.fromarray(out, "RGBA").transpose(Image.FLIP_LEFT_RIGHT)
    spr.save(f"{ART}/sprites/en_{name}.png")
    buf = io.BytesIO(); spr.save(buf, "PNG")
    data[name] = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    sheet.append(spr); print(name, spr.size)

with open(f"{ART}/sprites/enemy_down.js", "w", encoding="utf-8") as f:
    f.write("/* 敵の倒れた姿（art/enemies-down.png を art/cut_enemy_down.py で切り抜いたもの。頭が右） */\n")
    f.write("Object.assign(ENEMY_IMG,/*down*/" + json.dumps(data) + ");\n")
S = 5; bw = sum(s.width for s in sheet) * S + 12 * 4; bh = max(s.height for s in sheet) * S + 24
board = Image.new("RGBA", (bw, bh), (58, 66, 84, 255)); x = 12
for s in sheet:
    big = s.resize((s.width * S, s.height * S), Image.NEAREST); board.alpha_composite(big, (x, bh - 12 - big.height)); x += big.width + 12
board.save(f"{ART}/sprites/_enemy_down_sheet.png")
