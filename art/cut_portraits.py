"""管理画面用の一枚絵（ChatGPT で3人ずつ描いた横長の絵）を、一人ずつ縦長に切り分けて、プロトタイプに埋め込む。
使い方: python -I art/cut_portraits.py art prototype/shintaku.html

SHEETS の各人物: (id, 左端, 右端, 顔の中心x, 顔の中心y[, 消す四角のリスト])
  左端〜右端 の外側は背景色で塗る（隣の人の盾やマントが入らないように）。
  顔の中心を横の真ん中にして、縦横比 1:1.6 で切り出す。
"""
import base64, io, json, re, sys
from pathlib import Path
from PIL import Image

OUT_W, OUT_H = 540, 864
SHEETS = {
    "src-1.png": dict(bottom=955, people=[
        ("gareth", 0, 495, 235, 265),
        ("borg", 497, 1090, 765, 215),
        ("erin", 1092, 1536, 1290, 330),
    ]),
    # 女性3人は「顔が同じすぎ」と言われて描き直した版
    "src-2.png": dict(bottom=1024, people=[
        ("mira", 0, 532, 215, 270),
        ("rio", 540, 1045, 735, 320),
        ("raz", 1058, 1536, 1215, 290),
    ]),
    "src-3.png": dict(bottom=1024, people=[
        ("aldo", 0, 566, 265, 245),
        ("kei", 566, 1095, 790, 235, [(566, 60, 615, 260)]),  # アルドの斧の先を消す
        ("sera", 1095, 1536, 1310, 245),
    ]),
    "src-4.png": dict(bottom=1024, people=[
        ("tohma", 0, 770, 300, 200),
        ("noa", 780, 1536, 1250, 215),
    ]),
}

def knock_out(win, bg):
    """背景（紺の一色）を透明にする（2026-11-24：管理画面を明るい灰の地にしたため）。
    外枠につながっている背景色だけを抜く（服の暗い影は残す）。縁は色の差でなだらかに透かし、紺のにじみを取り除く。"""
    import numpy as np
    from PIL import ImageDraw, ImageFilter
    a = np.asarray(win, dtype=np.float32)
    b = np.array(bg, dtype=np.float32)
    dist = np.abs(a - b).max(axis=2)
    from scipy import ndimage
    lab, n = ndimage.label(dist < 7)
    sizes = ndimage.sum(np.ones_like(dist), lab, range(1, n + 1))
    edge = set(np.unique(np.concatenate([lab[0], lab[:, 0], lab[:, -1]]))) - {0}
    # 外枠につながる背景と、弓の弦の内側のような大きな背景の溜まり（1500画素以上）を抜く
    keep_bg = [i + 1 for i, s in enumerate(sizes) if (i + 1) in edge or s > 1500]
    out = np.isin(lab, keep_bg)
    # 隣の人の切れ端（本体から離れた小さな塊）も消す
    fl, m = ndimage.label(~out)
    if m > 1:
        fs = ndimage.sum(np.ones_like(dist), fl, range(1, m + 1))
        out |= np.isin(fl, [i + 1 for i, s in enumerate(fs) if s < fs.max() * 0.04])
    near = np.asarray(Image.fromarray((out * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    alpha = np.ones(dist.shape, np.float32)
    alpha[near] = np.clip((dist[near] - 6) / 22, 0, 1)
    alpha[out] = 0
    k = np.maximum(alpha, 1e-3)[..., None]
    rgb = np.where(k > 0.35, np.clip((a - b * (1 - k)) / k, 0, 255), a)
    rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")

def cut(art: Path):
    faces = {}
    out_dir = art / "portraits"
    for name, cfg in SHEETS.items():
        src = out_dir / name
        if not src.exists():
            print("skip", name); continue
        im = Image.open(src).convert("RGB")
        bg = im.getpixel((6, 6))
        H = cfg["bottom"]
        W = round(H / (OUT_H / OUT_W))
        for pid, l, r, fx, fy, *rest in cfg["people"]:
            keep = Image.new("RGB", im.size, bg)
            keep.paste(im.crop((l, 0, r, H)), (l, 0))
            for box in (rest[0] if rest else []):   # 隣の人の持ち物がはみ出す所は背景色で消す
                keep.paste(bg, box)
            x0 = fx - W // 2
            win = Image.new("RGB", (W, H), bg)
            sx0, sx1 = max(0, x0), min(im.width, x0 + W)
            win.paste(keep.crop((sx0, 0, sx1, H)), (sx0 - x0, 0))
            win = knock_out(win, bg).resize((OUT_W, OUT_H), Image.LANCZOS)
            win.save(out_dir / f"{pid}.webp", "WEBP", quality=82, alpha_quality=70, method=6)
            faces[pid] = [round((fx - x0) / W, 3), round(fy / H, 3)]
            print(pid, (out_dir / f"{pid}.webp").stat().st_size // 1024, "KB", faces[pid])
    return faces

def splice(art: Path, html: Path, faces):
    out_dir = art / "portraits"
    data = {}
    for p in sorted(out_dir.glob("*.webp")):
        data[p.stem] = "data:image/webp;base64," + base64.b64encode(p.read_bytes()).decode()
    # 前回の FACE も残す（今回切らなかった絵の分）
    s = html.read_text(encoding="utf-8")
    m = re.search(r"^const FACE=(\{.*\});$", s, re.M)
    old = json.loads(m.group(1)) if m and m.group(1) != "{}" else {}
    old.update(faces)
    old = {k: v for k, v in old.items() if k in data}
    s = re.sub(r"^const PORT_AR=.*$", f"const PORT_AR={OUT_H/OUT_W};", s, count=1, flags=re.M)
    s = re.sub(r"^const FACE=.*$", lambda _: "const FACE=" + json.dumps(old, separators=(",", ":")) + ";", s, count=1, flags=re.M)
    s = re.sub(r"^const PORTRAIT=.*$", lambda _: "const PORTRAIT=" + json.dumps(data, separators=(",", ":")) + ";", s, count=1, flags=re.M)
    html.write_text(s, encoding="utf-8", newline="")
    print("embedded", len(data), "portraits,", sum(len(v) for v in data.values()) // 1024, "KB")

if __name__ == "__main__":
    art, html = Path(sys.argv[1]), Path(sys.argv[2])
    splice(art, html, cut(art))
