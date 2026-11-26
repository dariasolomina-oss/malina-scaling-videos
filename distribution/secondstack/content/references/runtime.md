# Runtime commands and limits

Resolve SKILL_ROOT from the installed location. Run its verify.py. For dependency
installation use a clean writable copy of runtime/ outside installed assets and
verify copied source files. Keep EP, an absolute episode directory, outside both
library trees. Record toolkit version and preserve that release for continuing
episodes. Activation may reinstall assets, not restore episode work.

Core Python requires >=3.10 and standard library only. Video needs Node >=18,
npm, FFmpeg/ffprobe and Chromium (the workspace browser or its CDP endpoint). Use
model access for transcription and media generation for voice, music and effects.
Never transfer one person's browser sign-in to another person.

From the writable runtime copy:

```sh
python3 engine/scripts/doctor.py --path /workspace
cd engine/render
npm ci --ignore-scripts
cd ../..
python3 engine/scripts/pipeline.py init --episode "$EP" --id example \
  --brand brands/antares --format vertical --duration 14 --voice none \
  --author 'Actual episode author'
python3 engine/scripts/episode.py status "$EP"
```

The pinned Playwright 1.48.2 has browser-download certificate-authenticity advisory
GHSA-7mvr-c777-76hp, so prefer the workspace's installed Chromium or the workspace
browser over CDP to downloading a browser. If neither is available, install Chromium
with the system package manager and continue.

Research and draft first. Record episode.py approve script after the user approves
the script. Then build and make the animatic (see below):

```sh
python3 engine/scripts/pipeline.py build --episode "$EP"
python3 engine/scripts/pipeline.py animatic --episode "$EP"
```

The runtime supports horizontal, vertical and square universal card layouts and the shared
`templates/video-scenes.html` storyboard layout. Use `content.json` with
`layout: scenes` for ordered title, KPI, steps, screen and CTA scenes. A screen
scene may reference a local capture under `assets/` (image or
MP4/WebM/MOV video copied from the episode `inputs/` as `assets/episode/...`);
the renderer seeks the video frame by frame, so review its frames and timing.
The scene geometry follows the episode format, including the Shorts safe zone
for vertical episodes. Use scene `disclosure` for real captures; the brand
book disclosure is the default.

