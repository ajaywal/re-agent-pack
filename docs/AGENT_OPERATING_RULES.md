# RE Agent Pack — Agent Operating Rules

## Purpose
This repository uses the RE Agent Pack — a reusable pipeline for extracting knowledge from legacy codebases through AI-assisted reverse engineering with human-in-the-loop governance.

The goal is not full automatic migration. The goal is to produce modernisation-ready artifacts from a legacy codebase:
- screen inventory
- field dictionary
- business rules
- dependency mapping
- screen-to-action-to-API estimation
- candidate service decomposition
- traceability
- Review Priority stamping and rerun governance

## Scope
Defined by `RE_AGENTS_CONFIG.md` — see the **Subdomain in Scope** field.
Do not widen scope unless explicitly asked.

## Grounding Rules
Every meaningful finding must be classified as one of:
- source-grounded — directly verifiable from source files or resource definitions
- code-grounded — supported by code patterns and implementation evidence
- sample-only — derived from the sample codebase only; may not reflect the full production system
- inferred — reasonable professional judgment based on code patterns and domain knowledge; acceptable in documents with a caveat
- placeholder — synthetic value invented for the sample (e.g. fabricated identifiers, endpoint names, or codes that do not appear in any source file); must never appear in client-facing output without explicit qualification
- unresolved — evidence is missing, ambiguous, or conflicting

Do not present inferred or sample-only findings as production facts.
Do not include placeholder-grounded items in client-facing output without explicit qualification.

## Evidence Rules
For every material rule or dependency:
- include the screen or action
- include the file(s) used as evidence
- include confidence
- include notes if interpretation is ambiguous

## Governance Rules
Do not finalize business rules automatically.
All material rules should be routed through:
- `artifacts/rule_register.governance.md`

All unresolved items should be routed through:
- `artifacts/ambiguity_log.governance.md`

All reruns should be recorded in:
- `artifacts/re_run_log.governance.md`

Coverage completion should be checked against:
- `artifacts/rule_coverage_checklist.governance.md`

## Session State Rules
Every agent reads `artifacts/session_state.governance.md` before reading other artifacts.
Every agent appends a summary block to `artifacts/session_state.governance.md` after completing its run.
The file is append-only — never overwrite or delete existing entries.
Use the **Open Ambiguity IDs** list to avoid re-logging existing ambiguities.

## Output Routing
Write session state updates (append-only) to:
- `artifacts/session_state.governance.md`

Write extracted analysis to standard artifact files:
- `artifacts/generated_screen_inventory.md`
- `artifacts/field_dictionary.md`
- `artifacts/screen_action_api_estimation.md`
- `artifacts/service_decomposition.md`
- `artifacts/traceability_matrix.md`
- `artifacts/reverse_engineering_report.md`

Write workflow / rule register / rerun / ambiguity items to `*.governance.md` files.

Write final deliverables to `docs/final_output/`:
- `Reverse_Engineered_Business_Requirements.md`
- `Reverse_Engineered_Technical_Specification.md`
- `Rendering_Handoff.md`
- `Publication_Contract.json`
- `Architecture_Flow.md` — Mermaid diagrams for business and technical flows
- `Forward_Engineering_Modernization_Blueprint.md` — AI-consumable UI/API/DB specs for code generation
- `Forward_Engineering_API_Taxonomy.md` — API taxonomy in Alam's DGT tool format (Domain/Sub-Domain/ControllerName/etc.)

## Behavioral Rules for Agents
- Read `RE_AGENTS_CONFIG.md` first for project-specific context
- Preserve existing repo structure
- Prefer updating existing artifacts over creating duplicate files
- Keep outputs concise, reviewable, and evidence-linked
- Flag ambiguity instead of smoothing it over
- Do not invent production facts about this project
- Treat source files as a representative sample, not a claim of full production fidelity

