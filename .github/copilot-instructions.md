# RE Agent Pack — Copilot Instructions

This workspace uses the **RE Agent Pack** — a reusable pipeline for extracting knowledge from legacy codebases through AI-assisted reverse engineering with human-in-the-loop governance.

## Project context
All project-specific context (project name, source files, technology stack, subdomain scope) is in `RE_AGENTS_CONFIG.md` at the project root.
Read that file for the current project's details before doing any analysis.

## Primary objective
Help analyze the legacy codebase and maintain governance-friendly artifacts for:
- screen understanding
- field/control understanding
- business rule extraction
- dependency mapping
- screen-to-action-to-API estimation
- service decomposition
- traceability
- Review Priority stamping and rerun governance

## Important constraints
- Do not widen scope beyond the Subdomain in Scope in `RE_AGENTS_CONFIG.md`
- Do not rewrite the application unless explicitly asked
- Do not claim sample-only findings are confirmed production facts
- Do not delete or replace artifact history without reason
- Prefer surgical updates

## Classification labels
Use these labels consistently:
- source-grounded
- code-grounded
- sample-only
- inferred — reasonable inference from code patterns and domain knowledge; acceptable in documents with a caveat
- placeholder — synthetic value invented for the sample; must never appear in client-facing output without explicit qualification
- unresolved

## Confidence labels
Use:
- High
- Medium
- Low

## Artifact destinations
Analysis artifacts:
- `artifacts/generated_screen_inventory.md`
- `artifacts/field_dictionary.md`
- `artifacts/screen_action_api_estimation.md`
- `artifacts/service_decomposition.md`
- `artifacts/traceability_matrix.md`
- `artifacts/reverse_engineering_report.md`

Governance artifacts:
- `artifacts/rule_register.governance.md`
- `artifacts/re_run_log.governance.md`
- `artifacts/ambiguity_log.governance.md`
- `artifacts/rule_coverage_checklist.governance.md`

## Preferred working style
- Read `RE_AGENTS_CONFIG.md` first for project context
- Read existing artifacts before writing
- Update in place where possible
- Use repo-relative paths
- Link findings back to files and screens
- Keep tables simple and readable
- If uncertain, write the uncertainty down instead of hiding it

## Agent workflow
The governed workflow uses seven specialist agents in sequence:
0. **project-scanner** — scans the project and generates `RE_AGENTS_CONFIG.md` (Step 0, first-time setup)
1. **analysis-planner** — coverage assessment at Step 1; rerun scoping at Step 6 (does NOT chain agents)
2. **screen-analyzer** — dialog/control/field analysis
3. **rule-extractor** — business rule extraction into the rule register
4. **dependency-mapper** — action → handler → service → repository → gateway → candidate API tracing
5. **reviewer** — grounding/governance review (Step 5) and publication readiness (Step 8)
6. **document-publisher** — generates final client-facing Reverse-Engineered Business Requirements, Reverse-Engineered Technical Specification, Architecture Flow, Forward Engineering Modernization Blueprint, Rendering Handoff, and Publication Contract files

## Walkthrough support
This repo includes a sample legacy codebase for a guided walkthrough of the governed reverse-engineering workflow.
Favour outputs that are easy to walk through live:
- tables
- concise summaries
- rule cards (with Review Priority flags)
- rerun logs
