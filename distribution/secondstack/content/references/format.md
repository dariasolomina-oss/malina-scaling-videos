# Format and brand

Confirm horizontal 1920x1080 or vertical 1080x1920, duration, explicit voice,
caption treatment, destination and CTA. Use selected brand.json/style-guide.md.
Output copy and actual speech must be English.

Universal templates are editorial graphics, not verified UI. Prepare them through
prepare_page.py. JSON accepts headline <=100, subtitle <=180, footer <=120 and up
to 3 blocks (title <=36, body <=100 characters), plus duration/demo. Bounds do not
guarantee fit. Keep disclosures, official logos, local fonts and proper clear space.
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

Use finite window.DURATION and pure seekable render(t) in absolute seconds. Avoid
wall-clock animation, unseeded randomness and network resources. preview30 and
final60 are frame rates for the entire timeline, not excerpts. Review both.
Raw renderer video is silent H.264; guarded pipeline handles selected audio.
Caption/transcription/codec checks do not prove correct English speech.

Historical fixed demo/cover templates are excluded. Missing walkthrough/complex
scene support is a tooling gap, not permission to invent UI or substitute static
cards for an approved storyboard. No voice is preselected.
