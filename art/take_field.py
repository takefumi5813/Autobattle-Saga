"""ChatGPT の絵を画面いっぱいに出して写した写し（ツールの保存先の最新、または末尾を指定）から、絵の範囲だけを切って art/field/<名>.png に保存する。
使い方: python -I art/take_field.py <名> [写しの名前の末尾]（2026-11-26、フィールドの草木と物）"""
import sys, os, glob
from PIL import Image
import numpy as np
T = r'C:/Users/tsuzu/.claude/projects/C--Users-tsuzu-AppData-Local-Claude-Data-claude-pzs8sxrjxfjjc-scratch-workspaces-cf78cd38-0543-4441-b759-fa2fd0ed03d3-f02a2a22-9b6b-4f3c-bb61-6952b7afc7f3-scratch-2026-11-24-5e7d08/7f9e2f45-3b6d-4183-b830-f7360689e14c/tool-results'
T = '\\\\?\\' + os.path.normpath(T)   # 長い道筋なので先頭に \\?\ を付ける（Windows）
name = sys.argv[1]
fs = sorted([os.path.join(T, n) for n in os.listdir(T) if 'claude-in-chrome-blob' in n and n.endswith('.jpg')], key=os.path.getmtime)
f = [x for x in fs if sys.argv[2] in x][0] if len(sys.argv) > 2 else fs[-1]
im = Image.open(f).convert('RGB'); A = np.asarray(im).astype(int)
# 絵の範囲：黒い余白（右と下）を除く
dark = A.sum(2) < 40
cols = np.where(~dark.all(0))[0]; rows = np.where(~dark.all(1))[0]
box = (cols[0] + 2, rows[0] + 2, cols[-1] - 3, rows[-1] - 4)   # 縁の1〜2画素は写しの継ぎ目で暗いので落とす（人物をつないでしまう）
out = os.path.join(os.path.dirname(__file__), 'field', name + '.png')
im.crop(box).save(out); print(out, box, os.path.basename(f)[-20:])
