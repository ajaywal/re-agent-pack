#include "LoanRules.h"

CLoanRules::CLoanRules()
{
    LoadApprovedCarrierStates();
    LoadLenderTargetForms();
}

void CLoanRules::LoadApprovedCarrierStates()
{
    // States approved for RataBase carrier coverage.
    // A loan with PROPERTY_STATE not in this list cannot be rated — the
    // EnforceCarrierCoverage rule blocks the request before it reaches
    // the rating engine. Maintained by the carrier configuration team.

    const LPCTSTR approvedStateCodes[] = {
        _T("AL"), _T("AZ"), _T("CA"), _T("CO"), _T("FL"), _T("GA"),
        _T("IL"), _T("IN"), _T("KY"), _T("MD"), _T("MI"), _T("MN"),
        _T("MO"), _T("NC"), _T("NJ"), _T("NY"), _T("OH"), _T("PA"),
        _T("SC"), _T("TN"), _T("TX"), _T("VA"), _T("WI")
    };

    int nCount = sizeof(approvedStateCodes) / sizeof(approvedStateCodes[0]);

    for (int i = 0; i < nCount; i++)
    {
        m_approvedCarrierStates.push_back(approvedStateCodes[i]);
    }
}

void CLoanRules::LoadLenderTargetForms()
{
    // Approved form IDs from the lender_target table.
    // A 14E record referencing an unregistered form ID would be rejected by
    // the downstream EDI processor at the servicer. In production, this list
    // is loaded from the lender_target DB table at application startup.

    m_lenderTargetForms.push_back(_T("LT-F100"));
    m_lenderTargetForms.push_back(_T("LT-F200"));
    m_lenderTargetForms.push_back(_T("LT-F300"));
    m_lenderTargetForms.push_back(_T("LT-F400"));
}

BOOL CLoanRules::IsStateInApprovedCarrierList(const CString& strState) const
{
    for (size_t i = 0; i < m_approvedCarrierStates.size(); i++)
    {
        if (m_approvedCarrierStates[i].CompareNoCase(strState) == 0)
        {
            return TRUE;
        }
    }

    return FALSE;
}

BOOL CLoanRules::IsFormIdInLenderTarget(const CString& strFormId) const
{
    for (size_t i = 0; i < m_lenderTargetForms.size(); i++)
    {
        if (m_lenderTargetForms[i].CompareNoCase(strFormId) == 0)
        {
            return TRUE;
        }
    }

    return FALSE;
}

BOOL CLoanRules::ValidateLoanForSearch(
    const CString& strLoanNum,
    const CString& strBorrowerName,
    CString& strErrorMessage)
{
    CString strNum(strLoanNum);
    strNum.Trim();

    CString strName(strBorrowerName);
    strName.Trim();

    // At least one search criterion must be supplied.
    // An empty request would cause TKA900 on the Tandem backend to execute
    // an unrestricted scan against LSS_LOAN_T — rejected by the COBOL
    // 2000-VALIDATE-INPUT paragraph (STATUS-CODE '9001'). This UI-layer
    // check mirrors that enforcement and provides earlier user feedback.
    if (strNum.IsEmpty() && strName.IsEmpty())
    {
        strErrorMessage = _T("At least one search criterion is required. ")
                          _T("Enter a loan number or borrower name.");
        return FALSE;
    }

    if (!strNum.IsEmpty())
    {
        // Loan number must be exactly 10 digits.
        // LSS_LOAN_T defines LOAN_NUM as CHAR(10) NOT NULL on the HP NonStop
        // Tandem backend. A shorter value fails the SQL equality match in
        // TKA900's 3000-QUERY-LOAN EXEC SQL; a longer value is rejected at
        // the TME message serialisation layer before the fgatetcp send.
        if (strNum.GetLength() != 10)
        {
            strErrorMessage = _T("Loan number must be exactly 10 digits.");
            return FALSE;
        }

        // Loan number must contain digits only.
        // LOAN_NUM is a zero-padded numeric identifier. Alpha characters
        // indicate a data entry error — the Tandem SQL index on LOAN_NUM
        // is built on the numeric character set.
        for (int i = 0; i < strNum.GetLength(); i++)
        {
            if (!_istdigit(strNum[i]))
            {
                strErrorMessage = _T("Loan number must contain digits only.");
                return FALSE;
            }
        }
    }

    return TRUE;
}

