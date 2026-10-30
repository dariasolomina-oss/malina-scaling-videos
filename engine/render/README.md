# Render MVP

Node >=18; `npm ci --ignore-scripts` in this directory installs the pinned
Playwright **1.48.2** (lockfile included). Install its matching Chromium separately
for local execution (`npx playwright install chromium`), or supply an existing
`CDP_URL`. ffmpeg/ffprobe must be on PATH (`FFMPEG` overrides ffmpeg).

## Deterministic render and video

```sh
node engine/render/render.js /absolute/input/index.html /tmp/frames --test 0 1.5 7.2
node engine/render/render.js /absolute/input/index.html /tmp/frames 30
W=1920 H=1080 node engine/render/render.js /absolute/input/index.html /tmp/chunks \
  --video /tmp/final.mp4 --fps 30 --chunk-frames 240
# Identical command, plus --resume, skips verified complete chunks:
W=1920 H=1080 node engine/render/render.js /absolute/input/index.html /tmp/chunks \
  --video /tmp/final.mp4 --fps 30 --chunk-frames 240 --resume
```

The page must expose finite positive `window.DURATION` in seconds and
`window.render(t)`, optionally async. Each frame calls render with **global**
`frameIndex / fps`, including across chunk boundaries. Total frames =
`Math.round(DURATION * fps)`; no duplicate endpoint frame. Fonts/images are awaited.
The author must make render(t) a pure seek operation: real-time timers, random,
network content, media playback and stateful drawing are NOT made deterministic.
CSS animations are disabled for screenshots; animation must be driven by render(t).

For detached execution, `bash engine/scripts/render_bg.sh` takes the same arguments
and writes `render.log`/`render.pid` inside OUTDIR. Its successful launch is not
a successful render: inspect the log and final manifest/video. Stop with
`kill -TERM "$(cat /tmp/chunks/render.pid)"`.

Legacy positional fps and `--test` still work. Legacy sequence export writes JPGs;
`ALPHA=1` produces transparent PNG instead. `--video` is opaque, even-dimension
H.264/yuv420p only, no audio. It streams a single screenshot buffer at a time into
ffmpeg with write-completion backpressure, not thousands of intermediate JPEGs.
Each independent chunk uses identical settings; concat uses stream copy.

`manifest.json` records HTML/dependency/settings fingerprint and per-chunk byte
length/SHA-256. A chunk is renamed from `.partial.mp4` only after successful
ffmpeg exit; the manifest then atomically replaces its previous version. Progress
is JSON on stdout after every completed chunk. `--resume` rejects mismatched input
hash, and regenerates missing/corrupt chunks. Without --resume it starts afresh.
Final video is atomically renamed only after concat succeeds. An old final video
is left intact on failure. No simultaneous writers to the same output directory.
Atomic rename is crash-consistent at process level, **not power-loss/fsync durable**.

`HTML_ROOT` defaults to the HTML's parent. Every regular file under this root is
hashed recursively (including CSS, JS, fonts, images); symlinks are rejected.
Place chunk directory and final video **outside** the root. Expand HTML_ROOT to
include local dependencies accessed via `../`. Inputs must remain immutable for
an entire run; a final rehash refuses publication after changes. No guarantee for
external URLs, fonts fetched remotely, files outside HTML_ROOT, OS/GPU differences,
ffmpeg upgrades, hidden environment settings, or nondeterministic render code.
Prefer a self-contained offline root. `RENDER_CACHE_KEY` can manually invalidate
cache for external/environment changes. Manifest settings include Playwright and
browser version, viewport, fps, duration, encoding preset and chunk size.

SIGTERM/SIGINT stop between frames: completed chunks remain reusable; the active
partial chunk is discarded. The exit code is 143. Concat already in progress is
allowed to finish but is not published after a stop. Hard kills can leave partial
files, ignored/overwritten by resume. Other failures exit nonzero. There is no
per-frame checkpoint or retry/recovery inside a chunk.

## Existing browser / platform CDP

