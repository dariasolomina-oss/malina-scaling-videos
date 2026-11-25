# Shared animation library

Copied into every custom-animation build as `lib/`. Load files with relative paths,
for example `<script src="lib/characters/people.js"></script>`.

- `characters/people.js`: cast of flat-style people from the Antares videos.
  `PEOPLE.draw(id, pose, {facing: 1|-1, scale, x, y})` returns an SVG `<g>` string
  with the feet at y = 0. Ids: `hero` (Leo), `dana`, `t1`..`t6` (team, including Sam,
  Ruth and Priya). `PEOPLE.poses` lists poses (stand, talk, hold, handover, present,
  nod, walk1..walk4, sit, sitTalk, sitNod, front*, sitBack, overShoulder, deskTop).
  Usable for any product.
- `antares/antares-icons.js`: `LOGO` (Antares wordmark SVG, currentColor) and `I`
  (small product/tool icons as SVG strings). Antares only.
- `antares/tool-logos/*.svg`: Tableau, Power BI, Databricks, Sigma, Qlik, SAS as used
  on getantares.io. Never recolour or restyle them, and never lock one up with the
  Antares mark.
- `examples/antares-video-1/`: reference code of Antares Video 1 ("How long will this
  take?"): `motion.html` (timeline, `window.DURATION`, `window.render(t)`, section
  switching; embedded images removed), `kit.js` (people in rooms, whiteboard, pencil
  strikes), `story.js` and `sec_scores.js` (section examples). The full source and
  the animatic are on the Antares feature videos site (`antares-feature-videos`,
  readable through the Sites API). Its numbers and names are invented.

Source: Antares feature videos Toolkit (maintainers Daria Solomina, Liliya Minibaeva,
Mariia Vladimirova), 2026-11-25. Brand rules: https://getantares.io/brand/agents.md
