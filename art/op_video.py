"""オープニング（紙芝居）を mp4 に書き出す（2026-11-26）。ゲームの playOpening と同じ動き・同じ間（ま）。
台本は prototype/data/opening.js の OPENING をそのまま読む。絵は prototype/opening/<名>-NN.webp、曲は prototype/audio/。
使い方: python -I art/op_video.py rio   （→ opening-video/rio.mp4）
"""
import sys, re, os, subprocess, math
from PIL import Image, ImageDraw, ImageFont

K = sys.argv[1]
W, H, FPS = 1280, 720, 24
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'prototype/data/opening.js'), encoding='utf-8').read()

# --- 台本を読む ---
blk = src[src.index(f'  {K}:{{title:'):]
head = re.match(r"\s*\w+:\{title:'([^']*)',sub:'([^']*)',bgm:'(\w+)',scenes:\[", blk)
TITLE, SUB, BGM0 = head.groups()
body = blk[head.end():blk.index(']},')]
SC = []
for m in re.finditer(r"\{i:(\d+),z:'(\w+)'(.*?)t:'([^']*)'\}", body):
    i, z, mid, t = m.groups()
    at = re.search(r"at:\[([\d.]+),([\d.]+)\]", mid)
    bgm = re.search(r"bgm:'(\w+)'", mid)
    SC.append(dict(i=int(i), z=z, at=(float(at[1]), float(at[2])) if at else (.5, .5),
                   card='card:1' in mid, bgm=bgm[1] if bgm else None, end='end:1' in mid, mv='mv:1' in mid, t=t))

dur = lambda s: max(10, 6.5 + len(s['t'].replace('｜', '')) * .2)
TITLE_T, FADE, CARD, ENDT, CPS = 5, 1.4, 1.1, 6, 14

imgs = {}
for s in SC:
    if s['i'] not in imgs:
        imgs[s['i']] = Image.open(os.path.join(ROOT, f"prototype/opening/{K}-{s['i']:02d}.webp")).convert('RGB')

# --- 動く山場（2026-11-26）：mv:1 の場面から、Gemini の動画のコマを使う。終わったら最後のコマのまま、同じ絵の後の場面も ---
MV = {}
for s in SC:
    if s['mv'] and s['i'] not in MV:
        src = os.path.join(ROOT, f"art/opening-motion/{K}-{s['i']:02d}.mp4")
        if not os.path.exists(src): continue
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', 'fps=24,scale=1280:-2', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
        pr = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout.strip().split(',')
        vw, vh = 1280, round(1280 * int(pr[1]) / int(pr[0]) / 2) * 2
        n = len(raw) // (vw * vh * 3)
        MV[s['i']] = dict(src=src, frames=[Image.frombytes('RGB', (vw, vh), raw[k * vw * vh * 3:(k + 1) * vw * vh * 3]) for k in range(n)], start=None)
def frame_of(s, el):
    '''その場面で使う絵：動画が始まっていればそのコマ、まだなら元の絵'''
    m = MV.get(s['i'])
    if not m or m['start'] is None: return imgs[s['i']]
    k = int((starts[SC.index(s)] + el - m['start']) * 24)
    return m['frames'][max(0, min(len(m['frames']) - 1, k))]

def cam(s, p):
    e = min(1, max(0, p)); q = e * e * (3 - 2 * e) * .6 + e * .4; ax, ay = s['at']; z, x, y = 1.06, .5, .5
    if s['z'] == 'in': z = 1.04 + .16 * q; x = .5 + (ax - .5) * q; y = .5 + (ay - .5) * q
    elif s['z'] == 'out': z = 1.2 - .16 * q; x = ax + (.5 - ax) * q; y = ay + (.5 - ay) * q
    elif s['z'] == 'l': z = 1.14; x = .62 - .24 * q
    elif s['z'] == 'r': z = 1.14; x = .38 + .24 * q
    elif s['z'] == 'up': z = 1.14; y = .64 - .28 * q
    elif s['z'] == 'down': z = 1.14; y = .36 + .28 * q
    return z, x, y

