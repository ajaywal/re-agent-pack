#include "EDINotificationWriter.h"

CEDINotificationWriter::CEDINotificationWriter(CLoanRules* pLoanRules, CTMELibAdapter* pTmeAdapter)
    : m_pLoanRules(pLoanRules)
    , m_pTmeAdapter(pTmeAdapter)
{
}

BOOL CEDINotificationWriter::Write14ERecord(
    const CLoan& loan,
    const CString& strEventCode,
    const CString& strFormId,
    CString& strErrorMessage) const
{
    if (m_pLoanRules == NULL || m_pTmeAdapter == NULL)
    {
        strErrorMessage = _T("EDI writer is not properly initialised.");
        return FALSE;
    }

    // Enforce all three 14E EDI eligibility rules via CLoanRules.
    // Rules are driven by Tandem data returned by TKA900 in the LOAN_SEARCH response:
    //   EDI_FLAG from LSS_LOAN_T, CYCLE_TYPE from LSS_CYCLE_STEP_T.
    // A FALSE result here is a rule-governed suppression, not a system failure.
    if (!m_pLoanRules->EnforceEdiEligibility(loan, strFormId, strErrorMessage))
    {
        return FALSE;
    }

    // Build audit messages for this loan event before dispatch.
    std::vector<CString> auditMessages =
        m_pLoanRules->BuildLoanAuditMessages(loan, strEventCode);

    // Format selection: Black Knight servicers receive fixed-width 14E layout
    // (BK layout v2.3). SSP servicers receive delimited format (SSP-EDI spec rev 4).
    // The servicer type is determined by the FCI_CODE prefix on the loan record.
    // FCI_CODE is stored in LSS_LOAN_T and returned by TKA900.
    CString strFciPrefix = loan.m_strFciCode.Left(2);
    CString strFormat;

    if (strFciPrefix.CompareNoCase(_T("BK")) == 0)
    {
        strFormat = _T("BK-FIXED-WIDTH-v2.3");
    }
    else
    {
        strFormat = _T("SSP-DELIMITED-v4");
    }

    // Dispatch the 14E notification to Tandem program TKA920 via the TME framework.
    // The 14E_NOTIFY mnemonic is routed to TKA920 per the LSS001T routing table
    // (same table used for LOAN_SEARCH → TKA900). TKA920 writes the formatted
    // 14E record to the outbound EDI spool on the Tandem guardian volume for
    // pickup by the EDI transmission scheduler.
    CString strRequestData;
    strRequestData.Format(
        _T("LOAN=%s|CLIENT=%s|EVENT=%s|FORM=%s|FORMAT=%s|STATE=%s|AUDIT_COUNT=%d"),
        loan.m_strLoanNum.GetString(),
        loan.m_strClientId.GetString(),
        strEventCode.GetString(),
        strFormId.GetString(),
        strFormat.GetString(),
        loan.m_strPropertyState.GetString(),
        static_cast<int>(auditMessages.size()));

    CString strResponseData;

    BOOL bOk = m_pTmeAdapter->SendMessage(
        _T("14E_NOTIFY"),
        strRequestData,
        strResponseData,
        strErrorMessage);

    return bOk;
}
