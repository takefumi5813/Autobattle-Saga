"""モック（mock/ff6mock.html）のドット絵のデータを、試作（prototype/shintaku.html）のフィールドにも写す。
使い方: python -I art/splice_field.py mock/ff6mock.html prototype/shintaku.html

モックで絵を差し替えたら（splice_data.py のあと）、これを回すと試作も同じ絵になる。
写すのは仲間・ポーズ・敵・背景の素材（HERO_IMG / POSE_IMG / ENEMY_IMG / BG_IMG と、その追加分）。世界地図は写さない。
試作の <script id="field-data"> ... </script> の中身を丸ごと置き換える。
"""
import re, sys
from pathlib import Path

mock, proto = Path(sys.argv[1]), Path(sys.argv[2])
lines = mock.read_text(encoding="utf-8").splitlines()
keep = []
for ln in lines:
    s = ln.lstrip()
    if s.startswith(("const HERO_IMG=", "const POSE_IMG=", "const ENEMY_IMG=", "const BG_IMG=",
                     "Object.assign(HERO_IMG", "Object.assign(POSE_IMG", "Object.assign(ENEMY_IMG")):
        keep.append(ln)
    elif s.startswith("for(const [k,v] of Object.entries({") and "data:image" in s:
        keep.append(ln)   # 勝利のポーズを POSE_IMG に足す行
body = "\n".join(keep)
html = proto.read_text(encoding="utf-8")
new, n = re.subn(r'(<script id="field-data">)(.*?)(</script>)', lambda m: m.group(1) + "\n" + body + "\n" + m.group(3), html, count=1, flags=re.S)
if not n:
    sys.exit('試作に <script id="field-data"></script> が見つからない')
proto.write_text(new, encoding="utf-8", newline="")
print("copied", len(keep), "lines,", len(body) // 1024, "KB")
