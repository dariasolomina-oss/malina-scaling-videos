"""Build a jump-cut edit list from rough KEEP ranges: snaps every cut to real silence (energy of the clean voice)
and shortens pauses inside kept ranges.
usage: uv run --with numpy --with soundfile python edl.py clean48.wav keep.json edl.json
keep.json: [[start_s, end_s], ...] in SOURCE seconds (from words.py). Tweak MAXGAP/KEEPGAP for pacing."""
import json, sys, numpy as np, soundfile as sf
x, sr = sf.read(sys.argv[1]); x = x.mean(1) if x.ndim > 1 else x
KEEP = json.load(open(sys.argv[2]))
hop = int(0.01 * sr); n = len(x) // hop
env = 20 * np.log10(np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)
thr = np.percentile(env[env > -60], 70) - 16          # "silence" = 16 dB under typical speech
voiced = env > thr
PAD_IN, PAD_OUT, MAXGAP, KEEPGAP = 0.06, 0.10, 0.20, 0.10   # pauses > MAXGAP are cut down to KEEPGAP
edl = []
for a, b in KEEP:
    ia, ib = int(a * 100), int(b * 100); v = voiced[ia:ib]
    if not v.any(): continue
    idx = np.where(v)[0]; s = ia + idx[0]; e = ia + idx[-1] + 1
    seg_start = s; i = s
    while i < e:
        if voiced[i]: i += 1; continue
        j = i
        while j < e and not voiced[j]: j += 1
        if (j - i) / 100 > MAXGAP:
            edl.append([seg_start / 100 - PAD_IN, i / 100 + KEEPGAP / 2]); seg_start = j - int(KEEPGAP / 2 * 100)
        i = j
    edl.append([seg_start / 100 - PAD_IN, e / 100 + PAD_OUT])
edl.sort(); m = [edl[0]]
for s, e in edl[1:]:
    if s <= m[-1][1]: m[-1][1] = max(m[-1][1], e)
    else: m.append([s, e])
m = [[round(s, 3), round(e, 3)] for s, e in m if e - s > 0.12]
json.dump(m, open(sys.argv[3], 'w'))
t = 0
for s, e in m: print(f"src {s:7.2f}-{e:7.2f}  cut {t:6.2f}"); t += e - s
print(len(m), 'segments, total', round(t, 2), 's')
