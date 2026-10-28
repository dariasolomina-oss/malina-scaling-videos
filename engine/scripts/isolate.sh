#!/bin/zsh
# Voice isolation (DeepFilterNet3) on a raw take's audio. Output: <work>/clean48.wav (48 kHz, same length/sync as source).
# usage: isolate.sh <raw.MP4> <work_dir>
# ATTEN (dB, default 12) caps how much noise is removed. Full-strength DeepFilterNet (no cap, ~50 dB) made the voice sound
# processed and the jump cuts choppy (TZ5 feedback, 2026-09-30); 12 dB keeps room tone + breath with the hum ~25 dB under.
set -e
SRC="$1"; W="$2"; mkdir -p "$W"
ffmpeg -v error -y -i "$SRC" -map 0:a:0 -ar 48000 -c:a pcm_s16le "$W/raw48.wav"
uvx --python 3.11 --from deepfilternet --with "torch==2.0.1" --with "torchaudio==2.0.2" --with "numpy<2" \
  deepFilter "$W/raw48.wav" -o "$W" -a "${ATTEN:-12}" 2>&1 | grep -i enhanced
mv "$W/raw48_DeepFilterNet3.wav" "$W/clean48.wav"
echo "clean voice -> $W/clean48.wav"
