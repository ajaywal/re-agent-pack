#pragma once

#include <afx.h>
#include "LoanRules.h"

// CKentuckyISOAdapter — wraps the ISO advisory pre-call required for all
// Kentucky properties before a RataBase quote can be issued.
// In production, this call invokes Tandem program AIP930 via the TME gateway
// using mnemonic KY_ISO_QUERY (registered separately from the standard
// LSS001T routing table for ISO-enabled clients).
// AIP930 returns fire-protection class, construction type, and territory
// modifiers that RataBase requires as input context for KY rating.

class CKentuckyISOAdapter
{
public:
    CKentuckyISOAdapter();

    BOOL GetInfo(
        const CString& strPropertyState,
        CString& strIsoData,
        CString& strErrorMessage) const;
};


// CRataBaseServiceAdapter — external web service adapter for the RataBase
// premium rating engine.
//
// Carrier eligibility is enforced via CLoanRules::EnforceCarrierCoverage
// before any request reaches RataBase. Kentucky properties require an ISO
// advisory pre-call (CKentuckyISOAdapter::GetInfo → Tandem AIP930) before
// the rating request is submitted.

class CRataBaseServiceAdapter
{
public:
    explicit CRataBaseServiceAdapter(CLoanRules* pLoanRules);

    BOOL GetQuote(
        const CString& strPropertyState,
        const CString& strCoverageType,
        int nPropertyValue,
        CString& strQuoteResult,
        CString& strErrorMessage) const;

private:
    CLoanRules*          m_pLoanRules;
    CKentuckyISOAdapter* m_pKyIsoAdapter;
};
