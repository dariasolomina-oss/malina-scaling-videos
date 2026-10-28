"""VALIDATE A CUT. Whole-file Whisper silently merges repeated words ("rule… rule"), so transcribe a window
around every join on its own and read them all. Any doubled word / half word = fix edl.json and re-render.
usage: python3 check_joins.py <work_dir>   (uses edl.json + cut_clean.wav)"""
import json, subprocess, sys, os
W = sys.argv[1]; edl = json.load(open(f'{W}/edl.json')); os.makedirs(f'{W}/joins', exist_ok=True)
t = 0; js = []
for s, e in edl[:-1]: t += e - s; js.append(t)
for i, j in enumerate(js):
    f = f'{W}/joins/j{i:02d}.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(max(0, j - 1.6)), '-to', str(j + 1.6), '-i', f'{W}/cut_clean.wav', '-ac', '1', '-ar', '16000', f])
    subprocess.run(['uvx', '--python', '3.12', '--from', 'mlx-whisper', 'mlx_whisper', f, '--model', 'mlx-community/whisper-large-v3-turbo',
                    '--language', 'en', '--condition-on-previous-text', 'False', '--output-format', 'json', '--output-dir', f'{W}/joins'], capture_output=True)
    d = json.load(open(f'{W}/joins/j{i:02d}.json'))
    print(f'join {i:2d} @ {j:6.2f}s  (src {edl[i][1]:.2f}|{edl[i+1][0]:.2f}): ' + ' '.join(s['text'].strip() for s in d['segments']))
