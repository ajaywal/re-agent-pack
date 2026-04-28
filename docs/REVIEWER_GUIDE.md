# Reviewer Guide — Reading the Generated Business Documents

## Your role

The pipeline extracts candidate business rules from the legacy system's source code and publishes them into seven deliverables:

- **Reverse-Engineered Business Requirements** (your primary read — Plain-English rules, Subdomain Registry, Traceability Summary)
- **Reverse-Engineered Technical Specification** (for your technical leads — code-grounded rule statements, candidate APIs)
- **Architecture Flow** (system context diagrams — current state and target state, Mermaid format)
- **Forward Engineering Modernization Blueprint** (AI-consumable code scaffolds — paste into Claude or GPT-4o to generate Angular + .NET + SQL)
- **Forward Engineering API Taxonomy** (Alam's DGT tool format — feed directly into the Domain API Generation Tool)
- **Rendering Handoff** (paste into any AI to produce the 4 polished Word documents)
- **Publication Contract** (machine-readable manifest — QA and tooling use this)

As a business reviewer, you primarily work with the **Business Requirements** Word document. Your technical leads will review the Technical Specification and Architecture Flow. There is no approval step inside the tooling — these deliverables are the review artifact. Your job is to read them, confirm each rule matches how the business actually works, and note anything that needs correction or clarification. Feedback flows back through your normal review channels (email, tracked changes in Word, a shared doc, etc.) — not into the repo.

---

## Start with the Business Requirements document

Section 4 (Business Rules Register) is organised by **Functional Area**. Inside each Functional Area is a table with one row per rule:

| Rule ID | Rule Statement | Rule Type | Grounding | Review Priority |
|---|---|---|---|---|
| R-L-001 | Users must enter a loan number or borrower name before running loan search | validation | code-grounded | Standard |
| R-L-008 | Kentucky loans require ISO enrichment before rating submission | integration rule | code-grounded | **Priority** |

### The Review Priority column is your time-saver

Every rule is stamped **Priority** or **Standard**:

- **Priority** — the rule includes inferred, sample-derived, or ambiguous content. **Read these closely.** The tooling is telling you: "we extracted this from the code but we're less sure about it — please confirm."
- **Standard** — the rule traces directly to legacy code with high confidence and no open ambiguities. Safe to skim. Only dig in if something seems off.

If time is tight: read every Priority row and skim the Standard ones.

### How to read a row

Each Rule Statement is written in Plain-English for stakeholders. An example:

> **R-L-012 — 14E EDI format by servicer** *(Priority, [inferred])*
>
> The outbound placement notification is formatted for the servicer managing the loan: Black Knight servicers receive fixed-width; all other servicers receive delimited. Using the wrong format causes the servicer's system to reject the notification.

When reviewing, ask:

- Does this match what the business actually does today?
- Is any condition stated too strictly or too loosely?
- Is anything missing — an exception the legacy code doesn't handle but your team does manually?
- Is the business language clear enough for a non-technical reader, or is it leaking technical jargon?

Any of those being "no" is useful feedback — flag it.

---

## What Grounding labels mean

Labels appear next to each rule and indicate how the rule was derived:

| Label | Meaning |
|---|---|
| `[SG]` / code-grounded | Direct evidence from legacy code — highest confidence |
| `[SG-influenced]` | Grounded in the source pack but not confirmed against the real schema |
| `[inferred]` | Reasoned from context — contributes to Priority review |
| `[placeholder]` | Sample-only values (e.g. CLTMNT, QREQ) — always Priority, never treated as production fact |

Rules with `[inferred]` or `[placeholder]` grounding are automatically flagged Priority.

---

## Open Items section

Section 6 (Open Items and Ambiguities) lists rules that couldn't be fully extracted — usually because evidence was insufficient or conflicting. These are presented as open questions. Your input on any of them helps close the gaps in the next iteration.

---

## Traceability Summary

Section 8 ties every rule to:

- the legacy code it came from (`file::function`)
- the candidate modern API or service
- the section in the Forward Engineering Blueprint that implements it
- a suggested test case ID

You probably don't need this as a business reviewer, but your technical leads will use it to confirm the code analysis is sound.

---

## After your review

Send your feedback back to the engagement team in whatever format you normally use — marked-up Word doc, email summary, or meeting notes are all fine. The team will fold corrections into the source analysis and regenerate the documents.

There is nothing to sign off inside the tooling. The Word documents themselves are the record of what was reviewed.
