# Rule Register

Extracted business rules from the legacy codebase. Each rule card has `Status: Active` by default; rules with insufficient evidence carry `Status: Deferred` and surface only in the FRD Open Items section.

The grounding-reviewer agent (Step 5) stamps each Active rule with a **Review Priority** — **Priority** for non-code-grounded, ambiguous, or unresolved rules; **Standard** for code-grounded rules with no open gaps. There is no in-repo approval step — the generated Word documents are the review artifact sent to business stakeholders.

---

<!--
Rule card format:

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
**Review Priority:** _(to be stamped by grounding-reviewer Step 5)_

---
-->

_(no rules extracted yet — run rule-extractor Step 3 to populate)_
