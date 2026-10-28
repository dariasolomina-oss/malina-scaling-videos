#!/usr/bin/env bash
# Same arguments as render.js; writes render.log/render.pid into OUTDIR.
set -euo pipefail
if [[ $# -lt 2 ]]; then
  echo 'usage: render_bg.sh HTML OUTDIR --video OUT.mp4 [--fps N --chunk-frames N --resume]' >&2
  exit 2
fi
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
out="$2"
mkdir -p -- "$out"
if [[ -f "$out/render.pid" ]] && kill -0 "$(cat -- "$out/render.pid")" 2>/dev/null; then
  echo 'PID from render.pid is still alive; choose another output directory or verify it has exited' >&2
  exit 1
fi
nohup node "$script_dir/../render/render.js" "$@" > "$out/render.log" 2>&1 < /dev/null &
pid=$!
printf '%s\n' "$pid" > "$out/render.pid"
printf 'pid=%s log=%s/render.log (check the log for asynchronous failures)\n' "$pid" "$out"
