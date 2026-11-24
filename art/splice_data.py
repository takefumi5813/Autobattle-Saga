"""切り抜きスクリプトが出したデータ（art/sprites/*.js）を、モック（mock/ff6mock.html）の該当する行に差し替える。

使い方: python -I art/splice_data.py
切り抜き直したあと（大きさを変えたときなど）に回す。モックの中で、同じ書き出しの行を丸ごと入れ替える。
"""
import sys

MOCK = "mock/ff6mock.html"
FILES = ["sprites.js", "poses.js", "extra.js", "win.js", "enemies.js", "enemy_poses.js", "bg.js", "world.js"]
PREFIXES = ["const HERO_IMG=", "const POSE_IMG=", "Object.assign(HERO_IMG,", "Object.assign(POSE_IMG,",
            "for(const [k,v] of Object.entries(", "const ENEMY_IMG=", "Object.assign(ENEMY_IMG,", "const BG_IMG=", "const WORLD_IMG="]

lines = open(MOCK, encoding="utf-8").read().split("\n")
for fn in FILES:
    for dl in open(f"art/sprites/{fn}", encoding="utf-8").read().split("\n"):
        pre = next((p for p in PREFIXES if dl.startswith(p)), None)
        if not pre:
            continue
        idx = [i for i, l in enumerate(lines) if l.startswith(pre)]
        if len(idx) != 1:
            print("見つからない、または複数ある:", fn, pre, len(idx)); sys.exit(1)
        if lines[idx[0]] != dl:
            lines[idx[0]] = dl; print("差し替え:", fn, pre)
open(MOCK, "w", encoding="utf-8", newline="").write("\n".join(lines))
