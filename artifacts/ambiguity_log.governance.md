# Ambiguity Log

Use this file to track unresolved or weakly supported findings.

| Item ID | Screen / File | Uncertainty | Why It Is Unresolved | Needed Evidence | Owner | Status |
|---|---|---|---|---|---|---|
| A-001 | sample-project/tandem/TKA902.cbl | Property-address clear rule appears documented but not explicitly failed server-side. | In `3000-VALIDATE-MODIFY`, the R-ML-004 comment states address cannot be cleared, but condition executes `CONTINUE` without setting error status; client-side C++ enforces the block, Tandem behavior remains unclear. Related rule: R-L-014. | Confirm production `TKA902` implementation branch for blank `WS-PROPERTY-ADDRESS-NEW` and expected status code/message, or provide test evidence from Tandem runtime logs. | rule-extractor | Open |
| A-002 | sample-project/src/LoanRules.cpp | Source of valid lender-target form IDs is represented as seeded values, not verified table evidence. | Rule path references `lender_target` as table-backed in comments, but repository evidence shows only in-memory `LoadLenderTargetForms` values (`LT-F100`..`LT-F400`) and no concrete schema/table usage in scope. Related rule: R-L-008. | Evidence of production `lender_target` table structure and load path (DDL/query) or runtime config source used by deployed service. | grounding-reviewer | Open |

## Status options
- Open
- In Review
- Resolved
- Deferred

## Rules
- do not hide uncertainty in narrative artifacts
- if ambiguity affects a rule, reference the related Rule ID
- when resolved, update both the relevant artifact and this log
