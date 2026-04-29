# Reverse-Engineered Technical Specification

## 1. Overview

### 1.1 Purpose and audience
This specification provides a technical view of the governed reverse-engineering output for developers, architects, and technical leads implementing the modernization target.

### 1.2 Scope
In-scope subdomain: Loan Maintenance (Loan Search, Add Loan, Modify Loan, quote orchestration, and 14E dispatch dependencies).

### 1.3 Relationship to the full modernization program
This document captures the currently analyzed Loan Maintenance slice only. It should be treated as one bounded stream within a broader TrackAll modernization roadmap.

## 2. Current State Architecture

### 2.1 Technology stack
- Frontend: VC++ MFC thick-client dialogs.
- Backend and data: HP NonStop/Tandem COBOL programs and SQL/MP tables.
- Integration transport: TME mnemonic routing over TLS TCP (fgatetcp).
- External dependencies: RataBase rating service; Kentucky ISO advisory program AIP930.
- EDI: outbound 14E dispatch path.

### 2.2 Subdomain position in the full system
Loan Maintenance performs loan retrieval, lifecycle changes, quote-triggered orchestration, and conditional EDI dispatch within the broader insurance administration platform.

### 2.3 Key components analyzed in this run
- UI/dialog handlers: LoanSearchDlg, LoanAddDlg, LoanModifyDlg.
- Domain/rule logic: CLoanRules.
- Integration adapters: CTMELibAdapter, CRataBaseServiceAdapter, CKentuckyISOAdapter, CEDINotificationWriter.
- Tandem programs: TKA900, TKA901, TKA902, TKA920, AIP930.
- Data structures/tables: CLoan model, LSS_LOAN_T, LSS_CYCLE_STEP_T, LSS001T.

## 3. Reverse-Engineering Approach

### 3.1 Governed method
Each source file is analysed against a governance contract that enforces evidence grounding, flags unresolved references, and classifies every extracted rule by confidence. A subject-matter review step then stamps each rule with a review priority before publication, so business reviewers can focus on non-code-grounded or ambiguous items.

### 3.2 Governance model
The outputs are controlled through:
- Rule register with status and review priority.
- Ambiguity log for unresolved items.
- Rerun log for controlled update history.
- Coverage checklist for extraction completeness.

### 3.3 Business validation model
Business validation occurs on generated publication documents; Priority-stamped rules receive focused scrutiny, while Standard rules are expected to be faster to validate.

## 4. Screen and Control Analysis
Summary: 3 dialogs were analyzed with 31 material controls and 5 key user actions mapped across Search, Add, and Modify flows.

| Field | Control type | Business meaning | Constraints | Audit trigger |
|---|---|---|---|---|
| LOAN_NUM | EditText / StaticText | Loan identity key | 10-digit numeric format; immutable in modify | Included in quote/EDI audit payload context |
| BORROWER_NAME | EditText | Borrower identity/search facet | Required in create; optional in search | Included in change events |
| PROPERTY_ADDRESS | EditText | Collateral location for routing/eligibility | Required in create; non-clear in modify (A-001 unresolved server path) | Included in update/notification payloads |
| PROPERTY_STATE | EditText | Quote eligibility dimension | Approved states only for quote; KY triggers ISO pre-call | Included in quote decision trace |
| EDI_FLAG | Data field | Enrollment gate for 14E | Must be Y for dispatch | Suppression path is auditable business outcome |
| CYCLE_TYPE | Derived field | Loan cycle context for EDI path | INSTANT_ISSUE blocks 14E | Included in dispatch suppression rationale |
| QUOTE_REQD | Derived field | Quote trigger indicator from cycle config | Must equal Y to run quote | Included in result-processing status |
| UPB | Numeric input | Financial balance | Positive at create; non-increasing on modify | Included in modify validation context |

## 5. Business Rule Extraction
Rule extraction produced 14 Active rules (12 Standard, 2 Priority) for this slice.

### Loan Search
| Rule ID | Rule Statement | Evidence (file::function) | Grounding | Confidence |
|---|---|---|---|---|
| R-L-001 | CLoanRules::ValidateLoanForSearch returns FALSE when both strLoanNum and strBorrowerName are blank; Tandem TKA900 2000-VALIDATE-INPUT sets WS-STATUS-CODE='9001' for all-blank requests. | sample-project/src/LoanRules.cpp::ValidateLoanForSearch; sample-project/tandem/TKA900.cbl::2000-VALIDATE-INPUT | code-grounded | High |

