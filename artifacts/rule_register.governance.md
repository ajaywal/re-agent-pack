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
**Review Priority:** Standard

---
-->

## R-L-001 — Search Requires At Least One Criterion
| Field | Value |
|---|---|
| Screen | Loan Search |
| Action | Click Search |
| Plain-English | Users must enter at least one search value before running a loan search. |
| Rule statement | `CLoanRules::ValidateLoanForSearch` returns `FALSE` when both `strLoanNum` and `strBorrowerName` are blank; Tandem `TKA900` `2000-VALIDATE-INPUT` sets `WS-STATUS-CODE='9001'` for all-blank requests. |
| Rule type | Validation |
| Functional Area | Loan Search |
| Evidence | `sample-project/src/LoanRules.cpp::ValidateLoanForSearch`; `sample-project/tandem/TKA900.cbl::2000-VALIDATE-INPUT` |
| Grounding | code-grounded |
| Confidence | High |
| Notes | Prevents unrestricted query execution against `LSS_LOAN_T`. |

**Status:** Active
**Review Priority:** Standard

---

## R-L-002 — Loan Number Must Be Ten Digits
| Field | Value |
|---|---|
| Screen | Loan Search; Add Loan |
| Action | Submit Search or Add |
| Plain-English | When loan number is provided, it must be exactly 10 numeric digits. |
| Rule statement | `CLoanRules::ValidateLoanForSearch` and `CLoanRules::ValidateLoanForAdd` enforce length `10` and digits-only (`_istdigit` loop); `TKA901` `2000-VALIDATE-ADD` rejects non-10-length `WS-LOAN-NUM` with status `9101`. |
| Rule type | Validation |
| Functional Area | Loan Identification |
| Evidence | `sample-project/src/LoanRules.cpp::ValidateLoanForSearch`; `sample-project/src/LoanRules.cpp::ValidateLoanForAdd`; `sample-project/tandem/TKA901.cbl::2000-VALIDATE-ADD`; `sample-project/tandem/LSS_SCHEMA.sql` (`LSS_LOAN_T.LOAN_NUM CHAR(10)`) |
| Grounding | code-grounded |
| Confidence | High |
| Notes | Shared key-format rule across search and create paths. |

**Status:** Active
**Review Priority:** Standard

---

## R-L-003 — Quote Eligibility Requires Approved Property State
| Field | Value |
|---|---|
| Screen | Loan Search |
| Action | Process search result requiring quote |
| Plain-English | A quote can only be requested for properties in approved states. |
| Rule statement | `CLoanRules::EnforceCarrierCoverage` requires trimmed `strPropertyState` to be present in `m_approvedCarrierStates`; otherwise quote request is blocked before `CRataBaseServiceAdapter::GetQuote` proceeds. |
| Rule type | Validation |
| Functional Area | Rating Eligibility |
| Evidence | `sample-project/src/LoanRules.cpp::LoadApprovedCarrierStates`; `sample-project/src/LoanRules.cpp::EnforceCarrierCoverage`; `sample-project/src/RataBaseServiceAdapter.cpp::GetQuote` |
| Grounding | code-grounded |
| Confidence | High |
| Notes | Non-approved states are routed to manual underwriting process per error message. |

**Status:** Active
**Review Priority:** Standard

---

## R-L-004 — Kentucky Quotes Require ISO Pre-Call
| Field | Value |
|---|---|
| Screen | Loan Search |
| Action | Generate quote for KY property |
| Plain-English | Kentucky loans require an ISO advisory lookup before quote generation. |
| Rule statement | In `CRataBaseServiceAdapter::GetQuote`, when `strPropertyState == "KY"`, `CKentuckyISOAdapter::GetInfo` must succeed; otherwise quote flow returns `FALSE` with `Kentucky ISO pre-call failed`. `TMELibAdapter` maps `KY_ISO_QUERY` to `AIP930`. |
| Rule type | Integration/gateway |
| Functional Area | Rating Orchestration |
| Evidence | `sample-project/src/RataBaseServiceAdapter.cpp::GetQuote`; `sample-project/src/RataBaseServiceAdapter.cpp::CKentuckyISOAdapter::GetInfo`; `sample-project/src/TMELibAdapter.cpp::LoadRoutingTable`; `sample-project/tandem/LSS_SCHEMA.sql` (`LSS001T` seed) |
| Grounding | code-grounded |
| Confidence | High |
| Notes | Applies only to KY branch; other states skip ISO call. |

**Status:** Active
**Review Priority:** Standard

---

