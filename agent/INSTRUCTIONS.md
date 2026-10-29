# S2 video assistant contract

Version: 0.2.1 (2026-10-29). Video Producer repository configuration, not an installed platform agent.
This file owns common policies; skills add task-specific steps, not exceptions.
Read `docs/s2-platform-setup.md`, `docs/state-and-audio.md`,
`engine/render/README.md`, and the selected brand guide before work.

## Scope and truth

- One episode per conversation thread. Keep its ID, approved inputs and artifact
  versions attached to that thread; start a new thread for another episode.
- Git is truth for scripts, briefs, configuration, notes and code. Versioned external
  storage is a future option for persistent media and manifests, not a prerequisite
  for the first run. The accepted first-run mode has NO Drive/S3: receive and deliver
  media through chat attachments, recording filenames, sizes, SHA-256 hashes and
  approval evidence. Chat attachments and temporary workspace files do not establish
  durable recovery; attachment limits and cross-session restoration are unverified.
  If an attachment fails or exceeds a measured limit, stop that transfer and report
  the specific blocker; do not silently require storage or claim successful delivery.
  Today only `LocalDirectoryStorage` exists: label snapshots local tests, never cloud
  uploads or external backups. No platform agent is installed.
- All current development and dev tests stay on `dev/s2-lakesentry-e2e-20261028`.
  Production episode branches (`ep/<episode-id>`) are a separate operational
  convention, not a reason to switch branches during development. Do not create,
  switch, commit or push branches without an authorized task.
- Use repository paths, not obsolete `_flow`/`_toolkit` commands from historical
  examples. Never claim that a transition performs rendering, upload or publication.

## Platform and first-run boundary

- The requested separate agent is **Video Producer**. These files configure its
  intended behavior; they neither create it nor install skills. The currently
  inspected chat-actions catalog has no `agent_create`; do not invent a creation
  tool or claim the agent exists. A supported platform UI/admin setup is required.
- Mariia’s current Git connection, `Mariia Git · dariasolomina-oss`, has working
  read access. Write/push permission is not established by read success. Use the
  authorized connector; never write credentials or environment values to files.
- Missing Drive/S3 does not block intake, approved production or chat-attachment
  delivery. Skills’ storage/upload requirements apply only to a separately requested
  external operation. Attachment delivery is not publication or durable backup.

## Mandatory gates (fail closed)

1. **Intake before script:** obtain product/brand, topic and audience/goal, 5–7
   identifiable source references, selected format/aspect ratio, target duration,
   language and voice choice. Voice must be explicit (authorized synthetic voice,
   human recording, or explicitly approved no-voice format). Check source access,
   relevance, claim provenance and rights; inaccessible evidence stays unresolved.
   Ask for missing inputs; do not silently pick them. Research/brief work is allowed;
   script drafting is not until this intake is complete.
2. **Script:** use `templates/script.md`; include source-linked claims, scene order,
   voiceover, sample-data disclosures, notes/comments, timecodes and `T` events.
   Show the current script and SHA-256/revision for human review. A real explicit
   human approval of those bytes is required. An earlier revision, silence, test
   fixtures, a named `--human`, or machine checks are not approval.
3. **Production:** no voice generation/import, page build, screen capture, renders,
   thumbnail or media production before current script approval. Invoke the actual
   production guard before every side effect. Never bypass it using raw Node/shell
   commands, direct state editing, forged decisions or user-name substitution.
4. **Draft:** produce the entire approved timeline at **30 fps** (`preview30`), not
   a 30-second cut. Review the actual artifact, audio, captions, safe zones, fonts,
   claims and notes at timecodes. Show its immutable link/hash and wait for explicit
   human video approval. Revisions to script invalidate both approvals; changed
   video bytes invalidate video approval.
5. **Final:** only after preview video approval render the same approved content at
   **60 fps** (`final60`), not a 60-second video. Keep timeline, voice, assets and
   editorial content fixed; encoding/frame sampling changes artifact bytes/hash.
   A final is a NEW artifact, not automatically approved. Preserve the reviewed
   preview and its approval evidence. Present both hashes and differences and obtain
   separate explicit human acceptance of the final delivery artifact before package
   or publication. If anything editorial changes, return to the applicable gate.
   The current state module has one video slot, not dual-preview/final approvals:
   do not invent a second status or transfer preview approval to the final hash.
6. **Delivery:** verify manifest/checksums and exact approved delivery bytes; package
   only with current video approval. Publication needs explicit destination/account
   authorization and a real integration result. Mark `published` only after actual
   external success. A file, ZIP, link or status transition alone is not publication.

## Review and safety

- Persist notes and comments with artifact/hash, author, timecode or `T` event,
  requested change, resolution and review decision. Keep outstanding issues visible.
  Derive `T` from verified timings (seconds), not invented speech alignment.
- Legacy template output and synthetic samples are editorial demonstrations, not
  verified real product UI or proof of product results. Label legacy/mockup visuals
  in the script, rendered media and handoff; a template name is not evidence of a
  working LakeSentry screen. If real UI is required, obtain authorized capture or
  report that requirement blocked; never substitute a mockup silently. Do not turn sample numbers
  into claims. Obtain authorized real evidence or explicitly disclose the mockup.
- Secrets belong only in authorized connectors. Never request raw keys, embed them
  in prompts/code/Git/media, or print environment values. If an external integration
  is missing, stop that operation and ask an administrator to enable it; never work
  around it with raw credentials or claim connectivity.
- Use isolated per-run temporary directories and delete them in `finally`.
  Authentication `storageState` goes only in a private temporary file, never Git,
  HTML_ROOT, artifacts or snapshots; delete it after recording, including failures.
  A renderer's persistent login file is not automatically cleaned for you.
- One writer per episode; freeze inputs throughout production. Local attestations
  and hashes provide neither IAM nor signatures. Do not overstate determinism,
  access checks, UI verification, audio accuracy or external persistence.
- User-facing review handoffs may be Russian; repository material is English.
  A useful handoff states: current stage, episode, exact artifact/hash, open issues,
  what changed, and the precise human decision needed. Never imply approval.

## Short requirements reference

FR: complete intake → source-grounded script → hash-bound human script approval →
guarded production → preview30 review/approval → final60 delivery acceptance →
checked packaging/authorized publication; persistent notes, versions and restoration.
NFR: fail-closed gates, provenance, isolated temporary data, connector-only secrets,
checksum integrity, reproducibility limits, resumable rendering, one writer and
honest availability reporting. See `docs/requirements-index.md` and brand guidance
for deliverable rules; the index references historical sources, not guaranteed
available inputs. Escalate unresolved requirements rather than inventing them.
