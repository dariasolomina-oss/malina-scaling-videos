# Format and brand

Confirm horizontal 1920x1080, vertical 1080x1920 or square 1080x1080, duration, explicit voice,
caption treatment, destination and CTA. Use selected brand.json/style-guide.md.
Output copy and actual speech must be English.

Universal templates are editorial graphics, not verified UI. Prepare them through
prepare_page.py. Card JSON accepts headline <=100, subtitle <=180, footer <=120
and up to 3 blocks (title <=36, body <=100 characters), plus duration/demo.
For a storyboard use `layout: scenes` and the shared `video-scenes.html` template.
Scenes have ordered `start`/`end` times and one of `title`, `kpi`, `steps`, `screen`
or `cta` kinds. A screen scene may use a local `assets/` image or video (MP4,
WebM or MOV) as an authorized capture; it must be reviewed for private data and
timing. A screen video plays from its start for the scene's duration; trim it to
the scene first. The scene geometry follows the episode format (16:9, 9:16 with
the shared Shorts safe zone, or 1:1); `content.json` `format` may be omitted.
The header shows the brand logo (brand `editorial.logo_variant`) and one
disclosure line: the scene `disclosure`, else the content `disclosure`, else the
brand book `editorial.disclosure`. Give real product captures an accurate scene
disclosure, for example "Product UI recorded 2026-11-24 with demo data."; keep
the "not product UI" disclosure for illustrations and redrawn interfaces.
Bounds do not guarantee fit. Keep disclosures, official logos, local fonts and proper clear space.
Review actual phone-sized frames for line breaks, contrast and clipping.

Shared geometry lives in runtime/formats/shorts/safe-zone.json, not brand settings.
Current 1080x1920 preset uses x=60..880, y=240..1540 plus a 10px inner inset in
universal layouts, including the right button exclusion. Verify current target UI;
review other platform overlays and the cover crop separately.

## Camera and sound

- Frame the active control or result so it reads at phone size. Hold long enough
  to show the action and its effect. For a dense interface, start around 2x zoom
  and allow at least 0.7 s for a camera move, then adjust to the scene and speech.
  Keep related controls in one frame when a move would interrupt the explanation.
- Keep speech clear and effects below it. Check the actual mix and use -14 LUFS
  as a starting target for voiced output. Follow the selected brand guide for
  music and sound choices.

## Captions

Use these starting settings for English captions. Time each cue to the actual
speech or approved on-screen text. Keep cues to two lines, break at natural
phrase boundaries and check readability at delivery size.

| Format | Characters per line | Cue duration |
|---|---:|---:|
| Horizontal 16:9 | Up to 42 | 1.5–3.5 s |
| Vertical 9:16 | Up to 24 | 0.6–2.5 s |
| Square 1:1 | Up to 32 | 0.8–3.5 s |

Use a separate SRT when the destination supports it. Burn captions into the
video when the approved format calls for it.

## Covers

- For a 1280x720 landscape cover with a duration badge, leave the bottom-right
  clear of essential content.
- For a 1080x1920 vertical cover shown in a centered 4:5 crop, keep essential
  text, logo and focal image within y=285..1635. Check the destination's actual
  crop and overlays before delivery.
- Review a phone-sized preview. Use the selected brand's typography, colors
  and official logo.

## Rendering and review

Plan the opening problem, evidence-led demonstration, takeaway and CTA. For each
beat, record the viewer benefit, visible action and narration. Review each aspect
ratio as its own layout before approval.

Use finite window.DURATION and pure seekable render(t) in absolute seconds.
Express `T` event times in global seconds, independent of frame rate and chunks.
Avoid wall-clock animation, unseeded randomness and network resources. Review the
entire timeline at both preview30 and final60, including motion, caption timing
and audio sync.
Raw renderer video is silent H.264; guarded pipeline handles selected audio.
Caption/transcription/codec checks do not prove correct English speech.

The [LakeSentry historical references](lakesentry-history.md) document past
styling and fixed examples. Use the selected brand's current style guide for
production. If the runtime lacks a trusted scene needed for the approved
storyboard, report the gap and get approval for any change in scope.
