# Forward Engineering API Taxonomy — TrackAllLoanMaintenanceLegacy

## How to use
- DGT tool: import this file into Alam's Domain API Generation Tool directly.
- Direct AI code gen: paste into Claude or GPT-4o with the prompt:
  "Generate .NET Core 8 Web API controllers, request/response DTOs, and unit tests from this taxonomy."
- Spreadsheet: copy the taxonomy table into Excel — column order matches DomainApiTaxonomyTemplate_v2.xlsx.

**Subdomain in scope:** Loan Maintenance — Loan Search, Add Loan, and Modify Loan flows
**Rules source:** R-L-001 to R-L-014
**Generated from:** reverse-engineering artifacts — all rows trace to at least one rule card.

## Section 1 — Domain API Taxonomy Table

| Domain | Sub-Domain | Comments | AutomationCandidate | ControllerName | ResourceName | ResourceModel | SubCollectionName | SubCollectionModel | Request | RequestPayload | Response | ResponsePayload | Operation | RequestType | ConnectionType | Path | API Name |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Assurant | Loan Maintenance | Search loans by criteria; enforces R-L-001,R-L-002 | Y | LoanQueryController | Loan | LoanNum:string, BorrowerName:string, PropertyAddress:string, PropertyState:string, QuoteReqd:string, EdiFlag:string, CycleType:string |  |  | LoanSearchCriteriaDto | LoanNum:string, BorrowerName:string, PropertyAddress:string | IReadOnlyList<LoanDto> | LoanNum:string, BorrowerName:string, PropertyAddress:string, LoanStatus:string | SearchLoans | GET | TME over TLS TCP (fgatetcp) | /search |  |
| Assurant | Loan Maintenance | Process selected result for quote/notification path; enforces R-L-003..R-L-008 | Y | LoanProcessController | LoanProcess | LoanNum:string, QuoteRequired:bool, NotificationEligible:bool |  |  | ProcessLoanResultRequestDto | LoanNum:string | ProcessLoanResultDto | QuoteStatus:string, NotificationStatus:string, SuppressionReason:string | ProcessLoanResult | POST | TME over TLS TCP (fgatetcp) + External Service | /{loanNumber}/process-result |  |
| Assurant | Loan Maintenance | Create loan operation; enforces R-L-002,R-L-009,R-L-010,R-L-011,R-L-012,R-L-013 | Y | LoanCommandController | Loan | LoanNum:string, BorrowerName:string, PropertyAddress:string, PropertyType:string, LoanStatus:string, PropertyValue:decimal, UnpaidPrincipalBalance:decimal |  |  | CreateLoanRequestDto | LoanNum:string, BorrowerName:string, PropertyAddress:string, PropertyType:string, LoanStatus:string, PropertyValue:decimal, UnpaidPrincipalBalance:decimal | LoanDto | LoanNum:string, BorrowerName:string, LoanStatus:string | CreateLoan | POST | TME over TLS TCP (fgatetcp) | / |  |
| Assurant | Loan Maintenance | Modify loan operation; enforces R-L-014 | Y | LoanCommandController | Loan | LoanNum:string, BorrowerName:string, PropertyAddress:string, LoanStatus:string, UnpaidPrincipalBalance:decimal |  |  | UpdateLoanRequestDto | BorrowerName:string, PropertyAddress:string, LoanStatus:string, UnpaidPrincipalBalance:decimal | LoanDto | LoanNum:string, LoanStatus:string, UnpaidPrincipalBalance:decimal | UpdateLoan | PUT | TME over TLS TCP (fgatetcp) | /{loanNumber} |  |
| Assurant | Loan Maintenance | Quote retrieval path; enforces R-L-003,R-L-004,R-L-005 | Y | QuoteController | PremiumQuote | LoanNum:string, PropertyState:string, PremiumAmount:decimal, QuoteStatus:string |  |  | string | loanNumber:string | QuoteResultDto | QuoteStatus:string, PremiumAmount:decimal, Message:string | GetLoanQuote | POST | External Service | /loan/{loanNumber} |  |
| Assurant | Loan Maintenance | 14E dispatch operation; enforces R-L-006,R-L-007,R-L-008 | Y | EdiNotificationController | EDINotification | LoanNum:string, FormId:string, DispatchStatus:string, SuppressionReason:string |  |  | Dispatch14ERequestDto | LoanNum:string, FormId:string, EventType:string | EdiDispatchResultDto | DispatchStatus:string, SuppressionReason:string, AuditRef:string | Dispatch14E | POST | TME over TLS TCP (fgatetcp) | /14e |  |

### Section 2 — Rule-to-API Traceability

| Rule ID | Rule Summary | API Operation | Validation Enforced By | Notes |
|---|---|---|---|---|
| R-L-001 | Search requires at least one criterion | SearchLoans | UI + API | Search form group validator and API request validator |
| R-L-002 | Loan number must be ten digits | SearchLoans, CreateLoan | UI + API + DB | Pattern validator plus LoanNum schema/type constraints |
| R-L-003 | Quote eligibility requires approved state | GetLoanQuote | API | Orchestration service checks approved state list |
| R-L-004 | Kentucky quote requires ISO pre-call | GetLoanQuote | External + API | API branch invokes KY ISO dependency before quote |
| R-L-005 | Quote request gated by QUOTE_REQD flag | ProcessLoanResult, GetLoanQuote | API | Process endpoint determines whether quote call is invoked |
| R-L-006 | 14E requires EDI enrollment | Dispatch14E | API | EDI eligibility guard in service layer |
| R-L-007 | Instant Issue cycle suppresses 14E | Dispatch14E | API | Eligibility suppression rule before dispatch |
| R-L-008 | 14E requires registered form ID | Dispatch14E | API | Sample-seeded list; production source unresolved (A-002) |
| R-L-009 | Add requires identity fields | CreateLoan | UI + API | Required field checks in UI and API |
| R-L-010 | Add requires positive property value | CreateLoan | UI + API + DB | Min validator and command guard |
| R-L-011 | Add requires property address | CreateLoan | UI + API | Required address validation |
| R-L-012 | Add requires ACTIVE status and positive UPB | CreateLoan | API + DB | Command validation and schema non-null/positive constraints |
| R-L-013 | Property type restricted to two values | CreateLoan | UI + API | Enum-like validator |
| R-L-014 | Modify enforces immutable key and controlled updates | UpdateLoan | API | Transition and non-increase checks; address clear parity open in A-001 |
