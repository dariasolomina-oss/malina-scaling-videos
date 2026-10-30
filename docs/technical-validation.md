# S2 development validation — 2026-10-28

Scope: initial implementation through a local LakeSentry review path. Development branch: `dev/s2-lakesentry-e2e-20261028`, based on `ab5782ba709ec58b5c7b744d94fff9c207aa3486`.

## What was actually verified

- Clone and fetch from the currently supplied GitHub repository succeeded. No repository transfer was performed.
- A separate **local** development branch was created. Both push attempts failed for missing credentials (`could not read Username for https://github.com`). `gh auth status` reported no authenticated hosts. Project connector discovery returned an empty effective connector list. This is NOT evidence that GitHub permissions were revoked or that an earlier successful connector test was invalid.
- Node 18.19.0, Python 3.11.2, ffmpeg/ffprobe are available. Playwright pinned at 1.48.2 with a lockfile. `npm ci --ignore-scripts` succeeded.
- 36 Python tests passed. Tests cover negative approvals, invalidation, path traversal, snapshots, real MP3 validation/audio mux, safe page preparation and guarded CLI; mocked Node cases are not browser evidence.
- 7 Node tests passed. Real ffmpeg chunks/frame counts, resume, changed inputs, corrupted chunk recovery, termination, spawn/pipe errors and HTTP bridge; browser mocked in this unit suite.
- A separate **real platform-browser CDP** test rendered four control frames of the offline vertical template. The contact sheet was visually inspected. This exposed and led to fixing multirow contact-sheet layout and numeric timestamp ordering.
- `tests/browser_smoke.py --run` executed the real pipeline with synthetic, temporary test fixtures, not production approvals. Both 1920x1080 and 1080x1920 were rendered for one second at 30 and 60 fps. FFprobe confirmed all four frame counts/resolutions. Every render ended at `review`; no draft video approval carried over to the new final artifact.
- Browser smoke: `CDP_URL` supplied from `open_browser`; local HTTP bridge reachable using `BROWSER_HTTP_HOST=127.0.0.1`. No endpoint/secret is committed. Runtime artifacts were kept outside the repository.

## What is NOT verified or connected

| T / requirement | Actual status |
|---|---|
| T1 agent-specific limits | Not tested: no dedicated Video Producer agent installed. Synthetic one-second measurements do not prove NFR-3 for 14/35/120-second videos. Background survives workspace tool calls; cross-turn/process retention remains unverified. |
| T2 shared workspace/concurrent users | Not tested. Single-writer implementation; separate per-episode directories only. |
| T3 MP4 thread attachment limit | Not measured with a full-size video. |
| T4 ElevenLabs | Offline response parser/audio validation implemented; no live authorized connector call or timestamp precision test. |
| T5 external storage | Local-directory test adapter only; no Drive/S3 or 500 MB transfer verified. |
| T6 Git | Read succeeded; local branch exists. Remote push unavailable in this turn; remote branch/PR not created. |
| T7 network | npm and public Google Fonts source downloads succeeded. Product/demo network and login not verified. |
| T8 transcription | Ready word timing inputs supported. No live STT call; no 50 ms accuracy claim. |
| T9 platform skills | Git source files prepared, not installed/published. |
| T10 render | Real platform CDP control frames and four short renders passed, in Project Assistant workspace, not dedicated agent. |
| T11 authenticated product capture | CDP code adapted; no user login, cookie handoff or real product capture tested. |

No live production script/video was approved on the user's behalf. Automated approval fixtures were explicitly labelled `AUTOMATED TEST FIXTURE ONLY` and confined to temporary smoke-test directories.

## Implementation limitations / follow-up

- New universal templates provide an editorial layout (headline/subtitle/three blocks/footer), NOT the full reusable product UI/camera scene library. Existing product-specific templates remain clearly marked legacy demo content. Product facts, metrics and UI still require real sources/capture.
- Geometry safe-zone helper checks explicitly supplied rectangles; automatic DOM extraction/overlay/full layout acceptance remains incomplete.
- `none` currently produces silence in the guarded CLI; events-based sound design is still a separate existing script, not integrated. LUFS does not apply to silence.
- Audio timestamps are normalized and retained, but are not automatically used for click/camera synchronization by the universal editorial layout. Targeted phrase regeneration/live TTS is not implemented.
- Existing `make_srt.py` legacy whisper path is unchanged. Normalized-timings integration/SRT publication belongs to the next integration task; no package is claimed.
- Local snapshots reset approvals on restore for safety. This is stricter than transparent continuation in the original TЗ and requires a human review; full multi-author resume is not accepted yet.
- State/approvals are trusted local JSON-compatible YAML, not IAM or signed records. Direct engine calls/manual state edits can bypass CLI guards. No concurrent writers.
- Pipeline stores a local absolute brand path: another workspace must rebind the brand path and rebuild before production. Git/external-media fully portable recovery remains pending.
- Agent/skills instructions are prepared, but platform deployment requires an administrator. No configured named Agent was available in this execution.
- Historical Playwright pin has high advisory GHSA-7mvr-c777-76hp (<1.55.1), concerning browser downloads without certificate authenticity verification. Do not download browsers through this version; this run used the existing platform browser. Upgrade Node/Playwright together before deployment; CDP close semantics and tests must be revalidated.

## Reproduce

```sh
cd engine/render && npm ci --ignore-scripts && cd ../..
python3 -m unittest discover -s tests -p 'test_*.py' -v
node --test tests/test_render.test.js
# Open the workspace browser first, then supply its actual CDP endpoint:
CDP_URL='<provided endpoint>' BROWSER_HTTP_HOST=127.0.0.1 python3 tests/browser_smoke.py --run
```

This is a tested development increment, NOT acceptance of the full S2 MVP or a deployed end-to-end agent.
