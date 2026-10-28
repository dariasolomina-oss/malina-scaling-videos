> **Historical guide, not a verified product specification.** The narrative below was inherited from earlier work and has not been revalidated here. For the current offline template contract, demo labels, local font loading and legacy limitations, see [templates/README.md](templates/README.md). Local `brand.json` is the build input; no online brandkit or product page is fetched during preparation. Historical “real numbers”, UI and product-bug claims below are not evidence and must not be republished without fresh source verification.

# LakeSentry video style guide

What we learned making the calculator demo (long form) and its teaser (short), on 2026-10-07.
Most rules here came from direct feedback. Where a rule exists because something was rejected, the rejected version is noted, so nobody tries it again.

Brand source of truth: <https://lakesentry.io/brandkit/> (rules for AI agents: <https://lakesentry.io/brandkit/agents.md>).
**Read it before every new video.** If anything below conflicts with the brandkit, the brandkit wins.

---

## 1. Brand

| Topic | Rule |
|---|---|
| Logo | Only the official files in `_assets/brand/`. Use the lockup (`lakesentry-lockup-forlight-transparent-2400.png`) for "logo + name". Use the red mark (`lakesentry-red-transparent-1024.png`) for small icons, such as link previews. **Never retype "LAKESENTRY" in a font.** Never recolor, glow, outline or rotate the logo. |
| Name in copy | **LakeSentry**: one word, capital L and S. |
| Fonts | **Outfit** (500–800, tight tracking) for headings, big numbers and titles. **Plus Jakarta Sans** (400/500/600) for body and UI text. Mono only for code/formulas (`ui-monospace, SFMono-Regular, Menlo`). The current offline build loads local font files from `assets/fonts/`; see their source and license records. |
| Colors | Ink `#0F1729` · muted text `#566376` · borders `#E1E7EF` · background `#FCFCFC` · primary `#0950C3` (buttons go to `#1588C1`) · accent teal `#09A7B9`. Charts: `#2463EB` jobs, `#10B77F` SQL, `#AF57DB` interactive, `#E23670` streaming, `#F59F0A` environment/idle. Red for strike-throughs: `#DC2828`. **Never `#F80000`**, which is logo-only. |
| Look | **Light, calm, technical.** Website background = soft white `#FCFCFC` + faint grid (1px lines at ~4–5% ink, 44–60px cells). |
| ❌ Rejected | Dark/neon "AI startup" styling, glassmorphism, glows (v1 of the demo). Gradient backgrounds (teaser v1: "I don't like the gradient"). Gradient text. Red alarm / "budget exceeded" panic imagery; use neutral "?" question cards instead. |

## 2. Product UI must be the real product

- Rebuild the **real** UI as HTML, matching a screen recording of the live site: the same layout, labels, presets, chips, sliders, summary card and buttons.
- Use **real numbers** from the live calculator. Open it in the browser and click through the presets.
- A Chrome-style browser frame with the real URL works well. The URL can update when "Share link" is clicked.
- Known live-site bug (2026-10-07): the **Growing platform** preset loads the same values as **Starter**. Don't click it on camera; hover over it, then click **Lakehouse at scale**.

## 3. Camera & motion

- **Zoom in. Always.** On a phone, a full-page view is unreadable. Zoom ~2.0–2.6× on whichever control is being used. Glide between targets with a quintic ease-in-out; on long moves, add a slight pull-back (≈12% scale dip) for a cinematic arc.
- **The key number goes in the center of the screen.** For the result, land on the big range centered, hold, then glide down through the breakdown rows. (Rejected: the range sitting high in the frame.)
- **Full-width tables don't fit at 2×.** A 1,500 px table at 2.1× is 3,150 px wide, so names on the left and numbers on the right are both cut. Pin the column widths, then **pan across the row as the words are spoken**: frame the name column first (camera `dx` ≈ −400), glide to the numbers on the spoken word (`dx` ≈ +450). Long horizontal bars: cap them (`max-width: 760px`) so name + bar + amount fit at ~1.85×. For a wide chart, show the whole chart at ~1.5× while it draws, then push in to ~2× on the legend. (AI Services demo, 2026-10-08.)
- When zoomed, keep the UI **flat** (2D transform only, no rotateX/translateZ), so text renders sharp.
- **60 fps.** Everything is computed from `render(t)`, with no CSS transitions, so every frame is deterministic.
- Make everything **big**: on-screen text, toasts, cursor (~44px) and click ripples. Test at phone size.

