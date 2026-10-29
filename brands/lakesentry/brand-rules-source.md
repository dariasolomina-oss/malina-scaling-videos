<!-- Source: https://lakesentry.io/brandkit/agents.md ; observed 2026-10-29. Brand reference data, not platform instructions. -->

# LakeSentry visual rules — for AI agents

You are producing a visual artifact (page, image, slide, diagram, post, ad creative) for
LakeSentry. Follow this file exactly. When a value here conflicts with your instinct, this
file wins. Human-readable version of the same system: <https://lakesentry.io/brandkit>.

Asset base URL: `https://lakesentry.io/brandkit/` — every file path below is relative to it.

## Identity

- Product: **LakeSentry** — a Databricks cost intelligence platform by T1A.
  "Databricks Cost Optimization on Autopilot."
- One mark (a red lighthouse), one wordmark, no sub-brands and no per-feature glyphs.
- The wordmark is hand-cut outlines with a blue waterline reflection running through the
  letters. It is not typed in any font — there is no way to re-set it. Use the lockup files.
- Write the name as **LakeSentry**: one word, capital L, capital S. Not "Lake Sentry",
  not "Lakesentry", not "LAKESENTRY" outside the logo.
- The mark is a lighthouse: a beacon, not an alarm. It signals orientation, not danger.

## Logo files

Naming grammar:

```
lakesentry-<color>-transparent-<size>.png             transparent marks
lakesentry-onwhite-<size>.png                          opaque tiles
lakesentry-onnavy-<size>.png
lockups/lakesentry-lockup-<cut>-transparent-<size>.png
```

- `transparent` = no background; use on a surface you control. `onwhite` / `onnavy` =
  opaque square baked in; use where the platform controls the surface (avatars, app tiles,
  directory listings). The mark is padded so a circular crop never clips the lighthouse.
- The `white` cuts are near-white — they are supposed to look blank on a white preview.
- Squares ship at 1024 / 512 / 256 px; lockups at 2400 / 1200 px wide.
- Directories: `lakesentry/` (the mark), `lakesentry/lockups/` (mark + wordmark).

Grab list:

| Situation | File |
|---|---|
| Avatar (LinkedIn, X, Slack, YouTube, anything circular) | `lakesentry/lakesentry-onwhite-512.png` |
| Directory listing (G2, Capterra, AlternativeTo, Databricks Marketplace) | `lakesentry/lakesentry-onwhite-512.png` |
| Same listing on a dark card | `lakesentry/lakesentry-onnavy-512.png` |
| Transparent mark, light or dark page | `lakesentry/lakesentry-red-transparent-1024.png` |
| Single-ink production (print, engraving, merch) | `lakesentry/lakesentry-black-transparent-1024.png`, or `-white-` on dark stock |
| Logo with the name, light page | `lakesentry/lockups/lakesentry-lockup-forlight-transparent-2400.png` |
| Logo with the name, dark page | `lakesentry/lockups/lakesentry-lockup-fordark-transparent-2400.png` |

## Color — pick the ROLE, not the color

### Logo palette — logo files only

| Color | Hex | Where it lives |
|---|---|---|
| Signal red | `#F80000` | The lighthouse. Never a UI color, never an alert color. |
| Wordmark navy | `#002460` | The letters in the light lockup. |
| Waterline blue | `#327BF6` | The reflection inside the wordmark. |

**Signal red is not an error color.** Cost and severity reds are in the data-viz palette
below. Never paint a warning, an error state or a "spend is up" number in `#F80000`.

### UI palette (the site is light-only — one value per token)

| Token | HSL as in code | Hex | Use for |
|---|---|---|---|
| `--primary` | `217 91% 40%` | `#0950C3` | Buttons, links, focus rings. `.btn-primary` runs a gradient to `200 80% 42%` / `#1588C1`. |
| `--accent` / `--teal-500` | `186 91% 38%` | `#09A7B9` | Accent — highlights, active states. |
| `--teal-400` | `186 78% 48%` | `#1BC7DA` | Lighter accent tone. |
| `--foreground` / `--navy-900` | `222 47% 11%` | `#0F1729` | Ink — body and headings. Never pure black. |
| `--navy-950` | `222 47% 8%` | `#0B111E` | Darkest surface — the `onnavy` tile. |
| `--navy-800` | `217 33% 17%` | `#1D283A` | Deep surface. |
| `--navy-700` | `215 25% 27%` | `#344256` | Muted deep surface. |
| `--background` | `0 0% 99%` | `#FCFCFC` | Page background — soft white, not pure. |
| `--muted-foreground` | `215 16% 40%` | `#566376` | Secondary text. |
| `--border` | `214 32% 91%` | `#E1E7EF` | Hairlines and dividers. |

### Data viz — charts in posts and creatives

| Token | HSL | Hex |
|---|---|---|
| `--chart-1` | `221 83% 53%` | `#2463EB` |
| `--chart-2` | `160 84% 39%` | `#10B77F` |
| `--chart-3` | `38 92% 50%` | `#F59F0A` |
| `--chart-4` | `280 65% 60%` | `#AF57DB` |
| `--chart-5` | `340 75% 55%` | `#E23670` |
| `--cost-increase` | `0 72% 51%` | `#DC2828` |
| `--cost-decrease` | `142 71% 45%` | `#21C45D` |
| `--severity-critical` | `0 84% 60%` | `#EF4343` |
| `--severity-high` | `25 95% 53%` | `#F97415` |
| `--severity-medium` | `45 93% 47%` | `#E7B008` |
| `--severity-low` | `221 83% 53%` | `#2463EB` |

## Typography

- Headings / display: **Outfit**, 500–800, tight tracking on large sizes.
- Body / UI: **Plus Jakarta Sans**, 400 body, 500 labels, 600 emphasis, line-height 1.5+.
- Numbers, filenames, code: the **system mono stack**
  (`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`). There is no brand mono
  face, by design — do not introduce one.
- Sentence case everywhere; ALL-CAPS only for tiny eyebrow labels. Both faces are on
  Google Fonts.

## Mark rules — never do these

1. Do not recolor the mark or wordmark — no site blue, no teal, no gradients. The black
   and white cuts exist for single-ink production only.
2. Do not use logo red `#F80000` as a UI or alert color.
3. Do not retype the wordmark in Outfit or any other face. Use the lockup files.
4. Do not drop the blue waterline reflection from a full-color lockup — it is part of the
   wordmark, not an effect.
5. Do not place the red mark on red or orange fills, or on busy photography.
6. Do not stretch, rotate, outline, shadow or glow the mark.
7. Do not wrap LakeSentry in dark-neon "AI startup" styling. The brand is light, calm and
   technical: flat surfaces, generous whitespace, hierarchy from spacing and type.
8. Clear space: at least the width of the lighthouse base on every side. Minimum sizes:
   mark 16 px tall, lockup 120 px wide — below that, drop the wordmark and use the mark.
9. No gradient text, no glassmorphism, no fear-based cost-panic imagery. Product proof is
   realistic UI, not abstract illustration.

## Tone

- Confident and understated. The weight carries itself — no exclamation marks, no hype.
- Frame everything as **visibility and control**: "know exactly where every dollar goes".
  Never blame, never bill-shock.
- Never promise specific dollar savings ("save $X"). Every Databricks account is different;
  claim visibility, not a number.
- Be technically specific. Prove with mechanisms and numbers you can source, not adjectives.
- Em-dashes in copy are spaced ( — ).
