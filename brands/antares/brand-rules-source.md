# Antares visual rules — for AI agents

You are producing a visual artifact — a page, image, slide, diagram, social post, deck — for
Antares. Follow this file exactly. Where a value here conflicts with your instinct, with a
template default, or with an older Antares file you were given, this file wins.

Scope: the Antares **marketing** brand (getantares.io). The product application ships a separate
design system with its own type and its own primary blue. Nothing here describes it, and nothing
here should be applied to it.

Asset base URL: `https://getantares.io/brand/` — every file path below is relative to it.

## Identity

- Antares is a **BI migration tool** — analysis and conversion. It analyzes a BI estate, then
  converts dashboards to the target platform.
- The category noun is "BI migration tool". Not platform, not suite, not accelerator. Pick it once
  and keep it for the whole artifact.
- Migration is **universal**: source and target platforms vary per customer. Never hard-code one
  route (for example "Tableau to Power BI") as if it were the product.
- Two elements, one system: the **mark** — the lowercase `a` — and the **wordmark**, "antares" set
  lowercase. The mark is the wordmark's own `a`, the same drawn curve lifted out of it. They are
  one shape family, not a symbol plus a name.
- There is **no third element**. Because the mark is the wordmark's own first letter, setting the
  two side by side reads as "a antares", not as mark plus name. So the logo with the name is
  simply the wordmark — never the mark and the wordmark together.
- The palette is near-monochrome: a neutral grey scale plus a single blue. Colour is an accent on
  a quiet surface, never the surface itself.
- Tone: calm, senior engineer. Precise, structural, specific, reassuring. Not salesy, not
  breathless, not gradient-soaked, not generic-SaaS.
- Antares has **no public proof points**. Do not invent percentages, timings, customer names,
  customer logos or case studies, and do not restate an effort or speed figure you saw elsewhere.

## Color — pick the ROLE, not the hex

There is exactly **one brand blue: `#2563eb`**. Everything else in the system is neutral. If you
find yourself reaching for a second accent, the thing you are painting should be neutral.

| Token | Hex | Use for |
|---|---|---|
| `brand` | `#2563eb` | CTAs, links, active states, focus ring, the mark when it is in colour. Clears AA for text on white. |
| `brand-hover` | `#1d4ed8` | Hover on brand fills. Also brand **text on a brand-tinted background** (blue at 10%), where `#2563eb` no longer clears contrast. |
| `ink` | `#0a0a0a` | Primary text, the mono cut of the logo, dark surfaces (white text on them). |
| `neutral-900` | `#171717` | Headings. |
| `neutral-700` | `#404040` | Secondary text on light — still strong, still readable. |
| `neutral-600` | `#525252` | The floor for muted text on any tinted surface: eyebrows, captions, dates, labels. |
| `neutral-500` | `#737373` | Muted text on **pure white only**. Never on a tint. |
| `neutral-400` | `#a1a1a1` | Rings and de-emphasized marks; the footer wordmark cut is `#a3a3a3`. |
| `neutral-300` | `#d4d4d4` | Secondary borders, the "unavailable" dot. |
| `neutral-200` | `#e5e5e5` | Hairline borders and dividers. |
| `neutral-100` | `#f5f5f5` | Chips and secondary surfaces. |
| `neutral-50` | `#fafafa` | Card surfaces, the header bar. |
| `white` | `#ffffff` | Page surface. |

Status colours are **semantic** — chosen by meaning, never for decoration:

| Meaning | Dot / fill | Text |
|---|---|---|
| Success, available | `#00c758` | `#008138` |
| Caution, upcoming | `#fcbb00` | `#b75000` |
| Error, destructive | `#bf000f` on `#fef2f2` | `#bf000f` |
| Unavailable | `#d4d4d4` | `#525252` |

Colour rules:

- Never use `#3b82f6` for brand, UI or text. It fails the 4.5:1 floor on white. `#2563eb` is the
  minimum acceptable brand blue.
- White text goes on ink or on brand blue. Muted text on dark is white at 70% opacity, not a grey.
- Never signal hierarchy or state by lowering the opacity of text. Use colour, size, or a
  coloured dot.
- Brand blue is a fill or a text colour. It is not a page background, a gradient stop, or a tint
  behind a whole section.

## Typography

- One family: `'Helvetica Neue', Helvetica, Arial, sans-serif`. Helvetica Neue is a macOS and iOS
  system font; Windows, Android and Linux fall back to Arial. That fallback is part of the system,
  not a defect — there is no licensed webfont to distribute. Do not substitute Inter, Poppins or a
  Google font to "fix" it.
- Monospace is reserved for code, file names and data tables, with tabular figures in numeric
  columns. Never for body copy or headlines.
- Headings: bold, sentence case, tight negative tracking (`-0.03em` to `-0.04em`), leading around
  1.0 to 1.15.
- Eyebrows and overlines: uppercase, small, `+0.08em` tracking, `neutral-600`. Plain type — no
  pill, no leading dot, no background.
- Sentence case everywhere else. Never Title Case A Headline.
- Keep to about three type sizes in one composition.

Type scale, as shipped:

| Role | Size |
|---|---|
| Hero h1 | `clamp(2.6rem, 6vw, 4.5rem)` — bold, leading 1.0, tracking `-0.04em` |
| Display h2 | `clamp(2.4rem, 5vw, 4rem)` |
| Section h2 | `clamp(2rem, 4vw, 3rem)` — tracking `-0.03em`, the most common heading |
| Sub-head | `clamp(1.1rem, 2.5vw, 1.5rem)` |
| Lead paragraph | `clamp(1rem, 2vw, 1.25rem)` — medium weight, `neutral-500` |
| Body | `1rem` / `0.875rem` |
| Eyebrow | `0.75rem` — uppercase, `+0.08em`, `neutral-600` |