All three drivers use `browser.js`. CDP creates a **new isolated context**, never
reuses existing pages/contexts, and only closes its own context. It then disconnects
its CDP transport: in pinned Playwright 1.48.2, the connected browser's public
`close()` closes the WebSocket, **not Chromium** (verified in the pinned
server/chromium/chromium.js implementation). It sends no Browser.close CDP command.
Local mode owns and terminates Chromium. Recheck these semantics before upgrades.
CDP browser compatibility must be checked against the platform's Chromium.

CDP HTML navigation uses an ephemeral HTTP server, not file://. It binds
0.0.0.0 on a dynamic port, with no-store and MIME headers. Set `BROWSER_HTTP_HOST`
to the hostname/IP **reachable from the remote browser** (default: OS hostname).
No endpoint/port forwarding is invented or provisioned by these scripts. Ensure
network routing/firewall allow this connection. Server exposes HTML_ROOT only,
rejects traversal/symlink escapes, and is stopped after rendering. Use a private
network and a dedicated asset directory; do not put secrets/storageState there.
HTTP(S) shot destinations in record_screen are unchanged; file: shot URLs use the
same HTTP bridge under CDP.

```sh
node engine/render/thumbnail.js input/thumb.html /tmp/thumb.jpg
STATE=/tmp/private-state.json node engine/render/thumbnail.js input/thumb.html /tmp/thumb.jpg
LOGIN_URL=https://your-demo/login node engine/render/record_screen.js --login
MODE=cdp node engine/render/record_screen.js shots.json /tmp/demo.mp4
```

`--login` defaults to an OS temporary state file
`malina-render-<uid>.state.json`, permission 0600, never a repository file. `STATE`
or a login output argument can override it: use a private temporary location,
never a publish directory. Contexts load a state snapshot, not shared live cookies.
No cookies are logged or copied into outputs/manifests; fill text is redacted in
step logs. The login state intentionally persists for subsequent recordings;
remove it manually when finished. Thumbnail accepts STATE but does not write it.
Login needs an interactive browser; the supplied CDP browser must be accessible
to the user. Record_video on remote CDP may require browser-side video encoders
and accessible artifact transport. MODE=cdp avoids Playwright video transport,
but remains the **legacy real-time screencast**: it writes temporary JPEGs and
has no deterministic/chunk/resume guarantee. Only render.js video is streaming.

## Brand CSS and still review

```sh
node engine/render/brand_css.js brands/lakesentry/brand.json /tmp/brand.css
node engine/render/stills.js input/index.html /tmp/contact.jpg 0 1.5 3
node --test tests/test_render.test.js
```

brand_css emits `--color-<key>`, `--typography-<key>` (recursively) and
`--font-<role>` variables for the existing brand schema. A fonts role/name map
alone does **not** identify files. Explicit `font_faces` (or an array `fonts`) uses
`[{"family":"Outfit","src":"assets/Outfit.woff2","weight":400,"style":"normal"}]`
and emits @font-face; paths resolve relative to the CSS, and files are not fetched
or inferred. Arrays such as gradient stops are currently omitted. Unknown fields
are ignored; unsafe CSS values rejected. Brand templates are not modified.

stills.js renders requested times to a temporary directory and makes a 480px
per-cell contact sheet with ffmpeg, then removes temporary images. It is visual
review, not automatic proof of layout correctness. Exported `checkSafeZones`
checks caller-supplied `{x,y,width,height}` boxes against `{width,height,inset}`.
It does **not** detect text boxes, occlusion, platform overlays, or extract geometry
from screenshots. For asymmetric brand margins, callers must transform boxes or
perform explicit bounds checks; no complete shorts-safe-zone guarantee is claimed.

Tests use Node's built-in test runner. Real ffmpeg/ffprobe tests verify streamed
chunks and final frame count, resume, input invalidation, corrupt chunk recovery,
SIGTERM preservation/resume, spawn/pipe failure, and the real HTTP asset bridge;
browser is mocked. **No browser was launched and no CDP URL
was available during implementation**; real CDP routing, fonts/layout and remote
recording require a parent/browser smoke test. The required historical Playwright
pin has an npm audit high-severity advisory; upgrade requires a separate decision.
