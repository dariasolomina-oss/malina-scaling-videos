# Where the deliverable requirements live (as of 2026-10-27)

The rules are spread over four files in the source folder `z_04_ai videos/`. This index points at them; it does not restate them.

| Deliverable | Rules are in | Section |
|---|---|---|
| Video, animated (16:9 and 9:16) | `_flow/STYLE_GUIDE.md` | §1 brand, §2 real product UI, §3 camera and motion, §4 interaction, §5 story and on-screen text, §6 sound, §7 vertical teaser structure |
| Video, talking-head Short | `_flow/STYLE_GUIDE.md` | §10 and "after TZ10" (layout square + face, 2-second hook, cut proposal, burned-in captions, 12 dB voice clean) |
| Video, talking-head Short (older Remotion pipeline, TZ3 to TZ8) | `CLAUDE.md` | "Creative rules", "Retention", "Variety system", "Episode style log" |
| Safe zone for Shorts | `_assets/шортс_сейф_зоны_2025 (1).png` | top 240, left 60, right 120, bottom 380 clear (three other safe-zone PNGs in `_assets/` are older) |
| Thumbnail (16:9) and cover (9:16) | `_flow/STYLE_GUIDE.md` | §8 "Thumbnails": size, safe area, word count, type, proof element, file name; templates `_flow/templates/thumbnail-*.html` |
| Thumbnail face cutout (talking head) | `CLAUDE.md` | step 8 + "Retention" (rembg, `smooth_cutout.py`) |
| SRT | `_flow/STYLE_GUIDE.md` | §8 table: characters per line, cue length, source, line-break rules |
| Title, description, tags, pinned comment | `_flow/STYLE_GUIDE.md` + `_flow/templates/publish-horizontal.md`, `publish-vertical.md` | §8 table; `CLAUDE.md` "Upload copy is Shorts-style" |
| Sound levels | `_flow/STYLE_GUIDE.md` §6; `CLAUDE.md` step 7 and "Audio" | −14 LUFS, effects ducked, no music, no celebration sounds |
| Brand tokens | lakesentry.io/brandkit; `_toolkit/remotion/src/brand.ts`; `_assets/brand/` lockups | colours, fonts, logo files |
| Voice and copy gates | GTM repo `lakesentry-gtm/_guidelines/brand-voice/02-forbidden.md`, `04-ai-detection.md` | applied to every script |
| Script format | `_flow/SKILL.md` step 3; example `short form/2026-10-21 cost change you can defend/SCRIPT.md` | beat table: time, what the viewer gets, on screen, voiceover |

## Known conflicts between the files

- **Captions:** `STYLE_GUIDE.md` §8 says don't burn subtitles in; §10 "after TZ10" and `CLAUDE.md` say burn yellow word-by-word captions into talking-head Shorts. The talking-head rule wins for Shorts.
- **SRT line length for vertical:** `STYLE_GUIDE.md` says ≤ 24 characters per line; `CLAUDE.md` says ≤ 30.
- **Shorts safe zone:** `CLAUDE.md` says top ~180, bottom ~390, right ~120; `STYLE_GUIDE.md` says top 240, left 60, right 120, bottom 380 from the 2025 PNG. The PNG is the measured one.
- **Frame rate:** `CLAUDE.md` pipeline is 25 fps; `_flow` renders at 50 fps over a 25 fps take, or 60 fps for AI-voice videos.
- **Voice cleanup:** `STYLE_GUIDE.md` §10 says Resolve Voice Isolation; "after TZ10" and `CLAUDE.md` say DeepFilterNet capped at 12 dB. The 12 dB cap is the current rule.
- **Music:** `CLAUDE.md` step 7 still documents music beds; later notes in the same file and `STYLE_GUIDE.md` say no music.

Next step for this repo: merge the two guides into one `docs/requirements.md` with one section per deliverable, resolving the conflicts above.
