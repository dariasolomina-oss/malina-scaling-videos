# YouTube metadata: approved horizontal video

This is a STRUCTURE, not approved product copy. Do not reuse historical calculator
claims, dates, prices or scene descriptions. Follow `skills/seo-publish/SKILL.md`.

## Accepted artifact
- Episode / language / audience: fill from the current episode.
- Approved video SHA-256 and script SHA-256: actual accepted bytes, not placeholders.
- Format: horizontal. Editorial title target about 70 characters; hard maximum 100.

## Recommended title
Generate one title specific to this video's topic and search intent.

## Two alternative titles
Generate two useful alternatives without introducing new factual claims.

## Ready-to-paste description
First two lines: actual subject and viewer benefit, primary keyword naturally.
Then: accurate summary, one relevant CTA with verified URL, optional useful hashtags.
Preserve mockup/example-data disclosures. No fake savings, customer outcomes or UI.
No invented timestamps; chapters only for suitable long-form videos with real scenes.

## Evidence and editorial review
Map description/title claims to the approved script and source references. Identify
remaining human review. Do not claim rankings, CTR or semantic verification by code.

## Save and deliver
Agent generates copy. Export it through `engine/scripts/youtube_metadata.py` to
`publish/youtube.json` and `publish/youtube.md`; deliver text + Markdown in chat.
No YouTube upload, no `published` status, no Drive/S3 requirement.
