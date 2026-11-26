"""フィールドの草木と物（2026-11-26）。art/field/c?<T|L|R|O>.png（ChatGPT の絵を画面いっぱいに写したもの、元の約0.8倍）を切り分け、
prototype/data/field_img.js（FIELD_IMG）に入れる。名前は c0T0〜（段ごと左から）。
T＝木（背丈およそ70〜90画素）、L＝低い草花（25〜40）、R＝岩と地形（20〜45）、O＝人の物と小物（25〜60）。
背景は赤紫か緑の一色（左上の色で見分ける。cut_town.py と同じ抜き方）。
使い方: python -I art/cut_field.py
"""
import base64, io, json, os, glob, sys
import numpy as np
from PIL import Image
from scipy import ndimage
def key(im):
    I = np.asarray(im.convert('RGB'), dtype=np.float32)
    R, G, B = I[..., 0], I[..., 1], I[..., 2]
    k = I[6, 6]
    green = k[1] > k[0]
    ex = G - np.maximum(R, B) if green else np.minimum(R, B) - G
    a = 1 - np.clip((ex - 30) / 80, 0, 1)
    O = I.copy()
    if green:
        O[..., 1] = np.minimum(G, np.maximum(R, B) + 4)
    else:
        e2 = np.clip(np.minimum(R, B) - G, 0, None)
        O[..., 0] = R - e2 * .9; O[..., 2] = B - e2 * .9
    return O, a


HERE = os.path.dirname(__file__)
SCALE = {'T': 0.43, 'L': 0.26, 'R': 0.28, 'O': 0.30}

def cut(path, kind):
    O, a = key(Image.open(path))
    m = ndimage.binary_dilation(a > .5, structure=np.ones((5, 9)))
    lab, n = ndimage.label(m)
    boxes = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        ys, xs = sl
        if (ys.stop - ys.start) * (xs.stop - xs.start) < 1500: continue
        if (ys.stop - ys.start) > a.shape[0] * .45 or (xs.stop - xs.start) > a.shape[1] * .45: continue   # 縁の黒い帯など、絵でない大きな塊
        boxes.append([ys.start, xs.start, ys.stop, xs.stop, i + 1])
    boxes.sort(key=lambda b: (b[0] + b[2]) / 2)
    rows = []
    for b in boxes:
        cy = (b[0] + b[2]) / 2
        if rows and abs(cy - np.mean([(x[0] + x[2]) / 2 for x in rows[-1]])) < 90: rows[-1].append(b)
        else: rows.append([b])
    out = []
    for r in rows:
        for b in sorted(r, key=lambda b: b[1]):
            y0, x0, y1, x1, li = b
            mask = lab[y0:y1, x0:x1] == li
            rgb = O[y0:y1, x0:x1]; al = a[y0:y1, x0:x1] * mask
            # 足もとのはみ出し（細い切れ端）を切らないよう、そのまま。透明の縁を詰める
            ys, xs = np.where(al > .1)
            if len(ys) == 0: continue
            rgb = rgb[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; al = al[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
            A = np.dstack([rgb, al[..., None] * 255]).clip(0, 255).astype(np.uint8)
            im = Image.fromarray(A, 'RGBA')
            s = SCALE[kind]
            w, h = max(1, round(im.width * s)), max(1, round(im.height * s))
            im = im.resize((w, h), Image.LANCZOS)
            P = np.asarray(im).copy(); P[..., 3] = np.where(P[..., 3] > 110, 255, 0)   # 縁をくっきり（画素の絵に）
            out.append(Image.fromarray(P, 'RGBA'))
    return out

def b64(im):
    bio = io.BytesIO(); im.save(bio, 'WEBP', lossless=True); return 'data:image/webp;base64,' + base64.b64encode(bio.getvalue()).decode()

data = {}; counts = {}
for f in sorted(glob.glob(os.path.join(HERE, 'field', 'c[0-5][TLRO].png'))):
    nm = os.path.basename(f)[:-4]; c, k = nm[:2], nm[2]
    ims = cut(f, k); counts[nm] = len(ims)
    os.makedirs(os.path.join(HERE, 'field', 'cut'), exist_ok=True)
    for i, im in enumerate(ims):
        data[f'{nm}{i}'] = b64(im)
        im.save(os.path.join(HERE, 'field', 'cut', f'{nm}{i}.png'))
dst = os.path.join(HERE, '..', 'prototype', 'data', 'field_img.js')
with open(dst, 'w', encoding='utf-8') as fp:
    fp.write('/* フィールドの草木と物（2026-11-26、art/cut_field.py が作る）。大陸ごとに T＝木・L＝低い草花・R＝岩と地形・O＝人の物と小物 */\n')
    fp.write('const FIELD_IMG=' + json.dumps(data, separators=(',', ':')) + ';\n')
print(counts, sum(counts.values()), os.path.getsize(dst) // 1024, 'KB')
