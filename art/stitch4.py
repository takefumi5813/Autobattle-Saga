"""ChatGPT の生成画像（1536×1024）を、画面の写し4枚から元の大きさでつなぎ直す（2026-11-26）。
画面の写しは表示の0.891倍に縮むので、ページの上で絵を 1/0.891 倍に広げて四隅を写す（ブラウザ側の __tile(tx,ty)）。
写しの左上・右上・左下・右下は、元の絵の (0,0) (222,0) (0,178) (222,178) から 1314×846 の範囲。
使い方: python -I art/stitch4.py 出力.png 末尾1 末尾2 末尾3 末尾4   （末尾＝Claude のツールの保存先の写しの名前の末尾）
"""
import sys, os
from PIL import Image
T = r'\\?\C:\Users\tsuzu\.claude\projects\C--Users-tsuzu-AppData-Local-Claude-Data-claude-pzs8sxrjxfjjc-scratch-workspaces-cf78cd38-0543-4441-b759-fa2fd0ed03d3-f02a2a22-9b6b-4f3c-bb61-6952b7afc7f3-scratch-2026-11-24-5e7d08\7f9e2f45-3b6d-4183-b830-f7360689e14c\tool-results'
out, *suf = sys.argv[1:]
W, H, VW, VH = 1536, 1024, 1314, 846
files = os.listdir(T)
canvas = Image.new('RGB', (W, H))
for s, (x, y) in zip(suf, [(0, 0), (W - VW, 0), (0, H - VH), (W - VW, H - VH)]):
    f = [n for n in files if s in n][0]
    t = Image.open(os.path.join(T, f)).convert('RGB')
    canvas.paste(t.crop((0, 0, VW, VH)), (x, y))
canvas.save(out)
print(out, canvas.size)
