#pragma once

#include "Loan.h"
#include "LoanRules.h"
#include "TMELibAdapter.h"
#include <afxwin.h>
#include "resource.h"

// CLoanModifyDlg — Modify Loan dialog.
//
// Receives an existing loan from CLoanSearchDlg, presents current values,
// and dispatches the modification to Tandem TKA902 via MODIFY_LOAN mnemonic.
//
// Integration flow triggered by the Modify button:
//   1. CLoanRules::ValidateLoanForModify — modification rules:
//        R-ML-001: loan number is immutable
//        R-ML-002: status transition must follow ACTIVE→DELINQUENT or DELINQUENT→CLOSED
//        R-ML-003: UPB cannot increase
//        R-ML-004: property address cannot be cleared
//   2. CTMELibAdapter::SendMessage("MODIFY_LOAN") — dispatches to Tandem TKA902
//        TKA902 validates and updates LSS_LOAN_T for the matching LOAN_NUM.

class CLoanModifyDlg : public CDialog
{
public:
    CLoanModifyDlg(
        const CLoan&    loanOrig,
        CLoanRules*     pLoanRules,
        CTMELibAdapter* pTmeAdapter,
        CWnd*           pParent = NULL);

    enum { IDD = IDD_LOAN_MODIFY };

protected:
    virtual void DoDataExchange(CDataExchange* pDX);
    virtual BOOL OnInitDialog();
    afx_msg void OnBnClickedModify();
    DECLARE_MESSAGE_MAP()

private:
    CLoan           m_loanOrig;
    CLoanRules*     m_pLoanRules;
    CTMELibAdapter* m_pTmeAdapter;

    // Editable fields — pre-populated from loanOrig, user may change
    CString m_strBorrowerName;
    CString m_strPropertyAddress;
    CString m_strPropertyCity;
    CString m_strPropertyZip;
    CString m_strBorrowerPhone;
    CString m_strLoanStatus;
    CString m_strMortgageeClause;
    long    m_nUpb;
    int     m_nPropertyValue;

    // Read-only display — loan number is shown but cannot be edited
    CString m_strLoanNumDisplay;
};