BOOL CLoanRules::EnforceCarrierCoverage(
    const CString& strPropertyState,
    CString& strErrorMessage) const
{
    CString strState(strPropertyState);
    strState.Trim();

    if (strState.IsEmpty())
    {
        strErrorMessage = _T("Property state is required for RataBase rating.");
        return FALSE;
    }

    // Property state must be in the approved carrier coverage list.
    // Loans in non-covered states cannot be rated through RataBase — they
    // must follow the manual underwriting quoting process. This rule is
    // enforced at the service layer before any request reaches the rating
    // engine, since RataBase has no configured rates for unapproved states.
    if (!IsStateInApprovedCarrierList(strState))
    {
        strErrorMessage.Format(
            _T("State '%s' is not in the approved carrier list for RataBase rating. ")
            _T("Contact underwriting for manual quote options."),
            strState.GetString());
        return FALSE;
    }

    return TRUE;
}

BOOL CLoanRules::EnforceEdiEligibility(
    const CLoan& loan,
    const CString& strFormId,
    CString& strErrorMessage) const
{
    // EDI enrolment: EDI_FLAG must be 'Y' on the loan record.
    // The EDI_FLAG value is stored in LSS_LOAN_T on the HP NonStop Tandem
    // backend and returned by COBOL program TKA900 in the LOAN_SEARCH
    // response. Loans without an active EDI enrolment flag do not receive
    // outbound 14E notifications.
    if (loan.m_strEdiFlag.CompareNoCase(_T("Y")) != 0)
    {
        strErrorMessage = _T("EDI notification skipped: client EDI_FLAG is not set to Y.");
        return FALSE;
    }

    // Instant Issue suppression: 14E EDI is blocked for Instant Issue cycle loans.
    // CYCLE_TYPE is stored in LSS_CYCLE_STEP_T and returned by TKA900 alongside
    // the loan record. Instant Issue policies generate their own notification
    // path through the certificate issuance workflow — a separate 14E record
    // would create a duplicate at the servicer's EDI processor.
    if (loan.m_strCycleType.CompareNoCase(_T("INSTANT_ISSUE")) == 0)
    {
        strErrorMessage = _T("14E EDI write blocked: Instant Issue cycle does not generate 14E records.");
        return FALSE;
    }

    // Form registration: formId must be registered in the lender_target table.
    // An unrecognised form ID would produce a 14E record that the downstream
    // EDI processor cannot route to a lender, causing a processing exception
    // at the servicer and requiring a manual correction.
    if (!IsFormIdInLenderTarget(strFormId))
    {
        strErrorMessage.Format(
            _T("Form ID '%s' is not registered in lender_target. 14E record cannot be written."),
            strFormId.GetString());
        return FALSE;
    }

    return TRUE;
}

BOOL CLoanRules::RequiresQuote(const CLoan& loan) const
{
    // QUOTE_REQD is read from LSS_CYCLE_STEP_T by Tandem program TKA900
    // and returned in the LOAN_SEARCH TME response. When 'Y', the client
    // must obtain a RataBase premium estimate before presenting the loan
    // record — the quote is part of the placement workflow for this cycle type.
    return loan.m_strQuoteReqd.CompareNoCase(_T("Y")) == 0 ? TRUE : FALSE;
}

std::vector<CString> CLoanRules::BuildLoanAuditMessages(
    const CLoan& loan,
    const CString& strEventCode) const
{
    std::vector<CString> messages;

    // Build an audit entry for each loan event dispatched to TKA920 via 14E_NOTIFY.
    // Every placement or coverage change that triggers a 14E notification must
    // be recorded with enough context for the operations team to reconstruct
    // what changed and when. The audit trail accompanies the 14E dispatch.

    CString strMsg;
    strMsg.Format(
        _T("LOAN_AUDIT|LOAN=%s|CLIENT=%s|EVENT=%s|STATE=%s|COVERAGE=%s|EDI=%s|CYCLE=%s|VALUE=%d"),
        loan.m_strLoanNum.GetString(),
        loan.m_strClientId.GetString(),
        strEventCode.GetString(),
        loan.m_strPropertyState.GetString(),
        loan.m_strCoverageType.GetString(),
        loan.m_strEdiFlag.GetString(),
        loan.m_strCycleType.GetString(),
        loan.m_nPropertyValue);

    messages.push_back(strMsg);

    return messages;
}

