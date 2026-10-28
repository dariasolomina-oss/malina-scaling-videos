"""Print a transcript JSON (from transcribe.sh) as segments + words with times — for choosing KEEP ranges.
usage: uv run --with numpy python words.py transcript.json [from_s]"""
import json, sys
d = json.load(open(sys.argv[1])); t0 = float(sys.argv[2]) if len(sys.argv) > 2 else 0
for s in d['segments']:
    if s['end'] >= t0: print(f"{s['start']:7.2f}-{s['end']:7.2f} | {s['text'].strip()}")
print()
print(' '.join(f"{w['word'].strip()}[{w['start']:.2f}]" for s in d['segments'] for w in s.get('words', []) if w['start'] >= t0))
