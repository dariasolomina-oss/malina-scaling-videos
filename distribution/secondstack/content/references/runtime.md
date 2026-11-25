# Runtime commands and limits

Resolve SKILL_ROOT from the installed location. Run its verify.py. For dependency
installation use a clean writable copy of runtime/ outside installed assets and
verify copied source files. Keep EP, an absolute episode directory, outside both
library trees. Record toolkit version and preserve that release for continuing
episodes. Activation may reinstall assets, not restore episode work.

Core Python requires >=3.10 and standard library only. Video needs Node >=18,
npm, FFmpeg/ffprobe and compatible Chromium or authorized CDP. Optional transcription,
isolation, TTS and desktop tools require separate capabilities. Credentials remain
in authorized connections; never transfer browser authentication between users.

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
GHSA-7mvr-c777-76hp. Do not blindly download browsers. Use trusted pre-provisioned
compatible Chromium/CDP or request separate dependency remediation. This candidate
retains pinned dependencies; host smoke tests do not certify all environments.

Research/draft first. Record episode.py approve only after a real human decision
on the exact script. Its flags are local attestations, not identity verification.
After that approval:

```sh
python3 engine/scripts/pipeline.py build --episode "$EP"
python3 engine/scripts/pipeline.py render --episode "$EP" --fps 30
```

The runtime supports horizontal, vertical and square universal card layouts and the shared
`templates/video-scenes.html` storyboard layout. Use `content.json` with
`layout: scenes` for ordered title, KPI, steps, screen and CTA scenes. A screen
scene may reference a local authorized capture under `assets/` (image or
MP4/WebM/MOV video copied from the episode `inputs/` as `assets/episode/...`);
the renderer seeks the video frame by frame, so review its frames and timing.
The scene geometry follows the episode format, including the Shorts safe zone
for vertical episodes. Use scene `disclosure` for real captures; the brand
book disclosure is the default.

The guarded runtime can generate a separate SRT with `make_srt.py`; it does not
burn captions into the rendered MP4. Use an approved external caption-rendering
route for burned-in captions, or deliver the checked SRT when that route is absent.

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

Every render, 30 or 60 fps, requires the animatic approval for the current build
inputs. A rebuild with changed inputs or a changed script needs a new animatic and
a new approval.

Final bytes require separate acceptance. Audio import uses pipeline.py voice after
script approval with actual MP3/word timings or authorized connector response.
voice_elevenlabs.py is an offline parser, not a live API. Review speech, codec,
duration and timing. Use --help for actual supported options.

## Resume an interrupted render

Repeat the same guarded render command with `--resume`. Use the same episode,
build, frame rate and `--chunk-frames` value (default 240), for example:

```sh
python3 engine/scripts/pipeline.py render --episode "$EP" --final60 --resume
```
 Keep the cache and
approved inputs available. The renderer skips verified chunks and recreates
missing or corrupt ones. If inputs or settings change, follow the applicable
review gate and start a fresh render.

## Authorized product capture

Use dated capture from an authorized demo environment. Before launching the
recorder, require approval for the current script and run the production guard
through an authorized wrapper. `record_screen.js` is a raw helper. If guarded
capture or a suitable session is unavailable, report the blocker or request an
authorized recording from the user.

- If login is needed, open an isolated browser and let the authorized user sign
  in there. Use a verified `LOGIN_URL` and `record_screen.js --login STATE_PATH`
  with an explicit private temporary path. For capture, set `STATE` to that
  same path and pass the approved shots JSON and output MP4 path to
  `record_screen.js`. The helper saves login state for reuse. Delete it on
  completion or failure. Keep it outside the episode, `HTML_ROOT` and all
  delivery or backup paths.
- Review the shot list and the actual frames for private data. Record the
  capture date, environment, authorization and sample/anonymized status.
  Treat a screencast as a real-time capture, with different timing and resume
  behavior from the guarded offline renderer.
- For remote Chromium, use an authorized `CDP_URL`. If it needs to load local
  HTML, set `BROWSER_HTTP_HOST` to an address reachable from that browser over
  a private network. Serve only the prepared asset directory as `HTML_ROOT`.

## Episode state and delivery

Episode state is JSON in episode.yaml. Status inspection can invalidate stale
approvals. LocalDirectoryStorage is local only; restore revokes current approvals.
Snapshot directories and temporary files are not cloud backups. Attach actual files
and hashes in Chat and report measured transfer/restoration limits honestly.
