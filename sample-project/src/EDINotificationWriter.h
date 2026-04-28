#pragma once

#include "Loan.h"
#include "LoanRules.h"
#include "TMELibAdapter.h"

// CEDINotificationWriter — writes outbound 14E EDI notification records by
// dispatching to Tandem program TKA920 via the TME 14E_NOTIFY mnemonic.
//
// Before any dispatch, CLoanRules::EnforceEdiEligibility is called to
// evaluate the three business rules that gate 14E output:
//   1. EDI_FLAG = 'Y' on LSS_LOAN_T   (client enrolled in EDI)
//   2. CYCLE_TYPE != 'INSTANT_ISSUE'  (Instant Issue uses separate path)
//   3. formId registered in lender_target (valid routing target exists)
//
// Both LSS_LOAN_T.EDI_FLAG and LSS_CYCLE_STEP_T.CYCLE_TYPE are returned by
// COBOL program TKA900 in the LOAN_SEARCH response — the Tandem data drives
// every eligibility decision made here.
//
// Format: Black Knight servicers (FCI_CODE prefix "BK") use fixed-width BK
// layout v2.3. All others use SSP delimited format v4.

class CEDINotificationWriter
{
public:
    CEDINotificationWriter(CLoanRules* pLoanRules, CTMELibAdapter* pTmeAdapter);

    // Evaluate EDI eligibility and, if eligible, dispatch the 14E record to
    // TKA920 via CTMELibAdapter::SendMessage("14E_NOTIFY").
    // Returns FALSE (with strErrorMessage set) if any eligibility rule fails
    // or the TME dispatch fails. A FALSE result for a suppressed loan (e.g.
    // INSTANT_ISSUE) is expected and should not be treated as an error.
    BOOL Write14ERecord(
        const CLoan& loan,
        const CString& strEventCode,
        const CString& strFormId,
        CString& strErrorMessage) const;

private:
    CLoanRules*     m_pLoanRules;
    CTMELibAdapter* m_pTmeAdapter;
};
