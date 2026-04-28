# RE Agent Pack — Pipeline Guide

Full run order, agent selection, and copy-paste prompts for the VS Code workflow.

**Before starting:**
- Open the workspace in VS Code using `re-agent-pack.code-workspace`.
- Run `bash pipeline/scripts/update-checksums.sh` before starting or resuming any session.
- To select an agent: use the agent dropdown in Copilot chat before pasting the prompt.

---

## Step 0 — project-scanner _(first time, or when refreshing config)_

**Agent:** `project-scanner`

**PROMPT**
```
Scan this project workspace and generate RE_AGENTS_CONFIG.md.
```

**Result:** `RE_AGENTS_CONFIG.md` written to the project root. Fields marked `[REVIEW: ...]` need human input.

After Step 0, run:
```bash
bash pipeline/scripts/update-checksums.sh
```

---

## Step 1 — analysis-planner

**Agent:** `analysis-planner`

**PROMPT**
```
Assess current artifact coverage and recommend which agent to run next.
```

**Result:** Coverage status summary, recommended next step, source file change detection. No artifacts modified.

---

## Step 2 — screen-analyzer

**Agent:** `screen-analyzer`

**PROMPT**
```
Inspect the screens in scope and update the screen inventory, field dictionary, and traceability matrix.
```

**Result:** Screen inventory, field dictionary, and traceability matrix updated. Ambiguities logged.

---

## Step 3 — rule-extractor

**Agent:** `rule-extractor`

**PROMPT**
```
Extract business-rule candidates from all source files in scope.
```

**Result:** Rule candidates written to `artifacts/rule_register.governance.md` using the dual-field card format — `Plain-English` (stakeholder-facing, no code identifiers) above the technical `Rule statement` (code-grounded, preserves column names and version numbers). Both fields are required. Traceability matrix strengthened. See `docs/glossary.md` for plain-English definitions of code identifiers that may appear in technical statements.

---

## Step 4 — dependency-mapper

**Agent:** `dependency-mapper`

**PROMPT**
```
Trace the main user actions in scope and map their service, repository, and gateway dependencies.
```

**Result:** Action-to-API mappings, service decomposition, gateway dependency tracing.

---

## Step 5 — grounding-reviewer

**Agent:** `grounding-reviewer`

**PROMPT**
```
Review all reverse-engineering outputs for overclaims, weak grounding, and governance readiness.
```

**Result:** Grounding cleaned up, coverage checklist updated, rule register ready for publication. Runs a **Plain-English clarity check**, an **evidence resolution check**, and a **Review Priority stamping** step that marks every rule as either **Priority** (non-code-grounded, ambiguous, or unresolved — business should read closely) or **Standard** (code-grounded, no gaps — business can skim). There is no in-repo approval step; the generated Word documents are the review artifact sent to business.

---

## Step 6 — analysis-planner (rerun scoping)

**Agent:** `analysis-planner`

**PROMPT**
```
Re-evaluate only the rules and mappings that are flagged as Priority review or that remain ambiguous.
```

**Result:** Rerun log entry added. Impacted items flagged for targeted re-analysis. Skip this step if the governance review flagged no rules for rerun.

---

## Step 7 — document-publisher

**Agent:** `document-publisher`

**PROMPT**
```
Generate all eight client-facing deliverable documents from the current artifacts.
```

> **Run Step 7 standalone — do not chain it from a long session.** This agent needs a full context window to generate all 8 complete documents. Starting a fresh chat with just this agent and prompt produces the best output.

> **Overwrite behaviour:** each run fully overwrites any existing files in `docs/final_output/`. Prior-run content is replaced in full. You do not need to manually clear the folder before running. If a legacy `Architecture_Flow.md` exists from a prior run, the publisher will delete it automatically.