### Two looks, one brandkit
Each video should look different from the last one while staying inside the brandkit (the user: "make it look different from the calculator video but in the same brandkit"). Three looks exist so far (A, B, C below); alternate or invent a fourth, don't repeat the previous video's.

| | Look A: calculator demo (2026-10-07) | Look B: AI Services demo (2026-10-08) |
|---|---|---|
| Background | Line grid, radial mask, soft halo | Dot grid, no halo |
| Opening | Centered title, key phrase in primary blue, drifting 3D cards | Left-aligned title, key phrase with a **teal underline bar**, four product tiles stacked on the right ("$ ?" → values) |
| Feature name | Pill badge: lockup + name | Announce block: small-caps eyebrow INTRODUCING, big Outfit 800 name, teal rule, lockup |
| App | Chrome browser window, 3D fly-in with rotateX | Flat app card, no chrome, rises from the bottom |
| Camera | Quintic glides with a pull-back dip | Quick cubic glides, no dip |
| Emphasis | Blue tinted boxes on rows / headers | **Spotlight**: everything but the card in focus dims to 32%; teal underline sweeps; teal left bars on rows |
| Tabs | Crossfade | Slide sideways |
| End card | Centered: lockup, headline, "Link in the comments ↓" | Left-aligned block + the tiles return on the right (bookend) |

