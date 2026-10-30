# MVP S2 data contracts

These are JSON Schema draft 2020-12 documents, not installed runtime validators.
Python runtime performs critical gates and filesystem/timing checks without dependencies.
`episode.yaml` is UTF-8 **JSON**, a YAML-compatible subset. General YAML is rejected.

- `episode.schema.json`: required episode fields, French (`fr`) as the create default;
  content/title/script may contain Unicode. `revision` is a monotonically increasing
  working-copy script revision; snapshot UUIDs are separate. Approvals bind the exact
  script SHA-256 and revision; video approval additionally binds video SHA-256.
- `manifest.schema.json`: full persistent file snapshot, paths relative to `files/`,
  byte counts and SHA-256. No `work/`, absolute paths, traversal, or symlinks.
- `timings.schema.json`: supplied timings in seconds, nonempty words. Runtime additionally
  enforces finite timestamps, `end > start`, and ordered nonoverlapping words.
- `connector-voice-response.schema.json`: subset accepted by the offline parser;
  NOT a claim about a live ElevenLabs endpoint. Alignment arrays must have the same
  length and monotonic, nonoverlapping character spans. Zero-duration characters are
  permitted; resulting words must have positive duration. Whitespace separates words.

`script_check.py` returns `machine` results plus `editorial.status=pending` and
`grants_approval=false`. Passing mechanical checks does not approve publication.

Checksums detect corruption against a trusted manifest; they do not authenticate an
untrusted storage provider or protect against someone rewriting state and manifests.
