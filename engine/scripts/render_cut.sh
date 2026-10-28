#!/bin/zsh
# Render the talking-head cut from the 4K source + clean voice using edl.json, then level to -14 LUFS.
# Outputs in <work>: cut.mp4 (1080x1920, clean audio), cut_clean.wav
# usage: render_cut.sh <raw.MP4> <work_dir> [fps=25]
set -e
SRC="$1"; W="$2"; FPS="${3:-25}"
python3 - "$W" "$FPS" <<'PY'
import json, sys
W, fps = sys.argv[1], sys.argv[2]; edl = json.load(open(f'{W}/edl.json')); v = []; a = []; cat = []
for i, (s, e) in enumerate(edl):
    d = e - s
    v.append(f"[0:v:0]trim=start={s}:end={e},setpts=PTS-STARTPTS,scale=1080:1920:flags=lanczos,fps={fps}[v{i}]")
    a.append(f"[1:a:0]atrim=start={s}:end={e},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={d-0.015:.3f}:d=0.015[a{i}]")
    cat.append(f"[v{i}][a{i}]")
open(f'{W}/fc.txt', 'w').write(";".join(v + a) + ";" + "".join(cat) + f"concat=n={len(edl)}:v=1:a=1[v][a]")
PY
ffmpeg -v error -y -i "$SRC" -i "$W/clean48.wav" -/filter_complex "$W/fc.txt" -map "[v]" -map "[a]" \
  -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p -c:a pcm_s24le "$W/cut_raw.mov"
ffmpeg -v error -y -i "$W/cut_raw.mov" -map 0:a -c:a pcm_s24le "$W/cut_a.wav"
PRE="highpass=f=70,acompressor=threshold=-34dB:ratio=3:attack=5:release=120:knee=4"
J=$(ffmpeg -hide_banner -i "$W/cut_a.wav" -af "$PRE,loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
get(){ echo "$J" | grep "\"$1\"" | grep -oE '\-?[0-9]+\.[0-9]+'; }
ffmpeg -v error -y -i "$W/cut_a.wav" -af "${PRE},loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true" -ar 48000 -c:a pcm_s24le "$W/cut_clean.wav"
ffmpeg -v error -y -i "$W/cut_raw.mov" -i "$W/cut_clean.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -movflags +faststart "$W/cut.mp4"
echo "cut -> $W/cut.mp4 ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$W/cut.mp4")s)"
