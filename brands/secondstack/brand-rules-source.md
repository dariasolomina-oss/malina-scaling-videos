# SecondStack visual rules — for AI agents

You are producing a visual artifact (page, image, slide, diagram, post) for SecondStack.
Follow this file exactly. When a value here conflicts with your instinct, this file wins.
Human-readable system of record: `SecondStack-gtm/_guidelines/brand-visual/DESIGN.md` (internal repo).

Asset base URL: `https://secondstack.ai/brandkit/` — every file path below is relative to it.

## Identity

- Platform: **SecondStack** — self-hosted, multi-model LLM platform. "Own Your AI Infrastructure."
- Products: **SecondChat** (cyan), **SecondAgent** (lime), **SecondGuard** (coral), **SecondGate** (magenta).
- One mark, one wordmark system. Color is the only sub-brand carrier — never invent per-product glyphs.
- The mark is a hand-cut, asymmetric 6-ray burst. Never redraw it as a clean symmetric sparkle; the imperfection is intentional.
- Tone: precise, structural, technical, a little hand-made. Not: magical, glossy, gradient-soaked, generic-AI-sparkle.

## Color — pick the ROLE, not the color

Bright accents do not take white text. Always use the role token for the component you are painting.

### Brand accents (Light value / Dark value)

| Token | Light | Dark | Use for |
|---|---|---|---|
| `brand/cyan` | `#2FB5F4` | `#2FB5F4` | Brand fill: the mark, dots, chat bubbles (ink text on it). Never a button fill. |
| `brand/cyan-fill` | `#0EA5E0` | `#2FB5F4` | Filled-button fill. Label: white in light, ink `#0B0D10` in dark. |
| `brand/cyan-text` | `#0A6E9C` | `#2FB5F4` | Accent text, links, ghost/outline button labels. |
| `brand/cyan-container` | `#E0F3FB` | `#0A2A3A` | Chip / badge / active-nav background. Solid, no border. |
| `brand/lime` | `#B6F500` | `#B6F500` | SecondAgent accent (same 4-role pattern: fill `#84CC16`/`#B6F500`, text `#3F6A0C`/`#B6F500`, container `#EAF6D6`/`#24330A`). |
| `brand/coral` | `#FF6F5E` | `#FF6F5E` | SecondGuard accent (fill `#FB6F5E`/`#FF6F5E`, text `#B02E20`/`#FF6F5E`, container `#FFE7E3`/`#3A1712`). NEVER used to signal errors. |
| `brand/magenta` | `#E45CFF` | `#E45CFF` | SecondGate accent (fill `#D926E8`/`#E45CFF`, text `#A800C9`/`#E45CFF`, container `#F8DFFF`/`#33093A`). |
| `error` | `#D92D20` | `#D92D20` | Errors and destructive actions only. Distinct red — not coral. |

### Neutrals & text (shared by all products; Light / Dark)

| Token | Light | Dark |
|---|---|---|
| `neutral/bg` | `#F4F5F7` | `#0B0D10` |
| `neutral/surface` (cards) | `#FFFFFF` | `#14171B` |
| `neutral/surface-2` | `#ECEEF1` | `#1C2026` |
| `neutral/border` | `#A7AEB6` | `#2A2F36` |
| `text/primary` | `#0B0D10` | `#F4F6F8` |
| `text/secondary` | `#565D66` | `#A7AEB6` |
| `text/on-accent` (filled buttons, alerts) | `#FFFFFF` | `#0B0D10` |

### Component recipes (both themes)

- Filled button: `brand/*-fill` + `text/on-accent` label (white in light, **ink in dark**), pill-shaped.
- Ghost / outline button, link: `brand/*-text` at full strength — never dimmed, never `text/secondary`.
- Chip / badge / tag / active nav item: `brand/*-container` fill + `brand/*-text`, solid, **no border**. Never a bright solid fill on a chip.
- Section label / eyebrow: plain ALL-CAPS type (Inter 500, 11–12px, letter-spacing ~0.08em, `text/secondary`). **No pill, no dot, no background.**
- Status colors are semantic: success = lime pair, warning = coral pair, error = the red pair, info = cyan pair. Pick by meaning, never by product.

## Typography

- Headings / display: **Geist**, 600–700, tight tracking on large sizes.
- Body / UI: **Inter**, 400 body, 500 labels, line-height 1.5.
- Code, metrics, model IDs: **Geist Mono**.
- Sentence case everywhere; ALL-CAPS only for tiny labels. No serif or script display faces. Max ~3 type sizes per screen.

## Logo files

Naming grammar: `<component>-<colour>-[forlight|fordark]-<transparent|onblack|onwhite>-<size>.png`

- `transparent` = no background; use on a surface YOU control. `onblack` / `onwhite` = opaque square baked in; use where the platform controls the surface (avatars, app tiles).
- `fordark` files are near-white — they are supposed to look blank on a white preview.
- Squares ship at 1024 / 512 / 256 px; lockups at 2400 / 1200 px wide.

Directories: `secondstack/` (platform mark, all tones), `secondstack/lockups/` (mark + wordmark), `secondchat/`, `secondagent/`, `secondguard/`, `secondgate/`.

Grab list:

| Situation | File |
|---|---|
| Avatar (X, Slack, anything circular) | `secondstack/secondstack-onblack-512.png` |
| Company logo on LinkedIn / Crunchbase / G2 | `secondstack/secondstack-onblack-512.png` or `secondstack/secondstack-onwhite-512.png` |
| Transparent logo, light page | `secondstack/secondstack-black-transparent-1024.png` |
| Transparent logo, dark page | `secondstack/secondstack-white-transparent-1024.png` |
| Logo with the name, light page | `secondstack/lockups/secondstack-lockup-cyan-forlight-transparent-2400.png` |
| Logo with the name, dark page | `secondstack/lockups/secondstack-lockup-cyan-fordark-transparent-2400.png` |
| Brand-color moment | `secondstack/secondstack-multicolor-onblack-512.png` |
| A product's mark | `<product>/<product>-<colour>-transparent-1024.png` (e.g. `secondchat/secondchat-cyan-transparent-1024.png`) |

Product marks exist only in the product's accent — for mono contexts use the platform black / white files (that is the system, not a gap).

## Logo usage rules

- Clear space: at least one ray-height on all sides. Minimum size: mark 16 px, lockup 96 px wide.
- Three variants must stay available: full color, mono silhouette, inverted (white on dark).
- If rays merge at small sizes, switch to the mono silhouette — never to a "simplified" redraw.
- On a light surface prefer the `forlight` cut of an accent; the bright accents are tuned for dark.

## Anti-patterns — never do these

1. No warm-orange radial mark or palette (reads as Anthropic/Claude). Keep rays asymmetric and torn.
2. No blue→purple gradient (reads as Gemini). Brand gradient, when needed, runs orange→lime→cyan→coral; anchor is cyan.
3. No clean 4-point ✨ sparkle, no sanitized symmetric redraw of the mark.
4. Coral is SecondGuard's color, never an error signal. Errors use `#D92D20`.
5. No pill-with-a-dot hero badge (`• Self-Hosted`). Section labels are plain small-caps eyebrows.
6. No gradient text, no glassmorphism, no heavy shadows or 3D. Surfaces are flat; hierarchy comes from spacing and type.
7. No white label on a bright dark-mode fill — filled-button labels flip to ink in dark.
8. Layout: 4 px unit / 8 px rhythm, generous whitespace, left-aligned text, content max-width ~1200 px.

Em-dashes in site copy are spaced ( — ). Voice: facts-only, practitioner-led, no hype, no competitor bashing.

