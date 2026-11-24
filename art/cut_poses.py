"""ポーズ違いの絵（poses-attack.png / poses-down.png）から6人を切り抜き、立ち絵と同じ縮尺のスプライトにする。

使い方: python -I art/cut_poses.py art
出力: art/sprites/<id>_atk.png, <id>_down.png, art/sprites/poses.js（モックに貼るデータ）, art/sprites/_poses_sheet.png

ゲームでは一行は右を向く。立ち絵は左向きの絵を反転して使っているので、ここでも「右向き」にそろえて出力する。
"""
import base64, io, json, sys
from collections import deque

import numpy as np
from PIL import Image, ImageEnhance

ART = sys.argv[1]
IDS = ["gareth", "borg", "erin", "mira", "rio", "raz"]

# 人物ごとの区画（元画像 2400×1350 の座標）。生成画像ごとに確かめて決めた値
# 1人の区画は長方形のリスト（重なり合う人は、高さで分けた長方形を組み合わせる）
#  例：エリンの杖の先はボルグの頭の高さまで伸びているので、ボルグの右上の一角はエリン側に入れる
CELLS = {
    "attack": [[(0, 300, 400, 1060)],
               [(400, 300, 770, 1060), (770, 620, 948, 1060)],
               [(770, 300, 948, 620), (948, 300, 1296, 1060)],
               [(1296, 300, 1704, 1060)], [(1704, 300, 1974, 1060)], [(1974, 300, 2400, 1060)]],
    "down": [[(0, 330, 800, 720)], [(800, 330, 1600, 720)], [(1600, 330, 2400, 720)],
             [(0, 720, 800, 1080)], [(800, 720, 1600, 1080)], [(1600, 720, 2400, 1080)]],
}
# 絵の中で右を向いている人（攻撃のポーズ）。それ以外は左向きなので反転して右向きにする
FACES_RIGHT_ATK = {"gareth", "rio"}
# 縮尺：立ち絵とそろえるための値（元画像1画素あたりのスプライト画素）
#  攻撃：まっすぐ立っているリオの頭から足（約462px）を、立ち絵のリオ（42px）に合わせる
#  倒れ：ガレスの頭から足（約666px）を、立ち絵のガレス（46px）くらいの長さに合わせる
SCALE = {"attack": 31.5 / 462, "down": 35 / 666}  # 3/4の大きさ（立ち絵36画素に合わせる）


def cut(img, boxes, scale):
    # 長方形の組み合わせを囲む範囲を切り出し、区画の外は背景色で塗る
    X0, Y0 = min(b[0] for b in boxes), min(b[1] for b in boxes)
    X1, Y1 = max(b[2] for b in boxes), max(b[3] for b in boxes)
    a = np.asarray(img.crop((X0, Y0, X1, Y1)).convert("RGB")).astype(int).copy()
    h, w, _ = a.shape
    inside = np.zeros((h, w), bool)
    for bx0, by0, bx1, by1 in boxes:
        inside[by0 - Y0:by1 - Y0, bx0 - X0:bx1 - X0] = True
    edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(edge, axis=0)
    a[~inside] = bg
    near = np.sqrt(((a - bg) ** 2).sum(axis=2)) < 22
    bgm = np.zeros((h, w), bool); q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near[y, x]: bgm[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near[y, x] and not bgm[y, x]: bgm[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and near[ny, nx] and not bgm[ny, nx]:
                bgm[ny, nx] = True; q.append((ny, nx))
    # 弓と弦のあいだのように、人物に囲まれた背景も消す（背景色の大きなかたまり）
    rest = near & ~bgm
    seen = np.zeros((h, w), bool)
    for sy, sx in zip(*np.where(rest)):
        if seen[sy, sx]: continue
        comp = [(sy, sx)]; seen[sy, sx] = True; k = 0
        while k < len(comp):
            cy, cx = comp[k]; k += 1
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < h and 0 <= nx < w and rest[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; comp.append((ny, nx))
        if len(comp) > 300:
            for cy, cx in comp: bgm[cy, cx] = True
    fg = ~bgm
    ys, xs = np.where(fg)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgb = Image.fromarray(a[y0:y1, x0:x1].astype("uint8"))
    alpha = Image.fromarray((fg[y0:y1, x0:x1] * 255).astype("uint8"))
    tw, th = max(1, round((x1 - x0) * scale)), max(1, round((y1 - y0) * scale))
    rgb = ImageEnhance.Contrast(ImageEnhance.Color(rgb).enhance(1.08)).enhance(1.2)
    small = rgb.resize((tw, th), Image.LANCZOS)
    op = np.asarray(alpha.resize((tw, th), Image.BOX)) >= 120
    # 離れた小さな点を消す（落ちた武器のような大きめのかたまりは残す）
    lab = np.zeros(op.shape, int); n = 0
    for sy in range(th):
        for sx in range(tw):
            if op[sy, sx] and not lab[sy, sx]:
                n += 1; comp = [(sy, sx)]; lab[sy, sx] = n; k = 0
                while k < len(comp):
                    cy, cx = comp[k]; k += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        yy, xx = cy + dy, cx + dx
                        if 0 <= yy < th and 0 <= xx < tw and op[yy, xx] and not lab[yy, xx]:
                            lab[yy, xx] = n; comp.append((yy, xx))
                if len(comp) < 14:
                    for cy, cx in comp: op[cy, cx] = False
    q32 = small.quantize(colors=48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    out = np.zeros((th + 2, tw + 2, 4), "uint8")
    out[1:-1, 1:-1, :3] = np.asarray(q32); out[1:-1, 1:-1, 3] = op * 255
    o = out[:, :, 3] > 0
    ring = np.zeros_like(o)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ring |= np.roll(np.roll(o, dy, 0), dx, 1)
    ring &= ~o
    out[ring] = (20, 24, 38, 255)
    return Image.fromarray(out, "RGBA")


data = {k: {} for k in IDS}
sheet = []
for mode, fname in (("attack", "poses-attack.png"), ("down", "poses-down.png")):
    img = Image.open(f"{ART}/{fname}")
    for cid, box in zip(IDS, CELLS[mode]):
        spr = cut(img, box, SCALE[mode])
        if mode == "attack" and cid not in FACES_RIGHT_ATK:
            spr = spr.transpose(Image.FLIP_LEFT_RIGHT)
        key = "atk" if mode == "attack" else "down"
        spr.save(f"{ART}/sprites/{cid}_{key}.png")
        buf = io.BytesIO(); spr.save(buf, "PNG")
        data[cid][key] = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
        sheet.append(spr)
        print(cid, key, spr.size)

with open(f"{ART}/sprites/poses.js", "w", encoding="utf-8") as f:
    f.write("const POSE_IMG=" + json.dumps(data) + ";\n")

# 確認用の一覧（上段：攻撃、下段：倒れ。6倍）
S = 6
cw = max(s.width for s in sheet) * S + 12; rh = max(s.height for s in sheet) * S + 12
board = Image.new("RGBA", (cw * 6, rh * 2), (58, 66, 84, 255))
for i, s in enumerate(sheet):
    big = s.resize((s.width * S, s.height * S), Image.NEAREST)
    board.alpha_composite(big, ((i % 6) * cw + 6, (i // 6) * rh + rh - 6 - big.height))
board.save(f"{ART}/sprites/_poses_sheet.png")
print("poses.js bytes", sum(len(v) for d in data.values() for v in d.values()))
