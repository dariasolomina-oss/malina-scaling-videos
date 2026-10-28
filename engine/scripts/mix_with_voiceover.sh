#!/bin/bash
# Encode rendered frames + voiceover + sound-effects track into the final MP4.
# Effects are lowered and side-chain ducked under the voice so the voice is never overpowered
# (measured result on the calculator demo: effects ~19 dB under the voice on average).
# Usage: ./mix_with_voiceover.sh <framesDir> <fps> <voiceover.mp3> <sfx.wav> <durationSec> <out.mp4>
set -e
F="$1"; FPS="$2"; VO="$3"; FX="$4"; DUR="$5"; OUT="$6"
ffmpeg -loglevel error -y -framerate "$FPS" -i "$F/f_%05d.jpg" -i "$VO" -i "$FX" -filter_complex \
"[1:a]aformat=sample_rates=44100:channel_layouts=stereo,apad,asplit=2[vo][key];\
[2:a]volume=0.33[fx0];[fx0][key]sidechaincompress=threshold=0.02:ratio=8:attack=8:release=280:makeup=1[fx];\
[vo][fx]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
-map 0:v -map "[a]" -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -t "$DUR" -movflags +faststart "$OUT"
echo "wrote $OUT"
