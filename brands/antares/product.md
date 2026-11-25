# Antares — product source registry

Reviewed 2026-11-05; sources extended 2026-11-24. Output language is `en`.

Antares helps BI teams, migration consultants and analytics platform teams assess
workbooks and plan BI migrations. Analyzer and Converter are separate workflows.
The public documentation below describes product behavior. Actual output depends
on the selected route, input workbook and workspace capabilities. [S05, S10]

## Analyzer and Converter

- **Analyzer** assesses migration readiness. For the documented Tableau workflow,
  upload a workbook or connect an authorized Tableau environment. The result is
  a report with complexity, target-specific scoring, warnings and blockers.
  Inventory and usage context depend on source access. [S06–S09]
- **Converter** runs the conversion job on the backend. It transforms supported
  calculations and workbook structure into artifacts for the selected BI tool.
  For Tableau to Power BI, the output can include a downloadable Power BI project,
  report and semantic model for validation. For Databricks AI/BI, check which
  artifacts the current route generates and which steps require rebuild or review.
  [S10, S11, S15]

**Public Analyzer CTA.** For a video about assessment, use
[Try the free Antares Analyzer](https://try.getantares.io/upload) after confirming
the upload page opens for the intended audience. The public pricing page lists
analysis as free and conversion as a separate paid step. Keep the CTA specific
to analysis and recheck the public terms before delivery. [S13, S14]

## Topic-to-document map

| Topic | Read this source | Scope to preserve |
|---|---|---|
| Product overview and migration workflow | [S04 — Antares Documentation](https://docs.getantares.io/), [S05 — What is Antares?](https://docs.getantares.io/getting-started/what-is-antares/), [S17 — Migration Workflow](https://docs.getantares.io/concepts/migration-workflow/) | Use the index to find a topic page. The overview focuses on Tableau migration. S17 is not yet read. |
| Upload a workbook or analyze a Tableau environment | [S06 — Quick Start](https://docs.getantares.io/getting-started/quick-start/), [S07 — Analyzer Overview](https://docs.getantares.io/analyzer/overview/), [S18 — Upload a Workbook](https://docs.getantares.io/getting-started/upload-workbook/), [S19 — Connect Tableau](https://docs.getantares.io/getting-started/connect-tableau/), [S20 — Create an Analysis](https://docs.getantares.io/analyzer/create-analysis/), [S24 — Tableau Connections](https://docs.getantares.io/connections/tableau-connections/) | File upload and connected environment analysis yield different report context. S18–S20 and S24 are not yet read. |
| Read scores, blockers and warnings | [S08 — Migration Scoring](https://docs.getantares.io/analyzer/migration-scoring/), [S21 — Review Analysis Results](https://docs.getantares.io/analyzer/review-analysis-results/), [S22 — Workbook Details](https://docs.getantares.io/analyzer/workbook-details/) | Workbook complexity and target-specific migration difficulty are distinct. A score does not predict project duration or establish converter availability. S21–S22 are not yet read. |
| Explain missing usage or inventory data | [S09 — Report Capabilities & Data Access](https://docs.getantares.io/concepts/data-access-and-capabilities/), [S23 — Private Network Access](https://docs.getantares.io/concepts/private-network-access/) | Report sections depend on permissions and available sources. Missing usage data is different from zero usage. S23 is not yet read. |
| Convert a workbook and review the result | [S10 — Converter Overview](https://docs.getantares.io/converter/overview/), [S11 — Review Conversion Outputs](https://docs.getantares.io/converter/review-conversion-outputs/), [S25 — Create a Conversion](https://docs.getantares.io/converter/create-conversion/), [S26 — LLM Endpoints](https://docs.getantares.io/converter/llm-endpoints/) | Show the artifact and validation steps for the selected route. Power BI project output can require data-source fixes, refresh or gateway setup. S25–S26 are not yet read. |
| Deploy eligible Power BI output | [S12 — Deploy Power BI Output to Fabric](https://docs.getantares.io/converter/deploy-to-fabric/), [S27 — Fabric Connections](https://docs.getantares.io/connections/fabric-connections/) | A compatible result, Fabric connection and workspace permissions are required. Validate the deployed report and model. S27 is not yet read. |
| CLI, API, troubleshooting and FAQ | [S28 — CLI and Programmatic Access](https://docs.getantares.io/api/cli-and-programmatic-access/), [S29 — Common Issues](https://docs.getantares.io/troubleshooting/common-issues/), [S30 — FAQ](https://docs.getantares.io/troubleshooting/faq/) | Not yet read. |
| Show the real product UI | [S16 — Antares web application](https://app.getantares.io/) | Sign-in required. Authorized, dated capture with a demo account only. Not feature evidence by itself. |

## Evidence boundaries

The website includes effort and savings percentages that conflict with the brand
rules. Omit them and ask the product owner if the topic depends on resolving that
conflict. Public route badges describe advertised availability. The technical
docs describe route-specific artifacts, limits and review steps. Confirm the
exact enabled route and output before promising a downloadable workbook, an
automatic rebuild or deployment. [S03, S10, S11, S15]

The machine-readable [sources.json](sources.json) records what was actually read.
Use the brandkit [S01] for presentation and topic documentation for product
claims. Before scripting, record URLs, sections, claims, prerequisites, scope,
omissions and conflicts in episode-local `RESEARCH.md`. If essential evidence is
missing, ask for the official source before drafting. Use authorized, dated
Antares captures for a real walkthrough.

## Product application [S16]

https://app.getantares.io/ is the signed-in Antares web application (observed
version v0.17.0 on 2026-11-24). Sign-in uses an emailed link or a password; the
page also offers account creation. Use it for authorized, dated screen capture of a
real walkthrough after script approval: hand the browser to the user for sign-in,
use a demo account and demo data only, and stop if real customer data could appear.
The application does not replace topic documentation: confirm each claim shown on
screen in the relevant docs page. The public Analyzer upload page [S14] is a
separate entry point.

## Optional scheduler [S02]

https://content-machine.spot.t1a.dev/ant/

Read only relevant material, not the entire board. Access redirected to sign in
in the Project Assistant session on 2026-11-03; no posts were read. Video Producer
access is untested. Optional unavailability does not block adequately evidenced
research. Do not copy cookies or request raw credentials. No scheduler writes.
Record minimal observed provenance only; do not bulk-copy private content into Git.
Post approval is not script approval; a schedule does not prove publication.

## Production

Read [style-guide.md](style-guide.md), preserve every current script/video/final
acceptance gate, and generate English-only SEO after final acceptance. Repository
changes do not publish a platform profile or grant source access.
