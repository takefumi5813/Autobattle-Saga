"""切り抜きの共通部品（cut_extra.py と同じ処理を、ほかのスクリプトから使えるようにしたもの）"""
from collections import deque
import numpy as np
from PIL import Image, ImageEnhance


def mask(img, tol=22):
    """縁の色を背景とみなし、縁からつながる背景と、囲まれた大きな背景のかたまりを消す。(RGB配列, 前景の真偽) を返す"""
    a = np.asarray(img.convert("RGB")).astype(int)
    h, w, _ = a.shape
    edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(edge, axis=0)
    near = np.sqrt(((a - bg) ** 2).sum(axis=2)) < tol
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


def splitn(fg, n):
    """列ごとの前景の量から、n体の横の範囲を出す（いちばん広い n-1 個のすき間で分ける）"""
    col = fg.sum(axis=0) > 2
    xs = np.where(col)[0]
    gaps = []
    for i in range(1, len(xs)):
        if xs[i] - xs[i - 1] > 1:
            gaps.append((xs[i] - xs[i - 1], xs[i - 1], xs[i]))
    gaps = sorted(sorted(gaps, reverse=True)[:n - 1], key=lambda g: g[1])
    cuts = [xs[0]] + [(g[1] + g[2]) // 2 for g in gaps] + [xs[-1] + 1]
    return [(cuts[i], cuts[i + 1]) for i in range(n)]


def bbox(fg, x0, x1):
    ys, xs = np.where(fg[:, x0:x1])
    return x0 + xs.min(), ys.min(), x0 + xs.max() + 1, ys.max() + 1


def erode(fg, k):
    """前景の縁を k 画素削る（明るい背景のにじみを落とす）"""
    m = fg.copy()
    for _ in range(k):
        e = m.copy()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            e &= np.roll(np.roll(m, dy, 0), dx, 1)
        m = e
    return m


def shrink(a, fg, box, scale, colors=48, trim=0):
    """縮めて48色にまとめ、紺の縁取り（#141826）をつける。trim は縮める前に縁を削る画素数"""
    x0, y0, x1, y1 = box
    if trim:
        fg = erode(fg, trim)
        a = a.copy(); a[~fg] = (20, 24, 38)   # 背景を紺にしてから縮める（縁が明るくにじまないように）
    rgb = Image.fromarray(a[y0:y1, x0:x1].astype("uint8"))
    rgb = ImageEnhance.Contrast(ImageEnhance.Color(rgb).enhance(1.08)).enhance(1.2)
    alpha = Image.fromarray((fg[y0:y1, x0:x1] * 255).astype("uint8"))
    tw, th = max(1, round((x1 - x0) * scale)), max(1, round((y1 - y0) * scale))
    q = rgb.resize((tw, th), Image.LANCZOS).quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    op = np.asarray(alpha.resize((tw, th), Image.BOX)) >= 120
    out = np.zeros((th + 2, tw + 2, 4), "uint8")
    out[1:-1, 1:-1, :3] = np.asarray(q); out[1:-1, 1:-1, 3] = op * 255
    o = out[:, :, 3] > 0; ring = np.zeros_like(o)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ring |= np.roll(np.roll(o, dy, 0), dx, 1)
    ring &= ~o; out[ring] = (20, 24, 38, 255)
    return Image.fromarray(out, "RGBA")


def split_shapes(fg, n, big=1500):
    """つながった形ごとに分ける（横に重なっていても分けられる）。大きい形を左から n 個とり、小さなかけらは近い形に足す。
    戻り値は [(その形だけの前景, 外枠)] を左から"""
    h, w = fg.shape
    lab = np.zeros((h, w), np.int32); n_lab = 0; sizes = []
    for sy, sx in zip(*np.where(fg)):
        if lab[sy, sx]: continue
        n_lab += 1; lab[sy, sx] = n_lab; q = [(sy, sx)]; k = 0
        while k < len(q):
            cy, cx = q[k]; k += 1
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < h and 0 <= nx < w and fg[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = n_lab; q.append((ny, nx))
        sizes.append(len(q))
    order = sorted(range(1, n_lab + 1), key=lambda i: -sizes[i - 1])[:n]
    cents = {}
    for i in order:
        ys, xs = np.where(lab == i); cents[i] = (xs.mean(), ys.mean())
    groups = {i: (lab == i) for i in order}
    for i in range(1, n_lab + 1):
        if i in groups: continue
        ys, xs = np.where(lab == i); cx, cy = xs.mean(), ys.mean()
        j = min(order, key=lambda o: (cents[o][0] - cx) ** 2 + (cents[o][1] - cy) ** 2)
        groups[j] |= (lab == i)
    out = []
    for i in sorted(order, key=lambda o: cents[o][0]):
        m = groups[i]; ys, xs = np.where(m)
        out.append((m, (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)))
    return out