# YouTube copy after final acceptance

Use the current accepted video/script, actual review notes, episode RESEARCH.md
and Collection/official evidence. No local product brief is required. Recheck
volatile claims and preserve mockup/sample disclosures.

After final acceptance, generate English metadata (`en`) unless the author declines
or an essential input is missing. Infer search intent from the viewer's problem
and what the video demonstrates. Choose one primary phrase and a few relevant
secondary terms. Use them naturally. Avoid invented search metrics, keyword
stuffing, ranking promises and unsupported capabilities or savings. Keyword
research is optional when the evidence already supports the topic.

- Write one recommended title and two alternatives. Put the topic or primary
  phrase early. Aim for about 50 characters for Shorts and 70 for landscape.
  Each title must stay within 100 characters.
- Write a description of up to 5000 characters. Use the first two lines for
  the topic, viewer benefit and primary phrase. Follow with an accurate summary,
  one relevant CTA and a verified URL. Use up to three relevant hashtags when
  useful. #Shorts is optional. Add chapters only for suitable longer videos
  with real scene timestamps.
- Map each claim to the accepted video/script and checked evidence. Record
  editorial checks still needed.

Use runtime/templates/youtube-metadata.json with the actual accepted script and
video hashes. From the runtime directory, run:

```sh
python3 engine/scripts/youtube_metadata.py export "$EP" --metadata "$METADATA"
python3 engine/scripts/youtube_metadata.py check "$EP"
```

The exporter checks structure and hashes. Review the facts and wording separately.
If an older episode lacks verifiable acceptance, report the blocker and label any
draft copy as unvalidated. Changed inputs require renewed acceptance and metadata
validation as applicable. Reuse valid acceptance for the same exact bytes.

Deliver the title options, ready-to-paste description, primary keyword and brief
rationale in chat. Attach `publish/youtube.md`, keep `publish/youtube.json` as
provenance and identify the accepted video version/hash. Ask for editorial review
of the copy. Upload requires a separately authorized destination/account and a
confirmed result. Covers and SRT are separate deliverables.
