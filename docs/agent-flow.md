---
name: lakesentry-video
description: Make LakeSentry product videos — a landscape demo synced to a voiceover, and a vertical teaser short — as code-driven HTML animations rendered to MP4. Use when asked to make, edit or re-cut a LakeSentry product/demo/teaser video.
---

# LakeSentry video flow

Code-rendered motion videos: an HTML page draws every frame from `render(t)`. Playwright screenshots each frame, and ffmpeg encodes the frames with the voiceover and sound design.
**Read `STYLE_GUIDE.md` first.** It holds every style decision and every rejected idea.

Folder map (relative to `z_04_ai videos/`):
- `_flow/tools/`: `render.js`, `transcribe.sh`, `mix_with_voiceover.sh`, `mix_events.py`, `make_srt.py`, `thumbnail.js`
- `_flow/templates/`: `landscape-product-demo.html` (16:9 demo), `vertical-teaser.html` (9:16 short)
- `_assets/`: sound files. `_assets/brand/`: the official lockup and mark (never retype the logo)
- `long form and horizontal /<date> <name>/` and `short form/<date> <name>/`: one folder per video with `publish/` (final MP4 + thumbnail + SRT + publish.md), `source/`, `inputs/` and `versions/`

## One-time setup (macOS)
```bash
brew install ffmpeg whisper-cpp
mkdir -p ~/.cache/whisper && curl -L -o ~/.cache/whisper/ggml-base.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin
cd "_flow/tools" && npm install && npx playwright install chromium
```
Gotcha: Claude's shell can't read `~/Downloads` (macOS privacy). Copy files out with Finder:
`osascript -e 'tell application "Finder" to duplicate (POSIX file "~/Downloads/X.mp3" as alias) to (POSIX file "<dest dir>" as alias) with replacing'`

## Steps

### 1. Inputs → new video folder
Create `<long|short form>/<YYYY-MM-DD> <name>/{source,inputs,versions,publish}`. Put these in `inputs/`: a screen recording of the real product flow, the voiceover MP3 (ElevenLabs, voice "Dan"; recorded only after the script is approved in step 3), and any inspiration clip.

### 2. Understand the recording
Pull a frame every ~3 s and make a contact sheet (`ffmpeg -i rec.mov -vf "fps=1/3,scale=800:-1,tile=4x3" sheet_%d.jpg`). List each click and state change step by step. Get real numbers from the live product in the browser.

### 3. Script first: stop for review
**Always write the script before building anything** (no voiceover track, no page, no renders). Write `SCRIPT.md` in each video folder (template: the MCP server demo/teaser `SCRIPT.md`), with:
- format, target length (long form ≤ 2:00, short ≤ 30 s), and what got anonymized or is sample data
- one section per scene: time range, **what's on screen**, and the **voiceover line** (or the on-screen text plus sound for a short with no voice)
- the full voiceover as one read-through block, for recording in ElevenLabs
- open questions (missing footage, sample vs real numbers, unverified claims)

**The problem statement opens every video**: dead centre of the frame, typed out character by character in time with the voiceover, then a hand-drawn orange scratch under the key phrase (STYLE_GUIDE §5).
The voiceover must be **tight**: every sentence adds something new, nothing is said twice, no warm-up. **Problem, promise and solution land in the first ~10 s**, then show it. Feature videos follow this shape: problem with an emotional pull (a fact, not an invented story) → promise ("Here's how to…") → **"Introducing <feature> in LakeSentry"** → one new capability per line → payoff. Research the problem first (Databricks docs, community threads, lakesentry.io) and save it as `RESEARCH.md`, so every line traces to a source. State the problem plainly; don't invent a story about how the viewer works today. Use words the viewer already knows ("your Databricks cost data", not "your LakeSentry data").
The voiceover must not sound like AI. Run it against the brand-voice gates (`lakesentry-gtm/_guidelines/brand-voice/02-forbidden.md` and `04-ai-detection.md`): no rhetorical-question opener, no "no X, no Y, no Z" triplets, no filler adverbs, plain spoken sentences of varied length, one concrete detail a practitioner would recognize. Every product claim must trace to the product UI, docs or `_product_core`.
Show the user the scripts and **wait for approval**. Only then record or generate the voiceover and move on. Check that the approved script follows the on-screen order. Steps start at the first real action, and the video opens on the problem and ends on it (see STYLE_GUIDE §5). If the order is wrong, ask for a new voiceover take instead of splicing.

