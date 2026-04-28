# Reverse Engineering Report

Produced by multiple pipeline agents (Steps 2–4). Summarizes findings from the legacy codebase analysis.

**Project:** TrackAllLoanMaintenanceLegacy
**Date:** 2026-04-27
**Source:** `sample-project/`

---

## Grounding Key

- **[SG]** / `code-grounded` — Direct evidence from source files — highest confidence
- **[SD]** / `sample-only` — Derived from the sample codebase only; may not reflect the full production system
- **[inferred]** — Reasoned from context — acceptable with a caveat
- **[placeholder]** — Synthetic value invented for the sample; never present as a production fact
- **[unresolved]** — Evidence is missing, ambiguous, or conflicting

---

## Scope Summary

- Subdomain analyzed: Loan Maintenance (Search, Add, Modify, Quote, 14E notification)
- Legacy UI stack: VC++ MFC dialogs
- Legacy backend stack: HP NonStop Tandem COBOL + SQL/MP
- Integration transport: TME mnemonic routing over fgatetcp

## Step 2-4 Findings Snapshot

- Screens analyzed: 3 dialogs (Loan Search, Add Loan, Modify Loan)
- Rule candidates extracted: 14 active rules (R-L-001 to R-L-014)
- Main action chains mapped:
	- Search -> Validate -> LOAN_SEARCH (TKA900) -> optional Quote -> optional 14E
	- Add -> Validate -> ADD_LOAN (TKA901)
	- Modify -> Validate -> MODIFY_LOAN (TKA902)
- Candidate target API families:
	- Loan Query API
	- Loan Command API
	- Quote Orchestration API
	- EDI Notification API

## Dependency Map (Legacy -> Candidate Modern)

| User action | Legacy handler path | Tandem / integration dependency | Candidate modern boundary | Grounding | Confidence |
|---|---|---|---|---|---|
| Search loans | `LoanSearchDlg::OnBnClickedSearch` -> `ValidateLoanForSearch` -> `SendMessage(LOAN_SEARCH)` | `TKA900`, `LSS_LOAN_T`, `LSS_CYCLE_STEP_T` | Loan Query Service | code-grounded | High |
| Process quote | `ProcessLoanResult` -> `RequiresQuote` -> `GetQuote` | RataBase adapter; KY branch `KY_ISO_QUERY` -> `AIP930` | Quote Orchestration Service | code-grounded | High |
| Send 14E notification | `ProcessLoanResult` -> `Write14ERecord` -> `EnforceEdiEligibility` -> `SendMessage(14E_NOTIFY)` | `TKA920`; format selected from `FCI_CODE` | EDI Notification Service | code-grounded | High |
| Add loan | `LoanAddDlg::OnBnClickedAdd` -> `ValidateLoanForAdd` -> `SendMessage(ADD_LOAN)` | `TKA901` insert to `LSS_LOAN_T` | Loan Command Service (create) | code-grounded | High |
| Modify loan | `LoanModifyDlg::OnBnClickedModify` -> `ValidateLoanForModify` -> `SendMessage(MODIFY_LOAN)` | `TKA902` update to `LSS_LOAN_T` | Loan Command Service (update) | code-grounded | High |

## Open Ambiguities

- A-001: `TKA902` address-clear rule branch appears documented but not explicitly rejected in sample server code; treat modify-address hard-fail semantics as unresolved until confirmed.

## Governance Notes

- All current findings are code-grounded within sample-project sources and tandem artifacts.
- No production claim is made beyond source-backed behavior in this repository.

## Step 5 Grounding Review Summary

- Review Priority stamping complete for all active rules:
	- Standard: 12
	- Priority: 2 (`R-L-008`, `R-L-014`)
- Priority rationale:
	- `R-L-008`: lender-target registry source is sample-seeded in code and lacks table-backed evidence in repository artifacts (`A-002`).
	- `R-L-014`: server-side address-clear enforcement behavior in `TKA902` is unresolved (`A-001`).
- Publication readiness state: conditional-ready for Step 6 targeted rerun planning due open ambiguities.