## R-L-005 — Quote Request Is Triggered By QUOTE_REQD Flag
| Field | Value |
|---|---|
| Screen | Loan Search |
| Action | Open/process loan result |
| Plain-English | Quote generation is required only when the cycle configuration indicates quote required. |
| Rule statement | `CLoanRules::RequiresQuote` returns `TRUE` only when `loan.m_strQuoteReqd == "Y"`; this flag is populated by `TKA900` from `LSS_CYCLE_STEP_T.QUOTE_REQD` in `4000-QUERY-CYCLE-STEP`. |
| Rule type | State/routing |
| Functional Area | Search Result Processing |
| Evidence | `sample-project/src/LoanRules.cpp::RequiresQuote`; `sample-project/src/LoanSearchDlg.cpp::ProcessLoanResult`; `sample-project/tandem/TKA900.cbl::4000-QUERY-CYCLE-STEP`; `sample-project/tandem/LSS_SCHEMA.sql` (`LSS_CYCLE_STEP_T.QUOTE_REQD`) |
| Grounding | code-grounded |
| Confidence | High |
| Notes | When flag is not `Y`, UI shows no-quote message and continues flow. |

**Status:** Active
**Review Priority:** Standard

---

## R-L-006 — 14E Notification Requires EDI Enrollment
| Field | Value |
|---|---|
| Screen | Loan Search |
| Action | Trigger 14E notification |
| Plain-English | 14E notifications can only be sent for loans marked as EDI-enrolled. |
| Rule statement | `CLoanRules::EnforceEdiEligibility` rejects when `loan.m_strEdiFlag != "Y"`; `CEDINotificationWriter::Write14ERecord` exits `FALSE` on failed eligibility and does not dispatch `14E_NOTIFY`. |
| Rule type | Validation |
| Functional Area | EDI Eligibility |
| Evidence | `sample-project/src/LoanRules.cpp::EnforceEdiEligibility`; `sample-project/src/EDINotificationWriter.cpp::Write14ERecord`; `sample-project/tandem/LSS_SCHEMA.sql` (`LSS_LOAN_T.EDI_FLAG`) |
| Grounding | code-grounded |
| Confidence | High |
| Notes | Eligibility failure is treated as governed suppression path, not transport failure. |

**Status:** Active
**Review Priority:** Standard

---

## R-L-007 — Instant Issue Cycle Suppresses 14E Notification
| Field | Value |
|---|---|
| Screen | Loan Search |
| Action | Trigger 14E notification |
| Plain-English | Loans in Instant Issue cycle do not generate 14E output. |
| Rule statement | `CLoanRules::EnforceEdiEligibility` blocks when `loan.m_strCycleType == "INSTANT_ISSUE"`; `CYCLE_TYPE` is sourced from `LSS_CYCLE_STEP_T` by `TKA900` query. |
| Rule type | State/routing |
| Functional Area | EDI Eligibility |
| Evidence | `sample-project/src/LoanRules.cpp::EnforceEdiEligibility`; `sample-project/tandem/TKA900.cbl::4000-QUERY-CYCLE-STEP`; `sample-project/tandem/LSS_SCHEMA.sql` (`LSS_CYCLE_STEP_T.CYCLE_TYPE`) |
| Grounding | code-grounded |
| Confidence | High |
| Notes | Prevents duplicate notifications for certificate-issuance path. |

**Status:** Active
**Review Priority:** Standard

---

## R-L-008 — 14E Notification Requires Registered Form ID
| Field | Value |
|---|---|
| Screen | Loan Search |
| Action | Trigger 14E notification |
| Plain-English | Only pre-registered lender form IDs are allowed for 14E dispatch. |
| Rule statement | `CLoanRules::LoadLenderTargetForms` seeds valid forms (`LT-F100`, `LT-F200`, `LT-F300`, `LT-F400`); `EnforceEdiEligibility` rejects if `strFormId` is not in this list. |
| Rule type | Validation |
| Functional Area | EDI Routing |
| Evidence | `sample-project/src/LoanRules.cpp::LoadLenderTargetForms`; `sample-project/src/LoanRules.cpp::EnforceEdiEligibility` |
| Grounding | sample-only |
| Confidence | Medium |
| Notes | `lender_target` runtime source is represented by in-memory seed list in sample code; table-backed production loading is not evidenced in this repo. See ambiguity `A-002`. |

**Status:** Active
**Review Priority:** Priority

---

## R-L-009 — Add Loan Requires Core Identity Fields
| Field | Value |
|---|---|
| Screen | Add Loan |
| Action | Click Add Loan |
| Plain-English | A loan cannot be created unless loan number and borrower name are provided. |
| Rule statement | `CLoanRules::ValidateLoanForAdd` returns `FALSE` when trimmed `m_strLoanNum` or `m_strBorrowerName` is empty; `TKA901` validation rejects blank borrower (`9102`). |
| Rule type | Validation |
| Functional Area | Loan Onboarding |
| Evidence | `sample-project/src/LoanRules.cpp::ValidateLoanForAdd`; `sample-project/src/LoanAddDlg.cpp::OnBnClickedAdd`; `sample-project/tandem/TKA901.cbl::2000-VALIDATE-ADD` |
| Grounding | code-grounded |
| Confidence | High |
| Notes | Client and server both enforce identity requirement. |

**Status:** Active
**Review Priority:** Standard

---

