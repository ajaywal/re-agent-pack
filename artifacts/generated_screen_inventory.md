# Generated Screen Inventory

Produced by screen-analyzer (Step 2). Each row represents one dialog, form, or screen identified in the legacy codebase.

## Screen catalog

| Screen ID | Screen Title | Control Count | Breakup of Fields | Event Handlers | Candidate Business Actions | Evidence | Confidence |
|---|---|---:|---|---|---|---|---|
| SCR-LOAN-001 | Loan Search | 11 | Inputs: 3 (`LOAN_NUM`, `BORROWER_NAME`, `PROPERTY_ADDRESS`); Action buttons: 3 (`SEARCH`, `ADD_LOAN`, `MODIFY_LOAN`); Results grid: 1; Quote/status display: 1; Static labels: 3 | `OnBnClickedSearch`, `OnBnClickedAddLoan`, `OnBnClickedModifyLoan`, `OnNMDblclkListResults` | Search loans, open Add Loan flow, open Modify Loan flow, inspect selected result | `sample-project/src/LoanSearchDlg.cpp`, `sample-project/src/LoanSearchDlg.h`, `sample-project/src/TrackAllClientManagerLegacy.rc`, `sample-project/src/resource.h` | High |
| SCR-LOAN-002 | Add Loan | 28 | Inputs: 13 (loan identity, borrower, property, status, value, UPB); Action buttons: 2 (`ADD_LOAN`, `CANCEL`); Static labels: 13 | `OnBnClickedAdd` | Create new loan record after validation | `sample-project/src/LoanAddDlg.cpp`, `sample-project/src/LoanAddDlg.h`, `sample-project/src/TrackAllClientManagerLegacy.rc`, `sample-project/src/resource.h` | High |
| SCR-LOAN-003 | Modify Loan | 24 | Read-only display: 1 (`LOAN_NUM`); Editable inputs: 9 (borrower, address, status, UPB, value, mortgagee clause); Action buttons: 2 (`SAVE_CHANGES`, `CANCEL`); Static labels: 12 | `OnBnClickedModify` | Update existing loan record with guarded status/UPB/address transitions | `sample-project/src/LoanModifyDlg.cpp`, `sample-project/src/LoanModifyDlg.h`, `sample-project/src/TrackAllClientManagerLegacy.rc`, `sample-project/src/resource.h` | High |

## Notes
- Counts are based on resource scripts or inferred from code bindings where resource definitions are absent.
- Extend this file when new screens are analyzed; do not replace existing rows.
- Scope limited to Loan Maintenance dialogs only (Loan Search, Add Loan, Modify Loan) per `RE_AGENTS_CONFIG.md`.
