"""オープニングの絵の取り込み（2026-11-26）。
ChatGPT の画面いっぱいに置いた絵の写し（Claude のツールの保存先）を、名前の末尾で探し、黒い余白を切って
art/opening/<名>.png と prototype/opening/<名>.webp にする。
使い方: python -I art/op_take.py <写しの置き場所> <写しの名前の末尾> <名 例 rio-01>
"""
import sys, os, glob
from PIL import Image
import numpy as np

src_dir, suffix, name = sys.argv[1:4]
d = src_dir.replace('/', '\\')
if not d.startswith('\\\\?\\'):
    d = '\\\\?\\' + d
files = [f for f in os.listdir(d) if suffix in f]
im = Image.open(os.path.join(d, files[0])).convert('RGB')
a = np.asarray(im).astype(int).max(axis=2)
cols = np.where((a > 24).mean(axis=0) > .2)[0]
rows = np.where((a > 24).mean(axis=1) > .2)[0]
im = im.crop((cols[0], rows[0], cols[-1] + 1, rows[-1] + 1))
os.makedirs('art/opening', exist_ok=True)
os.makedirs('prototype/opening', exist_ok=True)
im.save(f'art/opening/{name}.png')
im.save(f'prototype/opening/{name}.webp', quality=86, method=6)
print(name, im.size, os.path.getsize(f'prototype/opening/{name}.webp') // 1024, 'KB')
