# Video flow map (as of 2026-10-27)

Amber = human input or action. Coral = approval gate. Purple = AI voice lane. Teal = human voice lane. Grey = agent work.

```mermaid
flowchart TB
  classDef human fill:#FAEEDA,stroke:#BA7517,color:#412402
  classDef gate fill:#FAECE7,stroke:#D85A30,color:#4A1B0C
  classDef ai fill:#EEEDFE,stroke:#7F77DD,color:#26215C
  classDef hv fill:#E1F5EE,stroke:#1D9E75,color:#04342C

  T1[Your idea + docs<br/>feature, recording, links]:::human
  T2[LinkedIn post<br/>content board, e.g. L161]:::human
  T3[GTM repo script<br/>TZ series, already written]:::human
  T1 --> BR
  T2 --> BR
  T3 --> BR
  BR[Brief<br/>idea in one line, anchor source, format, length]
  BR --> R[Research<br/>agent: RESEARCH.md, sourced claims]
  R --> S[Script<br/>agent: beats, look, voice gates]
  S --> G1{{Gate 1: you approve the script}}:::gate
  G1 -. edits .-> S
  G1 --> A[A: ElevenLabs voice<br/>you: paste, export, move to inputs/]:::ai
  G1 --> B1[B: a human records, e.g. Tatiana<br/>days to weeks; files to inputs/]:::hv
  B1 --> B2[Take log + voice clean<br/>agent: NOTES.md, 12 dB cap]:::hv
  B2 --> G2{{Gate 2: you pick the lines}}:::gate
  G2 --> B3[Cut on silence<br/>agent: joins tested, ≤ 40 s]:::hv
  A --> V
  B3 --> V
  V[Timed voice track<br/>agent: word start times]
  V --> AN[Animation page + render<br/>agent: template, stills check, frames]
  AN --> SC[Sound, captions, cover, copy<br/>agent: -14 LUFS, SRT, publish.md]
  SC --> G3{{Gate 3: your ear and eye check}}:::gate
  G3 -. notes, new version .-> AN
  G3 --> P[publish/ ready<br/>mp4, thumbnail, srt, copy]
  P --> U[You upload to YouTube<br/>rename folder uploaded_..., pin comment]:::human
```

## How topics arrive

Every video starts from one anchor source. So far there have been three kinds:

1. **Your idea plus material.** A feature name, a screen recording, doc links. Used for the product demos (calculator, AI services, MCP server, Genie).
2. **A LinkedIn post from the content board.** The post is the brief and the blog it links to is the source. Used for the 2026-10-21 Shorts scripts (L161, L166, L167).
3. **A script already written in the GTM repo** (`content/videos/short form/`). Used for the TZ talking-head series. The repo copy stays the authority for the words.

The `Brief` step normalises all three into one file: see `templates/brief.md`.

## Where the time goes

- Lane B waits on filming between Gate 1 and the take log. Files sometimes arrive truncated.
- Gate 3 is the longest loop: 4 to 13 versions per video so far.
- Two toolkits coexist in the source folder: the older Remotion pipeline (`_toolkit`, TZ3 to TZ8) and the HTML renderer (`_flow`, everything since October 2026). Lane B still borrows `isolate.sh` and the join checks from the old one.

See `stages-inputs-roles.md` for every stage's inputs and who does what.
