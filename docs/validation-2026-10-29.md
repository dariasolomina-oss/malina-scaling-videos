# LakeSentry validation — 2026-10-29

- Current authenticated requester: Mariia Vladimirova. Existing development branch preserved.
- GitHub connector: current requester's `Git · dariasolomina-oss`. Fetch/read succeeded; this commit's push is checked separately.
- Correct brandkit opened in the live browser: https://lakesentry.io/brandkit/ ; explicit machine-readable brand reference: https://lakesentry.io/brandkit/agents.md . The initially supplied getantares.io URL is Antares, not LakeSentry, and was NOT applied.
- Brand reference snapshot saved under brands/lakesentry/brand-rules-source.md. Main brand colors agree with prior package. Mono role switched from JetBrains Mono to system mono; caption role from Montserrat to Plus Jakarta Sans. Extra historical font binaries retained as legacy assets, no longer declared in font_faces. Legacy video guide treatments are explicitly deprecated for new output.
- Attempt to byte-compare existing logos against live asset downloads returned HTTP 403. No live logo identity claim is made; existing checked-in logo assets were retained.
- Agent instructions/setup updated to chat-attachment-first operation. Drive/S3 are optional, not blockers. Full-size attachment reimport/cross-thread recovery remain unverified.
- Python tests: 36 passed. Node tests: 7 passed. Browser mocked in unit tests; real browser result below is separate.
- Real platform browser render: 14-second synthetic vertical fixture at 30fps, through guarded pipeline. Synthetic approvals only in isolated test data, NOT approvals on behalf of a human author. Output silent; no LUFS claim. FFprobe confirmed dimensions/count; pipeline returned review. MP4 is offered as a Chat attachment.
- Platform creation: current user authenticated via browser handoff. Agents → New agent is available. Creation form requires an IMMUTABLE payer choice: own budget (funded by requester, with a spending cap) or each invoking user. No choice was submitted and no Agent was created before requester confirmation. No model, platform skill, connector binding, or project default was silently changed.

Browser report:
```json
{
  "kind": "synthetic_browser_smoke_NOT_production_approval",
  "cases": [
    {
      "format": "vertical",
      "fps": 30,
      "frames": 420,
      "width": 1080,
      "height": 1920,
      "elapsed_seconds": 206.51,
      "status": "review"
    }
  ]
}
```