### Loan Identification
| Rule ID | Rule Statement | Evidence (file::function) | Grounding | Confidence |
|---|---|---|---|---|
| R-L-002 | CLoanRules::ValidateLoanForSearch and CLoanRules::ValidateLoanForAdd enforce length 10 and digits-only (_istdigit loop); TKA901 2000-VALIDATE-ADD rejects non-10-length WS-LOAN-NUM with status 9101. | sample-project/src/LoanRules.cpp::ValidateLoanForSearch; sample-project/src/LoanRules.cpp::ValidateLoanForAdd; sample-project/tandem/TKA901.cbl::2000-VALIDATE-ADD | code-grounded | High |

### Rating Eligibility
| Rule ID | Rule Statement | Evidence (file::function) | Grounding | Confidence |
|---|---|---|---|---|
| R-L-003 | CLoanRules::EnforceCarrierCoverage requires trimmed strPropertyState to be present in m_approvedCarrierStates; otherwise quote request is blocked before CRataBaseServiceAdapter::GetQuote proceeds. | sample-project/src/LoanRules.cpp::EnforceCarrierCoverage; sample-project/src/RataBaseServiceAdapter.cpp::GetQuote | code-grounded | High |

### Rating Orchestration
| Rule ID | Rule Statement | Evidence (file::function) | Grounding | Confidence |
|---|---|---|---|---|
| R-L-004 | In CRataBaseServiceAdapter::GetQuote, when strPropertyState == "KY", CKentuckyISOAdapter::GetInfo must succeed; otherwise quote flow returns FALSE with "Kentucky ISO pre-call failed". TMELibAdapter maps KY_ISO_QUERY to AIP930. | sample-project/src/RataBaseServiceAdapter.cpp::GetQuote; sample-project/src/RataBaseServiceAdapter.cpp::CKentuckyISOAdapter::GetInfo; sample-project/src/TMELibAdapter.cpp::LoadRoutingTable | code-grounded | High |

### Search Result Processing
| Rule ID | Rule Statement | Evidence (file::function) | Grounding | Confidence |
|---|---|---|---|---|
| R-L-005 | CLoanRules::RequiresQuote returns TRUE only when loan.m_strQuoteReqd == "Y"; this flag is populated by TKA900 from LSS_CYCLE_STEP_T.QUOTE_REQD in 4000-QUERY-CYCLE-STEP. | sample-project/src/LoanRules.cpp::RequiresQuote; sample-project/src/LoanSearchDlg.cpp::ProcessLoanResult; sample-project/tandem/TKA900.cbl::4000-QUERY-CYCLE-STEP | code-grounded | High |

### EDI Eligibility
| Rule ID | Rule Statement | Evidence (file::function) | Grounding | Confidence |
|---|---|---|---|---|
| R-L-006 | CLoanRules::EnforceEdiEligibility rejects when loan.m_strEdiFlag != "Y"; CEDINotificationWriter::Write14ERecord exits FALSE on failed eligibility and does not dispatch 14E_NOTIFY. | sample-project/src/LoanRules.cpp::EnforceEdiEligibility; sample-project/src/EDINotificationWriter.cpp::Write14ERecord | code-grounded | High |
| R-L-007 | CLoanRules::EnforceEdiEligibility blocks when loan.m_strCycleType == "INSTANT_ISSUE"; CYCLE_TYPE is sourced from LSS_CYCLE_STEP_T by TKA900 query. | sample-project/src/LoanRules.cpp::EnforceEdiEligibility; sample-project/tandem/TKA900.cbl::4000-QUERY-CYCLE-STEP | code-grounded | High |

### EDI Routing
| Rule ID | Rule Statement | Evidence (file::function) | Grounding | Confidence |
|---|---|---|---|---|
| R-L-008 | CLoanRules::LoadLenderTargetForms seeds valid forms (LT-F100, LT-F200, LT-F300, LT-F400); EnforceEdiEligibility rejects if strFormId is not in this list. | sample-project/src/LoanRules.cpp::LoadLenderTargetForms; sample-project/src/LoanRules.cpp::EnforceEdiEligibility | sample-only | Medium |

