#!/bin/sh
# 歩きのコマの取り込み（2026-11-26）：sh art/take_walk.sh <組> <向き> <写しの名前の末尾>
# 写しから絵の範囲を切り（take_field.py）、人物ごとの段に分ける（split_rows.py → art/more-walk-<組>-<向き>-<id>.png）。そのあと cut_more.py → splice_field.py
set -e
G=$1; D=$2; SUF=$3
python -I art/take_field.py ../more-walk-$G-$D $SUF
# 写しの右下に出るマウスの矢印を消す（絵の右下の隅は人物がいない）
python -I -c "from PIL import Image,ImageDraw;p='art/more-walk-$G-$D.png';im=Image.open(p).convert('RGB');bg=im.getpixel((3,3));ImageDraw.Draw(im).rectangle((im.width-120,im.height-90,im.width,im.height),fill=bg);im.save(p)"
NAMES=$(python -I -c "import json;print(','.join(json.load(open('art/walk_groups.json'))['$G']))")
python -I art/split_rows.py art/more-walk-$G-$D.png art/more-walk-$G-$D $NAMES
