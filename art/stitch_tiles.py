"""画面より大きい生成画像を、4枚の画面写しからつなぎ直す。
使い方: python -I art/stitch_tiles.py 出力.png 幅 高さ 窓幅 窓高 左上.jpg 右上.jpg 左下.jpg 右下.jpg
ChatGPT の画面に画像を等倍で置き、(0,0) (幅-窓幅,0) (0,高さ-窓高) (幅-窓幅,高さ-窓高) をずらして写したものを渡す。
"""
import sys
from PIL import Image

out, W, H, VW, VH = sys.argv[1], *map(int, sys.argv[2:6])
tiles = sys.argv[6:10]
dx, dy = max(0, W - VW), max(0, H - VH)
canvas = Image.new("RGB", (W, H))
for path, (x, y) in zip(tiles, [(0, 0), (dx, 0), (0, dy), (dx, dy)]):
    t = Image.open(path).convert("RGB")
    canvas.paste(t.crop((0, 0, min(VW, W - x), min(VH, H - y))), (x, y))
canvas.save(out)
print(out, canvas.size)