## Model Configuration Rules
- All agents MUST use temperature 0 (or the lowest available setting) for deterministic, code-grounded output. Note: VS Code Copilot Chat does not expose a temperature parameter in agent definitions — this instruction serves as a behavioral directive to the model.
- Derive findings exclusively from code, comments, variable names, function signatures, and dependency traces
- When a finding cannot be grounded in source code, classify it as `inferred` or `unresolved` — never present it as fact
- Prefer false negatives (missing a rule) over false positives (inventing a rule) — missed rules can be caught in coverage gap scans; invented rules erode trust
- Do not generate creative explanations or speculative architecture — stick to what the code shows

## Agent Roles

| Agent | Step(s) | Role |
|---|---|---|
| `project-scanner` | 0 | Scans the workspace and generates `RE_AGENTS_CONFIG.md` (first-time setup) |
| `analysis-planner` | 1, 6 | Coverage assessment (Step 1); targeted rerun scoping for Priority-flagged rules (Step 6). Does NOT chain to other agents. |
| `screen-analyzer` | 2 | Dialog controls, field semantics, dead fields, screen purpose |
| `rule-extractor` | 3 | Business rule extraction into the rule register |
| `dependency-mapper` | 4 | Action → handler → service → repo → gateway → candidate API tracing |
| `grounding-reviewer` | 5 | Grounding/governance review + Review Priority stamping (Priority / Standard) |
| `publication-reviewer` | 8 | Publication readiness Go / No-go on the 7 final-output documents |
| `document-publisher` | 7 | Generates 7 deliverables: Reverse-Engineered Business Requirements, Reverse-Engineered Technical Specification, Architecture Flow, Forward Engineering Modernization Blueprint, Forward Engineering API Taxonomy, Rendering Handoff, Publication Contract |

## Rule Review Model (no in-repo approval)

There is no in-repo human approval step. The rule-extractor (Step 3) writes each rule into the rule register with `Status: Active`. The grounding-reviewer (Step 5) stamps each rule with a **Review Priority**:

- **Priority** — non-code-grounded grounding, open ambiguity, unresolved evidence, or Plain-English / Functional Area gaps. Business reviewers should read these closely.
- **Standard** — code-grounded with no open ambiguities or gaps. Business reviewers can skim these.

The generated Word documents (Step 7) are the review artifact sent to business stakeholders. Feedback flows back through normal review channels (marked-up Word, email, shared doc) — not into the repo. Step 6 reruns specific analyses if the grounding-reviewer (Step 5) flagged rules requiring deeper re-extraction. The publication-reviewer (Step 8) gives the final Go / No-go before documents leave the repo.

Rule card format:

```
## [Rule ID] — [Short rule title]
| Field           | Value |
|---|---|
| Screen          | ... |
| Action          | ... |
| Plain-English   | ... |
| Rule statement  | ... |
| Rule type       | ... |
| Functional Area | ... |
| Evidence        | ... |
| Grounding       | ... |
| Confidence      | ... |
| Notes           | ... |

**Status:** Active
**Review Priority:** Priority / Standard  (stamped by grounding-reviewer Step 5)
```

`Status: Deferred` is used only when evidence is insufficient — such rules are surfaced in the Open Items section of the FRD, not in the main Business Rules Register.

## Governed vs Fast-Lane Mode

The RE Agent Pack supports two operating modes:

**Governed mode (default):** After each specialist agent completes (screen-analyzer, rule-extractor, dependency-mapper), the human returns to the analysis-planner to confirm coverage before invoking the next agent. The analysis-planner is the single routing authority. This ensures coverage gaps are caught early and no step is skipped unintentionally.

**Fast-lane mode:** Steps 2, 3, and 4 run without returning to the analysis-planner between them, using the "Next step" suggestion the agent provides. This is faster but bypasses the coverage check. Recommended only for teams that have already completed the governed workflow at least once and understand the artifact structure. See `pipeline/GUIDE.md` — "Running steps 2–4 in parallel (fast-lane)" for instructions.

The playbook represents the governed mode. Agent definitions route back to the analysis-planner after each step.

## Success Condition
A good result is not "lots of text."
A good result is:
- traceable
- reviewable
- honest
- useful for API estimation, service grouping, and modernisation planning