`make_srt.py` generates the SRT. To burn captions into the video, render first,
then burn the checked SRT with FFmpeg (`subtitles` filter with the brand font and
the format's safe zone), and review the frames.

## Layout check and frame review

`pipeline.py animatic` measures every sampled frame in the browser and writes
`review/`: `sheets/` (four frames each), `frames/`, `issues/` (frames with boxes
around findings), `layout.json` and `layout.md`. Errors (block the animatic
approval): `text_off_frame`, `text_outside_safe_zone` (9:16), `text_clipped`
(words cut horizontally by a container), `text_overlap`, `text_covered` (a painted
element on top of the text), `escapes_container` (a text badge crossing its own
card). Warnings (judged by the reviewer): `shapes_overlap`, `text_too_small`,
`text_clipped_vertically`, `shape_cut_by_frame`, `escapes_container` without text.
It measures elements, not pixels inside images or canvas.

Waive an intended error: `pipeline.py waive --episode E --issue <id or key>
--reason "..."` (survives rebuilds while the text is the same) or `--at 243-247
--reason "..."` for a transition in motion (at most 20 s). Waivers apply on the
next animatic build.

Frame review: `pipeline.py review --episode E` calls vision models directly through
the model gateway (`OPENAI_BASE_URL`, `OPENAI_API_KEY`), billed to the conversation's
budget. Each request receives only `references/frame-review.md`, the brand style
guide and its share of the video: sheets, geometry findings with a few marked frames,
scenes and narration. No agent instructions, skills or conversation. Detail requests:
4 sheets (16 frames) each, 6 in parallel, `claude-sonnet-5-5`; one overall request
over all sheets for consistency between scenes, `gpt-5.5`. Options:
`--detail-model`, `--overall-model`, `--batch-sheets`, `--parallel`, `--no-overall`.
A failed request is retried once; on HTTP 402 (budget) it stops. The report is
`frame-review/round-N/report.md` in the episode, with `result.json` (verdict
CLEAN, NEEDS FIXES, INCOMPLETE or FAILED; counts of P0–P3). Sheets of failed
requests must be reviewed with the image viewer before the animatic is shown.

The layout check adds about 0.7 s per frame (a 5-minute video: about 2 minutes).

## Custom animation (layout `custom`)

For story videos like Antares Video 1: characters, mascots, an HTML interface that
looks like the product, whiteboards, embedded recordings, any transitions. Write the
page yourself in the episode:

- `inputs/animation/index.html` (plus any `.js`, `.css`, images, fonts or video
  files next to it). It must set `window.DURATION` (seconds, equal to the episode
  duration) and `window.render = async t => {...}` that draws the frame at absolute
  time `t` from scratch: no timers, no wall clock, no unseeded randomness, no CSS
  transitions or animations that run on their own. Media: seek `<video>` elements to
  the frame time inside `render`.
- `content.json`: `{"layout": "custom", "format": "horizontal|vertical|square",
  "duration": N, "scenes": [{"id", "title", "start", "end"}]}`; scenes are optional
  labels for the animatic and the cover.
- The build adds brand fonts and colours as CSS variables (`--color-primary`,
  `--font-headline`, ...), brand files under `assets/` (logos, fonts, mascots when
  supplied), the shared library under `lib/` (see `runtime/library/README.md`:
  `lib/characters/people.js`, `lib/antares/...`), `window.PAGE_DATA`,
  `PAGE_BRAND`, `PAGE_FORMAT`, `PAGE_VIEWPORT` and, for 9:16, `--shorts-*` safe-zone
  margins. Reserved names in the animation folder: `assets`, `lib`, `brand.json`,
  `content.json`, `build.json`, `script.md`.
- Everything must be local: no `fetch`, XHR, WebSocket, dynamic `import()`, remote
  `src`/`href` or remote CSS `url()`; copy fonts and images into the folder.
  `<iframe>` is not allowed. The build refuses these and missing local files.
- Size the stage to `PAGE_VIEWPORT` (1920x1080, 1080x1920 or 1080x1080) with no
  scrolling. Check stills at several times (`render.js --test`) for clipped or
  overflowing text before the animatic.

Then `pipeline.py build`, `pipeline.py animatic` and the usual approval and render.
Antares Video 1 (5:23, about 330 KB of code) builds this way unchanged except for its
remote font link; its animatic takes about 90 s.

Cover for every brand and format, from the current build (default: the middle of
the first title scene; `--at SECONDS` picks another moment):

```sh
python3 engine/scripts/pipeline.py cover --episode "$EP" [--at 1.0]
```

It writes `media/cover.jpg` (16:9 → 1280x720, 9:16 → 1080x1920, 1:1 → 1080x1080)
and a 320 px preview. Approvals are unchanged; review the cover with the preview.
The LakeSentry `thumbnail.js` templates are historical references only.

Render time: the browser renderer takes roughly 6–12 s per second of video at
30 fps and about twice as long at 60 fps. Estimate before long renders.

## Animatic (required before any render)

After `pipeline.py build`:

```sh
python3 engine/scripts/pipeline.py animatic --episode "$EP"
```

It writes `media/animatic.mp4` (960 px, a frame drawn from the middle of every
2 s interval, at most 300 frames, with the voice; about 6 MB and under two
minutes for 8 minutes of video), `media/animatic-sheet.jpg` (one frame per scene)
and `animatic/` (a static player site: the built pages drawn live in the browser
with the voice track and a scene list). Send the MP4 and the sheet as chat
attachments; the chat's inline HTML limit (128 KB) is too small for an animatic. Publish it as a private site for review, for example
site `vp-<episode-id>` (lowercase letters, digits and hyphens only), redeploying
the same name for each new version with `if_version`:

```sh
tar -C "$EP/animatic" -czf /tmp/animatic.tgz . && curl -sS --fail-with-body \
  -H "Authorization: Bearer $SECONDSTACK_SITES_TOKEN" -H "Content-Type: application/gzip" \
  --data-binary @/tmp/animatic.tgz \
  "$SECONDSTACK_SITES_API_URL/deploy?site=vp-<episode-id>&visibility=private"
```

The site belongs to the person you work for; private means only they can open it,
and they can share it from the site page. Never publish to an existing site you did
not create for this episode. If the
site cannot be published, send the contact sheet and the `animatic/` folder as
a ZIP (open it with a local web server). After the human approves this exact
animatic:

```sh
python3 engine/scripts/episode.py approve "$EP" animatic --human "<name>" --confirm
python3 engine/scripts/pipeline.py render --episode "$EP" --final60
```

A render uses the animatic approval for the current build inputs. A rebuild with
changed inputs or a changed script needs a new animatic and a new approval.

Two options record the user's own decisions:

```sh
# the user saw the remaining layout problems and said to render anyway
python3 engine/scripts/episode.py approve "$EP" animatic --human "<name>" --confirm \
  --accept-open-issues "badge over the number in scene 5 accepted by the user"
# the user insisted on rendering without an animatic
python3 engine/scripts/pipeline.py render --episode "$EP" --final60 \
  --user-skipped-animatic "user asked twice to render without an animatic" --human "<name>"
```

The final video is accepted separately (episode.py approve video). Audio import
uses pipeline.py voice after script approval with an MP3 and word timings: a user
recording edited to fit the picture, or a voice you generated with media
generation. voice_elevenlabs.py only parses a saved ElevenLabs response with
timings. Review speech, duration and timing. Use --help for all options.

## Resume an interrupted render

Repeat the same render command with `--resume`. Use the same episode,
build, frame rate and `--chunk-frames` value (default 240), for example:

```sh
python3 engine/scripts/pipeline.py render --episode "$EP" --final60 --resume
```
 Keep the cache and
approved inputs available. The renderer skips verified chunks and recreates
missing or corrupt ones. If inputs or settings change, follow the applicable
review gate and start a fresh render.

## Product capture

Record or screenshot product screens yourself in the workspace browser, following
the approved script, with a demo account and demo data.

- If login is needed, hand the browser to the user to sign in, then continue. With
  `record_screen.js`, use `--login STATE_PATH` with a private temporary path, then
  `STATE` set to that path, the shots JSON and the output MP4 path. Delete the saved
  login state when done; keep it out of the episode and delivery folders.
- Review the frames for private data and note the capture date in the episode.
- A screencast is real-time, so its timing differs from the offline renderer; trim
  it to the scene before use.
- For the remote workspace browser, use its `CDP_URL`. To load local HTML there, set
  `BROWSER_HTTP_HOST` to an address that browser can reach and serve only the
  prepared asset directory as `HTML_ROOT`.

## Episode state and delivery

Episode state is JSON in episode.yaml. Status inspection drops approvals whose
inputs changed. LocalDirectoryStorage is local only; restore drops current
approvals. Snapshots and temporary files are not cloud backups. Attach the actual
files in chat; keep hashes and state in the episode, not in messages.
