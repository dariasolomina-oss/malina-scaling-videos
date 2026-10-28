"""AUDIT A CUT, piece by piece: for every edl segment print its length, how loud the audio is right at its start and end
(a loud edge = the cut goes through a sound -> clipped / choppy), and what Whisper hears in that piece ALONE
(catches fillers like "eh", leftover syllables and junk slivers that whole-file transcription hides).
usage: uv run --with numpy --with soundfile python audit_cut.py <work_dir>        (uses edl.json + clean48.wav)
Flags: SHORT (< 0.35 s), EDGE-IN / EDGE-OUT (> -45 dBFS in the 20 ms at the cut)."""
import json, os, subprocess, sys
import numpy as np, soundfile as sf

W = sys.argv[1]
edl = json.load(open(f'{W}/edl.json'))
x, sr = sf.read(f'{W}/clean48.wav'); x = x.mean(1) if x.ndim > 1 else x
db = lambda a, b: 20 * np.log10(np.sqrt((x[int(a * sr):int(b * sr)] ** 2).mean()) + 1e-9)
os.makedirs(f'{W}/audit', exist_ok=True)
t = 0
for i, (s, e) in enumerate(edl):
    f = f'{W}/audit/s{i:02d}.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(s), '-to', str(e), '-i', f'{W}/clean48.wav', '-ac', '1', '-ar', '16000', f])
    subprocess.run(['uvx', '--python', '3.12', '--from', 'mlx-whisper', 'mlx_whisper', f, '--model', 'mlx-community/whisper-large-v3-turbo',
                    '--language', 'en', '--condition-on-previous-text', 'False', '--output-format', 'json', '--output-dir', f'{W}/audit'], capture_output=True)
    try: txt = ' '.join(g['text'].strip() for g in json.load(open(f'{W}/audit/s{i:02d}.json'))['segments'])
    except Exception: txt = '?'
    ein, eout = db(s, s + 0.02), db(e - 0.02, e)
    flags = [k for k, c in (('SHORT', e - s < 0.35), ('EDGE-IN', ein > -45), ('EDGE-OUT', eout > -45)) if c]
    print(f'{i:2d} cut {t:6.2f}  src {s:7.2f}-{e:7.2f} ({e - s:4.2f}s)  in {ein:4.0f} out {eout:4.0f}  {" ".join(flags):22s} | {txt}')
    t += e - s
