# LakeSentry — product brief and evidence registry

Version: 0.3.1 · reviewed **2026-10-30**. Official documentation pages below were
opened and read in the workspace browser, not inferred from old HTML templates.
They displayed "Last updated: Oct 6, 2026". This is a dated documentation summary,
NOT verification of a particular customer's tenant, feature entitlement or UI.

Machine-readable reading/discovery log: [sources.json](sources.json).
Before each script, re-open topic-relevant official pages and record what was
actually read in the episode's `RESEARCH.md` using `templates/research.md`.
This registry locates evidence; it does not replace reading it.

## Identity, audience and scope

**LakeSentry is a Databricks cost investigation/observability and workload
optimization platform.** Its documentation describes explaining spend, defensible
attribution, waste/anomaly investigation and reviewed optimization workflows.
Its cost views support historical financial investigation and FinOps, not
second-by-second operations monitoring. [S01, S03]

Primary audiences [S01]:
- Platform/DataOps engineers investigating workload and infrastructure costs.
- FinOps teams responsible for attribution, chargeback and showback.
- Data/ML teams tracking the compute spend of experiments and serving workloads.

Primary links:
- Official website / public positioning: https://lakesentry.io/
- Official documentation: https://docs.lakesentry.io/ (found through the site's Docs link)
- Product overview: https://docs.lakesentry.io/getting-started/what-is-lakesentry/
- Quick start: https://docs.lakesentry.io/getting-started/quick-start/
- Brand guidance: https://lakesentry.io/brandkit/ and its `agents.md`
- Public demo entry point: https://demo.lakesentry.io/ (discovered, not tested here)
- Pricing: https://lakesentry.io/pricing/ (discovered, not read for this brief)

Brandkit governs identity and presentation, not feature truth. Public marketing
screens, mockups and calculator examples are not verified tenant data. Keep demo
labels; do not convert displayed numbers into customer results or savings promises.

## Topic-to-document map

