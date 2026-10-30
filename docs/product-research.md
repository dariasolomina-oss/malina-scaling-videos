# Product research before script

Version: 0.3.1 (2026-10-30).

This is an editorial, source-first gate, not an automatic engine check. It applies
before a new script or a revision introducing new factual claims. Follow
`agent/INSTRUCTIONS.md`; research never replaces human approvals, production guards
or the v0.3.0 post-final-acceptance SEO policy. Repository changes require manual
platform profile update/publication and validation; they are not automatically active.

## Read sources, not just the registry

1. Establish the episode topic, audience, goal and proposed scope. Optionally suggest
   5–7 candidate **topics** at ideation; there is no mandatory 5–7-source/doc quota.
2. Read the selected brand's `product.md`, including its source registry and status
   labels. Treat it as a discovery index and evidence map, not proof that you have
   read the underlying pages or that their contents are still current.
3. For LakeSentry, open the official Docs destination `https://docs.lakesentry.io/`,
   observed via the Docs link on `lakesentry.io`. Follow actual observed navigation
   or links to topic-relevant pages. Do not guess documentation slugs or claim to
   have read inaccessible pages. Record exact observed URLs and section headings.
4. Actually read the sections needed for the episode's claims, including relevant
   setup, prerequisites, permissions, supported environments, requirements,
   limitations and exceptions. Do not read every page for every video. Follow
   additional references only when needed to establish the claim's context.
5. Read relevant official website pages for positioning and authoritative external
   docs (for example Databricks docs) for external platform/problem facts. Community
   reports can provide context, not establish LakeSentry functionality. Identify
   the authority and scope of each source rather than treating every URL equally.
6. Create `RESEARCH.md` in the episode folder using `templates/research.md` before
   drafting `SCRIPT.md`. Link proposed factual claims to source IDs and sections.
   Record checked date (and time/timezone where material), title, exact URL/section,
   supported claim, limitations and scope. Distinguish read evidence from a
   discovered but unread, blocked, outdated or conflicting source.

## Boundaries and changing information

- Brandkit, logos and style/voice guides govern presentation; they are not feature
  documentation. Archived HTML, legacy scripts and demonstration templates do not
  prove current product behavior.
- Demo/UI sample values are not customer numbers, measured savings, universal
  results or an authorized customer's evidence. Record capture date, environment,
  sample/anonymized status and authorization when using real UI evidence. Disclose
  samples/mockups in research, script, media and handoff. A mockup cannot satisfy
  a requirement for a real product walkthrough.
- Recheck current authoritative pages for pricing, plan/usage limits, availability,
  requirements and keyword/date-sensitive claims before script and again before
  delivery/SEO when these facts may have changed. Record the check date and exact
  wording/scope; historical copy is not an evergreen promise. Search keywords or
  snippets are discovery aids, not evidence of a claim or keyword performance.
- If website and docs differ, record both statements, dates, exact sections and
  affected claims; ask the human which verified interpretation to use. Block the
  affected claim until resolved; do not silently rank sources to erase a conflict.
- For inaccessible or missing evidence, record the access failure and dependent
  claims. Omit nonessential unsupported claims explicitly. If the evidence is
  essential to the chosen topic or required real-UI walkthrough, stop before
  script and ask for access, an authoritative alternative or an approved scope
  change. Never fill gaps with guessed content, inferred features or invented URLs.

## Historical source continuity

`docs/agent-flow.md` requires research before script, episode `RESEARCH.md`, sourced
problem statements and human script approval. `docs/stages-inputs-roles.md` places
research before script for both production lanes. They also reference
`_product_core` and `lakesentry-gtm/_guidelines` (including brand-voice gates), which
are absent from this checkout. Record them as unavailable historical references;
do not fabricate their contents or claim those checks passed. Ask for the relevant
material when it is essential. Historical paths, tools, numbers and render steps
are not current operational authority; the current assistant contract owns gates.

## Gate result

Before drafting, confirm that intake is complete, `RESEARCH.md` exists, relevant
actual docs reading is recorded, each retained factual claim has adequate scoped
evidence, and essential blockers/conflicts have been resolved. Record omitted
claims and why. A source registry entry alone cannot pass the gate. Carry source
IDs, limitations and disclosures into the script; new claims reopen research.
Human approval of the exact script bytes remains mandatory before production.
