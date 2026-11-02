# LakeSentry: from the local CLI to video review

`engine/scripts/pipeline.py` connects the existing `episode.py`, `prepare_page.py`,
`timings.py`, offline `voice_elevenlabs.py`, and `engine/render/render.js`.
The scope ends at a local `media/video.mp4` with status `review`, **not publication**.
External media storage and an agent are not connected. The CLI makes no TTS/API
requests, does not write to git or create a real git branch, and does not publish
sites or videos.

Requirements: Python >=3.10, Node with the renderer/Playwright dependencies and a
browser installed; audio and MP4 also require `ffmpeg`/`ffprobe` on PATH. Run commands
from the repository root. Use one writer per episode; do not edit concurrently
during build/render.

## English-only video policy

All video output must be in English. The required language code is `en`; language
is not a free-choice input. This applies to video text, narration, and supplied
word timings. The CLI records English language metadata; policy and metadata
validation do not establish semantic language detection of text or audio. Human
review must verify that the actual video content is English. English UI and video
metadata are separate from the current user's chat language, which may be Russian.

## Silent draft → review → final60

```sh
python3 engine/scripts/pipeline.py init --episode episodes/demo --id demo \
  --brand brands/lakesentry --format horizontal --duration 8 --voice none \
  --author 'Author' --thread-url 'https://example.org/thread'
# For 9:16: --format vertical (1080x1920 instead of 1920x1080).
# A human edits script.md and content.json; replace placeholders with English content.
python3 engine/scripts/episode.py status episodes/demo
# Run the next command ONLY after an actual, explicit human decision:
python3 engine/scripts/episode.py approve episodes/demo script --human 'Reviewer' --confirm
python3 engine/scripts/pipeline.py build --episode episodes/demo
python3 engine/scripts/pipeline.py render --episode episodes/demo \
  --fps 30 --chunk-frames 240 --resume
# A human watches media/video.mp4 and makes a separate approval decision:
python3 engine/scripts/episode.py approve episodes/demo video --human 'Reviewer' --confirm
python3 engine/scripts/pipeline.py render --episode episodes/demo --final60 \
  --chunk-frames 240 --resume
```

The CLI **does not call approve** or supply approvals on the author's behalf.
`init` writes English `metadata` (language/author/thread_url), a local `branch`
descriptor (language/format/name), and `pipeline` settings into a single
`episode.yaml`. This is JSON-compatible YAML, not a second state file. The script
lives in `script.md`; the episode module handles changes and revisions. The branch
descriptor is not a git ref.

`content.json` accepts only the safe universal-template schema: headline,
subtitle, footer, up to three blocks {title, body}, demo, and duration. Duration
must match the episode setting. HTML from data is not executed; data is embedded
by `prepare_page.safe_json`. Templates and local JS are trusted code, not a sandbox.
Demo content must not be presented as a real UI or proven results.

`build` requires current script approval **before the Node CSS subprocess and
source/work writes**. It saves a self-contained `source/index.html`, `brand.json`,
`content.json`, a copy of script.md, the original universal template, and local
assets. Source text is suitable for version control. Binary assets, MP3/MP4, and
the work cache are covered by the existing `.gitignore` for the standard
`episodes/<id>/` layout; for an arbitrary PATH outside that layout, the operator
must define the work exclusion policy. The CLI adds nothing to git. Do not store
a supplied connector response containing base64 audio in version control.

## What the guards actually protect

`episode.require_production` is called before production side effects. Exception:
`episode.load` itself may write state to invalidate stale approvals, as specified
by its contract. An empty, changed, or unapproved script blocks build, voice, and
render before Node/FFprobe. A human must genuinely approve the script; merely
filling in a placeholder is not approval.

The build binding in `episode.yaml` records the script hash/revision, settings,
hashes of content/audio/timings, the entire brand directory, and the engine
JS/Python files in use. All source files are hashed separately. Render recomputes
the binding and source hashes before subprocess execution and after completion:
changes to production inputs require a rebuild; script changes require new script
approval. Build does not create approvals.