**Result:** Eight deliverables written to `docs/final_output/`:
- `Reverse_Engineered_Business_Requirements.md` — business stakeholder document. Subdomain Registry, Functional Requirements by Subdomain, Business Rules Register (Plain-English), Traceability Summary.
- `Reverse_Engineered_Technical_Specification.md` — technical leads document. Technical Rule statement (code identifiers preserved) for developer traceability. Candidate API Estimation.
- `Current_State_Architecture_Flow.md` — **current-state-only diagrams**: Current State system context (legacy stack), business process flows (as-is), technical dependency flows (legacy), legacy integration map.
- `Modern_Stack_Architecture_Flow.md` — **target-state-only diagrams**: Target State system context (modern stack), service boundary map, architecture decision prompts, Legacy → Modern Mapping.
- `Forward_Engineering_Modernization_Blueprint.md` — **Working-app generator**: UI component specs, API service specs, database schema, unit test scaffolds for ALL active rules. Paste into Claude or ChatGPT with the target stack from `RE_AGENTS_CONFIG.md` → get runnable code scaffold.
- `Forward_Engineering_API_Taxonomy.md` — **DGT tool format**: 18-column locked template (Domain / Sub-Domain / Comments / AutomationCandidate / ControllerName / ResourceName / ResourceModel / SubCollectionName / SubCollectionModel / Request / RequestPayload / Response / ResponsePayload / Operation / RequestType / ConnectionType / Path / API Name). Rule-to-API traceability table included.
- `Rendering_Handoff.md` — combined Word-generation prompt with embedded color/styling spec. Paste into any AI to produce five polished Word documents with consistent branding.
- `Publication_Contract.json` — machine-readable contract; includes `groundingStats` checked by Step 8.

---

## Step 8 — publication-reviewer

**Agent:** `publication-reviewer`

**PROMPT**
```
Review the final output documents for publication readiness and give a Go / No-go.
```

**Result:** Publication-readiness summary. Go/No-go recommendation. If No-go, fix and re-run Step 7.

---

## Step 9 — scaffold-generator _(manual, post-business-approval only)_

**Agent:** `scaffold-generator`

> **Do not run this step until business stakeholders have approved the Business Requirements and Architecture Flow documents.** This step is triggered manually after sign-off — it is not part of the automated Steps 0–8 pipeline.

**PROMPT**
```
Read the Forward Engineering Modernization Blueprint and scaffold the strict DDD project structure in this workspace.
```

**Result:** A `forward-engineering/` folder created in the workspace root containing:
- `Domain/` — `Loan` aggregate root (behaviour from 14 rules), 3 Value Objects, 2 Repository interfaces, 2 Domain Events
- `Application/` — `ProcessLoanCommand`, `SearchLoansQuery`, DTOs
- `Infrastructure/` — `LoanDbContext` (EF Core), `LoanRepository`, 3 external service adapters (RataBase, ISO, EDI)
- `Presentation/` — thin .NET Core controllers delegating to Application layer
- `AngularUI/` — TypeScript interfaces + `LoanSearchComponent` stub
- `Database/scripts/` — 4 SQL DDL scripts (dbo.Loan, dbo.CycleStep, dbo.TmeRoutingTable, dbo.LoanAuditLog)
- `Tests/xunit/` — `LoanRuleTests.cs` with 14 stubs (Priority rules first)

All generated files contain `NotImplementedException` placeholders — hand off to the implementation team to fill in.

---

## After Step 8 — Using Your Deliverables

Once the reviewer gives a **Go**, all 8 deliverables in `docs/final_output/` are ready.

### What each file is for

| File | Audience | How to use |
|---|---|---|
| `Reverse_Engineered_Business_Requirements.md` | Business stakeholders, PMs | Share as-is — Subdomain Registry + FR by Subdomain, rules in Plain-English |
| `Reverse_Engineered_Technical_Specification.md` | Technical leads, architects | Share as-is — rules with code identifiers |
| `Current_State_Architecture_Flow.md` | Architects, solution designers | Open in any Mermaid viewer — current state context, process flows, dependency flows |
| `Modern_Stack_Architecture_Flow.md` | Architects, solution designers | Open in any Mermaid viewer — target state context, service boundary, decision prompts, Legacy → Modern mapping |
| `Forward_Engineering_Modernization_Blueprint.md` | Dev team | Paste into Claude or GPT-4o with target stack → get running code scaffold (test cases for every rule included) |
| `Forward_Engineering_API_Taxonomy.md` | Alam / DGT tool | Feed into DGT tool — 18-column locked template, all candidate APIs with connection types |
| `Rendering_Handoff.md` | Rendering input | Combined handoff for Word generation with styling spec (see below) |
| `Publication_Contract.json` | QA / tooling | Grounding stats and machine-readable manifest |

### Generating the five Word documents

1. Open `docs/final_output/Rendering_Handoff.md`.
2. Copy the entire file.
3. Paste into ChatGPT (GPT-4o or better), Claude, Gemini, or Copilot.
4. The file's header already contains the complete instruction — a single combined prompt that requests clean professional formatting with the embedded color/styling spec, names the five output files, and includes a short self-check the AI runs before returning. No extra instructions needed.
5. Save the AI's output using the canonical filenames embedded in the prompt:
   - `Reverse_Engineered_Business_Requirements.docx`
   - `Reverse_Engineered_Technical_Specification.docx`
   - `Current_State_Architecture_Flow.docx`
   - `Modern_Stack_Architecture_Flow.docx`
   - `Forward_Engineering_Modernization_Blueprint.docx`

