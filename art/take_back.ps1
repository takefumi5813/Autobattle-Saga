# 後ろ姿・前向きの取り込み（2026-11-24）。画面の写し4枚（左上・右上・左下・右下）の名前の末尾を渡すと、
# つないで art/more-back-<番号>.png にし、下の黒い帯を切り、上の段（back）と下の段（front）に分ける。
# 使い方: powershell -File art/take_back.ps1 <番号> <写し1> <写し2> <写し3> <写し4>
# 写しの置き場所は環境変数 SHOT_DIR で渡す（Claude のツールの保存先。長い道筋なので \\?\ を付ける）
param($n, $a, $b, $c, $d)
$dir = '\\?\' + $env:SHOT_DIR
$o = Join-Path $env:TEMP "take_back"; New-Item -ItemType Directory -Force $o | Out-Null
$i = 0; foreach ($s in $a, $b, $c, $d) { $f = Get-ChildItem -LiteralPath $dir | Where-Object Name -like "*$s*" | Select-Object -First 1; Copy-Item -LiteralPath $f.FullName "$o\t$i.jpg"; $i++ }
python -I art/stitch_tiles.py "art/more-back-$n.png" 1536 1024 1387 807 "$o\t0.jpg" "$o\t1.jpg" "$o\t2.jpg" "$o\t3.jpg"
python -I -c "from PIL import Image;import numpy as np;p='art/more-back-$n.png';im=Image.open(p).convert('RGB');a=np.asarray(im).astype(int);d=(a.max(axis=2)<40).mean(axis=1);ys=[y for y in range(600,a.shape[0]) if d[y]>.9];im.crop((0,0,im.width,(ys[0]-6) if ys else im.height)).save(p)"
python -I art/split_rows.py "art/more-back-$n.png" "art/more-back-$n" back,front