def shot(s, p, el=None):
    im = imgs[s['i']] if el is None else frame_of(s, el); iw, ih = im.size; z, x, y = cam(s, p)
    base = max(W / iw, H / ih) * z; dw, dh = iw * base, ih * base
    dx = min(0, max(W - dw, W / 2 - x * dw)); dy = min(0, max(H - dh, H / 2 - y * dh))
    box = (-dx / base, -dy / base, (-dx + W) / base, (-dy + H) / base)
    return im.resize((W, H), Image.BILINEAR, box=box)

# 周りを暗く
vig = Image.new('L', (W, H)); vd = vig.load()
r0, r1 = min(W, H) * .35, max(W, H) * .75
for yy in range(0, H, 4):
    for xx in range(0, W, 4):
        d = math.hypot(xx - W / 2, (yy - H * .47))
        a = int(255 * .55 * min(1, max(0, (d - r0) / (r1 - r0))))
        for j in range(4):
            for i2 in range(4):
                if xx + i2 < W and yy + j < H: vd[xx + i2, yy + j] = a
BLACK = Image.new('RGB', (W, H))
def vignette(fr): return Image.composite(BLACK, fr, vig)

FS = 30
font = ImageFont.truetype('C:/Windows/Fonts/yumin.ttf', FS)
fontT = ImageFont.truetype('C:/Windows/Fonts/yumindb.ttf', 48)
fontS = ImageFont.truetype('C:/Windows/Fonts/yumindb.ttf', 22)
bands = {}
def band(nl):
    if nl not in bands:
        lh = FS * 1.75; bh = nl * lh + FS * 2.2; top = H - bh - FS * 2
        m = Image.new('L', (W, H)); md = ImageDraw.Draw(m)
        for yy in range(int(top), H):
            f = (yy - top) / (H - top); a = .62 * f / .35 if f < .35 else .62 + (.85 - .62) * (f - .35) / .65
            md.line([(0, yy), (W, yy)], fill=int(255 * min(.85, a)))
        bands[nl] = m
    return bands[nl]
BAND_C = Image.new('RGB', (W, H), (8, 6, 4))
def text(fr, s, n):
    lines = s['t'].split('｜'); fr = Image.composite(BAND_C, fr, band(len(lines)))
    d = ImageDraw.Draw(fr); lh = FS * 1.75; bh = len(lines) * lh + FS * 2.2
    wmax = max(d.textlength(l, font=font) for l in lines); x0 = max(FS, (W - wmax) / 2); left = n
    for k, l in enumerate(lines):
        sh = l if left >= len(l) else l[:max(0, left)]; left -= len(l); y = H - bh + FS * .9 + k * lh
        d.text((x0 + 1.5, y + 1.5), sh, font=font, fill=(0, 0, 0)); d.text((x0, y), sh, font=font, fill=(239, 228, 204))
    return fr

def center(d, y, s, f, col):
    w = d.textlength(s, font=f); d.text(((W - w) / 2, y), s, font=f, fill=col)

def card(a, main, sub, big=False):
    fr = Image.new('RGB', (W, H)); d = ImageDraw.Draw(fr)
    c = lambda rgb: tuple(int(v * a) for v in rgb)
    if big:
        f = ImageFont.truetype('C:/Windows/Fonts/yumindb.ttf', 64)
        center(d, H / 2 - 50, main, f, c((239, 228, 204))); center(d, H / 2 + 40, sub, fontS, c((201, 168, 90)))
    else:
        center(d, H / 2 - 80, sub, fontS, c((201, 168, 90))); center(d, H / 2 - 30, main, fontT, c((239, 228, 204)))
        d.line([(W / 2 - 120, H / 2 + 40), (W / 2 + 120, H / 2 + 40)], fill=c((161, 134, 72)))
    return fr

# --- 時間割 ---
starts = []; t = TITLE_T
for s in SC: starts.append(t); t += dur(s)
for k, s in enumerate(SC):
    if s['mv'] and s['i'] in MV and MV[s['i']]['start'] is None: MV[s['i']]['start'] = starts[k]
TOTAL = t + ENDT

