# SecondStack distribution candidate

Baseline: `951fc06e6ee429498de5a842c196eb2a820ecf2a`.
Release: `1.0.0-candidate.13`. Status: installed in the Video Producer
Agent on 2026-11-26 as profile 22 (Skill, Agent instructions, User Guide v5.0). Product Knowledge is maintained in
the Agent's Collections, which are newer than `product-collections.zip`; do not
re-upload that archive over them.

candidate.13 softens the harness: Agent instructions override the Skill; only the
listed rules are hard; the user may accept open layout issues
(`episode.py approve animatic --accept-open-issues`) or insist on rendering without
an animatic (`pipeline.py render --user-skipped-animatic --human`); command errors
say what to do next; the frame review runs until clean (soft limit about 6 rounds).

This additive build layer leaves the developer toolkit's source directories and
existing instructions unchanged. Only generated runtime copies are adapted.

## Build and validate

From the developer checkout root, choose a new output directory:

```sh
python3 distribution/secondstack/build.py --out /absolute/new-output
python3 distribution/secondstack/validate.py --output /absolute/new-output --browser
python3 -m unittest discover -s distribution/secondstack -p 'test_*.py'
```

The optional browser validation needs Python Playwright and an already installed
host Chromium. It does not install browsers or use a user's live session. A
missing prerequisite fails validation; do not replace it with invented evidence.

## Outputs

- `video-production-toolkit.zip`: candidate skill archive, root SKILL.md, operational
  references, verifier, manifest and self-contained runtime library.
- `product-collections.zip`: four folders with Product Overview and Source Registry
  Markdown files (8 documents). Extract and upload documents individually; no ZIP
  Collection-import behavior is assumed.
- `agent-instructions.txt`: paste into Agent instruction text, not inside the skill.
- `UPLOAD.md`: supported UI destinations and acceptance checklist.
- `delivery-manifest.json`: distribution artifact byte lengths/checksums.
- `validation.json`: generated only by validation; production/installer/access
  checks are explicitly separated from local automated results.

The package layout follows a conventional root SKILL.md with supporting files.
Actual SecondStack archive limits, nested binary installation and Agent-owned skill
activation still require a platform probe. No Agent settings or Collections are
changed by these scripts.

## Runtime-only changes

Existing sibling runtime paths remain. Product documents move to Collections;
brand configs route by Collection label, with no missing local brief/registry
paths. Workflow, research and SEO procedures use the installed runtime paths.
Common policy lives in Agent text. The builder keeps LakeSentry's historical
style guide and six fixed templates under `references/lakesentry-history/` for
reference. The runtime catalog contains universal editorial layouts for 16:9,
9:16 and 1:1 delivery plus the shared `video-scenes.html` storyboard template;
LakeSentry fixed demos remain historical references.

The local branch descriptor is replaced with episode_metadata. Old states are
rejected explicitly, not silently migrated. Toolkit version participates in the
pipeline configuration binding; rendered input/code invalidation remains intact.
Episode initialization rejects writing inside its runtime library. New distribution
code hashes are used naturally by the existing binding mechanism; no approvals
are inherited from the developer baseline.

Core scripts are retained as a dependency-complete small set; some optional host-
specific helpers need extra tools. Assets retain license/provenance files. Bundled
legacy fonts/SFX are not styling defaults. No live product documentation was
re-read during export: retain source dates and evidence limits.

## Validation scope

The disposable extracted runtime runs a ported subset of upstream regressions:
56 Python tests, plus 7 Node renderer tests. Two upstream checks are excluded
because they exercise fixed legacy templates outside the runtime catalog and
local product registries;
the source-registry-specific test module is not part of the runtime suite. Routing,
archive contents, absence of obsolete instruction links, manifest integrity,
legacy-state rejection and four-brand no-product-file builds are checked separately.
The browser suite tests 8 synthetic layouts and shared Shorts bounds at preview30
timestamps. These are not human approvals, real product UI tests, actual speech
review, a final-video render or an installer test.

## Maintainer responsibilities

Review the candidate's runtime transforms when source contracts change. Build fails
if expected transformation sites disappear. Update release version for changed
outputs; test and publish the Agent text/skill pair deliberately. Retain old
archives required by existing episodes. Collection updates must preserve source
provenance and do not retroactively change an approved episode's evidence.
