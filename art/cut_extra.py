"""残りの3人（アルド・ケイ・セラ）の立ち絵・攻撃・倒れ（extra-*.png）を切り抜く。

使い方: python -I art/cut_extra.py art
出力: art/sprites/<id>.png / <id>_atk.png / <id>_down.png、art/sprites/extra.js、art/sprites/_extra_sheet.png
向きのそろえ方は前の6人と同じ：立ち絵は左向き、攻撃は右向き、倒れは頭が左。
"""
import base64, io, json, sys
from collections import deque

import numpy as np
from PIL import Image, ImageEnhance

ART = sys.argv[1]
IDS = ["aldo", "kei", "sera"]
# 生成画像の中で右を向いていた人（立ち絵・攻撃）。立ち絵は左向きに、攻撃は右向きにそろえる
STAND_FACES_RIGHT = {"kei", "sera"}
ATK_FACES_RIGHT = {"sera"}
STAND_H = 36      # 立ち絵：アルドの背丈（ガレスと同じ）。ほかの2人は同じ縮尺
DOWN_W = 42       # 倒れ：アルドの頭から足までの長さ


def mask(img):
    a = np.asarray(img.convert("RGB")).astype(int)
    h, w, _ = a.shape
    edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(edge, axis=0)
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
    # 弓と弦のあいだのように、囲まれた背景のかたまりも消す
    rest = near & ~bgm; seen = np.zeros((h, w), bool)
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
    return a, ~bgm


def split3(fg):
    """列ごとの前景の量から、3人の横の範囲を出す（いちばん広い2つのすき間で分ける）"""
    col = fg.sum(axis=0) > 2
    xs = np.where(col)[0]
    gaps = []
    for i in range(1, len(xs)):
        if xs[i] - xs[i - 1] > 1:
            gaps.append((xs[i] - xs[i - 1], xs[i - 1], xs[i]))
    gaps = sorted(sorted(gaps, reverse=True)[:2], key=lambda g: g[1])
    cuts = [xs[0]] + [(g[1] + g[2]) // 2 for g in gaps] + [xs[-1] + 1]
    return [(cuts[i], cuts[i + 1]) for i in range(3)]


def bbox(fg, x0, x1):
    ys, xs = np.where(fg[:, x0:x1])
    return x0 + xs.min(), ys.min(), x0 + xs.max() + 1, ys.max() + 1


def shrink(a, fg, box, scale):
    x0, y0, x1, y1 = box
    rgb = Image.fromarray(a[y0:y1, x0:x1].astype("uint8"))
    rgb = ImageEnhance.Contrast(ImageEnhance.Color(rgb).enhance(1.08)).enhance(1.2)
    alpha = Image.fromarray((fg[y0:y1, x0:x1] * 255).astype("uint8"))
    tw, th = max(1, round((x1 - x0) * scale)), max(1, round((y1 - y0) * scale))
    q = rgb.resize((tw, th), Image.LANCZOS).quantize(colors=48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    op = np.asarray(alpha.resize((tw, th), Image.BOX)) >= 120
    out = np.zeros((th + 2, tw + 2, 4), "uint8")
    out[1:-1, 1:-1, :3] = np.asarray(q); out[1:-1, 1:-1, 3] = op * 255
    o = out[:, :, 3] > 0; ring = np.zeros_like(o)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ring |= np.roll(np.roll(o, dy, 0), dx, 1)
    ring &= ~o; out[ring] = (20, 24, 38, 255)
    return Image.fromarray(out, "RGBA")


def enc(img):
    buf = io.BytesIO(); img.save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


hero, pose, sheet = {}, {k: {} for k in IDS}, []
# 立ち絵
a, fg = mask(Image.open(f"{ART}/extra-stand.png"))
boxes = [bbox(fg, *r) for r in split3(fg)]
s_scale = STAND_H / (boxes[0][3] - boxes[0][1])
stand_h = {}
for cid, b in zip(IDS, boxes):
    spr = shrink(a, fg, b, s_scale)
    if cid in STAND_FACES_RIGHT: spr = spr.transpose(Image.FLIP_LEFT_RIGHT)
    spr.save(f"{ART}/sprites/{cid}.png"); hero[cid] = enc(spr); sheet.append(spr); stand_h[cid] = spr.height
    print(cid, "stand", spr.size)
# 攻撃：ケイ（ほぼ立ったまま弓を引く）の背丈を、立ち絵のケイにそろえる縮尺
a, fg = mask(Image.open(f"{ART}/extra-attack.png"))
boxes = [bbox(fg, *r) for r in split3(fg)]
a_scale = (stand_h["kei"] - 2) / (boxes[1][3] - boxes[1][1])
for cid, b in zip(IDS, boxes):
    spr = shrink(a, fg, b, a_scale)
    if cid not in ATK_FACES_RIGHT: spr = spr.transpose(Image.FLIP_LEFT_RIGHT)
    spr.save(f"{ART}/sprites/{cid}_atk.png"); pose[cid]["atk"] = enc(spr); sheet.append(spr)
    print(cid, "atk", spr.size)
# 倒れ：アルドの長さを DOWN_W にそろえる縮尺
a, fg = mask(Image.open(f"{ART}/extra-down.png"))
boxes = [bbox(fg, *r) for r in split3(fg)]
d_scale = DOWN_W / (boxes[0][2] - boxes[0][0])
for cid, b in zip(IDS, boxes):
    spr = shrink(a, fg, b, d_scale)
    spr.save(f"{ART}/sprites/{cid}_down.png"); pose[cid]["down"] = enc(spr); sheet.append(spr)
    print(cid, "down", spr.size)

with open(f"{ART}/sprites/extra.js", "w", encoding="utf-8") as f:
    f.write("/* 残りの3人（art/extra-*.png を art/cut_extra.py で切り抜いたもの） */\n")
    f.write("Object.assign(HERO_IMG," + json.dumps(hero) + ");\n")
    f.write("Object.assign(POSE_IMG," + json.dumps(pose) + ");\n")
S = 5
cw = max(s.width for s in sheet) * S + 12; rh = max(s.height for s in sheet) * S + 12
board = Image.new("RGBA", (cw * 3, rh * 3), (58, 66, 84, 255))
for i, s in enumerate(sheet):
    big = s.resize((s.width * S, s.height * S), Image.NEAREST)
    board.alpha_composite(big, ((i % 3) * cw + 6, (i // 3) * rh + rh - 6 - big.height))
board.save(f"{ART}/sprites/_extra_sheet.png")
print("extra.js bytes", sum(len(v) for v in hero.values()) + sum(len(v) for d in pose.values() for v in d.values()))
