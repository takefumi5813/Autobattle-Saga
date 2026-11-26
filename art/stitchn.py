"""生成画像を、画面の写し（1〜4枚）から元の大きさでつなぎ直す（2026-11-26、stitch4.py の一般版）。
使い方: python -I art/stitchn.py 出力.png 幅 高さ 末尾:x:y [末尾:x:y ...]
  x,y は、その写しの左上が元の絵のどこに当たるか（右の写しは 幅-1314、下の写しは 高さ-846）。
  写しのうち 1314×846 の範囲を使う（下の66画素は拡張機能の印が出るので使わない）
"""
import sys, os, re
from PIL import Image
T = re.search(r"T = r'(.*)'", open(os.path.join(os.path.dirname(__file__), 'stitch4.py'), encoding='utf-8').read()).group(1)
out, W, H, *parts = sys.argv[1:]
W, H = int(W), int(H)
TW_, TH_ = 1314, 846
if parts and ':' not in parts[0]:   # 写しの使う大きさ（例 1347x836）。画面の大きさが変わったとき
    TW_, TH_ = map(int, parts[0].split('x')); parts = parts[1:]
files = os.listdir(T)
c = Image.new('RGB', (W, H))
for p in parts:
    s, x, y = p.split(':'); x, y = int(x), int(y)
    f = [n for n in files if s in n][0]
    t = Image.open(os.path.join(T, f)).convert('RGB')
    c.paste(t.crop((0, 0, min(TW_, W - x), min(TH_, H - y))), (x, y))
c.save(out)
print(out, c.size)
