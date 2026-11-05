# Shared Shorts safe zone

`safe-zone.json` owns platform geometry for every product. Brand profiles own visual identity, not platform overlays. The reference PNG is moved unchanged from the LakeSentry assets; its historical filename is retained. It is a layout reference, not certification of current platform UI.

For a 1080x1920 frame, keep meaningful content inside x=60..880, y=240..1540. The conservative rectangle excludes the right action-button column (x=880..960 from y=720 downward). Backgrounds may fill the viewport. Universal vertical layouts add a 10px inner inset, producing CSS padding 250px 210px 390px 70px.

`prepare_page.py` reads this policy for every universal vertical template, injects shared CSS variables and records the resolved policy in `build.json`. Prepared outputs remain self-contained; no runtime network lookup is required. Rebuild and review when this policy changes; production approval rules still apply.

Landscape layouts are unaffected. Historical fixed-content teaser/demo/thumbnail layouts are not automatically migrated or certified by this change. Their source scenes and platform-specific cover crops require separate review. Do not use their existence as evidence of safe-zone compliance.

Before delivery, verify the target platform's current overlays and inspect the actual output, including motion, captions and UI captures. The browser smoke test checks synthetic layout bounds at every preview30 timestamp; this does not replace rendered-video or human review.

Different platform requirements should receive separately named shared profiles, not brand overrides.
