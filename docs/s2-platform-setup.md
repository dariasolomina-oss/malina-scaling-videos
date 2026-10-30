# S2 platform preparation (not deployment)

Version: 0.2.1, 2026-10-29. This prepares Video Producer repository contracts for a
LakeSentry end-to-end run. No platform agent is installed. The accepted first run
uses chat attachments for media input/output, WITHOUT Drive/S3. External storage
is optional for this run, not a blocker. TTS and publishing are not connected here;
only a local storage test adapter exists.
The governing policy is [agent/INSTRUCTIONS.md](../agent/INSTRUCTIONS.md).

## Assembly and development boundary

Load the shared instructions, then the relevant skills: `demo-video`,
`video-format`, `seo-publish`. Preserve one episode per thread and make durable
Git/artifact references available on resume. Repository files alone do not register
an agent with the platform. The currently inspected chat-actions catalog has no
`agent_create`; creating the requested named **Video Producer** requires a supported
platform UI/admin action, followed by separate validation. Do not claim these files
installed the agent. Connector authorization likewise requires an authorized setup;
if unavailable, stop only the affected external operation.
Use connector-managed secrets only, never request raw API keys or write credentials
or environment values into files as a workaround. Mariia’s current Git connector
`Mariia Git · dariasolomina-oss` has working read access; write/push remains unverified.
The failed historical push in `technical-validation.md` is not proof that the current
connector cannot read, nor is read success proof of write authorization.

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

`engine/scripts/pipeline.py` now exists as a guarded init/voice/build/render entry
point; see [lakesentry-e2e.md](lakesentry-e2e.md) and inspect its actual `--help`.
It is a local CLI, not a deployed agent, live TTS connector or publication flow.
Do not guess flags or treat synthetic test approvals as production approval.
Existing raw Node/shell commands are not automatically guarded.

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
Legacy/mockup visuals must be disclosed in script, media and handoff; never present
them as the actual LakeSentry UI. If the user needs real UI, obtain authorized real
capture or report that specific gap. Resource checks target trusted templates and
are not a JavaScript sandbox.

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

## First run: chat attachments, not mandatory cloud storage

- Accept authorized source media via chat attachments; import into isolated episode
  paths. Deliver actual preview/final files back as attachments and identify each
  by filename, byte size, SHA-256 and approval/revision. A local path is not delivery.
- First validate the platform’s actual attachment import/export capability and
  measure MP4 limits with representative files. Limits are currently unverified;
  do not promise a specific maximum size, retention period or successful handoff.
- Keep script/preview/final approvals separate and bound to exact bytes. Chat delivery
  neither marks `published` nor authorizes public upload. No Drive/S3 setup is needed
  merely to run locally and attach the result. If attachment delivery is unavailable,
  report that concrete transfer blocker rather than inventing a storage prerequisite.
- Record recoverable references/hashes and unresolved persistence risks. Cross-turn,
  cross-session and workspace-loss recovery remain unverified. A local snapshot test
  does not prove recovery of chat attachments or a deployed agent.
- `seo-publish` storage/upload gates concern optional external publication only;
  they do not block the accepted attachment-only delivery mode.

## Optional storage, security and validation

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
external versioned media storage is a future durable-recovery option, not a first-run
prerequisite. Chat-attachment durability and full recovery are not established.

Use one writer per episode. Delete per-run work and private temporary
`storageState` in success/failure cleanup; login state otherwise persists by design.
Never place state/secrets under HTML_ROOT or storage snapshots. Remote CDP routing,
real browser behavior, audio playback, UI authenticity and external integrations
need separate authorized validation. Doctor checks presence, not connection health.
Before claiming full end-to-end readiness (rather than a limited first run), validate
the dedicated agent’s runtime/resource limits and attachment transfers, human gates,
changed-hash invalidation,
restore/re-review, preview/final delivery acceptance and connector failure handling
before claiming end-to-end readiness. No browser test or deployment is implied here.

Short FR/NFR reference: the shared contract owns workflow and safety requirements;
[requirements-index.md](requirements-index.md) points to deliverable-specific legacy
sources and known conflicts. Do not claim absent source documents were consulted.

## Remaining platform work (not performed by this configuration update)

1. Create/configure Video Producer through supported UI/admin controls; load this
   contract and the three skills, and authorize the intended Git connector.
2. Check authorized Git write/push separately only if requested; do not infer it
   from current read success or perform a push as a connectivity test without consent.
3. Validate named-agent runtime/browser/render prerequisites, attachment media I/O
   and representative full-length limits; short workspace smoke tests are not enough.
4. Complete LakeSentry intake and real-evidence/explicit-mockup choice, then obtain
   real script and artifact approvals. Live voice needs an authorized connector or
   an approved supplied recording; do not request a key. Explicit no-voice remains
   a valid intake choice. Review existing Playwright security/upgrade caveats in
   `technical-validation.md` before deployment.
5. Test restoration/re-review separately; do not claim verified persistence. Drive/S3
   and external publishing remain separate optional integrations, not first-run gates.
