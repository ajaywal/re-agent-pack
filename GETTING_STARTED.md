# Getting Started — TrackAll RE Agent Pack

This repo contains everything for the **TrackAll Loan Maintenance** reverse-engineering and modernisation project:
the legacy C++ source used as input, the 9-step AI agent pipeline that analyses it, all generated artifacts,
the final handoff documents for business and technical stakeholders, and the DDD-scaffolded modern replacement codebase.

---

## What Is In This Repo

```
re-agent-pack/
│
├── sample-project/          ← Legacy Win32/MFC + HP NonStop Tandem codebase (the INPUT)
│
├── .github/agents/          ← 9 VS Code Copilot agent definitions (the PIPELINE)
├── pipeline/                ← Pipeline run guide + helper scripts
├── artifacts/               ← Live analysis outputs produced by the pipeline
│
├── docs/
│   ├── final_output/        ← 8 Markdown deliverables (business + technical docs)
│   └── Handoff Documents/   ← Same 8 deliverables rendered as Word/Excel files
│
├── forward-engineering/     ← Modern .NET + Angular DDD scaffold (the OUTPUT)
├── presentation/            ← Interactive HTML demo workspaces
│
├── HANDOFF_TEST_DATA_RULES.txt  ← Test loans + expected rule outcomes (start here for testing)
└── RE_AGENTS_CONFIG.md          ← Auto-generated pipeline configuration (do not edit by hand)
```

---

## Start Here — Key Files For New People

### 1. Understand the legacy system
| File | What it tells you |
|---|---|
| `sample-project/ARCHITECTURE.md` | 4-layer architecture overview (UI → Rules → Adapters → Tandem) |
| `sample-project/src/LoanRules.cpp` | All business logic in one file — the extraction source for every rule |
| `sample-project/tandem/TKA900.cbl` | COBOL program for loan search (Tandem backend) |
| `sample-project/tandem/LSS_SCHEMA.sql` | Tandem database schema (LSS_LOAN_T, LSS_CYCLE_STEP_T) |

### 2. Read the extracted business rules
| File | What it tells you |
|---|---|
| `artifacts/rule_register.governance.md` | **14 rule cards** — the primary output of the pipeline. Each card has: Rule ID, plain-English statement, technical statement, source file:line evidence, Review Priority stamp |
| `artifacts/traceability_matrix.md` | Screen → Action → Rule → Evidence → API endpoint cross-reference |
| `artifacts/ambiguity_log.governance.md` | 2 open ambiguities (A-001, A-002) flagged for human review |

### 3. Read the final deliverables

**Markdown versions** (render in GitHub / VS Code):

| File | Audience |
|---|---|
| `docs/final_output/Reverse_Engineered_Business_Requirements.md` | Business stakeholders — plain-English rules |
| `docs/final_output/Reverse_Engineered_Technical_Specification.md` | Architects / developers — code-grounded rules |
| `docs/final_output/Current_State_Architecture_Flow.md` | Everyone — Mermaid diagram of the legacy stack |
| `docs/final_output/Modern_Stack_Architecture_Flow.md` | Everyone — Mermaid diagram of the target stack |
| `docs/final_output/Forward_Engineering_Modernization_Blueprint.md` | Implementation team — DDD scaffold specification |
| `docs/final_output/Forward_Engineering_API_Taxonomy.md` | Integration team — all REST endpoints in tabular format |

**Word/Excel versions** (same content, formatted for distribution):

All 6 documents above plus the API Taxonomy as `.xlsx` are in `docs/Handoff Documents/`.

### 4. Test data and expected rule outcomes
```
HANDOFF_TEST_DATA_RULES.txt
```
Contains the **5 canonical seed loans** used to exercise all 14 rules, with the exact expected
output for each loan when processed through both the legacy app and the modern API. Use this
to verify that a new environment reproduces the same rule behaviour.

| Loan # | Borrower | State | Key scenario |
|---|---|---|---|
| 1234567890 | Jordan Smith | KY | Quote required + KY ISO pre-call + 14E dispatched |
| 2234567890 | Casey Brown | TX | Quote skipped + 14E suppressed (EDI_FLAG=N) |
| 3333333333 | Quote Skip | TX | Quote skipped (QUOTE_REQD=N) + 14E dispatched |
| 4444444444 | State Block | CA | Quote triggered (CA is approved in legacy) + 14E dispatched |
| 5555555555 | Instant Issue | TX | Quote skipped + 14E suppressed (INSTANT_ISSUE cycle) |

### 5. Interactive demo
Open either file directly in a browser — no server needed:

| File | What it shows |
|---|---|
| `presentation/re_agent_pack_story_flow.html` | Full interactive demo: legacy architecture, animated flow per loan, agent pipeline, DDD diagram, rules registry, legacy→modern mapping |
| `presentation/re_agent_pack_oral_deck.html` | Slide-style oral presentation deck |

---

## How To Run The Agent Pipeline (New Project)

> Full step-by-step prompts with copy-paste instructions are in `pipeline/GUIDE.md`.
> What follows is the sequence summary.

### Prerequisites
- Visual Studio Code with **GitHub Copilot** extension (agent mode)
- The source codebase you want to analyse open in the VS Code workspace
- Agents installed: open `.github/agents/` — they load automatically in Copilot

### Step-by-step