### 4. Timings
`_flow/tools/transcribe.sh inputs/voiceover.mp3` gives word start times plus silences. Map every visual beat to a word: clicks on their verb ("link"), reveals on their noun ("monthly range"), the strike-through on "DBU".

### 5. Build the page
Copy a template into `source/` and edit:
- `T={…}`: event times taken from step 4
- `CAMK=[[t, '#selector' | [x,y], scale, dx, dy], …]`: camera keys (landscape). Zoom 2–2.6× on the active control and center the key number.
- `CK=[[t, '#selector' | [x,y]], …]`: cursor path. `CLICKS=[…]`: ripple times
- `D`/`model()`: real numbers from the live product
- Image paths point to `../../../_assets/brand/…`

### 6. Check stills before rendering
```bash
node _flow/tools/render.js source/demo.html /tmp/check --test 5.6 10.4 18.7 22.4    # landscape
W=1080 H=1920 node _flow/tools/render.js source/teaser.html /tmp/check --test 1.5 3.8 8.4   # vertical
```
Look at every still (make a contact sheet), and fix clipping, overlaps, off-center numbers and unreadable text.

### 7. Full render (60 fps)
```bash
node _flow/tools/render.js source/demo.html /tmp/frames 60
```

### 8. Sound
- **Landscape with voiceover:** build an effects track. Either synthesize it with `source/sfx_synth.py` from the calculator demo (edit its event times) or place `_assets` files with `mix_events.py`. Then:
  `_flow/tools/mix_with_voiceover.sh /tmp/frames 60 inputs/voiceover.mp3 source/sfx.wav <dur> publish/<video>.mp4`
  It ducks the effects under the voice and normalizes to −14 LUFS.
- **Vertical teaser (no voiceover):** edit `source/events.json` (times, volumes, trims), then
  `python3 _flow/tools/mix_events.py source/events.json source/sound-design.wav` and encode:
  `ffmpeg -framerate 60 -i /tmp/frames/f_%05d.jpg -i source/sound-design.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -t <dur> -movflags +faststart publish/<video>.mp4`
- No music. No end-card sound.

### 9. Subtitles, title, description & thumbnail (required for every video)
The **format differs for horizontal and vertical**; see STYLE_GUIDE §8.
```bash
python3 _flow/tools/make_srt.py horizontal source/voiceover.mp3 publish/<video>.en.srt            # landscape with voiceover
python3 _flow/tools/make_srt.py vertical   source/voiceover.mp3 publish/<video>.en.srt            # vertical with voiceover
python3 _flow/tools/make_srt.py vertical   --cues source/captions.json publish/<video>.en.srt     # vertical, no voice: on-screen text
```
Read the SRT back: fix line breaks, brand spellings and reading speed. Then copy the matching template (`templates/publish-horizontal.md` or `templates/publish-vertical.md`) to `publish/publish.md` and write the title + description.

**Thumbnail (always).** Copy `templates/thumbnail-horizontal.html` (1280×720) or `templates/thumbnail-vertical.html` (1080×1920) to `source/thumbnail.html`. Edit the headline (≤ 5 words, horizontal) or hook question (vertical), and put in the video's real result. Then:
```bash
node _flow/tools/thumbnail.js source/thumbnail.html publish/<video>-thumbnail.jpg   # horizontal
node _flow/tools/thumbnail.js source/thumbnail.html publish/<video>-cover.jpg       # vertical
```
Open the `-preview-320.jpg` it writes next to the page. Everything must still be readable at that size. Horizontal: the bottom-right corner stays empty. Vertical: content stays inside y 285–1635. Rules are in STYLE_GUIDE §8.

### 10. Deliver & file
Final MP4 goes in **`publish/`** (with the SRT and publish.md) **and** a copy in `versions/vN-<what changed>-FINAL.mp4`. Every cut you show the user goes into `versions/` with its number (drop the `-FINAL` suffix from the previous one). The editable page and audio go in `source/`.
Append anything new the user teaches you to `STYLE_GUIDE.md`.

