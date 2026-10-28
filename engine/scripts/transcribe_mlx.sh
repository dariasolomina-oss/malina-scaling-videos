#!/bin/zsh
# Transcribe one audio/video file with word timestamps (mlx-whisper, Apple Silicon).
# usage: [BRAND=brands/<name>/brand.json] transcribe_mlx.sh <input> <out_dir> [initial prompt]
# NOTE: mlx_whisper writes every input to the FIRST name when given several files — always one file per call,
#       and keep dots out of the base name (w_80.3.wav -> w_80.json).
set -e
IN="$1"; OUT="$2"; # default prompt = the brand pack's "transcription_prompt" when BRAND=brands/<name>/brand.json is set
DEF=""; [[ -n "$BRAND" ]] && DEF=$(python3 -c 'import json,os;print(json.load(open(os.environ["BRAND"])).get("transcription_prompt",""))')
PROMPT="${3:-$DEF}"
mkdir -p "$OUT"
uvx --python 3.12 --from mlx-whisper mlx_whisper "$IN" --model mlx-community/whisper-large-v3-turbo \
  --language en --word-timestamps True --condition-on-previous-text False \
  --hallucination-silence-threshold 1.0 --initial-prompt "$PROMPT" --output-format all --output-dir "$OUT" >/dev/null 2>&1
echo "transcript -> $OUT"
