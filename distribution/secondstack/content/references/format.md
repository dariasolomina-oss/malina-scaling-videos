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
other platform overlays/cover crops need separate review.

Use finite window.DURATION and pure seekable render(t) in absolute seconds. Avoid
wall-clock animation, unseeded randomness and network resources. preview30 and
final60 are frame rates for the entire timeline, not excerpts. Review both.
Raw renderer video is silent H.264; guarded pipeline handles selected audio.
Caption/transcription/codec checks do not prove correct English speech.

Historical fixed demo/cover templates are excluded. Missing walkthrough/complex
scene support is a tooling gap, not permission to invent UI or substitute static
cards for an approved storyboard. No voice is preselected.
