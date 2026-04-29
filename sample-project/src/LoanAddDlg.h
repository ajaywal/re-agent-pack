#pragma once

#include "Loan.h"
#include "LoanRules.h"
#include "TMELibAdapter.h"
#include <afxwin.h>
#include "resource.h"

// CLoanAddDlg — Add Loan dialog.
//
// Integration flow triggered by the Add button:
//   1. CLoanRules::ValidateLoanForAdd — input rules enforced before TME dispatch:
//        R-AL-001: loan number + borrower name required
//        R-AL-002: loan number exactly 10 digits
//        R-AL-003: property value > 0
//        R-AL-004: property address required
//        R-AL-005: initial status must be ACTIVE
//        R-AL-006: UPB must be > 0
//        R-AL-007: property type must be RESIDENTIAL or COMMERCIAL
//   2. CTMELibAdapter::SendMessage("ADD_LOAN") — dispatches to Tandem TKA901
//        TKA901 validates and inserts into LSS_LOAN_T with LOAN_STATUS = ACTIVE.

class CLoanAddDlg : public CDialog
{
public:
    CLoanAddDlg(
        CLoanRules*     pLoanRules,
        CTMELibAdapter* pTmeAdapter,
        CWnd*           pParent = NULL);

    enum { IDD = IDD_LOAN_ADD };

    // Returns the newly added loan after a successful add.
    const CLoan& GetAddedLoan() const { return m_loan; }

protected:
    virtual void DoDataExchange(CDataExchange* pDX);
    virtual BOOL OnInitDialog();
    afx_msg void OnBnClickedAdd();
    afx_msg HBRUSH OnCtlColor(CDC* pDC, CWnd* pWnd, UINT nCtlColor);
    afx_msg void OnDrawItem(int nIDCtl, LPDRAWITEMSTRUCT lpDrawItemStruct);
    afx_msg BOOL OnEraseBkgnd(CDC* pDC);
    DECLARE_MESSAGE_MAP()

private:
    CLoanRules*     m_pLoanRules;
    CTMELibAdapter* m_pTmeAdapter;
    CLoan           m_loan;

    CString m_strLoanNum;
    CString m_strBorrowerName;
    CString m_strPropertyState;
    CString m_strCoverageType;
    CString m_strPropertyAddress;
    CString m_strPropertyCity;
    CString m_strPropertyZip;
    CString m_strPropertyType;
    CString m_strBorrowerPhone;
    CString m_strFciCode;
    CString m_strLoanStatus;
    int     m_nPropertyValue;
    long    m_nUpb;

    CBrush m_brEditBackground;
};
