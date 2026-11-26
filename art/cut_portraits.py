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
    # 3人は「個性が薄い」と言われて描き直した版（2026-11-24。前の版は src-1-old.png）
    "src-1.png": dict(bottom=985, people=[
        ("gareth", 0, 645, 228, 255, [(488, 400, 645, 1024)]),   # ボルグの盾と毛皮を消す（肩の剣先は残す）
        ("borg", 488, 1083, 765, 220, [(488, 160, 634, 312)]),   # ガレスの剣先を消す
        ("erin", 1083, 1536, 1295, 300),
    ]),
    # 女性3人は「顔が同じすぎ」と言われて描き直した版
    "src-2.png": dict(bottom=1024, people=[
        ("mira", 0, 532, 215, 270),
        ("rio", 565, 1045, 735, 320),   # ミラの矢羽根が入らないように
        ("raz", 1058, 1536, 1215, 290),
    ]),
    "src-3.png": dict(bottom=1024, people=[
        ("aldo", 0, 548, 265, 245),
        ("kei", 566, 1095, 790, 235, [(566, 60, 615, 260), (1040, 640, 1095, 1024)]),  # アルドの斧の先を消す
        ("sera", 1095, 1536, 1310, 245),
    ]),
    # 町から来る信者（名前は毎回変わるので、職ごとに一人ずつの絵を使い回す。2026-11-24）
    "src-5.png": dict(bottom=988, people=[
        ("b_sword", 0, 470, 245, 240),
        ("b_tank", 470, 1025, 700, 215),
        ("b_mage", 1025, 1536, 1310, 270),
    ]),
    "src-6.png": dict(bottom=988, people=[
        ("b_hunter", 0, 470, 230, 215),
        ("b_priest", 470, 1040, 780, 200),
        ("b_thief", 1040, 1536, 1270, 235),
    ]),
    # 新しい名のある人物（2026-11-24）
    "src-7.png": dict(bottom=1024, people=[
        ("sigrun", 0, 560, 205, 235),
        ("halvar", 560, 1085, 745, 250),
        ("toki", 1085, 1536, 1360, 230),
    ]),
    "src-8.png": dict(bottom=1024, people=[
        ("hozuki", 0, 465, 225, 250),
        ("zaid", 465, 1065, 715, 230),
        ("najma", 1065, 1536, 1350, 215),
    ]),
    "src-9.png": dict(bottom=1024, people=[
        ("koko", 0, 470, 300, 300),
        ("ilse", 470, 1000, 775, 235),
        ("dorn", 1000, 1536, 1255, 200),
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

def knock_out2(win, bg):
    """背景をきれいに抜く（2026-11-26 作り直し。オーナー「後ろがうまく抜けてなくてがたがた」）。
    前の knock_out は背景（紺）との差が7未満だけを抜いていたので、髪のすき間や輪郭に紺が残ってガタガタだった。
    背景は (22,26,37) 前後のとても暗い紺で、服の暗い影と明るさが近い。見分けるのは「青み」（青−赤 が15ほど）。
    1. 前と同じく、差7未満で外枠につながる所と大きな溜まりを「確かな背景」にする
    2. そこから12画素以内で、背景に近く（差22未満）青みのある所へ広げる（輪郭に残った紺の縁）
    3. 髪のすき間のような閉じた小さな溜まりも、青みがあって背景に近ければ抜く
    4. 境目の帯だけ、元の絵の明るさを手がかりに透け具合をなめらかにし（ガイデッドフィルタ）、縁の紺を差し引く"""
    import numpy as np
    from scipy import ndimage
    I = np.asarray(win, dtype=np.float32)
    H, W, _ = I.shape
    b0 = np.array(bg, dtype=np.float32)
    dist = np.abs(I - b0).max(axis=2)
    blue = (I[..., 2] - I[..., 0]) > 8
    ones = np.ones((H, W))
    lab, n = ndimage.label(dist < 7)
    sizes = ndimage.sum(ones, lab, range(1, n + 1))
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    out = np.isin(lab, [i + 1 for i, s_ in enumerate(sizes) if (i + 1) in edge or s_ > 1500])
    # 2. 輪郭の紺の縁へ広げる
    near = ndimage.binary_dilation(out, iterations=12)
    soft = (dist < 22) & blue
    grow = ndimage.binary_propagation(out, mask=out | (soft & near))
    # 3. 閉じた紺の溜まり
    lab2, m = ndimage.label((dist < 11) & blue & ndimage.binary_dilation(out, iterations=24))   # 輪郭の近くだけ（青い服の中に穴をあけない）
    if m:
        s2 = ndimage.sum(ones, lab2, range(1, m + 1))
        grow |= np.isin(lab2, [i + 1 for i, s_ in enumerate(s2) if s_ >= 25])
    # 隣の人の切れ端（本体から離れた小さな塊）
    fl, k = ndimage.label(~grow)
    if k > 1:
        fs = ndimage.sum(ones, fl, range(1, k + 1))
        grow |= np.isin(fl, [i + 1 for i, s_ in enumerate(fs) if s_ < fs.max() * 0.04])
    a = (~grow).astype(np.float32)
    # 4. 境目をなめらかに
    band = ndimage.binary_dilation(grow, iterations=2) & ndimage.binary_dilation(~grow, iterations=2)
    pre = np.clip((dist - 6) / 26, 0, 1)
    a0 = np.where(band, np.minimum(np.maximum(a, 0.0) * 0 + pre, 1), a)
    g = I.mean(axis=2) / 255.0
    box = lambda x, r: ndimage.uniform_filter(x, 2 * r + 1)
    r, eps = 2, 1e-3
    mI, mp = box(g, r), box(a0, r)
    A = (box(g * a0, r) - mI * mp) / (box(g * g, r) - mI * mI + eps)
    Bc = mp - A * mI
    q = np.clip(box(A, r) * g + box(Bc, r), 0, 1)
    a = np.where(band, q, a)
    a[a < 0.05] = 0
    kk = np.maximum(a, 1e-3)[..., None]
    F = np.where(kk > 0.1, np.clip((I - b0 * (1 - kk)) / kk, 0, 255), I)
    rgba = np.dstack([F, a * 255]).round().astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")

def chroma_key(win, key):
    """単色の背景（緑 #00FF00 か 赤紫 #FF00FF）で描き直させた絵を抜く（2026-11-26。オーナー「全然ダメ。背景を描き直させる必要があるのでは」）。
    緑なら「緑の出っ張り」＝G−max(R,B)、赤紫なら min(R,B)−G で背景らしさを測り、なだらかに透かす。
    縁に残る背景色のにじみ（緑かぶり・赤紫かぶり）は、その色の出っ張りを削って戻す"""
    import numpy as np
    from scipy import ndimage
    I = np.asarray(win, dtype=np.float32)
    R, G, B = I[..., 0], I[..., 1], I[..., 2]
    green = key[1] > key[0]
    ex = G - np.maximum(R, B) if green else np.minimum(R, B) - G
    a = 1 - np.clip((ex - 28) / (110 - 28), 0, 1)
    # 外枠から離れた背景の溜まり（腕と体のすき間など）も抜く。人物の中の小さな色は残す
    bgm = ex > 70
    lab, n = ndimage.label(bgm)
    if n:
        sz = ndimage.sum(np.ones_like(ex), lab, range(1, n + 1))
        edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        pass   # 髪のすき間のような閉じた溜まりも、背景の色そのものなので抜く（服の緑はくすんでいて、ここまで鮮やかではない）
    # 切れ端を消す：左右の端にかかった隣の人の切れ端と、ごく小さな粒（宙に投げた銅貨のような離れた物は残す）
    lab2, m = ndimage.label(a > 0.5)
    if m > 1:
        fs = ndimage.sum(np.ones_like(a), lab2, range(1, m + 1))
        side = set(np.unique(np.concatenate([lab2[:, 0], lab2[:, -1]]))) - {0}
        big = int(np.argmax(fs)) + 1
        drop = [i + 1 for i, s_ in enumerate(fs) if (i + 1) != big and (s_ < 150 or ((i + 1) in side and s_ < fs.max() * 0.08))]
        a[ndimage.binary_dilation(np.isin(lab2, drop), iterations=2)] = 0
    a = ndimage.gaussian_filter(a, 0.6)
    a[a < 0.03] = 0
    # にじみ取り：半ば透ける縁は、背景色を差し引いて元の色に戻す。そのうえで背景色の出っ張りを削る
    K = np.array(key, dtype=np.float32)
    k3 = np.maximum(a, 1e-3)[..., None]
    O = np.where((k3 > 0.05) & (k3 < 0.97), np.clip((I - K * (1 - k3)) / k3, 0, 255), I)
    R2, G2, B2 = O[..., 0], O[..., 1], O[..., 2]
    if green:
        O[..., 1] = np.minimum(G2, np.maximum(R2, B2) + 2)
    else:
        lim = np.maximum(G2 + 4, np.minimum(R2, B2) * 0)
        ex2 = (np.minimum(R2, B2) - G2).clip(0)
        O[..., 0] = R2 - ex2 * 0.9
        O[..., 2] = B2 - ex2 * 0.9
    rgba = np.dstack([O, a * 255]).round().clip(0, 255).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")

def cut(art: Path):
    faces = {}
    out_dir = art / "portraits"
    for name, cfg in SHEETS.items():
        src = out_dir / name
        key = out_dir / name.replace("src-", "key-")   # 単色の背景で描き直させた版があれば、そちらを使う
        if key.exists():
            src = key
        if not src.exists():
            print("skip", name); continue
        im = Image.open(src).convert("RGB")
        bg = im.getpixel((6, 6))
        keyed = src == key
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
            win = (chroma_key(win, bg) if keyed else knock_out2(win, bg)).resize((OUT_W, OUT_H), Image.LANCZOS)
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