**This is prompt/workflow approval, not cryptographic approval of all data.**
Existing human approval covers only the script hash/revision. Content/brand can
be changed and a new build explicitly run within the approved script's scope;
such a rebuild invalidates video approval. This does not mean a human independently
approved each new content/brand hash. There is no separate `bind-content` or content
approval. If edits go beyond the approved script, first change script.md and
obtain genuine human approval again. Local state files are trusted; manual edits,
direct Node execution, and other scripts can bypass the CLI. There is no IAM,
signing, protection against a malicious operator, or support for concurrent writers.

## MP3 and existing word timings

With `init --voice mp3` instead of `none`, after script approval:

```sh
python3 engine/scripts/pipeline.py voice --episode episodes/demo \
  --mp3 /path/approved-voice.mp3 --timings /path/words.json
python3 engine/scripts/pipeline.py build --episode episodes/demo
python3 engine/scripts/pipeline.py render --episode episodes/demo --fps 30 --resume
```

Import uses FFprobe to verify the actual MP3 codec/container and a positive duration,
then saves `inputs/voiceover.mp3` and normalized `timings.json`.
Only existing word timings are accepted: an array or
`{ "words": [{"text":"Hello","start":0,"end":0.4}] }`.
Timings are mandatory, finite, ordered, non-overlapping, and within both the audio
and video durations. There is no transcription, alignment API, or interpolation
of segment timestamps. Word accuracy is not machine-verified; a human checks
consistency with the voice and script.

## ElevenLabs: supplied connector response only

For an episode using `--voice elevenlabs`, after script approval:

```sh
python3 engine/scripts/pipeline.py voice --episode episodes/demo \
  --response /private/provided-response.json --authorized-connector-response
```

This uses the existing offline parser: `audio_base64` plus `alignment` or
`normalized_alignment` with characters/character_start_times_seconds/
character_end_times_seconds. The data must actually have been supplied through an
authorized process; the CLI does not fetch it. The parser runs in an isolated
temporary copy of the episode; FFprobe validates the audio, which is converted to
`inputs/voiceover.mp3`, and timings are saved separately. This repository contains
no keys, network calls, ElevenLabs calls, or connected connector.

## Render, errors, audio, and repeat review

Node receives HTML, a separate working cache directory, and `--video`, `--fps 30|60`,
`--chunk-frames N`, and optional `--resume`; dimensions are set through W/H, while
HTML_ROOT and RENDER_CACHE_KEY are fixed. The cache key depends on the production
binding/source; fps and chunk size use separate directories. Resuming preserves
completed chunks; Node/FFmpeg errors are not hidden, and the CLI returns a nonzero
exit code. A failed render does not replace the previous `media/video.mp4`.

Output is prepared under a unique versioned filename, then atomically replaces
`media/video.mp4`; only then does state become `review`. History records input/video
hashes and fps. File replacement and state writing are not a single transaction:
after a crash between them, reload state and review the video again.

`none` deliberately produces **silent output**, without an events.json mix in this
CLI. The −14 LUFS requirement does not apply to silence: loudness is neither
measured nor claimed. In voice modes, FFmpeg adds audio with apad and a loudnorm
target of −14 LUFS/−1 dBTP, encoded as AAC; this is single-pass processing, not
certification of measured integrated loudness. Captions/word-driven animation are
not added automatically: timings are stored as a mandatory, validated production
input, not a promise of burned-in subtitles.

A 30 fps draft always ends in review. `--final60` (or `--fps 60`) is allowed only
after genuine video approval of the current draft with the same build hash.
Changes to approved video bytes already invalidate approval through `episode.load`,
returning the episode to review. The new 60 fps file **does not inherit the draft's
approval**: the pipeline also explicitly clears video approval and sets review,
even if the encoder happens to produce identical bytes. Watch and approve the new
file again through `episode.py approve`. Transitions to publish_ready/published
and publication are outside the CLI's scope.

## Verification

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -p 'test_pipeline.py' -v
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -v
```

Tests cover guards before subprocess execution, init, both self-contained formats,
script/content/source/brand/config/audio invalidation, Node errors, draft/final
approval, and offline import. MP3, renamed WAV, and corrupt audio are checked with
real FFmpeg/FFprobe. A separate audio integration test actually muxes audio, but
replaces Node with a small FFmpeg video fixture. **No mocked Node test proves that
a real browser render succeeded**. For actual browser E2E, run the commands above
with Playwright installed, genuine approvals, and visual review; this automated
verification does not claim that result.
