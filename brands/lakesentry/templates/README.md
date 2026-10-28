# Offline templates: contract and limits

`brand.json` is the build source for colors, font families and local font faces. `engine/render/brand_css.js` generates the stylesheet; `prepare_page.py` calls that Node module rather than implementing a second CSS generator. Templates keep geometry and animation timing, not a second literal color palette. Do not open the source HTML directly: it requires preparation.

## Data-only editorial MVP (new)

| File | Viewport | Purpose |
| --- | --- | --- |
| `universal-landscape.html` | 1920 × 1080 (16:9) | Headline, supporting sentence, up to 3 editorial blocks, footer |
| `universal-vertical.html` | 1080 × 1920 (9:16) | Same content model, stacked blocks, reserved top/bottom/side margins |

“Universal” means this **small editorial content schema**, not arbitrary product UI, a slide language, a calculator engine, responsive design or an automatic storyboard. There are no fake controls, invented results or product screenshots in these layouts. They expose deterministic `window.render(t)` and numeric `window.DURATION` (seconds); mild entrances depend only on absolute time, with no wall clock or CSS transitions.

Content is JSON. Supported keys:
- `headline`: required nonblank string, ≤ 100 characters.
- `subtitle`: optional string, ≤ 180 characters.
- `blocks`: 0–3 objects with exactly `title` (≤ 36 characters) and `body` (≤ 100 characters).
- `footer`: optional string, ≤ 120 characters.
- `duration`: positive finite seconds, ≤ 3600; default 8.
- `demo`: boolean, default `true`. `false` changes the disclosure to “EDITORIAL CONTENT — NOT PRODUCT UI”; it does **not** certify facts.

`examples/demo-content.json` is explicitly illustrative, not product information. Missing `--data` uses this demo file from the chosen brand directory. Text enters an escaped JSON script and is assigned with `textContent`, never interpolated as HTML. HTML markup, arbitrary CSS, URLs and image overrides are not supported as content.

The label remains visible. Use approved copy for production. Character caps are conservative input bounds, **not a promise of fit**: review line breaks and all frames, especially with other fonts/languages. These fonts are not guaranteed to cover every script. Fixed 1080/1920 geometry does not resize automatically. The vertical layout reserves top 250, bottom 390, left 70 and right 120 px; actual platform overlays vary. No voiceover, audio, captions, source verification or publishing is performed here.

## Legacy (retained filenames, not universal)

- `landscape-product-demo.html`: historical calculator-specific animation, 1920×1080.
- `vertical-teaser.html`: historical calculator-specific teaser, 1080×1920.
- `thumbnail-horizontal.html`: historical calculator thumbnail, **1280×720**.
- `thumbnail-vertical.html`: historical calculator cover, 1080×1920.

These keep the original layout, scene structure, timings and hard-coded demo values. They are not live product recordings, not validated replicas and not proof of any prices, savings or features. They now carry a visible **DEMO DATA · LEGACY RECONSTRUCTION · NOT VERIFIED PRODUCT UI** disclosure. No new product UI was invented.

Remote font stylesheets were removed, asset paths made root-local, literal palettes moved to `brand.json` (including historical tints under `colors.legacy`), and font families routed through variables. Existing dynamic color interpolation uses CSS `color-mix` with brand tokens; camera/motion logic was not rewritten. Modern Chromium CSS support is required. Visual regression has **not** been checked in a browser in this task.

Legacy copy, equations, amounts, chart proportions, product labels, logo filenames and CTA strings are still fixed. `--data` is therefore rejected for legacy files. A different brand palette can recolor them, but cannot make them a different product or change the old identity/content. Use new editorial layouts for genuine data-only brand switching; verified product walkthroughs need their own sourced episode-specific implementation. Legacy thumbnails are static and do not expose a video render contract.

## Build CLI

Run from repository root (Python 3.10+, Node available on PATH):

```sh
python engine/scripts/prepare_page.py \
  --brand brands/lakesentry \
  --template universal-landscape.html \
  --data brands/lakesentry/examples/demo-content.json \
  --out /tmp/lakesentry-landscape

python engine/scripts/prepare_page.py \
  --brand brands/lakesentry/brand.json \
  --template universal-vertical.html \
  --out /tmp/lakesentry-vertical

# Preserve the historical fixed-content demo, with explicit demo disclosure:
python engine/scripts/prepare_page.py \
  --brand brands/lakesentry --template landscape-product-demo.html \
  --out /tmp/lakesentry-legacy

PYTHONDONTWRITEBYTECODE=1 python -m unittest discover -s tests -p test_prepare_page.py -v
```

Output must be new or empty and separate from sources. Output includes `index.html`, copied `assets/` (fonts, licenses, logos and existing assets), `brand.json`, resolved `content.json` and `build.json`. The entire directory is the self-contained **offline HTTP root**, not a single-file HTML embedding. There are no `../assets` references or remote font imports. Assets can be served with the renderer’s local static server without reaching the network. No browser is started by the builder or its tests.

`--brand` accepts a directory or a JSON file; `--template` accepts a filename in that brand’s `templates/` or an explicit trusted HTML path. For brand switching, copy the brand directory, change color/font/name/logo fields in its JSON, retain required token keys and supply local fonts/logos. Font faces and logo paths must resolve under `assets/`. Remote/imported assets, traversal, missing files and symlink assets fail the build. Templates and scripts are trusted code: resource checks are not a JavaScript sandbox and cannot prove an arbitrary supplied script is network-free.

Sources/licenses of fonts: [`../assets/fonts/SOURCES.md`](../assets/fonts/SOURCES.md). Local `product.md` and `log.md` record unknowns and implementation changes. The inherited style guide is historical context, not current product evidence.