### Loan Onboarding
| Rule ID | Rule Statement | Evidence (file::function) | Grounding | Confidence |
|---|---|---|---|---|
| R-L-009 | CLoanRules::ValidateLoanForAdd returns FALSE when trimmed m_strLoanNum or m_strBorrowerName is empty; TKA901 validation rejects blank borrower (9102). | sample-project/src/LoanRules.cpp::ValidateLoanForAdd; sample-project/src/LoanAddDlg.cpp::OnBnClickedAdd; sample-project/tandem/TKA901.cbl::2000-VALIDATE-ADD | code-grounded | High |
| R-L-010 | CLoanRules::ValidateLoanForAdd rejects m_nPropertyValue <= 0; TKA901 2000-VALIDATE-ADD sets status 9103 when WS-PROPERTY-VALUE = ZERO. | sample-project/src/LoanRules.cpp::ValidateLoanForAdd; sample-project/tandem/TKA901.cbl::2000-VALIDATE-ADD | code-grounded | High |
| R-L-011 | CLoanRules::ValidateLoanForAdd trims and rejects blank m_strPropertyAddress; TKA901 sets 9104 when WS-PROPERTY-ADDRESS = SPACES. | sample-project/src/LoanRules.cpp::ValidateLoanForAdd; sample-project/tandem/TKA901.cbl::2000-VALIDATE-ADD | code-grounded | High |

### Loan Lifecycle Initialization
| Rule ID | Rule Statement | Evidence (file::function) | Grounding | Confidence |
|---|---|---|---|---|
| R-L-012 | CLoanRules::ValidateLoanForAdd requires m_strLoanStatus == "ACTIVE" and m_nUnpaidPrincipalBalance > 0; TKA901 enforces status (9105) and UPB (9106) in 2000-VALIDATE-ADD. | sample-project/src/LoanRules.cpp::ValidateLoanForAdd; sample-project/tandem/TKA901.cbl::2000-VALIDATE-ADD | code-grounded | High |

### Classification
| Rule ID | Rule Statement | Evidence (file::function) | Grounding | Confidence |
|---|---|---|---|---|
| R-L-013 | CLoanRules::IsValidPropertyType allows only RESIDENTIAL or COMMERCIAL; ValidateLoanForAdd rejects blank/invalid type; TKA901 2000-VALIDATE-ADD enforces same two allowed literals (9107). | sample-project/src/LoanRules.cpp::IsValidPropertyType; sample-project/src/LoanRules.cpp::ValidateLoanForAdd; sample-project/tandem/TKA901.cbl::2000-VALIDATE-ADD | code-grounded | High |

### Loan Modification Governance
| Rule ID | Rule Statement | Evidence (file::function) | Grounding | Confidence |
|---|---|---|---|---|
| R-L-014 | CLoanRules::ValidateLoanForModify enforces immutable LOAN_NUM, allows status changes only ACTIVE->DELINQUENT or DELINQUENT->CLOSED, rejects UPB increase, and rejects clearing property address. TKA902 mirrors status and UPB checks (9203, 9204) before UPDATE LSS_LOAN_T. | sample-project/src/LoanRules.cpp::ValidateLoanForModify; sample-project/src/LoanRules.cpp::IsLoanStatusTransitionValid; sample-project/tandem/TKA902.cbl::3000-VALIDATE-MODIFY | unresolved | Medium |

## 6. Dependency and Flow Analysis
| Action | Handler | Service / Rule Module | Repository / Data access | Gateway / External |
|---|---|---|---|---|
| Search loans | LoanSearchDlg::OnBnClickedSearch | CLoanRules::ValidateLoanForSearch | TKA900 query to LSS_LOAN_T and LSS_CYCLE_STEP_T | CTMELibAdapter::SendMessage(LOAN_SEARCH) |
| Process quote | LoanSearchDlg::ProcessLoanResult | CLoanRules::RequiresQuote; CRataBaseServiceAdapter::GetQuote | Quote result handling in adapter | RataBase + KY_ISO_QUERY/AIP930 branch |
| Dispatch 14E | LoanSearchDlg::ProcessLoanResult | CEDINotificationWriter::Write14ERecord; CLoanRules::EnforceEdiEligibility | Dispatch payload formatting | CTMELibAdapter::SendMessage(14E_NOTIFY) |
| Add loan | LoanAddDlg::OnBnClickedAdd | CLoanRules::ValidateLoanForAdd | TKA901 insert into LSS_LOAN_T | CTMELibAdapter::SendMessage(ADD_LOAN) |
| Modify loan | LoanModifyDlg::OnBnClickedModify | CLoanRules::ValidateLoanForModify | TKA902 update of LSS_LOAN_T | CTMELibAdapter::SendMessage(MODIFY_LOAN) |

