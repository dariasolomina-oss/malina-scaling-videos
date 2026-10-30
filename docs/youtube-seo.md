# YouTube metadata after video acceptance

Implemented 2026-10-30 in the existing S2 development branch. This is a mandatory
agent workflow step plus a guarded offline exporter, not a YouTube uploader or a
standalone keyword-research service.

## Workflow

1. Author explicitly accepts the exact current final delivery MP4. Preview approval
   that merely authorizes final60 is not acceptance of the new delivery bytes.
2. Agent reads approved script, actual video/review notes, research evidence, current
   brand rules and product.md. It generates one recommended title, two alternatives
   and the description in the video's language. Use actual subject/search intent,
   no unsupported capabilities or savings, no keyword stuffing/ranking promises.
3. Agent prepares metadata JSON using `templates/youtube-metadata.json`, replacing
   every value and supplying the actual accepted script/video SHA-256 hashes.
4. Export and check:

```sh
python3 engine/scripts/youtube_metadata.py export episodes/lakesentry/EPISODE --metadata /tmp/metadata.json
python3 engine/scripts/youtube_metadata.py check episodes/lakesentry/EPISODE
```

5. Deliver title/options/description directly in chat and attach
   `publish/youtube.md`. `publish/youtube.json` retains provenance/checksums. Request
   metadata editorial review without pretending it was approved by the author.

No command in this workflow calls an LLM: the conversational agent writes the copy.
No raw model keys, YouTube API, Drive/S3, automatic upload, status `published`, or
complete thumbnail/SRT package is involved. Product documentation fetches/evidence
selection and semantic checking remain the agent/editor's responsibility.

## Validation

Exporter requires current script and video approvals, accepted status, matching
input hashes, nonempty evidence mappings, valid text and field limits. Title <=100,
description <=5000 characters. Shorter editorial targets are guidelines, not SEO
ranking factors. Changed script/video invalidates approval/export; `check` diagnoses
stale or modified output. References are retained, not fetched or semantically
verified. `human_review_required` is always true. Export does not advance lifecycle.
Each output replaces atomically; two-file installation is not transactional. One
writer per episode; hostile concurrent filesystem mutations are out of scope.

## Product information finding (historical; superseded 2026-10-30)

The placeholder described below was replaced by the source-backed current
`brands/lakesentry/product.md` and `sources.json` in version 0.3.1. The following
paragraph records the original SEO-task finding, not the current product brief.

`brands/lakesentry/product.md` currently remains the historical placeholder headed
`Product information status`. It has no populated positioning/features/verified
claims/doc source registry; brand.json product and voice are null. It warns against
using old calculator templates as proof. This change deliberately DOES NOT invent
or fill product facts. Its statement that no site was opened relates to the original
offline template task, not to all subsequent project work.

## Agent release

Git instructions and `seo-publish` are version 0.3.0. Git updates do not automatically
replace published profile instructions or their embedded skill fallback. To make the
new behavior active reliably, publish an agent profile update with these rules or
verify that the running agent fetched and read these versions. Until profile
publication is confirmed, report repository delivery and runtime rollout separately.

## Tests

49 Python tests passed, including 13 new metadata tests: approval guards, source and
video changes, stale input/output hashes, limits/placeholders, symlinks, repeatable
export, pre-install recheck, tampering and CLI. Synthetic fixture approvals only;
these tests are not a real user's acceptance of a production video or its metadata.
