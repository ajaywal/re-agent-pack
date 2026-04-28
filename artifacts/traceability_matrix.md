# Traceability Matrix — Legacy → Modern Target

Produced by dependency-mapper (Step 4). Maps legacy artifacts to their candidate modern equivalents.

**Grounding key:** [SG] = source-grounded | [SD] = sample-derived | [inferred] = reasoned from context | [placeholder] = synthetic sample value

---

## UI Layer

| Legacy Artifact | Legacy Type | Legacy Behavior | Target Artifact | Target Type | Confidence | Grounding | Notes |
|---|---|---|---|---|---|---|---|
| `LoanSearchDlg` (`IDD_LOAN_SEARCH`) | MFC dialog | Captures loan number / borrower / address criteria and triggers search | `LoanSearchComponent` | Angular component | High | [SG] | Maps to search form plus results grid in web UI |
| `IDC_BUTTON_LOAN_SEARCH` -> `OnBnClickedSearch` | Button handler | Validates criteria and dispatches `LOAN_SEARCH` | `searchLoans()` | Angular action -> API call | High | [SG] | Candidate REST operation: `GET /api/loans?loanNumber=&borrowerName=&address=`. Rules: R-L-001, R-L-002. |
| `IDC_LIST_LOAN_RESULTS` -> `OnNMDblclkListResults` | List view + double-click event | Selects result and re-runs downstream result processing | `LoanResultsGrid` row select action | Angular grid interaction | High | [SG] | Double-click behavior may become explicit row action in web UX |
| `IDC_BUTTON_LOAN_ADD` -> `OnBnClickedAddLoan` | Button handler | Opens Add dialog modal from Search | `openAddLoanDialog()` | Angular modal route/state action | High | [SG] | Parent-child screen flow preserved |
| `LoanAddDlg` (`IDD_LOAN_ADD`) | MFC dialog | Captures new-loan fields and submits create request | `AddLoanDialogComponent` | Angular modal component | High | [SG] | Includes identity/property/financial fields |
| `IDC_BUTTON_LOAN_ADD` in Add dialog -> `OnBnClickedAdd` | Default button handler | Validates add payload and dispatches `ADD_LOAN` | `createLoan()` | Angular action -> API call | High | [SG] | Candidate REST operation: `POST /api/loans`. Rules: R-L-009 to R-L-013. |
| `IDC_BUTTON_LOAN_MODIFY` -> `OnBnClickedModifyLoan` | Button handler | Requires selected row and opens Modify dialog | `openModifyLoanDialog(selectedLoan)` | Angular modal route/state action | High | [SG] | Enforces selected-loan context before edit |
| `LoanModifyDlg` (`IDD_LOAN_MODIFY`) | MFC dialog | Pre-loads selected loan and permits guarded updates | `ModifyLoanDialogComponent` | Angular modal component | High | [SG] | Loan number shown read-only in UI |
| `IDC_BUTTON_LOAN_MODIFY` in Modify dialog -> `OnBnClickedModify` | Default button handler | Validates modification and dispatches `MODIFY_LOAN` | `updateLoan(loanId, payload)` | Angular action -> API call | High | [SG] | Candidate REST operation: `PUT /api/loans/{loanNumber}`. Rule: R-L-014. |
| `IDC_STATIC_QUOTE` bound to `m_strQuoteResult` | Static status text | Displays quote-required result or failure/no-quote messages | `quoteStatusBanner` | UI status component | High | [SG] | Result is derived from quote and eligibility path |

## Service / Logic Layer

| Legacy Artifact | Legacy Type | Legacy Behavior | Target Artifact | Target Type | Confidence | Grounding | Notes |
|---|---|---|---|---|---|---|---|
| `CLoanRules::ValidateLoanForSearch` | Validation logic | Enforces search input constraints before gateway call | `LoanSearchValidator` | Domain/application validator | High | [SG] | Invoked from `LoanSearchDlg::ValidateSearchCriteria`. Rules: R-L-001, R-L-002. |
| `CLoanRules::ValidateLoanForAdd` | Validation logic | Enforces Add rules before `ADD_LOAN` dispatch | `CreateLoanValidator` | Domain/application validator | High | [SG] | Invoked from `CLoanAddDlg::OnBnClickedAdd`. Rules: R-L-009 to R-L-013. |
| `CLoanRules::ValidateLoanForModify` | Validation logic | Enforces modify transition and UPB/address constraints | `UpdateLoanValidator` | Domain/application validator | High | [SG] | Invoked from `CLoanModifyDlg::OnBnClickedModify`. Rule: R-L-014. |
| `CLoanRules::RequiresQuote` + `CRataBaseServiceAdapter::GetQuote` | Rules + adapter | Conditionally obtains premium quote for search result | `QuoteOrchestrator` | Application service | High | [SG] | Triggered in `CLoanSearchDlg::ProcessLoanResult`. Rules: R-L-003, R-L-004, R-L-005. |
| `CEDINotificationWriter::Write14ERecord` | Integration orchestrator | Applies EDI eligibility and dispatches notification | `EdiNotificationService` | Application/integration service | High | [SG] | Triggered after result processing for placement event. Rules: R-L-006, R-L-007, R-L-008. |

## Data Layer

| Legacy Artifact | Legacy Type | Legacy Behavior | Target Artifact | Target Type | Confidence | Grounding | Notes |
|---|---|---|---|---|---|---|---|
| `CLoan` | C++ data model | Shared in-memory loan payload across Search/Add/Modify | `Loan` | Domain entity / DTO pair | High | [SG] | Includes status, UPB, address, quote, cycle, and EDI fields |

## Integration / Gateway Layer

| Legacy Artifact | Legacy Type | Legacy Behavior | Target Artifact | Target Type | Confidence | Grounding | Notes |
|---|---|---|---|---|---|---|---|
| `CTMELibAdapter::SendMessage("LOAN_SEARCH")` | Gateway call | Routes search request to Tandem `TKA900` | `LoanQueryApi` | Backend query endpoint | High | [SG] | Mnemonic-to-program map in `TMELibAdapter`. Rules: R-L-001, R-L-005. |
| `CTMELibAdapter::SendMessage("ADD_LOAN")` | Gateway call | Routes create request to Tandem `TKA901` | `LoanCommandApi` create endpoint | Backend command endpoint | High | [SG] | Called by Add dialog submit. Rules: R-L-009 to R-L-013. |
| `CTMELibAdapter::SendMessage("MODIFY_LOAN")` | Gateway call | Routes update request to Tandem `TKA902` | `LoanCommandApi` update endpoint | Backend command endpoint | High | [SG] | Called by Modify dialog submit. Rule: R-L-014. |
| `CRataBaseServiceAdapter::GetQuote` | External service adapter | Executes carrier eligibility + rating call | `RatingGateway` | External service port/adapter | High | [SG] | Includes KY ISO pre-call branch. Rules: R-L-003, R-L-004. |
| `CKentuckyISOAdapter::GetInfo` (`KY_ISO_QUERY` -> `AIP930`) | Tandem integration call | Fetches Kentucky ISO context required for KY quote | `KentuckyIsoGateway` | External/Tandem integration port | High | [SG] | Invoked only for KY state. Rule: R-L-004. |
| `CEDINotificationWriter` + `14E_NOTIFY` -> `TKA920` | Gateway + formatter | Dispatches 14E EDI notification for eligible loans | `EdiDispatchGateway` | Integration adapter | High | [SG] | Format selected from `FCI_CODE` prefix. Rules: R-L-006, R-L-007, R-L-008. |
