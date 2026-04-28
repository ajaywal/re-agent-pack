# Service Decomposition

Produced by dependency-mapper (Step 4). Proposes a candidate target service split based on the current analysis artifacts.

This is an estimation worksheet derived from legacy code analysis — not a final architecture decision.

## Candidate service groups

| Candidate service | Responsibilities | Related screens / actions | Related legacy evidence | Suggested APIs | Rationale for grouping | Confidence / ambiguity notes |
|---|---|---|---|---|---|---|
| Loan Query Service | Execute loan search and return loan + cycle context required for downstream decisions | Loan Search -> Search | LoanSearchDlg::ExecuteLoanSearch; CTMELibAdapter::SendMessage(LOAN_SEARCH); TKA900 3000-QUERY-LOAN + 4000-QUERY-CYCLE-STEP | GET /api/loans/search | Search is read-only and depends on tandem query path distinct from write operations | High |
| Loan Command Service | Create and modify loan records with server-enforced validation outcomes | Add Loan -> Add; Modify Loan -> Save Changes | LoanAddDlg::OnBnClickedAdd; LoanModifyDlg::OnBnClickedModify; TKA901 2000-VALIDATE-ADD + 3000-INSERT-LOAN; TKA902 3000-VALIDATE-MODIFY + 4000-UPDATE-LOAN | POST /api/loans; PUT /api/loans/{loanNumber} | Write workflows share lifecycle constraints, status transitions, and persistence behavior | High; A-001 impacts modify-address branch certainty |
| Loan Validation Domain Module | Centralize business constraints reused by query/process/command flows | Search validation, Add validation, Modify validation | CLoanRules::ValidateLoanForSearch, ValidateLoanForAdd, ValidateLoanForModify, IsLoanStatusTransitionValid | Internal only (no direct API) | Rules are cohesive domain logic and should stay internal unless independently owned | High |
| Quote Orchestration Service | Determine quote requirement and coordinate rating call, including KY ISO branch | Loan Search -> Process result | CLoanRules::RequiresQuote; CRataBaseServiceAdapter::GetQuote; CKentuckyISOAdapter::GetInfo; TMELibAdapter KY_ISO_QUERY mapping | POST /api/quotes/loan/{loanNumber} | Quote path has conditional orchestration and external dependency behavior separate from core loan CRUD | High |
| EDI Notification Service | Evaluate 14E eligibility, build audit payload, choose format, dispatch gateway notification | Loan Search -> Placement notification | CLoanRules::EnforceEdiEligibility; BuildLoanAuditMessages; CEDINotificationWriter::Write14ERecord; CTMELibAdapter::SendMessage(14E_NOTIFY) | POST /api/edi/notifications/14e | EDI is event-driven integration with suppression logic and delivery formatting concerns | High |
| Tandem Routing Gateway | Resolve mnemonic-to-program and perform transport dispatch | All integration actions | CTMELibAdapter::LoadRoutingTable; ResolveProgramName; SendMessage; LSS001T table | Internal gateway interface | Single infrastructure adapter shared by query, command, quote adjunct, and EDI dispatch paths | High |
| Rating Gateway Adapter | Integrate with RataBase and normalize quote outputs | Search result quote flow | CRataBaseServiceAdapter::GetQuote | Internal adapter behind Quote Orchestration Service | Keeps external rating protocol isolated from domain logic | High |
| Kentucky ISO Adapter | Retrieve ISO context for KY-only rating path | KY quote flow | CKentuckyISOAdapter::GetInfo; mapping KY_ISO_QUERY -> AIP930 | Internal adapter behind Quote Orchestration Service | Narrow integration concern applicable only to Kentucky branch | High |

## Boundary stance

- Treat validation modules as internal domain logic first; do not split into separate deployable services unless source evidence shows a separately owned rules engine.
- Treat audit/logging as an internal sink first; do not add a read API unless the analysis specifically requires audit retrieval.
- Preserve a clear boundary between loan query/read and loan command/write operations to mirror tandem program separation (TKA900 vs TKA901/TKA902).
- Keep tandem mnemonic routing as infrastructure, not business service logic.
