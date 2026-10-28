#!/bin/bash
# Word-level timings for a voiceover: prints "[start]word" plus the silences between phrases.
# Needs: brew install ffmpeg whisper-cpp ; model at ~/.cache/whisper/ggml-base.en.bin
#   curl -L -o ~/.cache/whisper/ggml-base.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin
# Usage: ./transcribe.sh voiceover.mp3
set -e
IN="$1"; TMP=$(mktemp -d)
ffmpeg -loglevel error -y -i "$IN" -ar 16000 -ac 1 "$TMP/a.wav"
whisper-cli -m ~/.cache/whisper/ggml-base.en.bin -f "$TMP/a.wav" -ml 1 -sow -ojf -of "$TMP/w" >/dev/null 2>&1
python3 -c "
import json;d=json.load(open('$TMP/w.json'))
for s in d['transcription']:
  t=s['text'].strip()
  if t: print(f\"{s['offsets']['from']/1000:6.2f}  {t}\")"
echo "--- duration: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN") s"
echo "--- silences (cut points / phrase gaps):"
ffmpeg -i "$IN" -af silencedetect=noise=-38dB:d=0.12 -f null - 2>&1 | grep -o "silence_\(start\|end\): [0-9.]*" | paste - - | awk '{printf "  %.2f – %.2f\n",$2,$4}'
