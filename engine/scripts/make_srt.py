#!/usr/bin/env python3
"""Make an .srt subtitle file in the right format for horizontal or vertical video.

From a voiceover (transcribed with whisper.cpp, word timings):
    python3 make_srt.py horizontal voiceover.mp3 out.srt
    python3 make_srt.py vertical   voiceover.mp3 out.srt

From on-screen text, for videos with no voice (a JSON list of {"start","end","text"}):
    python3 make_srt.py vertical --cues cues.json out.srt

Format rules (see STYLE_GUIDE.md §8 Publishing):
  horizontal: <=42 chars/line, <=2 lines, 1.0–6.0 s per cue, break at sentence/clause ends
  vertical:   <=24 chars/line, <=2 lines, 0.6–2.5 s per cue, short phrases for small screens
Brand spellings come from the brand pack: set BRAND=brands/<name>/brand.json ("spelling_fixes", "split_word_merges").
Without BRAND, no spelling fixes are applied.
"""
import json, os, re, subprocess, sys, tempfile, textwrap

FORMATS = {
    "horizontal": dict(line=42, lines=2, min_d=1.0, max_d=6.0),
    "vertical":   dict(line=24, lines=2, min_d=0.6, max_d=2.5),
}
# whisper mis-hearings -> brand spelling (case-insensitive), from the brand pack
_BRAND = json.load(open(os.environ["BRAND"])) if os.environ.get("BRAND") else {}
FIXES = {pat: rep for pat, rep in _BRAND.get("spelling_fixes", [])}
MERGES = _BRAND.get("split_word_merges", [])  # [first word, second-word regex, merged spelling]

def fix(text):
    for pat, rep in FIXES.items():
        text = re.sub(pat, rep, text, flags=re.I)
    return text

WEAK = {"the","a","an","to","of","in","on","for","with","and","or","our","your","my","is","at","by"}

def ts(sec):
    ms = int(round(sec * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"

def wrap(text, f):
    lines = textwrap.wrap(text, f["line"], break_long_words=False)
    if len(lines) == 2:  # balance two lines (bottom-heavy pyramid reads best)
        words = text.split(); best = None
        for i in range(1, len(words)):
            a, b = " ".join(words[:i]), " ".join(words[i:])
            if len(a) <= f["line"] and len(b) <= f["line"]:
                last = a.split()[-1].lower().strip(",.")
                score = abs(len(a) - len(b)) + (0 if len(a) <= len(b) else 3)
                if a.endswith((",", ";", ":", ".", "?", "!", "—")): score -= 12   # break after punctuation
                if last in WEAK: score += 15                                     # never end a line on "the", "a", "to"…
                if best is None or score < best[0]: best = (score, [a, b])
        if best: lines = best[1]
    return lines

def words_from_audio(audio):
    tmp = tempfile.mkdtemp(); wav = os.path.join(tmp, "a.wav")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", audio, "-ar", "16000", "-ac", "1", wav], check=True)
    model = os.path.expanduser("~/.cache/whisper/ggml-base.en.bin")
    subprocess.run(["whisper-cli", "-m", model, "-f", wav, "-ml", "1", "-sow", "-ojf", "-of", os.path.join(tmp, "w")],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    segs = json.load(open(os.path.join(tmp, "w.json")))["transcription"]
    words = [(s["offsets"]["from"] / 1000, s["offsets"]["to"] / 1000, s["text"].strip()) for s in segs if s["text"].strip()]
    # merge split brand words (e.g. "Lake" + "Century") before chunking
    out = []
    for w in words:
        m = next((m for m in MERGES if out and re.fullmatch("(?i)" + m[1], re.sub(r"\W", "", w[2]))
                  and re.sub(r"\W", "", out[-1][2]).lower() == m[0]), None)
        if m:
            out[-1] = (out[-1][0], w[1], m[2] + re.sub(r"^\w+", "", w[2])); continue
        out.append(w)
    return out

def cues_from_words(words, f):
    cap = f["line"] * f["lines"]; cues = []; cur = []
    def flush():
        if cur: cues.append([cur[0][0], cur[-1][1], fix(" ".join(w[2] for w in cur))])
    for i, w in enumerate(words):
        cand = " ".join(x[2] for x in cur + [w])
        too_long = len(cand) > cap or (cur and w[1] - cur[0][0] > f["max_d"])
        if too_long:
            flush(); cur = []
        cur.append(w)
        text = " ".join(x[2] for x in cur); end_sentence = re.search(r"[.?!]$", w[2])
        clause = re.search(r"[,;:]$", w[2]) and len(text) >= cap * 0.45
        if end_sentence or clause:
            flush(); cur = []
    flush()
    # timing: end each cue at the next cue's start (minus a hair), respect min/max duration
    for i, c in enumerate(cues):
        nxt = cues[i + 1][0] if i + 1 < len(cues) else c[1] + 0.6
        c[1] = min(max(c[1] + 0.15, c[0] + f["min_d"]), nxt - 0.04, c[0] + f["max_d"])
    return cues

def write(cues, f, out):
    with open(out, "w") as fh:
        for i, (a, b, text) in enumerate(cues, 1):
            fh.write(f"{i}\n{ts(a)} --> {ts(b)}\n" + "\n".join(wrap(fix(text), f)) + "\n\n")
    # report anything that breaks the format rules
    for i, (a, b, text) in enumerate(cues, 1):
        lines = wrap(fix(text), f)
        if len(lines) > f["lines"] or any(len(l) > f["line"] for l in lines): print(f"  ! cue {i} too long: {text}")
        if b - a < f["min_d"] - 0.05: print(f"  ! cue {i} short ({b - a:.2f}s): {text}")
    print(f"wrote {out} ({len(cues)} cues)")

if __name__ == "__main__":
    fmt, *rest = sys.argv[1:]
    f = FORMATS[fmt]
    if rest[0] == "--cues":
        cues = [[c["start"], c["end"], c["text"]] for c in json.load(open(rest[1]))]; out = rest[2]
    else:
        cues = cues_from_words(words_from_audio(rest[0]), f); out = rest[1]
    write(cues, f, out)
