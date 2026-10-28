"""Try several candidate start points for a segment on the SOURCE audio and print what Whisper hears from each —
pick the earliest start that doesn't include the tail of the previous (dropped) word.
usage: python3 test_starts.py <work_dir> <end_s> <start1> <start2> ..."""
import json, subprocess, sys, os
W, end = sys.argv[1], sys.argv[2]; os.makedirs(f'{W}/tst', exist_ok=True)
for st in sys.argv[3:]:
    name = 't' + st.replace('.', '_'); f = f'{W}/tst/{name}.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', st, '-to', end, '-i', f'{W}/clean48.wav', '-ac', '1', '-ar', '16000', f])
    subprocess.run(['uvx', '--python', '3.12', '--from', 'mlx-whisper', 'mlx_whisper', f, '--model', 'mlx-community/whisper-large-v3-turbo',
                    '--language', 'en', '--condition-on-previous-text', 'False', '--output-format', 'json', '--output-dir', f'{W}/tst'], capture_output=True)
    print(st, '|', ' '.join(s['text'].strip() for s in json.load(open(f'{W}/tst/{name}.json'))['segments']))
