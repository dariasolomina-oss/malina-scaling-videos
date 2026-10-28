"""Final transcript -> words.json for burned-in captions (+ used by srt.py).
Applies FIX (Whisper mishearings) and GRAMMAR (spoken phrase -> clean caption phrase; kept words keep their timing).
usage: python3 caption_words.py final_transcript.json edits.json out_words.json
edits.json: {"fix": {"way,": "rate,"}, "swap": [[...]], "grammar": [["spoken phrase as transcribed", "corrected phrase"], ...]}
  swap    = same number of words, replaced 1:1 so every word keeps its exact timing (prefer this).
  grammar = free rewrite; words that don't match a spoken word get estimated times, and a matching word
            later in the phrase can be grabbed out of order ("the first three are the top…") — check the timings."""
import json, re, sys
d = json.load(open(sys.argv[1])); E = json.load(open(sys.argv[2]))
W = [[w['word'].strip(), round(w['start'], 3), round(w['end'], 3)] for s in d['segments'] for w in s['words']]
M = []
for w in W:
    w[0] = E.get('fix', {}).get(w[0], w[0])
    if w[0] in ('%', '%.') and M: M[-1][0] += w[0]; M[-1][2] = w[2]
    else: M.append(w)
norm = lambda s: re.sub(r'\W', '', s).lower()
for spoken, fixed in E.get('swap', []):
    sp, fx = spoken.split(), fixed.split(); assert len(sp) == len(fx), f'swap needs equal word counts: {spoken}'
    toks = [w[0] for w in M]; idx = next((i for i in range(len(toks) - len(sp) + 1) if toks[i:i + len(sp)] == sp), None)
    if idx is None: print('SWAP NOT FOUND:', spoken); continue
    for k, f in enumerate(fx): M[idx + k][0] = f
for spoken, fixed in E.get('grammar', []):
    sp = spoken.split(); n = len(sp); toks = [w[0] for w in M]
    idx = next((i for i in range(len(toks) - n + 1) if toks[i:i + n] == sp), None)
    if idx is None: print('NOT FOUND (check spelling vs transcript):', spoken); continue
    seg = M[idx:idx + n]; out = []; j = 0
    for f in fixed.split():
        k = j
        while k < len(seg) and norm(seg[k][0]) not in (norm(f), norm(f).rstrip('s')): k += 1
        if k < len(seg): out.append([f, seg[k][1], seg[k][2]]); j = k + 1
        else:
            st = out[-1][2] if out else seg[0][1]; out.append([f, st, max(seg[min(j, len(seg) - 1)][1], st + 0.15)]); j = min(j + 1, len(seg))
    M[idx:idx + n] = out
json.dump(M, open(sys.argv[3], 'w'))
print(' '.join(w[0] for w in M))
