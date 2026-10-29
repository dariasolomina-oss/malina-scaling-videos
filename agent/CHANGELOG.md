# Agent preparation changelog

## 0.2.1 — 2026-10-29

- Named the intended Video Producer configuration without claiming platform agent
  creation; documented the current lack of `agent_create` in chat actions.
- Adopted the accepted first-run mode: media input/output via chat attachments,
  no mandatory Drive/S3. Distinguished delivery from publication and durable backup;
  attachment limits and cross-session recovery remain unverified.
- Scoped skill storage/upload gates to optional external operations, preserving
  script/preview/final approvals and reporting actual attachment failures honestly.
- Recorded the current Mariia Git connector’s read success without claiming write
  permission; prohibited raw-key requests and credential/environment file writes.
- Strengthened visible legacy/mockup disclosures and real-UI evidence requirements.
- Updated platform setup’s obsolete pipeline availability wording and listed remaining
  platform validation. Only INSTRUCTIONS.md, CHANGELOG.md and s2-platform-setup.md
  changed; no code/tests, agent creation, connector setup, commit or push performed.

## 0.2.0 — 2026-10-28

- Added the S2 repository assistant contract and three task skills with explicit
  names, descriptions and versions; centralized shared safety and approval policy.
- Added complete-intake/source gates, hash-bound human script review, preview30
  review, final60 rendering and separate final delivery acceptance requirements.
- Added a source-linked scene/voiceover script template with timecoded comments
  and semantic `T` events.
- Documented actual local CLI capabilities, guarded-wrapper integration boundary,
  local-only storage, connector/admin requirements and platform setup limitations.
- Distinguished development on `dev/s2-lakesentry-e2e-20261028` from future episode
  production branches. No agent installation, external integration, browser session,
  publication or Git operation is performed by this documentation change.
