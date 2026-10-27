# Stages, inputs, and who does what (as of 2026-10-27)

Lane A = animated video with an AI voice. Lane B = talking-head Short recorded by a human (e.g. Tatiana). "both" = shared.

| # | Stage | What it is | Inputs needed | Human does | Agent does |
|---|---|---|---|---|---|
| 1 | Topic | Decide what the video is about | Content board, blog post or feature, format, target slot | Picks topic and format | Suggests candidates from the board |
| 2 | Research | Sources for the problem statement | Databricks docs, community threads, lakesentry.io, `_product_core` | Nothing | Writes `RESEARCH.md`, every claim sourced |
| 3 | Script | Scenes, on-screen text, voiceover lines | Research, brand-voice gates (GTM repo pulled), SCRIPT template, product recording or live numbers (Lane A) | **Gate: approves or sends back** | Writes `SCRIPT.md`, runs voice gates, lists open questions |
| 4A | Voice (AI) | Generate the voiceover | Approved script, ElevenLabs, voice choice | Pastes lines into ElevenLabs, exports MP3, moves it to `inputs/` | Nothing |
| 4B | Voice (human) | A human (e.g. Tatiana) records takes | Script sent to them, phone, time slot | Presenter records; operator transfers MP4s, re-downloads truncated ones | Nothing |
| 5B | Take log | What is on the recording | Raw 4K MP4s, the script | Nothing | Transcribes, finds restarts and flubs, writes `NOTES.md` |
| 6B | Cut proposal | Which lines survive | Take log, target length ≤ 40 s, 2-second hook rule | **Gate: picks keep / drop / reorder** | Lists every line with timestamps and a recommended cut |
| 7B | Voice clean + cut | Make the audio track | Raw take, picked lines | Nothing | Noise reduction (12 dB cap), cuts in silence on the 25 fps grid, tail-tests joins |
| 8 | Timing (both) | When each word is spoken | Voice track | Nothing | Word start times, maps each visual beat to a word |
| 9 | Animation (both) | The page that draws the video | Template HTML, timings, real numbers, brand assets, safe-zone PNG, style guide, variety log | Nothing unless product footage is missing | Writes scenes, camera, cursor, data; checks variety vs last two episodes |
| 10 | Stills check (both) | Catch layout bugs cheaply | The page | Optional glance | Renders sample frames, fixes clipping and safe-zone violations |
| 11 | Render (both) | Frames to video | The page, fps | Nothing | Playwright frames, ffmpeg encode |
| 12 | Sound (both) | Effects and levels | `_assets` sounds, event times, voice track | Nothing | Pops / clicks / typing, ducked, −14 LUFS, no music |
| 13 | Captions (both) | Yellow word-by-word captions + SRT | Word timings, grammar and brand fixes | Nothing | Aligns, fixes, reads as a paragraph, burns in, writes SRT |
| 14 | Thumbnail / cover (both) | The click image | Thumbnail template, hook line, 4K face frame (Lane B), brand lockup | Optional: picks the face frame | Face cutout, renders template, checks at 320 px |
| 15 | Upload copy (both) | Title, description, tags, pinned comment | Publish template, script, related video link | Nothing | Writes `publish.md` |
| 16 | Review (both) | Decide if it ships | Numbered version in `versions/` | **Gate: watches, listens, sends notes** (4 to 13 rounds so far) | Logs each version in `NOTES.md`, builds the next |
| 17 | Publish | Get it on YouTube | Final mp4, thumbnail, srt, copy, YouTube access | Uploads, renames folder to `uploaded_…`, posts the comment | Nothing |

## Observations

- Humans touch 6 of 17 stages; 3 are judgment (script, lines, review), 3 are file ferrying (MP3 from Downloads, phone footage, YouTube upload).
- The agent re-reads the same five things every episode: style guide, safe-zone image, sound assets, templates, variety log. Package these first.
- Stage 4 is the fork. From stage 8 on, the pipeline only needs "a timed voice track", whoever made it.