| Step | Agent | What to do | Output |
|---|---|---|---|
| **0** | `project-scanner` | Open Copilot Chat, select `project-scanner` agent, send the Step 0 prompt from `pipeline/GUIDE.md` | `RE_AGENTS_CONFIG.md` |
| **0b** | *(script)* | Run `bash pipeline/scripts/update-checksums.sh` in terminal | `artifacts/source_checksums.governance.md` |
| **1** | `analysis-planner` | Send Step 1 prompt | Coverage status, next-step recommendation |
| **2** | `screen-analyzer` | Send Step 2 prompt | `artifacts/generated_screen_inventory.md`, `artifacts/field_dictionary.md` |
| **3** | `rule-extractor` | Send Step 3 prompt | `artifacts/rule_register.governance.md` ← **primary output** |
| **4** | `dependency-mapper` | Send Step 4 prompt | `artifacts/screen_action_api_estimation.md`, `artifacts/service_decomposition.md` |
| **1 again** | `analysis-planner` | Re-run to confirm coverage before grounding review | Updated coverage report |
| **5** | `grounding-reviewer` | Send Step 5 prompt | Review Priority stamps added to rule register, `artifacts/rule_coverage_checklist.governance.md` |
| **6** | `analysis-planner` | *(conditional)* Only if Step 5 flagged Priority rules — scopes targeted re-analysis | Rerun log |
| **7** | `document-publisher` | **Start a fresh Copilot chat**, send Step 7 prompt | 8 files in `docs/final_output/` |
| **8** | `publication-reviewer` | Send Step 8 prompt | Go / No-go decision |
| **9** | `scaffold-generator` | **Only after business approval of the Blueprint** — send Step 9 prompt | `forward-engineering/` project scaffold |

### Important notes
- **Steps 3 and 5 run at temperature = 0.** Every rule must cite a source file and line number — rules without grounding go to the ambiguity log, not the rule register.
- **Step 7 must run in a fresh chat** — the document-publisher is a long agent and produces better output without prior context.
- **Step 9 is manual and gated.** Do not run it until business stakeholders have reviewed and approved `Reverse_Engineered_Business_Requirements.md`.

### Resetting artifacts to baseline (clean re-run)
```bash
# Reset governance files only (keeps rules/screens/fields)
bash pipeline/scripts/reset-artifacts.sh --governance

# Full reset to empty baseline
bash pipeline/scripts/reset-artifacts.sh --full
```

---

## The Modern Codebase (forward-engineering/)

The `forward-engineering/` folder is the DDD scaffold generated by Step 9. It is a separate
sub-project with its own `.gitignore` and solution file.

```
forward-engineering/
├── Domain/              ← LoanAggregate + 5 value objects + ports + events (rules live here)
├── Application/         ← Commands, Queries, DTOs
├── Infrastructure/      ← EF Core + SQLite + 3 external service adapters
├── Presentation/        ← 4 ASP.NET Core REST controllers + Swagger
├── AngularUI/           ← Angular 18 frontend (npm install + ng serve)
├── Database/scripts/    ← SQL DDL for dbo.Loan
├── Tests/xunit/         ← 14 xUnit test class stubs (one per rule, Priority rules first)
└── TrackAllLoanMaintenanceLegacy.sln
```

**To run the API locally:**
```bash
cd forward-engineering/Presentation
dotnet run
# Swagger UI: http://localhost:5000/swagger
```

**To run the Angular UI:**
```bash
cd forward-engineering/AngularUI
npm install
npx ng serve
# UI: http://localhost:4200
```

---

## Reference — All Artifacts At a Glance

| Artifact | Location | Produced by step |
|---|---|---|
| Pipeline config | `RE_AGENTS_CONFIG.md` | Step 0 |
| Source checksums | `artifacts/source_checksums.governance.md` | Step 0b (script) |
| Coverage report | *(in Copilot chat output)* | Step 1 |
| Screen inventory | `artifacts/generated_screen_inventory.md` | Step 2 |
| Field dictionary | `artifacts/field_dictionary.md` | Step 2 |
| **Rule register** | `artifacts/rule_register.governance.md` | Step 3 |
| Ambiguity log | `artifacts/ambiguity_log.governance.md` | Step 3 / 5 |
| API estimation | `artifacts/screen_action_api_estimation.md` | Step 4 |
| Service decomposition | `artifacts/service_decomposition.md` | Step 4 |
| Traceability matrix | `artifacts/traceability_matrix.md` | Step 4 |
| Coverage checklist | `artifacts/rule_coverage_checklist.governance.md` | Step 5 |
| Reverse engineering report | `artifacts/reverse_engineering_report.md` | Step 4/5 |
| Session state | `artifacts/session_state.governance.md` | All steps |
| **8 final deliverables** | `docs/final_output/` | Step 7 |
| **Word/Excel handoff docs** | `docs/Handoff Documents/` | Step 7 (rendered) |
| Modern code scaffold | `forward-engineering/` | Step 9 |
| Test data + rule scenarios | `HANDOFF_TEST_DATA_RULES.txt` | Manual |

---

## Glossary

Plain-English definitions of all code identifiers, mnemonics, and Tandem program names:
`docs/glossary.md`

Agent operating rules (grounding standards, evidence requirements, scope constraints):
`docs/AGENT_OPERATING_RULES.md`

Reviewer guide (how to read rule cards, what Priority vs Standard means):
`docs/REVIEWER_GUIDE.md`