Headline shape: two beats split by a period or an em-dash. "A structured process. No surprises."
"The tool is self-serve. Delivery doesn't have to be." Em-dashes in copy are spaced ( — ).

## Logo files

Naming grammar:

```
antares-<component>-<colour>-<background>-<size>.png
```

| Part | Means |
|---|---|
| `component` | `mark` (the `a`), `wordmark` ("antares") |
| `colour` | `blue` `#2563eb`, `black` `#0a0a0a`, `white` `#ffffff` |
| `transparent` | No background at all. Goes on a surface **you** control |
| `onwhite` / `onblue` / `onblack` | Opaque square baked in. Goes where the **platform** controls the surface — avatars, app tiles, listing cards. The mark is padded so a circular crop never clips the glyph |
| `size` | Squares: pixel side (`1024`, `512`, `256`). Wordmark: pixel **width** (`2400`, `1200`) |

The opaque **mark** squares drop the colour segment, because the pairing is fixed and there is
nothing to choose: `onwhite` is the blue mark on white, `onblue` and `onblack` are the white mark
on the blue or ink square. Where a colour genuinely remains a choice — the opaque wordmark — it
stays in the name (`antares-wordmark-black-onwhite-2400.png`).

SVG variants drop the size: `antares-mark-blue.svg`. Each component also ships a
`-currentcolor.svg` that inherits the surrounding text colour — use it when you are placing the
logo in code and the theme can change under it.

Directories: `mark/`, `wordmark/`, `favicon/`, `social/`.

### What to grab

| Situation | File |
|---|---|
| Avatar on X, Slack, Discord, anything circular | `mark/antares-mark-onblue-512.png` |
| Company logo on LinkedIn, GitHub, G2, Crunchbase, a directory listing | `mark/antares-mark-onwhite-512.png` |
| Transparent mark, light surface, brand colour | `mark/antares-mark-blue-transparent-1024.png` |
| Transparent mark, light surface, one-ink | `mark/antares-mark-black-transparent-1024.png` |
| Transparent mark, dark surface | `mark/antares-mark-white-transparent-1024.png` |
| Logo with the name, light surface — the cut the site header uses | `wordmark/antares-wordmark-black-transparent-2400.png` |
| Logo with the name, dark surface | `wordmark/antares-wordmark-white-transparent-2400.png` |
| Logo in code, theme-aware | `mark/antares-mark-currentcolor.svg` |
| Print, sponsor wall, embroidery, anything vector | `mark/antares-mark-black.svg` |
| Favicon and app icons | `favicon/` — `favicon.ico`, `apple-touch-icon-180.png`, `maskable-512.png` |
| A sized social avatar or listing tile | `social/` — one file per platform slot, already at the platform's dimensions. Channel banners are not in the kit |

The mark exists in blue, ink and white only. That is the system, not a gap — colour carries no
sub-brand meaning at Antares, so there is no fourth cut to look for.

## Logo usage rules

- **Clear space:** half the artwork's own height on all sides — half the mark's height around the
  mark, half the wordmark's height around the wordmark. Nothing — type, rule, image edge, another
  logo — enters that space.
- **Minimum size:** mark 16 px tall (24 px anywhere you control the surface); wordmark 120 px wide,
  which puts its letters at the mark's comfortable 24 px. Below the wordmark minimum, drop it and
  use the mark alone rather than shrinking the word.
- **Three variants must stay available** in any context you build: brand blue, mono (ink or
  white), and inverted for dark surfaces. If a surface can flip between light and dark, ship both
  cuts or use the `currentcolor` SVG.
- On a photo or any busy surface, do not float a transparent mark. Use an opaque square file, or
  clear a flat area first.
- The mark's counter — the enclosed white of the `a` — is load-bearing. If it fills in or closes
  up at your size, you are below the minimum.

## Anti-patterns — never do these

1. Never `#3b82f6` for brand, UI or text. It fails contrast on white, and a second blue in the
   same artifact reads as two companies.
2. No second accent colour and no multi-colour palette. One blue, one neutral scale. Extra colour
   is only ever semantic status.
3. No gradients — not on the mark, not on the wordmark, not on text, not behind a section. Flat
   fills are the system, and they are what survives one-ink print.
4. No redrawn, rounded, thickened or "simplified" mark, and no circle or rounded square baked
   around it. Platforms apply their own mask; a baked corner shows as a double frame.
5. Never set "antares" in Helvetica or any other face as a stand-in wordmark. The wordmark is
   drawn; a typed substitute never matches its spacing.
6. Never place the mark beside the wordmark as a combined logo. The mark is the wordmark's own
   first letter, so the pair reads "a antares". Use one or the other: the wordmark when the name
   has to appear, the mark when it does not.
7. Do not stretch, rotate, outline, emboss or drop-shadow either element. Scale proportionally,
   fill flat.
8. No Title Case headlines, no exclamation marks, no hype adjectives ("lightning-fast",
   "revolutionary", "seamless"). Emphasis comes from what the sentence says.
9. Do not state effort, speed or cost-saving percentages. There are no published proof points to
   support them.
10. Do not hard-code a single migration route as the product's identity. Sources and targets vary.
11. No stock photography of people at whiteboards, no 3D renders, no glassmorphism, no heavy
    shadows. Surfaces are flat; hierarchy comes from spacing and type.
12. Never lock the Antares mark up with a third-party BI platform logo, and never restyle or
    recolour one. It implies an endorsement that does not exist, and those marks are not ours.
13. Do not label mock or illustrative data as real. If a screenshot or chart is synthetic, say so
    on it: "Example data — not a customer environment."

Voice for any copy you write: facts first, no hype, no competitor bashing, spaced em-dashes ( — ),
and every "don't" carries its reason.

