#pragma once

#include "Loan.h"
#include <vector>

// CLoanRules — enforces all business rules for the Loan Search and Premium
// Quote workflow. Follows the same pattern as CClientRules: business logic
// is centralised here so the rule-extractor agent scans a single file and
// produces a complete, traceable rule card set.
//
// Rule origins across integration layers:
//   UI layer        — input format rules derived from Tandem schema constraints
//   Service layer   — carrier eligibility and EDI enrolment configuration rules
//   Tandem layer    — flags driven by LSS_LOAN_T and LSS_CYCLE_STEP_T columns
//                     returned by COBOL program TKA900 via the TME LOAN_SEARCH call

class CLoanRules
{
public:
    CLoanRules();

    // Input validation — enforced before the TME LOAN_SEARCH call is dispatched.
    // Rules mirror the CHAR(10) column constraint on LSS_LOAN_T.LOAN_NUM and
    // the 2000-VALIDATE-INPUT check in Tandem program TKA900, which rejects
    // any request with blank LOAN_NUM and BORROWER_NAME fields.
    BOOL ValidateLoanForSearch(
        const CString& strLoanNum,
        const CString& strBorrowerName,
        CString& strErrorMessage);

    // Carrier eligibility — enforced before a RataBase quote request is submitted.
    // States not in the approved list cannot be rated via RataBase and must be
    // handled through the manual underwriting quoting process.
    BOOL EnforceCarrierCoverage(
        const CString& strPropertyState,
        CString& strErrorMessage) const;

    // 14E EDI eligibility — enforced before Write14ERecord dispatches to TKA920.
    // All three conditions must pass:
    //   1. EDI_FLAG = 'Y' on LSS_LOAN_T — returned by TKA900 in LOAN_SEARCH response
    //   2. CYCLE_TYPE != 'INSTANT_ISSUE' on LSS_CYCLE_STEP_T — returned by TKA900
    //   3. formId must be registered in the lender_target table
    BOOL EnforceEdiEligibility(
        const CLoan& loan,
        const CString& strFormId,
        CString& strErrorMessage) const;

    // Returns TRUE when QUOTE_REQD = 'Y' on LSS_CYCLE_STEP_T.
    // This flag is read by TKA900 from the Tandem backend and returned in the
    // LOAN_SEARCH response. When true, the client must invoke RataBase to
    // obtain a premium estimate before displaying the loan record.
    BOOL RequiresQuote(const CLoan& loan) const;

    // Audit trail — builds loan event audit messages before 14E dispatch.
    // Mirrors BuildAuditMessages in CClientRules: every placement or status
    // change that affects billing or coverage must produce a traceable entry.
    std::vector<CString> BuildLoanAuditMessages(
        const CLoan& loan,
        const CString& strEventCode) const;

    // Add Loan validation — enforced before the TME ADD_LOAN call is dispatched.
    // All required fields must be present and valid before a new loan record
    // is inserted into LSS_LOAN_T via Tandem program TKA901.
    BOOL ValidateLoanForAdd(
        const CLoan& loan,
        CString& strErrorMessage);

    // Modify Loan validation — enforced before the TME MODIFY_LOAN call is dispatched.
    // Compares the original loan record against the proposed modifications to
    // enforce immutability rules and valid state transitions before TKA902 update.
    BOOL ValidateLoanForModify(
        const CLoan& loanOrig,
        const CLoan& loanMod,
        CString& strErrorMessage) const;

private:
    BOOL IsStateInApprovedCarrierList(const CString& strState) const;
    BOOL IsFormIdInLenderTarget(const CString& strFormId) const;
    BOOL IsLoanStatusTransitionValid(const CString& strFrom, const CString& strTo) const;
    BOOL IsValidPropertyType(const CString& strPropertyType) const;
    void LoadApprovedCarrierStates();
    void LoadLenderTargetForms();

    // Approved states for RataBase carrier coverage.
    // In production, loaded from the carrier eligibility table at startup.
    std::vector<CString> m_approvedCarrierStates;

    // Valid form IDs from the lender_target table.
    // In production, loaded from the lender_target DB table at startup.
    std::vector<CString> m_lenderTargetForms;
};
