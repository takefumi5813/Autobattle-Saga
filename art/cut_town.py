"""町の絵（2026-11-26）。art/town/c?b.png（建物12）と c?n.png（自然・小物15＋地面2）を切り分け、
prototype/data/town_img.js（TOWN_IMG）に入れる。名前は c0b0〜c0b11・c0n0〜c0n16（並びは art/town_prompts.md）。
背景は緑か赤紫の一色（左上の色で見分ける）。塊を段に分け（中心の高さが大きく離れたら次の段）、段ごと左から番号を振る。
使い方: python -I art/cut_town.py
"""
import base64, io, json, os, glob
import numpy as np
from PIL import Image
from scipy import ndimage

SCALE = {'b': 0.33, 'n': 0.3}

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

def seamless(im):
    A = np.asarray(im.convert('RGBA'), dtype=np.float32); h, w = A.shape[:2]
    Bm = np.roll(np.roll(A, h // 2, axis=0), w // 2, axis=1)
    y = np.abs(np.linspace(-1, 1, h))[:, None]; x = np.abs(np.linspace(-1, 1, w))[None, :]
    wgt = np.clip((np.maximum(x, y) - .45) / .5, 0, 1)[..., None]
    C = A * (1 - wgt) + Bm * wgt; C[..., 3] = 255
    return Image.fromarray(C.round().astype(np.uint8), 'RGBA')

def cut(path, kind):
    O, a = key(Image.open(path))
    m = ndimage.binary_dilation(a > .5, structure=np.ones((5, 21)))
    if os.path.basename(path)[:3] in ('c4b', 'c4n', 'c2n'):   # 隣と近い絵（密林の建物・木、八洲の木）は、つながず切る
        m = ndimage.binary_dilation(a > .5, structure=np.ones((3, 5)))
    lab, n = ndimage.label(m)
    boxes = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        ys, xs = sl
        if (ys.stop - ys.start) * (xs.stop - xs.start) < 3000: continue
        boxes.append([ys.start, xs.start, ys.stop, xs.stop, i + 1])
    boxes.sort(key=lambda b: (b[0] + b[2]) / 2)
    rows = []
    for b in boxes:
        cy = (b[0] + b[2]) / 2
        if rows and abs(cy - np.mean([(x[0] + x[2]) / 2 for x in rows[-1]])) < 120:
            rows[-1].append(b)
        else:
            rows.append([b])
    out = []
    for r in rows:
        for b in sorted(r, key=lambda b: b[1]):
            y0, x0, y1, x1, li = b
            x0 += 8; x1 -= 8
            mask = lab[y0:y1, x0:x1] == li
            rgba = np.dstack([O[y0:y1, x0:x1], a[y0:y1, x0:x1] * mask * 255]).astype(np.uint8)
            out.append(Image.fromarray(rgba, 'RGBA'))
    print(path, [len(r) for r in rows], len(out))
    return out

def main():
    enc = {}
    os.makedirs('art/town/cut', exist_ok=True)
    for path in sorted(glob.glob('art/town/c?[bn].png')):
        base = os.path.basename(path)[:-4]; cont, kind = base[:2], base[2]
        for i, im in enumerate(cut(path, kind)):
            nm = f'{cont}{kind}{i}'
            if kind == 'n' and i >= 15:   # 地面の模様：縁を落として敷き詰められるように
                w, h = im.size; im = seamless(im.crop((12, 12, w - 12, h - 12)))
            sc = SCALE[kind]
            w, h = im.size
            sm = im.resize((max(1, round(w * sc)), max(1, round(h * sc))), Image.LANCZOS)
            al = np.asarray(sm)[..., 3]
            if kind == 'b' or i < 15:   # 余白を詰める
                ys, xs = np.where(al > 10)
                if len(ys): sm = sm.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
            sm.save(f'art/town/cut/{nm}.png')
            b = io.BytesIO(); sm.save(b, 'PNG', optimize=True)
            enc[nm] = 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
    js = '/* 町の絵（art/cut_town.py が作る。手で直さない） */\nconst TOWN_IMG=' + json.dumps(enc, separators=(',', ':')) + ';\n'
    open('prototype/data/town_img.js', 'w', encoding='utf-8').write(js)
    print('TOWN_IMG', len(enc), len(js) // 1024, 'KB')

main()
