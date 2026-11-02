# English-only project and video output policy

Version 0.4.0 · 2026-11-02 · requested by Liliya Minibaeva.

## Required outputs

All newly authored project deliverables are English: documentation, status files,
product/technical descriptions, briefs, research summaries, scripts, review notes,
code identifiers/comments/docstrings, CLI messages, generated manifests, on-screen
text, narration/recordings, captions/SRT, covers, and YouTube titles/descriptions.
The output language is exactly `en`, not a question to ask during intake.
Conversation may follow the user's language. A Russian conversation is not permission
to generate Russian research, technical documentation, script, video, or metadata.

External source text may be read in any language. Write its interpretation in English
and retain accurate observed URLs, IDs, legal names and provenance. Machine paths,
authorship/legal names, licenses, and explicit negative test data are not prose to
translate arbitrarily. Do not alter historical Chat attachments or approved bytes.
For any revised/translated production input, create a new English revision and obtain
fresh approval. Previously accepted content is not silently grandfathered through a
new production step if it violates the policy.

## Runtime checks

`engine/scripts/language_policy.py` is shared by the entry points below:

| Entry point | Mechanical check |
|---|---|
| `episode.py create/load/restore` | Declared language is exactly `en`; creation validates title. Invalid old state is rejected without silently rewriting it. |
| `episode.py approve/require_production` | Script prose passes the conservative output check before approval/media side effects. |
| `prepare_page.py` | Universal-template headline/subtitle/footer/block text is checked before output writes. |
| `pipeline.py` | Script gate, static content checks and supplied voice/caption words; policy code contributes to build binding. |
| `voice_elevenlabs.py` | Supplied alignment words are checked before installing response artifacts; no live TTS API. |
| `make_srt.py` | All caption text is checked before opening/truncating the SRT output. Legacy local Whisper invocation explicitly uses `-l en`. |
| `script_check.py` | A language-policy failure is a machine error, while semantic language/audio review remains pending. |
| `youtube_metadata.py` | Exact `en` and checked title, description, primary keyword, alternatives and editorial prose before export. |

The episode JSON Schema also specifies `language: const en`. It is documentation,
not a replacement for runtime checks. Direct arbitrary HTML/JS/ffmpeg calls do not
become a secure sandbox or acquire automated OCR/audio classification from this policy.

## Limits: do not overclaim English detection

The dependency-free check rejects non-Latin Unicode letters in checked output prose.
It allows Latin letters, accented names, punctuation, numbers and symbols; literal
source URLs are excluded from script/description checks. This is a conservative
script check, **not a natural-language classifier**. French or Spanish written in
Latin letters can pass. An `en` label does not prove the text is English.

The authoring agent must write English and semantically review the text. Actual audio
must be heard/reviewed against an English transcript: MP3 codecs, supplied word
alignment and a forced English transcription setting do not identify or prove the
spoken language. No unimplemented language-recognition service is claimed.

Documentation translation covers maintained repository documentation; immutable
historical Chat files remain historical. Existing old snapshots must not be described
as current English-compliant outputs. A current English project status is maintained
in `docs/project-status.md`.

## Rollout

- Shared Project instructions now carry the English-only policy for future turns.
- Repository changes are prepared in `fix/english-only-20261102`; they are not active
  on `main` until reviewed and merged.
- The separately published Video Producer profile and its embedded fallback are not
  automatically replaced by a push. Review/publish that profile separately when
  rolling out a new bootstrap/policy, and test with a fresh project conversation.
- Do not infer universal enforcement in every historical/custom pipeline from a
  successful unit test of the maintained entry points.