## 7. Candidate API Estimation
| Action | Candidate REST API | HTTP method | Service group | Confidence | Grounding |
|---|---|---|---|---|---|
| Search loans | /api/loans/search | GET | Loan Query Service | High | code-grounded |
| Process selected result | /api/loans/{loanNumber}/process-result | POST | Loan Orchestration Service | Medium | inferred |
| Retrieve quote | /api/quotes/loan/{loanNumber} | POST | Quote Orchestration Service | High | code-grounded |
| Dispatch 14E | /api/edi/notifications/14e | POST | EDI Notification Service | High | code-grounded |
| Add loan | /api/loans | POST | Loan Command Service | High | code-grounded |
| Modify loan | /api/loans/{loanNumber} | PUT | Loan Command Service | High | code-grounded |

Note: API shapes are candidate estimations; unless explicitly present in source contracts, endpoint contracts remain inferred.

## 8. Candidate Service Decomposition
| Candidate Service | Scope | Supporting Legacy Components | Modernization Alignment |
|---|---|---|---|
| Loan Query Service | Search and read-model return | LoanSearchDlg, TKA900, LoanRules search validator | .NET Core REST query API |
| Loan Command Service | Create and update loan records | LoanAddDlg, LoanModifyDlg, TKA901, TKA902, LoanRules command validators | .NET Core REST command API |
| Quote Orchestration Service | Quote requirement and rating orchestration | RequiresQuote, RataBaseServiceAdapter, KentuckyISOAdapter | .NET Core orchestration endpoint with external adapters |
| EDI Notification Service | Eligibility + 14E dispatch orchestration | EnforceEdiEligibility, EDINotificationWriter, TKA920 route | .NET Core integration service |
| Tandem Routing Gateway | Shared mnemonic routing | TMELibAdapter, LSS001T mapping | Infrastructure adapter boundary |

## 9. Target State Mapping
| Legacy Component | Target Component |
|---|---|
| LoanSearchDlg / LoanAddDlg / LoanModifyDlg | Angular UI components |
| CLoanRules | Domain/application validation modules in API layer |
| TKA900 | Loan Query API + persistence access in Azure SQL |
| TKA901 / TKA902 | Loan Command API + persistence access in Azure SQL |
| CRataBaseServiceAdapter + CKentuckyISOAdapter | Quote orchestration and external integration adapters in .NET Core |
| CEDINotificationWriter + 14E route | EDI notification service in .NET Core |

## 10. Data and Integration Considerations
- Core migration entities: loan identity, borrower fields, address, state, status, UPB, property value, cycle flags, EDI flags.
- Key legacy constraints to preserve: LOAN_NUM format, UPB and property value positivity constraints, status transition guards, property type enum.
- Integration touchpoints: TME mnemonic routing table (LSS001T), RataBase quote service, KY ISO branch, 14E notification dispatch path.

## 11. Governance Summary
- Active rules: 14.
- Review Priority distribution: 2 Priority (R-L-008, R-L-014), 12 Standard.
- Open ambiguities: A-001, A-002.
- Rerun log entries: none recorded yet.
- Coverage checklist: all reported categories checked complete for in-scope slice.

## 12. Risks and Assumptions
- Risk: R-L-014 includes unresolved server-side behavior for address-clear rejection path (A-001).
- Risk: R-L-008 uses sample-seeded lender form IDs without table-backed evidence in current artifacts (A-002).
- Assumption: Candidate REST boundaries remain estimations pending modernization architecture decisions.

## 13. Appendix
- Grounding labels: code-grounded, sample-only, inferred, unresolved, placeholder.
- Source file index:
  - sample-project/src/LoanSearchDlg.cpp
  - sample-project/src/LoanAddDlg.cpp
  - sample-project/src/LoanModifyDlg.cpp
  - sample-project/src/LoanRules.cpp
  - sample-project/src/RataBaseServiceAdapter.cpp
  - sample-project/src/EDINotificationWriter.cpp
  - sample-project/src/TMELibAdapter.cpp
  - sample-project/tandem/TKA900.cbl
  - sample-project/tandem/TKA901.cbl
  - sample-project/tandem/TKA902.cbl
  - sample-project/tandem/LSS_SCHEMA.sql
