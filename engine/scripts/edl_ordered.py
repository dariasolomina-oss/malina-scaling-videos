"""Like edl.py, but keeps keep.json ORDER (edl.py sorts by source time, which silently undoes a take spliced
from earlier in the recording). Runs edl.py once per range.
usage: uv run --with numpy --with soundfile python edl_ordered.py clean48.wav keep.json edl.json"""
import json, subprocess, sys, tempfile
wav, keep, out = sys.argv[1:4]; EDL = sys.argv[4] if len(sys.argv) > 4 else __file__.replace('edl_ordered.py', 'edl.py'); K = json.load(open(keep)); E = []
for r in K:
    kf = tempfile.mktemp(suffix='.json'); ef = tempfile.mktemp(suffix='.json'); json.dump([r], open(kf, 'w'))
    subprocess.run(['python', EDL, wav, kf, ef], check=True, capture_output=True); E += json.load(open(ef))
json.dump(E, open(out, 'w')); t = 0
for s, e in E: print(f"src {s:7.2f}-{e:7.2f}  cut {t:6.2f}"); t += e - s
print(len(E), 'segments, total', round(t, 2))
