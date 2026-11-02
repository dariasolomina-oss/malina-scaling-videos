# Malina Videos Production — project status

Updated: 2026-11-02. This is a status snapshot, not full MVP acceptance.

## Repository and deployment

Repository: https://github.com/dariasolomina-oss/malina-scaling-videos .
The S2 development branch was merged into main at `3d8c072cd066523e7c39650da042a21a265203e3`.
The current English-only changes are prepared in `fix/english-only-20261102`;
they are not merged into main or silently activated in the separately published
Video Producer profile. Project instructions have been updated with the language rule.

## English-only requirement

All newly authored documentation, technical descriptions, code/comments, scripts,
review/research/status files and video-related deliverables are English. Output
language is fixed to `en`: screen text, voiceover, captions, covers and YouTube copy.
Conversational responses may use the current user's language. Historical Chat files
and previously approved bytes are not overwritten; content changes require fresh
approval. Runtime checks are conservative, not semantic/audio language detection.
See `language-policy.md`.

## Implemented and tested baseline

- Named Video Producer is published and included in the Project. Billing is
  Whoever uses it; this does not grant access to external data. Mariia, Liliya and
  Daria have Manage access according to the last verified configuration.
- Git/GitHub access is scoped to this repository. A read-only test from the Agent
  successfully fetched/read main and the product/research/SEO policies.
- Pipeline/state guards, brand CSS/local fonts, offline page preparation, CDP
  rendering, ffmpeg streaming/chunks/resume, audio import and timing adapters exist.
- Product brief and source registry reference official LakeSentry documentation;
  topic-specific reading and episode RESEARCH.md are required before scripting.
- Liliya reported a successful generation test. A later attached research/script/
  review package was audited: file sizes/hashes and 14-second frame math agreed;
  phone-size readability and visual causal meaning still require artifact review.
- YouTube copy is written by the Agent after final delivery acceptance. The offline
  exporter checks approved hashes and exports Markdown/JSON; it does not call a
  model, upload to YouTube, or guarantee factual accuracy/ranking.

## Content Machine and access

https://content-machine.spot.t1a.dev/ls/ is optional read-only editorial context,
not the required origin of video topics or authority for product capabilities.
The last Agent-specific test on 2026-10-30 returned HTTPS 401 / ControlTower login.
Another assistant's authenticated browser does not confer access on the Agent.

Desired access is user-scoped: the board should check the launching user's delegated
identity and return only authorized read data. Platform/board support and a read-only
integration remain unverified/unimplemented. Billing is not authorization. Never
transplant cookies/tokens, fall back to another user's rights, or expose cached
restricted data to a different user. Shared-thread visibility also needs review.

## Remaining work and limitations

- Review/merge the English-only branch and confirm runtime/profile rollout.
- Verify/change the Agent model according to the specification using the current
  authorized account; this documentation does not claim that change occurred.
- Implement/validate automatic Git bootstrap/caching and per-episode revision pins.
- Test attachment reimport, cross-thread/workspace restoration and concurrency.
- Complete live TTS/STT, sound-event integration, full subtitle/thumbnail/publication
  packaging, and the additional product packs/pilot.
- Upgrade the historical Playwright 1.48.2 pin with compatible Node/runtime testing;
  the known browser-download security advisory remains a release consideration.

The initial no-Drive/S3 pilot decision remains: input/output via Chat attachments,
workspace for processing. Persistent recovery must be verified, not assumed.

## English-only validation

67 Python tests and 7 Node tests passed for this development increment. Coverage
includes declared-language rejection, altered state, checked output text, subtitle
no-overwrite behavior and supplied voice-word guards. These are not semantic
English classification, spoken-audio detection or a full rendered-video acceptance.
