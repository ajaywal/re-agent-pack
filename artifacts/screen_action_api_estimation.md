# Screen Action API Estimation

Produced by dependency-mapper (Step 4). Estimates probable target APIs and service groupings from the current analysis artifacts.

Complexity below refers to estimated target-state implementation effort, not to the amount of legacy code present.

## Estimation table

| Legacy screen / dialog | User action | Business intent | Legacy evidence | Probable backend operation | Candidate target API | Candidate method | Service grouping | Complexity | Confidence | Assumptions / open questions |
|---|---|---|---|---|---|---|---|---|---|---|
| Loan Search (IDD_LOAN_SEARCH) | Click Search | Find loans by loan number, borrower, and optional property address | LoanSearchDlg::OnBnClickedSearch -> ValidateSearchCriteria -> ExecuteLoanSearch -> CTMELibAdapter::SendMessage(LOAN_SEARCH) -> TKA900 | Query LSS_LOAN_T and enrich with cycle flags from LSS_CYCLE_STEP_T | /api/loans/search | GET | Loan Query Service | Medium | High | Address criterion is present in UI and validation branch, but TKA900 sample SQL currently shows loan number and borrower filter only. |
| Loan Search (results row) | Double-click result | Re-process selected loan for quote and notification side-effects | LoanSearchDlg::OnNMDblclkListResults -> ProcessLoanResult | Re-run quote decision and eligible notification flow for selected record | /api/loans/{loanNumber}/process-result | POST | Loan Orchestration Service | Medium | Medium | Could be implemented as client-side compose call instead of single orchestration endpoint. |
| Loan Search (result processing) | Auto-process first result after search | Obtain quote when required and update UI quote status | LoanSearchDlg::ProcessLoanResult -> CLoanRules::RequiresQuote -> CRataBaseServiceAdapter::GetQuote | Conditional rating orchestration with KY branch to ISO lookup | /api/quotes/loan/{loanNumber} | POST | Quote Orchestration Service | High | High | Endpoint can return quote + eligibility explanation for no-quote path. |
| Loan Search (result processing) | Dispatch 14E after placement event | Send EDI notification for eligible loans | LoanSearchDlg::ProcessLoanResult -> CEDINotificationWriter::Write14ERecord -> EnforceEdiEligibility -> CTMELibAdapter::SendMessage(14E_NOTIFY) -> TKA920 | Eligibility gate + format selection + gateway dispatch | /api/edi/notifications/14e | POST | EDI Notification Service | High | High | Should expose suppression reason as non-error business response when ineligible. |
| Add Loan (IDD_LOAN_ADD) | Click Add Loan | Create a new loan with onboarding validation | LoanAddDlg::OnBnClickedAdd -> ValidateLoanForAdd -> CTMELibAdapter::SendMessage(ADD_LOAN) -> TKA901 | Validate payload then insert LSS_LOAN_T | /api/loans | POST | Loan Command Service | Medium | High | Duplicate-key behavior should map Tandem 9108 to HTTP conflict. |
| Modify Loan (IDD_LOAN_MODIFY) | Click Save Changes | Apply controlled updates to existing loan | LoanModifyDlg::OnBnClickedModify -> ValidateLoanForModify -> CTMELibAdapter::SendMessage(MODIFY_LOAN) -> TKA902 | Fetch current state, enforce status/UPB rules, update LSS_LOAN_T | /api/loans/{loanNumber} | PUT | Loan Command Service | High | High | Address-clear enforcement in sample TKA902 appears incomplete; see ambiguity A-001. |
| Loan Search (toolbar action) | Click Modify Loan without selected row | Prevent invalid modify flow | LoanSearchDlg::OnBnClickedModifyLoan | Gate operation until row selection exists | /api/loans/{loanNumber} | n/a (client-side guard) | UI Guardrail | Low | High | Pure UI constraint, no backend call expected when no row is selected. |

## Notes
- All estimates are derived from legacy code analysis — not from a confirmed production API contract.
- Extend this file as more screens are analyzed; do not replace existing rows.
- Query and command APIs are separated because legacy flow distinguishes read search (TKA900) from write paths (TKA901, TKA902).