BOOL CLoanRules::IsLoanStatusTransitionValid(
    const CString& strFrom,
    const CString& strTo) const
{
    // Valid loan status transitions:
    //   ACTIVE      → DELINQUENT  (borrower misses payment)
    //   DELINQUENT  → CLOSED      (loan resolved or written off)
    // All other transitions — including any reverse or CLOSED→any — are rejected.
    // Status is stored in LSS_LOAN_T.LOAN_STATUS and updated by TKA902 on MODIFY_LOAN.
    if (strFrom.CompareNoCase(_T("ACTIVE")) == 0 &&
        strTo.CompareNoCase(_T("DELINQUENT")) == 0)
        return TRUE;

    if (strFrom.CompareNoCase(_T("DELINQUENT")) == 0 &&
        strTo.CompareNoCase(_T("CLOSED")) == 0)
        return TRUE;

    return FALSE;
}

BOOL CLoanRules::IsValidPropertyType(const CString& strPropertyType) const
{
    // Property type must be one of the two recognised values.
    // RESIDENTIAL covers single-family and multi-family dwellings subject to LPI.
    // COMMERCIAL covers non-residential collateral handled by a separate rating path.
    return (strPropertyType.CompareNoCase(_T("RESIDENTIAL")) == 0 ||
            strPropertyType.CompareNoCase(_T("COMMERCIAL"))  == 0);
}

BOOL CLoanRules::ValidateLoanForAdd(
    const CLoan& loan,
    CString& strErrorMessage)
{
    // R-AL-001: Loan number and borrower name are both required to register a new loan.
    // A loan record with no identifier or no named borrower cannot be tracked in the
    // system — TKA901 rejects the INSERT if LOAN_NUM or BORROWER_NAME is blank.
    CString strNum(loan.m_strLoanNum);
    strNum.Trim();
    CString strName(loan.m_strBorrowerName);
    strName.Trim();

    if (strNum.IsEmpty() || strName.IsEmpty())
    {
        strErrorMessage = _T("Loan number and borrower name are required to add a loan.");
        return FALSE;
    }

    // R-AL-002: Loan number must be exactly 10 digits.
    // Reuses the same CHAR(10) column constraint enforced on LOAN_SEARCH.
    // TKA901 performs an identical check in its 2000-VALIDATE-ADD paragraph
    // before executing the INSERT against LSS_LOAN_T.
    if (strNum.GetLength() != 10)
    {
        strErrorMessage = _T("Loan number must be exactly 10 digits.");
        return FALSE;
    }

    for (int i = 0; i < strNum.GetLength(); i++)
    {
        if (!_istdigit(strNum[i]))
        {
            strErrorMessage = _T("Loan number must contain digits only.");
            return FALSE;
        }
    }

    // R-AL-003: Property value must be greater than zero when adding a loan.
    // A zero or negative property value indicates a data entry error — a loan
    // with no collateral value cannot be rated or insured by the LPI system.
    if (loan.m_nPropertyValue <= 0)
    {
        strErrorMessage = _T("Property value must be greater than zero.");
        return FALSE;
    }

    // R-AL-004: Property address is required for a new loan record.
    // The property address identifies the collateral location for insurance
    // and is required for lender notification letters. LSS_LOAN_T enforces
    // a NOT NULL constraint on PROPERTY_ADDRESS via TKA901 insert validation.
    CString strAddr(loan.m_strPropertyAddress);
    strAddr.Trim();

    if (strAddr.IsEmpty())
    {
        strErrorMessage = _T("Property address is required to add a loan.");
        return FALSE;
    }

    // R-AL-005: Initial loan status must be ACTIVE on creation.
    // All new loans enter the system in ACTIVE status. A loan submitted with
    // any other initial status is rejected — DELINQUENT and CLOSED statuses
    // are reached only through governed modify-loan status transitions.
    if (loan.m_strLoanStatus.IsEmpty())
    {
        // Caller should default to ACTIVE — flag if it was left blank.
        strErrorMessage = _T("Loan status must be set to ACTIVE when adding a new loan.");
        return FALSE;
    }

    if (loan.m_strLoanStatus.CompareNoCase(_T("ACTIVE")) != 0)
    {
        strErrorMessage = _T("New loans must have initial status ACTIVE.");
        return FALSE;
    }

    // R-AL-006: Unpaid principal balance must be greater than zero.
    // A new loan with a zero UPB has no outstanding balance to insure — it
    // cannot enter the LPI tracking cycle and is rejected at the data layer.
    if (loan.m_nUnpaidPrincipalBalance <= 0)
    {
        strErrorMessage = _T("Unpaid principal balance must be greater than zero.");
        return FALSE;
    }

    // R-AL-007: Property type must be RESIDENTIAL or COMMERCIAL.
    // Only these two classifications are supported by the TrackAll 2.0 rating
    // and letter cycle configuration. An unrecognised type would produce
    // an unresolvable carrier match in the downstream RataBase call.
    CString strType(loan.m_strPropertyType);
    strType.Trim();

    if (strType.IsEmpty() || !IsValidPropertyType(strType))
    {
        strErrorMessage = _T("Property type must be RESIDENTIAL or COMMERCIAL.");
        return FALSE;
    }

    return TRUE;
}