| Topic / allowed scoped summary | Read this official page and section | Conditions / limits to preserve |
|---|---|---|
| What LakeSentry does, audience and data boundary | [S01 — What is LakeSentry](https://docs.lakesentry.io/getting-started/what-is-lakesentry/): What LakeSentry does; Who LakeSentry is for; What LakeSentry connects to; Core principles | Read-only by default; optimization actions require explicit approval. Query text is included in the documented current version: do NOT promise "no SQL/query text access". Do not promise guaranteed savings or real-time monitoring. |
| Onboarding and prerequisites | [S02 — Quick Start](https://docs.lakesentry.io/getting-started/quick-start/): Prerequisites; Steps 2–4 | Connector setup requires Admin/Owner and Databricks admin support; Unity Catalog system tables, a usable SQL warehouse, workspace URL and appropriate credentials. OAuth M2M preferred; PAT supported. Additional regions need connectors. External Connector requires support enablement; first backfill depends on source/history/plan. |
| Architecture and data processing | [S03 — How LakeSentry Works](https://docs.lakesentry.io/concepts/how-lakesentry-works/): Deployment model; Data sources; Extraction modes; Sequential pipeline; Freshness expectations | Single-tenant isolated app/database infrastructure. Direct pull vs external workflow push. Pipeline: extraction → raw → ledger → attribution → metrics → insights. Not all mentioned sources are active: MLflow source extraction and Databricks audit-log extraction are planned/not active in the current default direct-extraction registry. LakeSentry Audit Log is its own internal audit trail. |
| Investigating cost by resource, principal and dimensions | [S04 — Cost Explorer](https://docs.lakesentry.io/features/cost-explorer/): Breakdown; Compute Types; Principals; Tables; Matrix; Filters; Cost display; Deep linking | Multiple grouping presets and drill-down; shared time/workspace/org/tag/cost-mode filters; Total / Databricks / Cloud / split views. Workload type is NOT a dedicated filter: use By Type or Matrix Workloads. Comparison/trends moved to Cost Changes; attribution moved to Cost Allocation. Do not recreate obsolete tabs as current UI. |
| Evidence-led findings and optimization decisions | [S05 — Insights & Actions](https://docs.lakesentry.io/features/insights-actions/): Insight detail; Choosing a response; How findings update and close; Common questions | Review finding-specific evidence, available estimates and plans. Only Admin/Owner can modify findings or approve/reject plans. Approval is NOT a guarantee of execution: docs say only two plan types execute, without identifying them on this page. Others are proposals applied by the user. Safety checks and execution cycles apply; auto-closure does not prove realized savings. |
| Attribution confidence and ownership | [S06 — Cost Attribution & Confidence Tiers](https://docs.lakesentry.io/concepts/cost-attribution/): Evaluation flow; Attribution paths; Confidence tiers; Attribution modes | Session allocation, proportional overhead, rules and fallback; exact / strong / estimated / unattributed confidence. Unreliable allocation stays workspace/unattributed. Split totals must be 100%; overhead basis is compute-spend share. Never promise complete or uniformly exact attribution. |
| Chargeback / allocation rules | [S07 — Cost Allocation](https://docs.lakesentry.io/features/cost-allocation/): Overview; Rules; Resources; Projects; Tags; Evaluation order; Best practices | Accountability hierarchy and optional context labels. Exact/pattern/proportional rules; direct/split/shared treatment. Mapping/tag/rule coverage matters; review gaps after connector backfills. Do not imply automatic billing/invoice generation from allocation. |
| Freshness and incomplete data | [S08 — Data Freshness](https://docs.lakesentry.io/troubleshooting/data-freshness/): Expected freshness by data type; Data Sync schedule tuning; Extraction settings; Understanding lag | Source publication + sync + processing determine freshness. Current-day totals may be incomplete/revised. A cadence is not a freshness SLA. Missing data is not zero usage; retained history/initial depth/plan limits matter. Do not imply recovery of expired source data. |

## Critical claim boundaries

1. **Read access vs actions:** collection is read-only by default, not a promise that
   all approved actions can never change resources. Any execution claim needs the
   supported action, permission and deployment scope verified. [S01, S05]
2. **No autonomous savings guarantee:** manual approval is required; savings
   estimates need evidence and are not realized customer savings. [S01, S05]
3. **Privacy claims must be precise:** S01 excludes business data, notebooks and
   query results, but explicitly includes query text. A general "metadata only"
   slogan must not be used to imply query text is never read.
4. **Source availability is contextual:** S06 mentions workload metadata including
   MLflow/audit-derived signals, while S03 says those extraction sources are not
   active in the current default direct registry. Do not infer currently active
   ingestion from the attribution model's input list. Resolve a material ambiguity
   with current authoritative evidence/product owner before a feature claim.
5. **Deployment-specific details need the right page:** S02 differentiates SaaS and
   Databricks App authentication. Do not universalize one connector screen, role,
   security boundary or schedule across deployment modes. [S02, S03, S08]
6. **No static pricing/limits promise:** read the current pricing/plan/feature page
   before mentioning price, access limits, certifications or availability. This
   brief deliberately contains no unverified plan amounts or compliance claims.
7. **UI evidence:** documentation summaries do not prove a visual matches the live
   product. Real walkthroughs need an authorized dated capture. Generic editorial
   cards and legacy templates must remain disclosed mockups/example data.

## Research required for each episode

1. Read this brief and the relevant source entries in `sources.json`.
2. Open the actual topic-specific docs, including conditions and limitations. Follow
   observed links for additional detail; do not invent page paths or cite unread pages.
3. Save `RESEARCH.md`: checked date, title, URL/section, supported claim, limitation,
   scope (plan/deployment/version/sample status), conflicts, omitted/blocked claims.
4. Map factual script statements to evidence. Site/brandkit alone is insufficient
   for technical behavior; resolve website/docs contradictions rather than silently
   selecting the more attractive claim.
5. Draft the script only when material evidence gaps are resolved; then obtain the
   author's separate explicit approval. Research does not authorize media production.
6. Recheck volatile claims before final delivery/YouTube metadata. Bind SEO text to
   accepted script/video bytes; do not introduce unsupported capabilities there.

## Provenance from the original main branch

Original input baseline: commit `ab5782ba709ec58b5c7b744d94fff9c207aa3486`.
The sources below already required evidence-based research and were NOT empty:

- [`docs/agent-flow.md`, Step 3](https://github.com/dariasolomina-oss/malina-scaling-videos/blob/ab5782ba709ec58b5c7b744d94fff9c207aa3486/docs/agent-flow.md): research first, `RESEARCH.md`, every claim traceable to UI/docs/`_product_core`.
- [`docs/stages-inputs-roles.md`, Research/Script rows](https://github.com/dariasolomina-oss/malina-scaling-videos/blob/ab5782ba709ec58b5c7b744d94fff9c207aa3486/docs/stages-inputs-roles.md): official/context sources, research-to-script chain and human gate.
- [`docs/current-flows.md`, Where ideas start](https://github.com/dariasolomina-oss/malina-scaling-videos/blob/ab5782ba709ec58b5c7b744d94fff9c207aa3486/docs/current-flows.md): an anchor source per video.
- Brand JSON/style guide supplied site, brandkit, demo and visual rules. Historical
  product scenarios and figures are not independently verified current behavior.

`_product_core` and `lakesentry-gtm/_guidelines/brand-voice/02-forbidden.md` /
`04-ai-detection.md` are referenced by original files but are not present in this
repository baseline. Their contents were not retrieved or fabricated. Databricks
reference material must be consulted separately for a Databricks-specific claim.

## Not established by this brief

No live customer tenant was accessed; no action was executed; no performance,
savings, security, SLA or pricing guarantee was tested. No private GTM source was
fetched. This file improves the Git evidence baseline; it does not itself update
published platform instructions or prove a running agent read every source.
