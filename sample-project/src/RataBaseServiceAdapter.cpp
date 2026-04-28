#include "RataBaseServiceAdapter.h"

// ---------------------------------------------------------------------------
// CKentuckyISOAdapter
// ---------------------------------------------------------------------------

CKentuckyISOAdapter::CKentuckyISOAdapter()
{
}

BOOL CKentuckyISOAdapter::GetInfo(
    const CString& strPropertyState,
    CString& strIsoData,
    CString& strErrorMessage) const
{
    // In production, this call dispatches to Tandem program AIP930 via the
    // TME gateway using mnemonic KY_ISO_QUERY. AIP930 queries the ISO
    // advisory database and returns fire-protection class, construction type
    // codes, and territory modifiers that RataBase requires before producing
    // a Kentucky quote. The fgatetcp call routes to AIP930 on the Tandem
    // node; the response is deserialised into strIsoData by the TME client.

    if (strPropertyState.CompareNoCase(_T("KY")) != 0)
    {
        strErrorMessage = _T("KentuckyISOAdapter called for a non-KY state.");
        return FALSE;
    }

    strIsoData = _T("ISO-DATA|STATE=KY|FIRE_CLASS=3|CONSTRUCTION=FRAME|TERRITORY=KY-CENTRAL|AIP930=OK");

    return TRUE;
}


// ---------------------------------------------------------------------------
// CRataBaseServiceAdapter
// ---------------------------------------------------------------------------

CRataBaseServiceAdapter::CRataBaseServiceAdapter(CLoanRules* pLoanRules)
    : m_pLoanRules(pLoanRules)
    , m_pKyIsoAdapter(NULL)
{
    m_pKyIsoAdapter = new CKentuckyISOAdapter();
}

BOOL CRataBaseServiceAdapter::GetQuote(
    const CString& strPropertyState,
    const CString& strCoverageType,
    int nPropertyValue,
    CString& strQuoteResult,
    CString& strErrorMessage) const
{
    if (m_pLoanRules == NULL)
    {
        strErrorMessage = _T("Loan rules are not available.");
        return FALSE;
    }

    if (nPropertyValue <= 0)
    {
        strErrorMessage = _T("Property value must be greater than zero for RataBase rating.");
        return FALSE;
    }

    // Enforce carrier state eligibility via CLoanRules.
    // States not in the approved list are blocked before reaching RataBase.
    if (!m_pLoanRules->EnforceCarrierCoverage(strPropertyState, strErrorMessage))
    {
        return FALSE;
    }

    // Kentucky requires an ISO advisory lookup before rating.
    // ISO pre-call invokes Tandem program AIP930 via CKentuckyISOAdapter.
    // RataBase requires the ISO context block (fire class, territory, construction
    // type) as part of the rating request payload for KY submissions.
    if (strPropertyState.CompareNoCase(_T("KY")) == 0)
    {
        CString strIsoData;
        CString strIsoError;

        BOOL bIsoOk = m_pKyIsoAdapter->GetInfo(strPropertyState, strIsoData, strIsoError);

        if (!bIsoOk)
        {
            strErrorMessage.Format(
                _T("Kentucky ISO pre-call failed: %s"),
                strIsoError.GetString());
            return FALSE;
        }

        // ISO data is appended to the rating request payload for KY submissions.
        // RataBase will reject KY quotes submitted without the ISO context block.
    }

    // In production, the rating request is submitted to the RataBase web service
    // endpoint over HTTPS. The response contains an annual premium estimate and
    // a quote reference number. This simulation calculates a representative
    // premium so the full loan → quote flow can be traced end to end.

    double dblRate = 0.0045;    // base rate per dollar of property value

    if (strPropertyState.CompareNoCase(_T("FL")) == 0 || strPropertyState.CompareNoCase(_T("TX")) == 0)
    {
        // Coastal and storm-exposure states carry a loading factor.
        // FL and TX have elevated risk profiles in the carrier rate tables.
        dblRate = 0.0062;
    }

    double dblAnnualPremium = static_cast<double>(nPropertyValue) * dblRate;

    strQuoteResult.Format(
        _T("RATABASE-QUOTE|STATE=%s|COVERAGE=%s|VALUE=%d|ANNUAL_PREMIUM=%.2f|REF=RB-%s-QUOTE"),
        strPropertyState.GetString(),
        strCoverageType.GetString(),
        nPropertyValue,
        dblAnnualPremium,
        strPropertyState.GetString());

    return TRUE;
}
