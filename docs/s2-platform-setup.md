# S2 platform preparation (not deployment)

Version: 0.2.0, 2026-10-28. This prepares repository contracts for a future
LakeSentry end-to-end run. No platform agent is installed, and external storage,
TTS and publishing are not connected here. Only a local storage test adapter exists.
The governing policy is [agent/INSTRUCTIONS.md](../agent/INSTRUCTIONS.md).

## Assembly and development boundary

Load the shared instructions, then the relevant skills: `demo-video`,
`video-format`, `seo-publish`. Preserve one episode per thread and make durable
Git/storage references available on resume. Repository files alone do not register
an agent with the platform. Installation and connector authorization require an
administrator and separate validation; if unavailable, stop the external operation.
Use connector-managed secrets only, never raw API keys as a workaround.

All development, including tests, currently stays on
`dev/s2-lakesentry-e2e-20261028`. Future `ep/<episode-id>` production branches
isolate episode work; they are not development branch instructions.

## Actual CLI, from repository root

Python >=3.10. State files named `episode.yaml` contain JSON-compatible YAML;
indented YAML is not supported. See [state-and-audio.md](state-and-audio.md).

```sh
python3 engine/scripts/episode.py --help
python3 engine/scripts/episode.py create episodes/demo --id demo --title 'Demo' --language fr
# Complete intake first, then write the script; status detects its new bytes.
python3 engine/scripts/episode.py status episodes/demo
python3 engine/scripts/script_check.py episodes/demo/script.md --max-words 180
# Only after the named person's actual explicit approval of current hash/revision:
python3 engine/scripts/episode.py approve episodes/demo script --human 'Reviewer name' --confirm
python3 engine/scripts/episode.py transition episodes/demo voice
# Only an already authorized connector response; this command makes no network call:
python3 engine/scripts/voice_elevenlabs.py episodes/demo /private/connector-response.json --authorized-connector-response
python3 engine/scripts/episode.py transition episodes/demo render
# An available guarded renderer must actually create media/video.mp4 here.
python3 engine/scripts/episode.py transition episodes/demo review
# Only after actual human review of this video hash:
python3 engine/scripts/episode.py approve episodes/demo video --human 'Reviewer name' --confirm
```

These commands are primitives, not a complete automated flow. `transition` only
changes state. The lifecycle is `topic → script → script_approved → voice → render
→ review → video_approved → publish_ready → published`; approved states require
`approve`, never `transition`. `status` may write state: changed script bytes reset
both approvals, increment revision and return to `script`; changed/missing video
revokes video approval and returns approved-or-later state to `review`.
Local name/confirmation flags attest a decision, not identity verification.

`pipeline.py` is being added separately as a guarded init/import/render/review
entry point. Its CLI arguments are intentionally not specified here: inspect its
actual implementation and `--help` when available. Do not guess subcommands/flags
or treat this document as evidence it is installed or complete. It must enforce
intake, current script approval, operation ordering, immutable artifact review and
cleanup. Existing raw Node/shell commands are not automatically guarded.

Production integrations must call `episode.require_production(root, action)`
before side effects (`voice`, `render`, `package`); package also needs video approval.
Do not use that low-level check alone as proof the entire intake/final delivery
policy is implemented: `episode.py` does not enforce the 5–7-source intake or a
separate preview/final acceptance model.

## Page preparation and rendering reference

After current human script approval, a guarded integration may use:

```sh
python3 engine/scripts/prepare_page.py --brand brands/lakesentry \
  --template universal-landscape.html --data /path/to/episode-content.json \
  --out /tmp/episode-page
```

`--output` aliases `--out`. Output must be new/empty and separate from brand and
template inputs. Universal landscape/vertical templates accept validated JSON:
`demo`, `headline`, `subtitle`, `blocks`, `footer`, `duration`; at most three blocks.
Assets must be local under `assets/`. Legacy templates reject content overrides;
prepared pages explicitly warn that demos are not verified product UI or results.
Resource checks target trusted templates and are not a JavaScript sandbox.

[Render README](../engine/render/README.md) documents the actual Node API:
`render.js INPUT_HTML OUTDIR --video OUTPUT --fps FPS --chunk-frames N [--resume]`.
This is a reference, not permission to bypass the guarded entry point. Use 30 fps
for the complete preview and 60 fps only after preview human video approval.
Viewport settings are `W`/`H`; duration comes from `window.DURATION`, not fps.
Keep outputs outside HTML_ROOT and freeze page/assets for the run. Video output
is silent H.264; any audio mix changes the review artifact and its hash.

Preserve preview30, its manifest/hash and human decision before creating final60.
The same content at a new fps has different encoded bytes. The current state
module has only `video_path` and a single video approval: replacing its approved
file invalidates that approval on load. Do not change state by hand or silently
approve final bytes. Track both immutable artifacts/reviews and obtain explicit
human delivery acceptance for final60; with final at the reviewed video path and
state `review`, record its actual human approval before packaging. If the wrapper
cannot safely represent this sequence, stop and report the missing capability.
`publish_ready` is permission to package, not proof an archive exists; `published`
is recorded only after successful authorized external publication.

## Storage, security and validation

```sh
python3 engine/scripts/episode.py version episodes/demo --storage /tmp/s2-local-storage
python3 engine/scripts/episode.py restore episodes/demo-restored --storage /tmp/s2-local-storage --version <returned-uuid>
python3 engine/scripts/doctor.py --path .
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -p 'test_*.py' -v
```

Storage must be disjoint from the episode and outside Git. UUID snapshots include
persistent files plus SHA-256/size manifests, excluding `work/`; restore requires
an absent destination, validates paths/checksums and clears current approvals.
This is local testing, not external persistence or signed audit evidence. Git plus
external versioned media storage remains the target durable truth, not chat.

Use one writer per episode. Delete per-run work and private temporary
`storageState` in success/failure cleanup; login state otherwise persists by design.
Never place state/secrets under HTML_ROOT or storage snapshots. Remote CDP routing,
real browser behavior, audio playback, UI authenticity and external integrations
need separate authorized validation. Doctor checks presence, not connection health.
A platform rollout must demonstrate human gates, changed-hash invalidation,
restore/re-review, preview/final delivery acceptance and connector failure handling
before claiming end-to-end readiness. No browser test or deployment is implied here.

Short FR/NFR reference: the shared contract owns workflow and safety requirements;
[requirements-index.md](requirements-index.md) points to deliverable-specific legacy
sources and known conflicts. Do not claim absent source documents were consulted.
