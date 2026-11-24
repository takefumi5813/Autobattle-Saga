"""3段（立ち・攻撃・倒れ）に並べて描かせたドット絵を、段ごとの3枚に分ける（2026-11-24）。
使い方: python -I art/split_rows.py 入力.png 出力の頭（例 art/more-named-a）
背景（左上の色）と違う画素がある行を数え、背景だけの行のすき間で3つに分ける。出力は 頭-stand.png / 頭-attack.png / 頭-down.png
"""
import sys
import numpy as np
from PIL import Image

src, head = sys.argv[1], sys.argv[2]
NAMES = sys.argv[3].split(",") if len(sys.argv) > 3 else ["stand", "attack", "down"]   # 段の名前（2段なら 例 win1,win2）
im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(int)
bg = a[3, 3]
fg = (np.abs(a - bg).max(axis=2) > 18)
rows = fg.sum(axis=1) > 3
# 連続した「人のいる行」のかたまり
bands, start = [], None
for y, v in enumerate(rows):
    if v and start is None: start = y
    if not v and start is not None:
        if y - start > 12: bands.append((start, y))
        start = None
if start is not None: bands.append((start, len(rows)))
# 近いかたまりはつなぐ（武器の先などで切れたもの）。3つになるまで、いちばん近いすき間からつなぐ
while len(bands) > len(NAMES):
    gaps = [(bands[i + 1][0] - bands[i][1], i) for i in range(len(bands) - 1)]
    _, i = min(gaps)
    bands[i:i + 2] = [(bands[i][0], bands[i + 1][1])]
print("bands", bands)
for (y0, y1), name in zip(bands, NAMES):
    pad = 10
    out = im.crop((0, max(0, y0 - pad), im.width, min(im.height, y1 + pad)))
    out.save(f"{head}-{name}.png")
    print(name, out.size)
