"""建物の中の絵（2026-11-26）。ChatGPT に町の絵を見本として渡し、緑一色の背景で描かせた2枚から切り分ける。
  art/interior-furniture.png … 家具20（3段）
  art/interior-tiles.png     … 床4・壁3・窓の壁・出入り口・敷物
緑を抜き、つながった塊ごとに切り出して、段ごと左から名前を付ける。ゲームの大きさに縮めて
prototype/data/interior_img.js（INT_IMG）に埋め込む。
使い方: python -I art/cut_interior.py
"""
import base64, io, json
import numpy as np
from PIL import Image
from scipy import ndimage

FURN = [['counter', 'shelf', 'rack', 'armor', 'rtable', 'bar', 'barrels'],
        ['bed', 'fireplace', 'anvil', 'forge', 'bookshelf', 'altar', 'crates'],
        ['plant', 'board', 'chest', 'chair', 'ltable', 'candela']]
TILES = [['f_wood', 'f_stone', 'f_mat', 'f_earth'],
         ['w_plaster', 'w_stone', 'w_wood'],
         ['w_window', 'doorway', 'rug']]
SCALE = {'f_': 0.25, 'w_': 0.3, 'doorway': 0.3, 'rug': 0.25}

def key_green(im):
    I = np.asarray(im.convert('RGB'), dtype=np.float32)
    R, G, B = I[..., 0], I[..., 1], I[..., 2]
    ex = G - np.maximum(R, B)
    a = 1 - np.clip((ex - 30) / 80, 0, 1)
    O = I.copy(); O[..., 1] = np.minimum(G, np.maximum(R, B) + 4)
    return O, a

def pieces(path, names, merge):
    im = Image.open(path)
    O, a = key_green(im)
    m = ndimage.binary_dilation(a > 0.5, structure=np.ones((5, 2 * merge + 1)))   # 横にだけ広げてつなぐ（丸い卓と腰掛け）。縦には広げない（上下の段がくっつく）
    lab, n = ndimage.label(m)
    objs = ndimage.find_objects(lab)
    boxes = []
    for i, sl in enumerate(objs):
        ys, xs = sl
        if (ys.stop - ys.start) * (xs.stop - xs.start) < 2500:
            continue
        boxes.append((ys.start + 2, xs.start + merge, ys.stop - 2, xs.stop - merge, i + 1))
    # 段に分ける：上端の近いものを同じ段に
    # 段：絵の高さを段の数で等分した帯に、塊の下端（足もと）で振り分ける
    H = a.shape[0]; nr = len(names)
    rows = [[0, []] for _ in range(nr)]
    for b in boxes:
        r = min(nr - 1, int(((b[0] + b[2]) / 2) / (H / nr)))
        rows[r][1].append(b)
    out = {}
    flat = [n for r in names for n in r]
    got = [sorted(r[1], key=lambda b: b[1]) for r in rows]
    print(path, [len(r) for r in got], 'want', [len(r) for r in names])
    for r, rn in zip(got, names):
        for b, nm in zip(r, rn):
            y0, x0, y1, x1, li = b
            mask = (lab[y0:y1, x0:x1] == li)
            aa = (a[y0:y1, x0:x1] * mask)
            rgba = np.dstack([O[y0:y1, x0:x1], aa * 255]).astype(np.uint8)
            out[nm] = Image.fromarray(rgba, 'RGBA')
    return out

def main():
    res = {}
    res.update(pieces('art/interior-furniture.png', FURN, 16))
    res.update(pieces('art/interior-tiles.png', TILES, 6))
    enc = {}
    import os
    os.makedirs('art/interior', exist_ok=True)
    for nm, im in res.items():
        sc = next((v for k, v in SCALE.items() if nm.startswith(k)), 0.23)
        if nm.startswith('f_'):
            w, h = im.size
            im = im.crop((8, 8, w - 8, h - 8))   # 縁の線を落として、敷き詰められるように
        w, h = im.size
        sm = im.resize((max(1, round(w * sc)), max(1, round(h * sc))), Image.LANCZOS)
        if nm.startswith('f_') or nm.startswith('w_'):
            sm = Image.alpha_composite(Image.new('RGBA', sm.size, (0, 0, 0, 255)), sm)
        sm.save(f'art/interior/{nm}.png')
        b = io.BytesIO(); sm.save(b, 'PNG', optimize=True)
        enc[nm] = 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
        print(nm, sm.size)
    js = '/* 建物の中の絵（art/cut_interior.py が作る。手で直さない） */\nconst INT_IMG=' + json.dumps(enc, separators=(',', ':')) + ';\n'
    open('prototype/data/interior_img.js', 'w', encoding='utf-8').write(js)
    print('INT_IMG', len(enc), len(js) // 1024, 'KB')

main()
