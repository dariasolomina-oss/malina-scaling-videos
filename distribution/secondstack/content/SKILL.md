---
name: video-production-toolkit
description: Produce source-grounded English product videos for T1A products with branded scene templates or custom full-screen animation, an animatic, a final render in 16:9, 9:16 or 1:1, covers, and YouTube copy on request after acceptance.
---

# Video production toolkit

The Agent's instructions override this Skill and its references wherever they
differ. This Skill gives you tools and procedures; it never forbids what the
Agent's instructions allow.

Resolve this installed skill's actual directory as SKILL_ROOT. Run
`python3 "$SKILL_ROOT/verify.py"` before use. Read references/workflow.md, then
references/research.md and references/format.md for the current episode. Use
references/youtube.md after final acceptance when the user asks for YouTube copy;
references/runtime.md lists commands and options. references/frame-review.md holds
the rules for the frame review that `pipeline.py review` sends to vision models;
use it yourself when that review cannot run.

Production library: `SKILL_ROOT/runtime/`. Keep that tree unchanged. Work on a copy
outside the installed skill if dependencies must be installed, and write episode
files outside both library trees. Activation may reinstall support files; it is
not persistent episode storage. Continue an old episode with the same toolkit
release; start a new episode for a new release.

Read the selected product Collection with the knowledge tools of this run.
User-supplied material and current official documents can add evidence. Templates
and example JSON are not product evidence.

When a command refuses, its message says what to do next: do that, or use the
option it names. If something the toolkit does not cover is needed (captions burned
into the video, music mixing, a custom scene), build it yourself in the workspace
(FFmpeg, Node, Python, the browser, media generation).
