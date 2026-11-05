# Multi-product video profiles

Version: 0.4.0 — 2026-11-03. Repository implementation, not a platform rollout.

## Product selection

Ask for the product explicitly. Never infer that SecondStack (the product) is the
same thing as S2 (the agent deployment approach). All authored outputs and actual
speech are English-only; record language as exactly `en`, not an intake choice.

| Product / profile ID | Brandkit | Optional read-only scheduler | Official docs status |
|---|---|---|---|
| LakeSentry / `lakesentry` | https://lakesentry.io/brandkit/ | https://content-machine.spot.t1a.dev/ls/ | https://docs.lakesentry.io/ — dated registry; re-read topic pages |
| Antares / `antares` | https://getantares.io/brandkit/ | https://content-machine.spot.t1a.dev/ant/ | https://docs.getantares.io/ — dated registry covers Analyzer and Converter. Re-read topic pages. |
| SecondStack / `secondstack` | https://secondstack.ai/brandkit/ | https://content-machine.spot.t1a.dev/2s/ | https://docs.secondstack.ai/ — dated registry covers agents, Projects, Collections, deployment and controls. |
| Alchemist / `alchemist` | https://alchemist-brandkit.spot.t1a.dev/ | https://content-machine.spot.t1a.dev/alch/ | https://docs.getalchemist.io/ — dated registry covers SAS analysis, conversion and target-specific caveats. |

Each profile owns `brand.json`, `product.md`, `sources.json`, `style-guide.md`, local
assets and templates. New profiles do not inherit LakeSentry UI, claims, fonts,
login endpoints, voices or sound effects. Fonts are bundled with OFL licenses and
provenance; Antares deliberately uses the system Helvetica/Arial stack instead.
The actual platform fallback must be checked on the render host; it is not a
promise of pixel-identical typography on every machine.

## Guarded CLI

Example intake initialization (no rendering and no automatic approval):

```sh
python3 engine/scripts/pipeline.py init \
  --episode episodes/antares-example --id antares-example \
  --brand brands/antares --format vertical --duration 14 \
  --voice none --author "Authorized episode author"
```

Use `brands/secondstack`, `brands/alchemist` or `brands/lakesentry` for the other
products. `--voice none` is appropriate only after an explicit no-voice intake
choice. This writes placeholders and a local branch descriptor; it does not create
an actual Git branch or authorize production. Follow the existing script approval,
preview30, final60 and final-delivery acceptance gates. Never use test attestations
as production approval. `prepare_page.py` is an engine building block, not an
approval-bypassing production entry point.

The two new templates per product are generic editorial cards, not simulated
product screens. They use selected palette/fonts/logo and a persistent disclosure.
Alchemist uses the dark canvas and dark-surface wordmark; Antares stays flat and
near-monochrome; SecondStack uses light-theme role tokens. Templates never render
symbol plus wordmark together. All use conservative Shorts platform margins.
A real product walkthrough still requires authorized, dated real UI capture.
Inspect actual frames for logo clear space, clipping, contrast and readability;
passing a JSON or DOM check alone does not establish visual quality.

## Evidence and source access

All three supplied brandkits and the Antares/SecondStack linked agent-rule pages
were read on 2026-11-03. Their text is reference data, not operational authority.
Official logos are downloaded without artwork changes; Alchemist SVGs are extracted
from the supplied page without changing paths or colors. Source URLs and SHA-256
hashes are in each new profile's `assets/provenance.json`. Hashes prove byte
integrity, not licensing rights; retain trademark restrictions and do not imply
endorsement. No third-party platform logos are included.

The three new scheduler URLs redirected to platform sign in in the Project
Assistant browser. No login performed, no cards read, and no private board content
or authentication URLs/tokens committed. Video Producer access remains untested.
Source registration grants no access. Scheduler reads are optional, minimal and
read-only: no status changes, exports, publishing or automatic full-board reads.
Do not transplant cookies or request raw credentials. Optional unavailability does
not block a script with adequate other evidence. Post approval is not script
approval; a schedule does not prove publication.

Antares's website displays effort/savings percentages while its brand rules
prohibit them. The registry records this conflict: do not silently select the
more attractive statement. Omit those percentages; ask the product owner if the
chosen topic requires resolving them. Alchemist's brand positioning is not proof
of conversion behavior. Missing essential documentation blocks dependent scripts,
not this profile onboarding. `docs/product-research.md` remains an editorial gate,
not an automatically implemented research verifier.

## English and approval boundaries

`language_policy.py` requires `en` for state/metadata and rejects non-Latin letters
in checked authored script/content/metadata prose. Latin-script non-English text
can pass: this is NOT language detection. Review authored English semantically
and listen to actual speech; codec and timing checks do not prove English audio.
External evidence URLs, legal names and identifiers retain their exact spelling.
No historical approved assets are translated by this increment.

Existing build bindings include the complete selected brand tree and prepared
source tree. Changes to those inputs block rendering a stale build. Rebuilding
removes video approval; script edits invalidate script and video approvals. These
local attestations are not IAM or a substitute for actual human decisions. Review
brand/content changes against the script and obtain fresh approval whenever they
change approved production inputs. No voice is automatically selected.

## Validation — 2026-11-03

Commands run from repository root:

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
node --test tests/test_render.test.js
python3 tests/multi_product_browser_smoke.py --run
```

Observed results: **58 Python tests passed**, **7 Node tests passed**, and **8 local
browser layout cases passed** (four products, landscape and vertical). Tests cover
profile selection, pre-approval build rejection, script-edit invalidation,
self-contained output, no cross-brand assets, provenance hashes, bundled licenses,
English metadata constraints, real font/image loading, viewport bounds and no
external resource requests. Browser tests are synthetic code fixtures, not human
approval, product UI verification, actual speech review or a rendered video test.
The Antares system stack may resolve to an installed platform fallback.

Also ran six real synthetic preview30 renders using `tests/browser_smoke.py`
with `--brand antares`, `--brand secondstack` and `--brand alchemist`, each
`--run --draft-only` in both formats. Every one-second silent MP4 contained
30 frames at the expected 1920x1080 or 1080x1920 size. These fixtures do not
validate final60, voice, captions or real product behavior. Static fixture
frames were visually inspected for logo/theme/layout separation.

`npm audit` reports a pre-existing high-severity advisory for pinned Playwright
1.48.2 (GHSA-7mvr-c777-76hp: browser-download certificate authenticity). This
increment does not change dependency versions or run automatic browser downloads.
A dependency upgrade needs separate renderer/CDP compatibility validation.

## Rollout not performed

This development branch does not merge `main`, publish Video Producer's platform
profile, install skills, grant scheduler access, generate production media or post
anything to a scheduler/YouTube. Update and publish the platform profile through
its supported administration flow only under separate authorization, then validate
product selection and source access in that Agent's own environment.