## R-L-010 — Add Loan Requires Positive Property Value
| Field | Value |
|---|---|
| Screen | Add Loan |
| Action | Click Add Loan |
| Plain-English | New loans must have a property value greater than zero. |
| Rule statement | `CLoanRules::ValidateLoanForAdd` rejects `m_nPropertyValue <= 0`; `TKA901` `2000-VALIDATE-ADD` sets status `9103` when `WS-PROPERTY-VALUE = ZERO`. |
| Rule type | Validation |
| Functional Area | Loan Onboarding |
| Evidence | `sample-project/src/LoanRules.cpp::ValidateLoanForAdd`; `sample-project/tandem/TKA901.cbl::2000-VALIDATE-ADD` |
| Grounding | code-grounded |
| Confidence | High |
| Notes | `LSS_LOAN_T.PROPERTY_VALUE` has default `0`, so validation prevents invalid default persistence. |

**Status:** Active
**Review Priority:** Standard

---

## R-L-011 — Add Loan Requires Property Address
| Field | Value |
|---|---|
| Screen | Add Loan |
| Action | Click Add Loan |
| Plain-English | Property address is mandatory when creating a loan. |
| Rule statement | `CLoanRules::ValidateLoanForAdd` trims and rejects blank `m_strPropertyAddress`; `TKA901` sets `9104` when `WS-PROPERTY-ADDRESS = SPACES`. |
| Rule type | Validation |
| Functional Area | Loan Onboarding |
| Evidence | `sample-project/src/LoanRules.cpp::ValidateLoanForAdd`; `sample-project/tandem/TKA901.cbl::2000-VALIDATE-ADD` |
| Grounding | code-grounded |
| Confidence | High |
| Notes | Supports downstream carrier and notice routing. |

**Status:** Active
**Review Priority:** Standard

---

## R-L-012 — New Loans Must Start Active With Positive UPB
| Field | Value |
|---|---|
| Screen | Add Loan |
| Action | Click Add Loan |
| Plain-English | New loans must start in Active status and include a positive unpaid principal balance. |
| Rule statement | `CLoanRules::ValidateLoanForAdd` requires `m_strLoanStatus == "ACTIVE"` and `m_nUnpaidPrincipalBalance > 0`; `TKA901` enforces status (`9105`) and UPB (`9106`) in `2000-VALIDATE-ADD`. |
| Rule type | State/routing |
| Functional Area | Loan Lifecycle Initialization |
| Evidence | `sample-project/src/LoanRules.cpp::ValidateLoanForAdd`; `sample-project/tandem/TKA901.cbl::2000-VALIDATE-ADD`; `sample-project/tandem/LSS_SCHEMA.sql` (`LSS_LOAN_T.LOAN_STATUS`, `LSS_LOAN_T.UPB`) |
| Grounding | code-grounded |
| Confidence | High |
| Notes | Prevents direct creation into terminal or delinquent lifecycle states. |

**Status:** Active
**Review Priority:** Standard

---

## R-L-013 — Property Type Is Restricted To Two Values
| Field | Value |
|---|---|
| Screen | Add Loan |
| Action | Click Add Loan |
| Plain-English | Property type must be Residential or Commercial when creating a loan. |
| Rule statement | `CLoanRules::IsValidPropertyType` allows only `RESIDENTIAL` or `COMMERCIAL`; `ValidateLoanForAdd` rejects blank/invalid type; `TKA901` `2000-VALIDATE-ADD` enforces same two allowed literals (`9107`). |
| Rule type | Validation |
| Functional Area | Classification |
| Evidence | `sample-project/src/LoanRules.cpp::IsValidPropertyType`; `sample-project/src/LoanRules.cpp::ValidateLoanForAdd`; `sample-project/tandem/TKA901.cbl::2000-VALIDATE-ADD` |
| Grounding | code-grounded |
| Confidence | High |
| Notes | Keeps downstream rating path deterministic by supported property classes. |

**Status:** Active
**Review Priority:** Standard

---

## R-L-014 — Modify Flow Enforces Immutable Key And Controlled Updates
| Field | Value |
|---|---|
| Screen | Modify Loan |
| Action | Click Save Changes |
| Plain-English | Existing loans can be modified only through approved status progression, non-increasing balance, and non-blank address while keeping loan number unchanged. |
| Rule statement | `CLoanRules::ValidateLoanForModify` enforces immutable `LOAN_NUM`, allows status changes only `ACTIVE->DELINQUENT` or `DELINQUENT->CLOSED`, rejects UPB increase, and rejects clearing property address. `TKA902` mirrors status and UPB checks (`9203`, `9204`) before `UPDATE LSS_LOAN_T`. |
| Rule type | State/routing |
| Functional Area | Loan Modification Governance |
| Evidence | `sample-project/src/LoanRules.cpp::ValidateLoanForModify`; `sample-project/src/LoanRules.cpp::IsLoanStatusTransitionValid`; `sample-project/tandem/TKA902.cbl::3000-VALIDATE-MODIFY`; `sample-project/tandem/TKA902.cbl::4000-UPDATE-LOAN` |
| Grounding | unresolved |
| Confidence | Medium |
| Notes | Client-side rule is code-grounded, but server-side address-clear enforcement in `TKA902` appears incomplete; see ambiguity `A-001`. |

**Status:** Active
**Review Priority:** Priority

---
