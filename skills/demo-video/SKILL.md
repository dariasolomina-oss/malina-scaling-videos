---
name: demo-video
description: Orchestrate a source-grounded product demo from complete intake through human script review, guarded preview30, final60 and delivery acceptance.
version: 0.2.0
---

# Demo video

Common policy: read and follow `../../agent/INSTRUCTIONS.md`. This skill cannot
waive its gates. CLI availability: `../../docs/s2-platform-setup.md`.

1. Identify the thread's one episode and collect every mandatory intake input.
   Research 5–7 sources and record the supported claims and evidence limitations.
2. Apply `video-format`; fill `../../templates/script.md`. Include full narration,
   ordered scenes, evidence references, sample disclosures and unresolved questions.
   Run `script_check.py` as an editorial aid, not approval.
3. Present the exact script hash/revision to the reviewer. Wait for their explicit
   decision before recording the local attestation or producing any media.
4. Use only an available guarded production entry point. Authorized connector audio
   may be imported after approval; the offline voice parser does not call ElevenLabs.
   Verify real audio and timings before binding semantic events in `T`.
5. Build a self-contained page from a trusted universal template and episode JSON.
   Review stills, then render the full timeline as preview30. Raw rendering tools
   are implementation references, not a standalone safe episode workflow.
6. Collect timecoded review comments, resolve them and obtain human approval of
   the actual preview artifact. Follow the common final60 and separate delivery
   acceptance rules; record both artifacts and hashes without inheriting approvals.
7. Pass the accepted exact delivery artifact and approval evidence to `seo-publish`.

If `pipeline.py` is not available or its guards have not been verified, stop at the
last safe stage and report the blocker. Do not invent wrapper commands or flags.
