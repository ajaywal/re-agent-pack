#pragma once

#include <afx.h>

// Loan record returned by the TME LOAN_SEARCH gateway call (program TKA900).
// Fields map directly to columns in LSS_LOAN_T and LSS_CYCLE_STEP_T on the
// HP NonStop Tandem backend. In-memory seeding in CLoanGateway mirrors the
// data shape a real fgatetcp round-trip would return.

class CLoan
{
public:
    CLoan()
        : m_nPropertyValue(0)
        , m_nUnpaidPrincipalBalance(0)
    {
    }

public:
    // From LSS_LOAN_T
    CString m_strLoanNum;                  // LOAN_NUM CHAR(10) — primary key; must be exactly 10 digits
    CString m_strClientId;                 // CLIENT_ID CHAR(8) — foreign key to TB_CLIENT
    CString m_strBorrowerName;             // BORROWER_NAME CHAR(40)
    CString m_strPropertyState;            // PROPERTY_STATE CHAR(2) — 2-letter US state code
    CString m_strCoverageType;             // COVERAGE_TYPE CHAR(10)
    int     m_nPropertyValue;              // PROPERTY_VALUE NUMERIC(10)
    CString m_strFciCode;                  // FCI_CODE CHAR(6) — servicer code; "BK" prefix = Black Knight
    CString m_strEdiFlag;                  // EDI_FLAG CHAR(1) — 'Y' = eligible for 14E outbound EDI

    // Extended loan fields — added for Add/Modify Loan operations (Assessment doc: Loan Maintenance module)
    CString m_strLoanStatus;               // LOAN_STATUS CHAR(10) — 'ACTIVE', 'DELINQUENT', 'CLOSED'
    long    m_nUnpaidPrincipalBalance;     // UPB NUMERIC(15) — unpaid principal balance in dollars
    CString m_strMortgageeClause;          // MORTGAGEE_CLAUSE CHAR(255) — lender rights clause text
    CString m_strPropertyAddress;          // PROPERTY_ADDRESS CHAR(100) — street address
    CString m_strPropertyCity;             // PROPERTY_CITY CHAR(50)
    CString m_strPropertyZip;              // PROPERTY_ZIP CHAR(10)
    CString m_strPropertyType;             // PROPERTY_TYPE CHAR(20) — 'RESIDENTIAL' or 'COMMERCIAL'
    CString m_strBorrowerPhone;            // BORROWER_PHONE CHAR(20)

    // From LSS_CYCLE_STEP_T (joined on CLIENT_ID by TKA900)
    CString m_strQuoteReqd;                // QUOTE_REQD CHAR(1) — 'Y' = RataBase quote required
    CString m_strCycleType;                // CYCLE_TYPE CHAR(20) — e.g. 'STANDARD', 'INSTANT_ISSUE'
};
