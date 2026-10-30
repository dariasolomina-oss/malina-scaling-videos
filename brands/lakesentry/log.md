# Local implementation log

## 2026-10-28 — Offline template MVP

- Added semantic border/accent/surface/chart colors and a historical palette in `brand.json`. Product and approved voice remain unknown (`null`). Existing URLs and assets were retained, not validated.
- Downloaded Outfit, Plus Jakarta Sans, JetBrains Mono and Montserrat normal/italic variable fonts over HTTPS from the Google Fonts GitHub repository. Stored actual downloaded family OFL texts, source URLs and SHA-256 values under `assets/fonts/`. No external font API is required at build/render time.
- Retained legacy calculator/teaser/thumbnail filenames, geometry, narrative and motion. Centralized colors/font families, removed Google Fonts imports, fixed asset paths and added explicit visible demo/legacy disclaimers. Dynamic color blends now use brand variables and CSS `color-mix`; timings remain unchanged. These demos are not verified product UI or verified financial data.
- Added two small data-only editorial layouts (16:9 / 9:16), an explicitly demo content file and a documented bounded content schema. No new product controls or numerical claims were created.
- Added `engine/scripts/prepare_page.py`: invokes the existing Node brand CSS generator, safely serializes JSON, copies brand assets including font licenses into an offline output root, rejects unsafe/missing/remote assets and disallows overriding fixed legacy content.
- Added real CLI/build, brand-switch, safe-content, legacy compatibility and invalid-input tests in `tests/test_prepare_page.py`. Checks use Python and Node syntax validation; no browser launched. Rendering/visual fidelity still requires a separate review.

See `templates/README.md` for CLI, template contracts and explicit limitations. This entry documents implementation only, not product facts or market claims.