### 11. Talking-head split screen (TZ shorts with Tatiana)
**Reference build: `short form/2026-10-08 tz10 focus export/` (v5, 2026-10-14).** Copy its `source/` (`top.html`, `captions.html`, `compose.sh`, `make_captions.py`) and follow its `NOTES.md`. Rules (STYLE_GUIDE §10, "after TZ10"):
1. **Clean voice on the whole take first:** `_toolkit/scripts/isolate.sh <take.MP4> work/dfn` (DeepFilterNet capped at 12 dB → `work/dfn/clean48.wav`, same clock as the take). Transcribe the take (whisper large-v3, `-ml 1 -sow`).
2. **Propose the cut, then stop.** Send the user her lines with source times: which to keep, which to drop, the new order, the stray words/fillers to cut ("are", "uhh", version numbers like "1.2"), and the on-screen hook. Build nothing until they pick.
3. **Problem + solution inside 2 s.** Her voice can't do it, so the screen does: the problem headline + visuals built at frame 0, the answer by ~1 s. Then her lines, reordered for problem → solution → product → where to find it. Aim for ≤ ~35 s.
4. **Cut on silence, never in a word.** Edges on the 25 fps grid (multiples of 0.04 s), in the dips of `clean48.wav`'s 20 ms energy; ~0.25 s of pause per join; leave ~0.3 s before her first word. Check every word end ("-ges", "-s", "Sentry") is inside the clip, and test each join by transcribing a short window. Whisper fills in words that aren't there and misses clipped ones, so trust the energy. **Tail test for every out-point:** transcribe the 0.3–0.4 s right after it; if that window still says part of her word (TZ12: "down" of "breakdown"), the cut is too early. A dip inside a word (the "k" of "break") looks like a word end in the energy.
5. **Layout:** `top.html` 1080×1080 with the scenes in `#fit` (scaled into the safe zone of `_assets/шортс_сейф_зоны_2025 (1).png`: top 240, left 60, right 120 clear, above the caption band); face 1080×840 below; nothing clipped inside UI windows. Overlay the safe-zone PNG on test stills before the full render.
6. **Captions burned in** (yellow word-by-word, `captions.html`, `ALPHA=1 W=1080 H=280` render, overlaid at y=960), words from the cut's transcript with 1:1 fixes (brand names, grammar). Read them as a paragraph first. The SRT from the same words is an optional upload.
7. **Sound:** pops/clicks from `_assets` via `events.json`, no music, −14 LUFS. Render `top.html` and `captions.html` at 50 fps, then `source/compose.sh <frames> <out.mp4> <captionFrames>`.
8. Number every cut in `versions/`, log each one's changes in `NOTES.md`, mark the approved one `-FINAL` and copy it to `publish/`.

Older split-screen notes (TZ9, 1080×960 halves, Resolve Voice Isolation): template `short form/2026-10-08 tz9 calculator in 5 steps/source/compose.sh`.
Resolve version, through the DaVinci Resolve MCP (`~/davinci-resolve-mcp`, Resolve Studio; install with `python install.py --clients manual`, drive it with `~/davinci-resolve-mcp/venv/bin/python _flow/tools/resolve_mcp.py`):
1. `project_manager.create` → `project_settings.set_setting` timelineFrameRate 50, timelineResolutionWidth/Height 1080/1920. The playback frame rate can't be set by API, so ask the user to set it.
2. Encode the frames to `source/top-animation.mp4`, make a ducked `sfx-resolve.wav`, then `media_pool.safe_import_media` the take, the animation and the effects.
3. `media_pool.create_timeline`, `timeline.add_track` (video, audio), then `media_pool.append_to_timeline` with `clip_infos`. **`end_frame` is exclusive**, and source frames are in the clip's own fps (25 for the take).
4. `timeline_item.set_transform` / `set_crop` using the measured units in the TZ9 `NOTES.md` (Tilt is scaled by timeline height ÷ fitted clip height). Then check with `timeline_frame.capture` against the generated MP4.
5. Voice: `timeline_item.set_voice_isolation_state` with `state={isEnabled:true, amount:80}` on each A1 clip. To reuse it in the generated MP4, disable the SFX track (on the **Edit** page; track toggles do nothing on Deliver), render a QuickTime H.264 + LPCM job (`render.prepare_render_job` + `start`), and extract `source/voice-isolated.wav` with ffmpeg.
6. Grade with `timeline_item_color.safe_set_cdl`, add `timeline_markers.add` per step, `project_manager.save`, then `safe_project_export` to `source/<name>.drp` (needs `allow_non_mcp_name` and `require_temp_path=false`).
Don't append an SRT with an explicit range: it crashed Resolve 21.1.1.