### Generating code from the Blueprint

Open `Forward_Engineering_Modernization_Blueprint.md` → start with **Part 0 — Build the First Vertical Slice** for a guided end-to-end example → paste any UI-NNN / SVC-NNN / DB-NNN spec into Claude or ChatGPT and ask it to generate the corresponding component in the target stack from `RE_AGENTS_CONFIG.md`.

---

## Resetting the pipeline

```bash
# Reset governance files only — resume from Step 5
bash pipeline/scripts/reset-artifacts.sh --governance

# Reset everything — resume from Step 1
bash pipeline/scripts/reset-artifacts.sh --full

# Save current artifacts as the new baseline (after a successful run)
bash pipeline/scripts/reset-artifacts.sh --save-as-baseline

# Interactive — script will prompt you to choose
bash pipeline/scripts/reset-artifacts.sh
```

**Which mode:**
- Use `--governance` when you want stable, predictable content — analysis is kept, you show the Step 5 governance review and Review Priority stamping without re-running Steps 2–4.
- Use `--full` when you want to run the complete pipeline from Step 1. Agents regenerate content each run — output is correct but phrasing varies slightly.
- Use `--save-as-baseline` after a successful run to checkpoint your project's own artifacts. Future resets will restore to your project's state, not the empty templates.

---

## Running steps 2–4 in fast-lane

Steps 2, 3, and 4 can overlap once `RE_AGENTS_CONFIG.md` exists.

- Start Step 2 (`screen-analyzer`) first.
- Start Step 3 (`rule-extractor`) in a second Copilot chat after Step 2 has written to `traceability_matrix.md` — both agents update this file; avoid overlap.
- Start Step 4 (`dependency-mapper`) in a third chat as soon as Step 2 completes.

After all three complete, return to Step 1 (`analysis-planner`) to confirm coverage before moving to Step 5.

> Fast-lane skips the coverage check between steps. Recommended only for teams that have already completed the governed workflow at least once and understand the artifact structure.

---

## Multi-subdomain workflow

Activated automatically when `project-scanner` detects 30+ dialog files. The scanner generates:
- `RE_AGENTS_CONFIG_MASTER.md` — full subdomain index
- `RE_AGENTS_CONFIG_{Name}.md` — one config per subdomain group

Run Steps 1–8 independently for each subdomain. Artifacts land in `artifacts/{SubdomainName}/`. Use the aggregate coverage prompt in `analysis-planner` to track overall progress across all subdomains.

---

## Files to check after the pipeline

**Analysis artifacts:**
- `artifacts/generated_screen_inventory.md`
- `artifacts/field_dictionary.md`
- `artifacts/screen_action_api_estimation.md`
- `artifacts/service_decomposition.md`
- `artifacts/traceability_matrix.md`
- `artifacts/reverse_engineering_report.md`

**Governance artifacts:**
- `artifacts/rule_register.governance.md`
- `artifacts/ambiguity_log.governance.md`
- `artifacts/re_run_log.governance.md`
- `artifacts/rule_coverage_checklist.governance.md`

**Final documents (8 deliverables):**
- `docs/final_output/Reverse_Engineered_Business_Requirements.md`
- `docs/final_output/Reverse_Engineered_Technical_Specification.md`
- `docs/final_output/Current_State_Architecture_Flow.md`
- `docs/final_output/Modern_Stack_Architecture_Flow.md`
- `docs/final_output/Forward_Engineering_Modernization_Blueprint.md`
- `docs/final_output/Forward_Engineering_API_Taxonomy.md`
- `docs/final_output/Rendering_Handoff.md`
- `docs/final_output/Publication_Contract.json`

**Reference:**
- `docs/glossary.md` — plain-English definitions of code identifiers referenced from FRD Appendix and Blueprint header.

**Presentation assets** (for the leadership walkthrough — not produced by the pipeline, live under `presentation/`):
- `presentation/phase1_architecture_diagram.md` — Mermaid source for the Phase 1 solution architecture.
- `presentation/re_agent_pack_loan_overview.html` — interactive, self-contained Phase 1 pipeline walkthrough (open in a browser).
