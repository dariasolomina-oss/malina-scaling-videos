# Current video flows (as of 2026-10-27)

Two entry lanes, one shared back half. Coral boxes are manual gates that wait on a human.

```mermaid
flowchart TB
  subgraph A[Lane A: animated video, AI voice]
    A1[Script + research written first] --> A2{{Gate: you approve the script}}
    A2 --> A3[ElevenLabs voiceover MP3 into inputs/]
    A3 --> A4[Transcribe: word start times drive visuals]
  end
  subgraph B[Lane B: talking-head Short]
    B1[Script drafted in the GTM repo] --> B2[Tatiana records takes, 4K phone, batch]
    B2 --> B3[Log the take in NOTES.md, clean the voice at 12 dB]
    B3 --> B4{{Gate: you pick the lines}}
    B4 --> B5[Cut on silence, every join tested, ~40 s]
  end
  A4 --> S1
  B5 --> S1
  S1[Build the animation page: HTML template, beats timed to words] --> S2[Check stills, then full render, 50 or 60 fps]
  S2 --> S3[Sound mix: pops and clicks, no music, -14 LUFS]
  S3 --> S4[Captions, SRT, thumbnail, upload copy]
  S4 --> S5{{Gate: your ear and eye check, numbered versions}}
  S5 --> S6[publish/: MP4, cover, SRT, publish.md]
  S6 --> S7[Upload to YouTube by hand, rename folder to uploaded_...]
```

## Where the time goes

- Lane B has a scheduling gap between "script drafted" and "takes recorded" that no tool controls. Files sometimes arrive truncated.
- The ear-check gate is the longest loop: 4 to 13 versions per video so far.
- Two toolkits coexist in the source folder: the older Remotion pipeline (`_toolkit`, TZ3 to TZ8) and the HTML renderer (`_flow`, everything since October 2026). Lane B still borrows `isolate.sh` and the join checks from the old one.
