---
name: video-format
description: Specify aspect ratio, duration, scene structure, captions and timing requirements for an approved video format without changing workflow approvals.
version: 0.2.0
---

# Video format

Common policy: `../../agent/INSTRUCTIONS.md`. This skill defines the deliverable
contract; it does not authorize production.

- Confirm 16:9 landscape (1920×1080) or 9:16 vertical (1080×1920), duration in
  seconds, language, voice, caption treatment and intended channel before script.
  Different aspect ratios need explicit layout review, not an automatic crop.
- State the opening problem, evidence-led demonstration, takeaway and CTA. Keep
  each beat's viewer benefit, visible action and narration in the script table.
- Consult the brand guide and `../../docs/requirements-index.md`. Flag conflicts or
  unavailable reference documents; do not guess platform safe zones or override
  current brand-specific rules using legacy samples.
- Use finite `window.DURATION` and pure seekable `window.render(t)`; make event
  times in `T` global seconds, independent of fps/chunks. Keep randomness, network
  dependencies and real-time timers out of deterministic pages.
- Universal templates accept JSON content; their `demo` label does not establish
  product authenticity. Legacy fixed templates reject content overrides.
- preview30 and final60 mean fps, not durations. Both contain the full identical
  approved editorial timeline. Review readability, clipping, motion, timing,
  audio sync, captions and safe zones at both delivery settings. The renderer
  exports silent H.264: verify any separately mixed final audio and its hash.

Output a compact format specification and scene/timing constraints for the script;
report unresolved visual requirements before requesting script approval.