BOOL CLoanRules::ValidateLoanForModify(
    const CLoan& loanOrig,
    const CLoan& loanMod,
    CString& strErrorMessage) const
{
    // R-ML-001: Loan number is immutable after creation.
    // LOAN_NUM is the primary key of LSS_LOAN_T and is referenced by every
    // downstream system (EDI, audit log, billing). Changing it would break
    // referential integrity across the full TrackAll data model.
    if (loanOrig.m_strLoanNum.CompareNoCase(loanMod.m_strLoanNum) != 0)
    {
        strErrorMessage = _T("Loan number cannot be changed after a loan is created.");
        return FALSE;
    }

    // R-ML-002: Loan status transition must follow the approved sequence.
    // Only ACTIVE→DELINQUENT and DELINQUENT→CLOSED are permitted.
    // A CLOSED loan cannot be re-opened — closure is a terminal state.
    // Status is unchanged when the same value is submitted (no-op allowed).
    if (loanOrig.m_strLoanStatus.CompareNoCase(loanMod.m_strLoanStatus) != 0)
    {
        if (!IsLoanStatusTransitionValid(loanOrig.m_strLoanStatus, loanMod.m_strLoanStatus))
        {
            strErrorMessage.Format(
                _T("Invalid loan status transition: '%s' to '%s' is not permitted. ")
                _T("Allowed: ACTIVE→DELINQUENT, DELINQUENT→CLOSED."),
                loanOrig.m_strLoanStatus.GetString(),
                loanMod.m_strLoanStatus.GetString());
            return FALSE;
        }
    }

    // R-ML-003: Unpaid principal balance cannot be increased on a modification.
    // UPB decreases as payments are applied. An increase would indicate a data
    // entry error — loan principals are not increased through the Loan Maintenance
    // workflow (origination is handled by a separate boarding process).
    if (loanMod.m_nUnpaidPrincipalBalance > loanOrig.m_nUnpaidPrincipalBalance)
    {
        strErrorMessage = _T("Unpaid principal balance cannot be increased. ")
                          _T("UPB is reduced by payments — contact loan origination for balance corrections.");
        return FALSE;
    }

    // R-ML-004: If property address is being changed, the new address must be non-empty.
    // An address update with a blank value would overwrite the collateral location
    // with no data, breaking carrier eligibility lookups and lender notification routing.
    CString strNewAddr(loanMod.m_strPropertyAddress);
    strNewAddr.Trim();
    CString strOrigAddr(loanOrig.m_strPropertyAddress);
    strOrigAddr.Trim();

    if (strOrigAddr.CompareNoCase(strNewAddr) != 0 && strNewAddr.IsEmpty())
    {
        strErrorMessage = _T("Property address cannot be cleared. Provide a valid address when updating location.");
        return FALSE;
    }

    return TRUE;
}
