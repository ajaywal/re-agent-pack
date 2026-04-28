#pragma once

#include "Loan.h"
#include "LoanRules.h"
#include "LoanAddDlg.h"
#include "LoanModifyDlg.h"
#include "TMELibAdapter.h"
#include "RataBaseServiceAdapter.h"
#include "EDINotificationWriter.h"
#include <afxwin.h>
#include <afxcmn.h>
#include <vector>
#include "resource.h"

// CLoanSearchDlg — Loan Search dialog.
//
// Full integration flow triggered by a search:
//   1. CLoanRules::ValidateLoanForSearch — input rules (mirrors TKA900 COBOL checks)
//   2. CTMELibAdapter::SendMessage("LOAN_SEARCH") — dispatches to Tandem TKA900
//      TKA900 queries LSS_LOAN_T and joins LSS_CYCLE_STEP_T for QUOTE_REQD + CYCLE_TYPE
//   3. CLoanRules::RequiresQuote — if QUOTE_REQD='Y' from TKA900 response:
//      CRataBaseServiceAdapter::GetQuote — carrier eligibility check + KY ISO pre-call
//   4. CEDINotificationWriter::Write14ERecord — EDI eligibility (CLoanRules) then
//      CTMELibAdapter::SendMessage("14E_NOTIFY") → Tandem TKA920

class CLoanSearchDlg : public CDialog
{
public:
    CLoanSearchDlg(
        CLoanRules* pLoanRules,
        CTMELibAdapter* pTmeAdapter,
        CRataBaseServiceAdapter* pRataBaseAdapter,
        CEDINotificationWriter* pEdiWriter,
        CWnd* pParent = NULL);

    enum { IDD = IDD_LOAN_SEARCH };

protected:
    virtual void DoDataExchange(CDataExchange* pDX);
    virtual BOOL OnInitDialog();
    afx_msg void OnBnClickedSearch();
    afx_msg void OnBnClickedAddLoan();
    afx_msg void OnBnClickedModifyLoan();
    afx_msg void OnNMDblclkListResults(NMHDR* pNMHDR, LRESULT* pResult);
    DECLARE_MESSAGE_MAP()

private:
    BOOL ValidateSearchCriteria(CString& strErrorMessage);
    void ExecuteLoanSearch(const CString& strLoanNum, const CString& strBorrowerName);
    void ProcessLoanResult(const CLoan& loan);
    void PopulateResultList(const std::vector<CLoan>& results);

private:
    CLoanRules*              m_pLoanRules;
    CTMELibAdapter*          m_pTmeAdapter;
    CRataBaseServiceAdapter* m_pRataBaseAdapter;
    CEDINotificationWriter*  m_pEdiWriter;

    CString   m_strLoanNum;
    CString   m_strBorrowerName;
    CString   m_strPropertyAddress;   // extended search criterion — address-based lookup
    CString   m_strQuoteResult;
    CListCtrl m_lstResults;

    std::vector<CLoan> m_searchResults;
};
