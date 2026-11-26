"""一枚絵（ChatGPT で3人ずつ、単色の背景で描いた横長の絵）を、手で位置を決めずに切り分けて埋め込む（2026-11-26、新しい名のある30人）。
art/portraits/key-n3-<番号>.png と、art/portraits/n3_groups.json（番号ごとの3人の id）を使う。
3人は絵の幅を3等分した場所にいるものとして、それぞれの中で人物の形を探し、頭のてっぺんから顔の位置を決める。
切り抜きと埋め込みは cut_portraits.py と同じ（chroma_key / splice）。前からの絵も消さない。
使い方: python -I art/cut_portraits_auto.py art prototype/shintaku.html
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(__file__).parent))
import cut_portraits as CP   # noqa: E402


def cut_auto(art: Path):
    out_dir = art / "portraits"
    groups = json.loads((out_dir / "n3_groups.json").read_text(encoding="utf-8"))
    faces = {}
    for num, ids in groups.items():
        src = out_dir / f"key-n3-{num}.png"
        if not src.exists():
            print("skip", src.name); continue
        im = Image.open(src).convert("RGB")
        bg = im.getpixel((6, 6))
        I = np.asarray(im, dtype=np.int32)
        fg = np.abs(I - np.array(bg)).max(axis=2) > 60
        H = im.height
        W = round(H / (CP.OUT_H / CP.OUT_W))
        n = len(ids)
        for k, pid in enumerate(ids):
            l, r = round(im.width * k / n), round(im.width * (k + 1) / n)
            m = fg[:, l:r]
            rows = np.where(m.sum(axis=1) > 6)[0]
            top = int(rows[0]) if len(rows) else int(H * .08)
            band = m[top + int(H * .04): top + int(H * .16)]
            xs = np.where(band.any(axis=0))[0]
            fx = l + (int(xs.mean()) if len(xs) else (r - l) // 2)
            fy = top + int(H * .11)
            keep = Image.new("RGB", im.size, bg)
            keep.paste(im.crop((l, 0, r, H)), (l, 0))
            x0 = fx - W // 2
            win = Image.new("RGB", (W, H), bg)
            sx0, sx1 = max(0, x0), min(im.width, x0 + W)
            win.paste(keep.crop((sx0, 0, sx1, H)), (sx0 - x0, 0))
            win = CP.chroma_key(win, bg).resize((CP.OUT_W, CP.OUT_H), Image.LANCZOS)
            win.save(out_dir / f"{pid}.webp", "WEBP", quality=82, alpha_quality=70, method=6)
            faces[pid] = [round((fx - x0) / W, 3), round(fy / H, 3)]
            print(pid, faces[pid])
    # 顔の位置は、肌の色で探した値と手で直した値（n3_faces.json）を優先する（杖や頭飾りで頭のてっぺんを読み違えるため）
    fix = out_dir / "n3_faces.json"
    if fix.exists():
        faces.update(json.loads(fix.read_text(encoding="utf-8")))
    return faces


if __name__ == "__main__":
    art, html = Path(sys.argv[1]), Path(sys.argv[2])
    CP.splice(art, html, cut_auto(art))