**Look C: MCP server demo (2026-10-13).** Plus-mark grid (small crosses, 64px cells, no halo) · opening: the typed statement over a blurred SQL editor and a half-built dashboard, which sharpen, then blur off as a chat input rises and types the question · feature name: badge lockup | name, then three step pills that pop on "three steps" · app: slim window with a title bar and URL (no Chrome tabs), **slides in from the right**, flat · camera: expo glides, no dip · emphasis: a **hand-drawn orange marker outline** (`feTurbulence` wobble, drawn left to right with `pathLength=1`) around the active control, plus orange tints on spoken words · other surfaces: a dark terminal card for Claude Code, a generic assistant chat (not branded as one vendor's app), a consent card · end card: centered lockup + headline with the scratch, a breadcrumb (LakeSentry › Profile › MCP) that builds on the spoken words.

**Look D: TZ9 split-screen short (2026-10-13).** Graph-paper grid (96px major + 24px minor lines, no halo) · opening: the typed problem line + orange scratch, then five numbered step dots pop on "five steps" · app: the calculator page as a flat rounded card (no browser chrome) that fades in wide, then zooms · camera: smootherstep glides, no dip · emphasis: a **blue focus ring** that travels from control to control and morphs its box (amber on the Environment behavior row), plus a teal bar under "Rough is fine" · overlays: a live estimate card bottom-right while zoomed into controls, amber tag chips on a white tray ("Idle clusters · Failed jobs · Reruns"), a link-preview card for "share the link" · end card: centered lockup, "Know your Databricks budget before the bill arrives" with the scratch, URL, "Link in the comments ↓" pill.

**Look F: Genie demo v3 (2026-10-19).** Built after the user rejected v2's visuals ("think through them to convey the message better", "communicate through the visuals, not through text"). One metaphor carries the whole video: **two layers**, a white card on top (what Genie costs: $0.00 in a green pill) and an amber-edged slab underneath (the SQL it triggers, metered on a warehouse). The opening acts out the problem with no typed headline (an answer card lifts like a lid; queries stream into a warehouse and drop their Genie mark; the bill shows the warehouse line beside Genie $0.00). The product beats reuse the same layers on real numbers. Explainer graphics (allowance bars, calendar) are allowed when they show a rule the UI can't, and stay visibly separate from the product UI.
- ❌ Rejected (Genie v2): typed problem statements that repeat the voiceover, a release-notes card as the transition, and tab-by-tab zooms that don't make the point. Plan every beat as *what the viewer should get → what they see* before building (see the Genie SCRIPT.md table).

## 4. Interaction rules

- **Align the boxes (Genie demo v14, 2026-10-20: "the boxes are not aligned… different heights").** Cards shown side by side share their top and bottom edges (scale one to the other's height), and the group is centred in the frame. Check with `getBoundingClientRect` at the hold time, not by eye.
- **CTA arrows (2026-10-20):** no slanted ↗ in CTA pills; the user hates it. Use an arrow emoji before the URL (➡️ lakesentry.io). The ↗ inside rebuilt product UI (external-link icons, trends) stays. Teasers point to the long video with "Watch the full demo on YouTube / Link in the description".
- **Camera moves ≥ 0.7 s, and fewer of them (Genie demo v15).** When the voice names two things in one breath ("the people and workspaces"), frame both at once and switch emphasis (highlight + soften the other) instead of zooming twice. Keep camera keys in time order; list each move's duration before rendering.
- **Tab clicks must be readable:** the camera reaches the tab bar ≥ 0.5 s before the click, the cursor rests on the tab ≥ 0.6 s, and the camera holds ≥ 0.6 s on the new tab before moving on (Genie demo v14: a 0.25 s arrival "took quick, I don't understand what button you click").

- **Every change must be visibly clicked by the cursor.** If the product changes something automatically (for example, the scenario switching to *Custom*), give it a visible pulse so the viewer sees the effect.
- **Sync clicks to the exact spoken word.** For example, "Copy" is clicked on "Copy it" and "Share link" on the word "link". Get the timings with `tools/transcribe.sh`.
- Show hovering across options before the click when the voiceover says "pick the closest one".
- A small **live estimate card** (bottom-right) while zoomed into controls helps viewers see the number react to each click.

## 5. Story & on-screen text

- **Exception, MCP server demo (2026-10-13):** the user replaced the typed statement with an animation of the problem itself: someone writing a SQL query and building a dashboard widget by widget, on the voiceover's "writing queries and building dashboards". When the problem is a *task*, show the task being done instead of typing it out. The voiceover still states the problem.
- **Open on the problem statement. Always.** It goes **dead centre of the frame** — centred horizontally *and* vertically, not at the top — and it **types itself out**, character by character with a caret, in time with the voiceover. Then **the key phrase gets a hand-drawn scratch underneath**, drawn left to right, wobbly with grain (the `feTurbulence` + `feDisplacementMap` trick), in orange `#F59F0A`. Example: "Struggling to understand your Databricks <u>AI spend?</u>".
  - Put a soft white radial veil behind it whenever anything else is on screen, so the type always reads.
  - Let the line land and the scratch finish before anything else takes focus; don't start the next move while it is still fading.
  - ❌ Rejected: the statement sitting at the top of the frame; words floating in one by one instead of typing (AI Services demo, 2026-10-08). The earlier calculator demo used centred word-by-word with the key phrase in blue — typing + scratch replaces it.
- **Feature launch videos** (AI Services, 2026-10-08): the problem in **one line, 1–2 s** ("Struggling to understand your Databricks AI spend?") → promise ("Here's how to see where the money goes") → **"Introducing <feature> in LakeSentry"** → **walk through the product, tab by tab**, saying what each view shows and why it's useful → close. Target the calculator demo's length (~35 s), since that video performed well.
  ❌ Rejected (AI Services v2): a scenario opener ("When AI spend jumps, the bill won't tell you why. Most of it sits on one line: model serving") and scenario beats ("hover a spike to see what caused it", "this chatbot is mostly tokens"). Not relatable, and the "one line" claim wasn't true. Don't build a story; show the product.
- **Step numbering starts at the first real action.** "Step one" = start from the closest scenario. Don't number the intro ("describe what you run").
- ❌ **No step-number captions / eyebrow pills** in the corner ("① Start from…"). Rejected as clutter.
- **"Never type a DBU":** show the formula struck through with a **horizontal red-pencil scratch**, slightly wobbly with grain, drawn left to right on the word "DBU". Then dissolve into a green "No DBU math required" badge. (Rejected: a tilted bar.)
- **Sharing moment:** a generic, unbranded **messaging app**. A colleague asks for something concrete ("monthly Databricks budget estimate for 2027"), the link is pasted and sent with a LakeSentry preview card showing the range, and they reply "Perfect, thank you! 🙌".
- **End by tying back to the problem**, then the call to action. Example: "Know your **2027 Databricks budget** before the bill arrives." → pill "Try out the calculator for yourself ↗".

## 6. Sound

- ❌ **No background music.** The ambient pad was rejected ("too much").
- With a voiceover, effects must sit **well under the voice**: volume ×0.33 plus side-chain ducking keyed to the voice (`tools/mix_with_voiceover.sh`). Measured target: effects mean ≈19 dB below the voice, peaks ≈11 dB below. Final loudness −14 LUFS.
- Effects the user liked: soft clicks on every click, slider ticks per value, gentle whooshes on camera moves, toast pops, chat pop/paste/send/ding, and a **celebration on the result** (bell ping + sparks, or the ta-da).
- ❌ **No sound on the end card.** The closing chord and whoosh were removed.
- Prefer the **real sound files in `_assets/`** over synthesized ones:
  - `dragon-studio-keyboard-typing…` for typing. **Soften it:** highpass 180 Hz, lowpass 4.2 kHz, volume ×0.5, short fades.
  - `matthewvakaliuk…mouse-click` for clicks and button presses.
  - `creatorshome-sharp-pop` for things appearing or popping (×0.16–0.22; it's loud).
  - `castanet-roll` under a number counting up (×0.32).
  - `tada-fanfare` when the result lands. ❌ Removed from the MCP server demo (2026-10-13, user: "I don't like the celebration sound"). Ask before using it again.
    If it is used: **keep it low: ×0.18, peaking around −20 dB, under the typing.** At ×0.5 it was "too loud".

## 7. Vertical teaser (short form)

Structure, adapted from the SnapYT/GPT-5 inspiration: short beats, typing, a word swap, cards, a result and a CTA pill.
1. A wide, multi-line chat-style input box types the question, with big text (~58px, wrapping over 2 lines).
2. **Word reel:** the prefix ("No") **never moves**. Only the word after it rolls vertically like a slot reel, with overshoot and motion blur and the edges masked: DBU math → spreadsheets → guesswork. Lay the line out once around the widest word. (Rejected: re-centering the whole line on each swap.)
3. Workload cards: "Sizing…" → "Sized ✓" + amount.
4. Result: big count-up, celebration, then the breakdown streams in under a slow push-in.
5. End: lockup → problem tied back → CTA pill typed out.
- 1080×1920, 60 fps, ~14 s. No voiceover; just the sound design from `_assets` (see `short form/…/source/events.json`).

## 8. Publishing: subtitles, title & description (every video)

Each video folder gets a `publish/` folder with **`<video>.en.srt`** and **`publish.md`** (title + description + platform notes).
**Horizontal and vertical use different formats:**

| | Horizontal (YouTube / LinkedIn) | Vertical (Shorts / Reels / TikTok) |
|---|---|---|
| **SRT lines** | ≤ 42 characters per line, ≤ 2 lines | ≤ 24 characters per line, ≤ 2 lines (narrow screen, UI overlays) |
| **SRT timing** | **One clause per cue, 1.5–3.5 s** (the calculator demo: 12 cues in 33 s). ❌ Rejected (AI Services v1): 5 s cues holding a whole sentence over two full lines: "too verbose" | 0.6–2.5 s per caption, short phrases |
| **SRT source** | Voiceover word timings (`make_srt.py horizontal voiceover.mp3`) | Voiceover if there is one; otherwise the on-screen text (`make_srt.py vertical --cues captions.json`) |
| **Line breaks** | Balanced, bottom-heavy, break after punctuation, never end a line on "the / a / to / with…" | Same |
| **Title** | ≤ 70 characters. Search keywords first, `\| LakeSentry …` last, sentence case | ≤ 50 characters. A hook phrased as the viewer's question; an emoji is OK |
| **Description** | Hook + calculator link in the first 2 lines (above the fold), "In this video" steps, "What you get" bullets, brand line + start-free link, 3 hashtags at the end | 3 lines max: hook, ▶ link to the long video, calculator link, 3 hashtags including #Shorts |
| **Chapters** | Only if ≥ 3 sections each ≥ 10 s, starting at 0:00 | Never |
| **Links** | Clickable in the description | Shorts: set the long video as *Related video*. TikTok/IG: "Link in bio" |

Copy rules: **LakeSentry** (never "Lake Century", a whisper mis-hearing that `make_srt.py` fixes), **Databricks**, **DBU**. Sentence case everywhere (brandkit). Name real prices and dates ("September 2026 list rates"). Don't burn subtitles into the video; upload the SRT as captions.
Templates: `_flow/templates/publish-horizontal.md`, `_flow/templates/publish-vertical.md`.

### Thumbnails (always; every video gets one)

| | Horizontal (YouTube) | Vertical (Shorts cover / Reels / TikTok) |
|---|---|---|
| **Size** | **1280×720** JPG, < 2 MB | **1080×1920** JPG |
| **Safe area** | Keep the **bottom-right corner empty** (the duration badge covers it) | Everything inside the **central 1080×1350 band (y 285–1635)**. The Reels grid crops to 4:5, and app UI covers the top and bottom |
| **Text** | **≤ 5 words**, Outfit 800 at ~120–130 px, 2–3 lines, left-aligned. One key phrase in primary blue | The **hook question**, Outfit 800 at ~150 px, centered, key word in blue |
| **Proof** | One real UI element showing the result (for example, the estimate card **$48K–$75K per month** + colour bar), slightly tilted (−2°…−3°), plus one benefit chip ("No DBU math") | The same result card, big and centered under the question |
| **File** | `publish/<video>-thumbnail.jpg` | `publish/<video>-cover.jpg` |

Rules:
- **It has to read at phone size.** `tools/thumbnail.js` also writes a 320 px-wide preview next to the source page. Look at it: if any text is hard to read there, cut words or make them bigger.
- **Brand:** website white with the grid, the official lockup top-left (horizontal) or top-center (vertical) at ≥ 120 px wide with clear space, Outfit and Plus Jakarta Sans, flat primary blue `#0950C3`. No gradient text, no glow, no dark background, no panic imagery, no faces/stock photos.
- **Make the point of the video obvious:** the topic (Databricks cost), the promise (3 steps / no DBU math) and the real outcome (the range). The title and the thumbnail should complement each other, not repeat word for word.
- Templates: `_flow/templates/thumbnail-horizontal.html`, `_flow/templates/thumbnail-vertical.html`.

## 9. Process lessons

- **Always start with the script** (`SCRIPT.md`: scenes, what's on screen, voiceover) and get it approved before building anything. On the MCP server videos (2026-10-07), work began on a scratch voiceover and was stopped: "First, draft me the script… to review." See SKILL.md step 3.
- **Voiceover: tight, straight to the point.** Problem → promise → solution in the first two sentences. ❌ Rejected (MCP demo v1): an opening story ("Finance wants to know why spend went up… a query against the billing system tables, then a dashboard…"). Too long, and it assumed how the viewer works. State the problem; don't narrate a scenario. ❌ "It answers from your LakeSentry data": viewers don't know what that is yet, so say "your Databricks cost data". Frame the MCP server as **conversational analytics** for Databricks spend.
- Voiceover scripts must not sound like AI. Write them as plain spoken sentences and run them through the brand-voice gates (`02-forbidden.md`, `04-ai-detection.md`).

- Show the user a contact sheet or stills of the key moments before the full render. It catches layout bugs (clipped descenders, overlaps, wrong draw order) cheaply.
- If the voiceover needs restructuring, ask for a fresh ElevenLabs take (voice "Dan – Captivating, Engaging and Inviting") rather than splicing the old one.
- Keep each version in the video's `versions/` folder with a descriptive name.

## 10. Talking-head split screen (vertical, 2026-10-13)

The format for the TZ talking-head shorts (first used on TZ9): **top half = code-rendered animation, bottom half = the presenter**, each 1080×960 in a 1080×1920 frame. The user's call: "the top is the animation, the bottom is her head".
- **Frame rate:** render at 50 fps when the take is 25 fps, so her frames repeat evenly. 60 fps over 25 fps judders.
- **Bottom crop:** head-and-shoulders, face centred, ~14% headroom (TZ9: 1845×1640 out of the 3840×2160 take). After a jump cut, punch in ~6% on the next segment.
- **Top half:** the animation is timed to her words in **record time** of the cut, not source time. Keep key content below y≈140 (the Shorts top bar). Zoom so the active control fills the 1080 width. A 540px-wide page column at ~1.9–2.0× works; wider columns get clipped.
- **Her voice is the voiceover.** Clean it with **Resolve Studio Voice Isolation** (amount ~80, via the MCP), then highpass 80 Hz and 3:1 compression. Duck the effects under it, −14 LUFS. On TZ9 this took the pause noise ~14 dB lower than an ffmpeg FFT denoise did. The user asked for voice isolation on 2026-10-13.
- **Step captions:** still none in the corner (§5). She says "Step one…" and the camera move carries it.
- **Two deliverables, by request:** a generated MP4 (`source/compose.sh`) and a DaVinci Resolve project (`.drp`) built through the DaVinci Resolve MCP, so the edit can be finished by hand. See SKILL.md step 11.


### Talking-head shorts after TZ10 (2026-10-14), these override the split-screen notes above
- **Propose the cut first.** Which of her lines to drop, reorder or splice goes to the user as a list (with times) before anything is built.
- **Problem + solution inside 2 s.** Her voice can't do it, so the screen does: headline + vendor logos built at frame 0, the answer ("→ FOCUS fixes that") by ~1 s. Then her lines, reordered if needed; ≤ ~35 s.
- **Layout:** animation square 1080×1080 on top with all content inside the Shorts safe zone (`_assets/шортс_сейф_зоны_2025 (1).png`: top 240, left 60, right 120, bottom 380 clear), face 1080×840 below. Nothing cropped inside app windows either.
- **Captions are burned in** (overrides §8 for these shorts): one word at a time, Montserrat 900 italic, #FFD60A, black outline, on the seam (y≈1085), via `captions.html` rendered with `ALPHA=1`. Keep the SRT as an optional upload.
- **Clean her speech by cutting:** stray words ("bill are all speak"), fillers ("uhh" before a line), version numbers she doesn't need ("FOCUS 1.2" → "FOCUS"). Check every join's energy so word ends ("languages", "bills", "LakeSentry") aren't clipped; Whisper reads clipped words as whole.
- **Voice:** DeepFilterNet capped at 12 dB on the whole take (`_toolkit/scripts/isolate.sh`), so any re-cut has clean audio everywhere.
- Reference: `short form/2026-10-08 tz10 focus export/` (v5, `NOTES.md`).
- **Mispronounced words can be respliced from her own take** (TZ12, ex-TZ14: "Proton" → "Photon" by replacing the "Pro" with the "Fo" of her "Four", same length so picture and captions stay in sync; see that video's `NOTES.md`). Offer a test clip and let the user judge by ear: Whisper is unreliable on unusual words.
- **Hook animation must act out the line** (TZ12 user feedback): for "might be doing the opposite", the bill showing "↓ save" then flipping to "↑ ×2" worked; a generic meter didn't.
