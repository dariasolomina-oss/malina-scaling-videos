"""Burned-in caption words from a FIXED caption text + the cut's word timings.
Whisper words the same edited audio slightly differently on every pass ("$1000", "failruns", "an SQL"), which keeps
breaking caption_edits.json find/replace rules. Instead: write the correct caption paragraph once (<work>/caption_text.txt),
and this aligns it to the transcript's word times (difflib on normalised tokens). Unmatched caption words (the corrected
ones) get times spread between their matched neighbours, so every word stays near its spoken word.
usage: python3 align_captions.py <work>/final/cut.json <work>/caption_text.txt out_words.json [word=start ...]
       optional overrides pin a word index to a start time, e.g. 0=0.0 1=0.52 (from a verified window)."""
import difflib, json, re, sys

d = json.load(open(sys.argv[1]))
S = [[w['word'].strip(), w['start'], w['end']] for s in d['segments'] for w in s['words']]
T = open(sys.argv[2]).read().split()
n = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
sm = difflib.SequenceMatcher(None, [n(w[0]) for w in S], [n(w) for w in T], autojunk=False)
times = [None] * len(T)
for a, b, size in sm.get_matching_blocks():
    for k in range(size): times[b + k] = (S[a + k][1], S[a + k][2])
for o in sys.argv[4:]:
    i, st = o.split('='); times[int(i)] = (float(st), float(st) + 0.3)
i = 0
while i < len(T):
    if times[i] is None:
        j = i
        while j < len(T) and times[j] is None: j += 1
        a = times[i - 1][1] if i else 0.0; b = times[j][0] if j < len(T) else a + 0.4 * (j - i)
        step = (b - a) / (j - i + 1)
        for k in range(i, j): times[k] = (a + step * (k - i + 1) - step * 0.2, a + step * (k - i + 1) + step * 0.6)
        i = j
    else: i += 1
M = [[w, round(s, 3), round(e, 3)] for w, (s, e) in zip(T, times)]
for k in range(1, len(M)):
    if M[k][1] < M[k - 1][1]: M[k][1] = M[k - 1][1] + 0.05
json.dump(M, open(sys.argv[3], 'w'))
matched = {b + k for _, b, sz in sm.get_matching_blocks() for k in range(sz)}
print(len(M), 'words; interpolated:', [T[k] for k in range(len(T)) if k not in matched])
print('order ok:', all(M[k][1] <= M[k + 1][1] for k in range(len(M) - 1)))
