# malina · scaling videos

A toolkit for making short-form video production repeatable and fast: one raw take in, a finished Short out, with as few manual steps as possible.

## What it optimises

- **Cut** — transcribe the take, pick the clean lines, snap cuts into silence, render a tight jump cut.
- **Animate** — programmatic B-roll (Remotion) from a per-episode scene file, so every video uses the same components but looks different.
- **Caption** — word-level timings, grammar-corrected captions, burned-in plus SRT.
- **Sound** — typing / pen SFX from animation cues, loudness-normalised mix.
- **Publish** — thumbnail from a 4K frame, Shorts-style title / description / tags / pinned comment.

## Layout

```
malina-scaling-videos/
  README.md
  pipeline/        one script per step (transcribe, cut, validate, captions, mix, thumbnail)
  animation/       Remotion project: brand tokens, reusable components, per-episode scenes
  episodes/        one folder per video: raw take, work files, final exports (media is git-ignored)
  docs/            production rules, creative rules, variety system, lessons learned
```

## Principles

- Zero-build where possible: scripts over frameworks, single files over packages.
- Every step is validated by machine first (joins, captions, loudness), then by eye.
- Variety by design: neighbouring videos must differ on most of the style axes, while the brand stays constant.
- Nothing fabricated: numbers, names and claims on screen come from real data.

## Status

Scaffold. Scripts and the animation project get ported in next.
