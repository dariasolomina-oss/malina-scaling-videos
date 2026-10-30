---
name: seo-publish
description: After explicit acceptance of the current delivery video, generate source-grounded YouTube titles and description, validate their artifact binding, and deliver copy in chat without uploading.
version: 0.3.0
---

# YouTube SEO and delivery

Common policy: `../../agent/INSTRUCTIONS.md`. No raw keys, automatic approval,
automatic upload or ranking guarantees. Chat delivery needs no Drive/S3.

## Mandatory post-approval step

When the author explicitly accepts the CURRENT FINAL DELIVERY VIDEO, do not stop at
"video approved". In the same workflow, generate its YouTube metadata unless the
author explicitly declines or a real required input is missing. Approval of preview30
that only authorizes final60 is NOT acceptance of the new final60 file. Never transfer
approval between hashes or request a second approval for unchanged already accepted bytes.

1. Load the current episode, verify real script/video approvals and exact SHA-256
   values. Read the approved script, available final-video review/scene notes,
   research/evidence, brand tone and `brands/<id>/product.md`. A product.md placeholder
   is not evidence. If claims need further verification, use authoritative sources or
   omit the unsupported claim. Do not derive facts from sample HTML.
2. Use the video's language. Infer the search intent from its actual subject, viewer
   problem and demonstrated mechanism. Select ONE primary keyword and a few relevant
   secondary terms. No invented search volume, trend, score or competitive analysis.
   No keyword stuffing or promise of better ranking/CTR. Research is optional when
   existing evidence suffices; do not block metadata on a mandatory keyword API.
3. Generate ONE recommended title and TWO alternatives. Put the useful topic/main
   phrase early and write for a human. Working editorial targets: about 50 characters
   for Shorts, 70 for landscape; hard limit 100. Do not claim these targets are ranking
   factors. No unsupported savings, capabilities, superlatives or misleading clickbait.
4. Generate a ready-to-paste description (hard limit 5000 characters):
   - First two lines: the actual topic, viewer benefit and primary phrase naturally.
   - Short, accurate summary of what this video covers (not a catalogue of all features).
   - One relevant CTA and a verified product/documentation URL. Use no invented links;
     ask only if the destination cannot be established and is required by the author.
   - Up to three relevant hashtags, only if useful; #Shorts is optional for Shorts.
   - Preserve disclosure of mockups/example data/Not product UI where relevant.
   - Chapters only for real scenes/timestamps in a suitable long video; never invent
     timestamps or force chapters into a 14-second Short.
5. Check every claim against the approved script and evidence. Metadata may not add
   capabilities absent from the video/source evidence. Record evidence mappings and
   unresolved editorial checks. Mechanical validation is not semantic fact-checking.
6. Prepare JSON using `../../templates/youtube-metadata.json` with ACTUAL script/video
   hashes. The agent itself generates text; `engine/scripts/youtube_metadata.py` only
   validates and exports it. Run:
   `python3 engine/scripts/youtube_metadata.py export EPISODE --metadata METADATA.json`
   `python3 engine/scripts/youtube_metadata.py check EPISODE`
   Never bypass guard failures or forge an approval to make export pass. If an older
   episode lacks state, recover/verify the actual acceptance evidence first; otherwise
   report the blocker and preserve any text as clearly unvalidated draft only.
7. Deliver in chat: recommended title, alternatives, ready-to-copy description,
   primary keyword and brief rationale. Attach `publish/youtube.md`; keep
   `publish/youtube.json` for provenance. Identify the approved video/version/hash.
   Offer metadata for author review; do not claim title/description are human-approved.
   If any scene/script/video changes, regenerate and revalidate against accepted bytes.

## Separate publication boundary

Exporting metadata does not upload to YouTube and does not set `published` or claim a
full publication package. Thumbnails/SRT are separate deliverables. A future upload
requires explicit destination/account authorization and confirmed external success.