out_dir = os.path.join(ROOT, 'opening-video'); os.makedirs(out_dir, exist_ok=True)
silent = os.path.join(out_dir, f'_{K}_v.mp4')
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                       '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', silent], stdin=subprocess.PIPE)
nf = int(TOTAL * FPS)
for f in range(nf):
    tt = f / FPS
    if tt < TITLE_T:
        a = min(1, tt / 1.2, max(0, (TITLE_T - tt) / 1)); fr = card(a, TITLE, SUB)
    elif tt < starts[-1] + dur(SC[-1]):
        idx = max(k for k in range(len(SC)) if starts[k] <= tt); s = SC[idx]; el = tt - starts[idx]; d = dur(s)
        fr = shot(s, el / d, el)
        if idx > 0 and el < (CARD if s['card'] else FADE):
            pv = SC[idx - 1]; pd = dur(pv); pf = shot(pv, (dur(pv) + el) / pd, dur(pv) + el)
            if s['card']:
                q = el / CARD; e2 = q * q * (3 - 2 * q); off = int(e2 * (W + 24))
                if off < W:
                    fr.paste(pf.crop((off, 0, W, H)), (0, 0))
                    ImageDraw.Draw(fr).rectangle([W - off, 0, W - off + 18, H], fill=(0, 0, 0))
            else:
                fr = Image.blend(pf, fr, min(1, el / FADE))
        fr = vignette(fr); n = int((el - .6) * CPS)
        if n > 0: fr = text(fr, s, n)
        ImageDraw.Draw(fr).rectangle([0, H - 3, int(W * (idx + min(1, el / d)) / len(SC)), H], fill=(150, 142, 125))
    else:
        e = tt - (starts[-1] + dur(SC[-1])); fr = vignette(shot(SC[-1], 1, dur(SC[-1])))
        fr = Image.blend(fr, BLACK, min(1, e / 1.5))
        if e > 1.2:
            a = min(1, (e - 1.2) / 1.2, max(0, (ENDT - e) / .8)); c2 = card(a, '神託の迷宮', TITLE, True)
            fr = Image.fromarray(__import__('numpy').maximum(__import__('numpy').asarray(fr), __import__('numpy').asarray(c2)))
    ff.stdin.write(fr.tobytes())
ff.stdin.close(); ff.wait()

# --- 曲：場面の bgm に合わせて切り替え、0.8秒で重ねる ---
segs = []; cur = BGM0; t0 = 0
for k, s in enumerate(SC):
    if s['bgm'] and s['bgm'] != cur:
        segs.append((cur, t0, starts[k])); cur = s['bgm']; t0 = starts[k]
segs.append((cur, t0, TOTAL))
args = ['ffmpeg', '-y', '-loglevel', 'error', '-i', silent]
flt = []
for j, (b, a0, a1) in enumerate(segs):
    args += ['-stream_loop', '-1', '-i', os.path.join(ROOT, f'prototype/audio/{b}.mp3')]
    L = a1 - a0 + (0.8 if j < len(segs) - 1 else 0)
    fo = f',afade=t=out:st={L - 0.8 if j < len(segs) - 1 else L - 3}:d={0.8 if j < len(segs) - 1 else 3}'
    fi = ',afade=t=in:st=0:d=0.8' if j > 0 else ',afade=t=in:st=0:d=2'
    flt.append(f'[{j + 1}:a]atrim=0:{L},asetpts=PTS-STARTPTS,volume=0.6{fi}{fo},adelay={int(a0 * 1000)}|{int(a0 * 1000)}[a{j}]')
na = len(segs)
for m in MV.values():
    if m['start'] is None: continue
    args += ['-i', m['src']]; ms = int(m['start'] * 1000)
    flt.append(f'[{na + 1}:a]volume=0.7,adelay={ms}|{ms}[a{na}]'); na += 1
flt.append(''.join(f'[a{j}]' for j in range(na)) + f'amix=inputs={na}:normalize=0,atrim=0:{TOTAL}[aout]')
out = os.path.join(out_dir, f'{K}.mp4')
args += ['-filter_complex', ';'.join(flt), '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', out]
subprocess.run(args, check=True); os.remove(silent)
print(K, 'done', round(TOTAL), 's', os.path.getsize(out) // 1024 // 1024, 'MB')
