# SecondStack distribution candidate

Baseline: `951fc06e6ee429498de5a842c196eb2a820ecf2a`.
Release: `1.0.0-candidate.1`. Status: locally validated; not installed/published.

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
paths. Workflow/research/SEO instructions are rewritten, not copied with dangling
links. Common policy lives only in Agent text. Fixed historical demo/cover templates
and historical style experiments are not distributed. Universal layouts remain
limited editorial cards, not a complete arbitrary product-demo generator.

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
because they exercise removed fixed legacy templates and local product registries;
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
