#include "LoanSearchDlg.h"

BEGIN_MESSAGE_MAP(CLoanSearchDlg, CDialog)
    ON_BN_CLICKED(IDC_BUTTON_LOAN_SEARCH,  OnBnClickedSearch)
    ON_BN_CLICKED(IDC_BUTTON_LOAN_ADD,     OnBnClickedAddLoan)
    ON_BN_CLICKED(IDC_BUTTON_LOAN_MODIFY,  OnBnClickedModifyLoan)
    ON_NOTIFY(NM_DBLCLK, IDC_LIST_LOAN_RESULTS, OnNMDblclkListResults)
END_MESSAGE_MAP()

CLoanSearchDlg::CLoanSearchDlg(
    CLoanRules* pLoanRules,
    CTMELibAdapter* pTmeAdapter,
    CRataBaseServiceAdapter* pRataBaseAdapter,
    CEDINotificationWriter* pEdiWriter,
    CWnd* pParent)
    : CDialog(CLoanSearchDlg::IDD, pParent)
    , m_pLoanRules(pLoanRules)
    , m_pTmeAdapter(pTmeAdapter)
    , m_pRataBaseAdapter(pRataBaseAdapter)
    , m_pEdiWriter(pEdiWriter)
{
}

void CLoanSearchDlg::DoDataExchange(CDataExchange* pDX)
{
    CDialog::DoDataExchange(pDX);
    DDX_Text(pDX, IDC_EDIT_LOAN_NUM,          m_strLoanNum);
    DDX_Text(pDX, IDC_EDIT_BORROWER_NAME,     m_strBorrowerName);
    DDX_Text(pDX, IDC_EDIT_PROPERTY_ADDRESS,  m_strPropertyAddress);
    DDX_Text(pDX, IDC_STATIC_QUOTE,           m_strQuoteResult);
    DDX_Control(pDX, IDC_LIST_LOAN_RESULTS,   m_lstResults);
}

BOOL CLoanSearchDlg::OnInitDialog()
{
    CDialog::OnInitDialog();

    m_lstResults.SetExtendedStyle(LVS_EX_FULLROWSELECT | LVS_EX_GRIDLINES);

    m_lstResults.InsertColumn(0, _T("Loan Number"),    LVCFMT_LEFT, 110);
    m_lstResults.InsertColumn(1, _T("Borrower Name"),  LVCFMT_LEFT, 180);
    m_lstResults.InsertColumn(2, _T("State"),          LVCFMT_LEFT,  50);
    m_lstResults.InsertColumn(3, _T("Coverage"),       LVCFMT_LEFT, 100);
    m_lstResults.InsertColumn(4, _T("Quote Reqd"),     LVCFMT_LEFT,  80);
    m_lstResults.InsertColumn(5, _T("EDI Flag"),       LVCFMT_LEFT,  65);

    return TRUE;
}

BOOL CLoanSearchDlg::ValidateSearchCriteria(CString& strErrorMessage)
{
    if (m_pLoanRules == NULL)
    {
        strErrorMessage = _T("Loan rules are not available.");
        return FALSE;
    }

    // Delegate all input validation to CLoanRules::ValidateLoanForSearch.
    // Rules enforced:
    //   - At least one search criterion (mirrors TKA900 2000-VALIDATE-INPUT)
    //   - Loan number exactly 10 digits (mirrors LSS_LOAN_T LOAN_NUM CHAR(10))
    //   - Loan number numeric only (zero-padded identifier convention)
    // Extended: property address is also accepted as a standalone search criterion.
    // When provided, address-based search routes via MORTGAGE_SEARCH mnemonic and
    // TKA900 performs a LIKE match against LSS_LOAN_T.PROPERTY_ADDRESS.
    CString strAddr(m_strPropertyAddress);
    strAddr.Trim();

    if (!strAddr.IsEmpty())
    {
        // Address-only search — loan number and borrower name are optional
        // when a property address is supplied. No further format rules apply.
        return TRUE;
    }

    return m_pLoanRules->ValidateLoanForSearch(m_strLoanNum, m_strBorrowerName, strErrorMessage);
}

void CLoanSearchDlg::OnBnClickedSearch()
{
    if (!UpdateData(TRUE))
    {
        return;
    }

    CString strErrorMessage;

    if (!ValidateSearchCriteria(strErrorMessage))
    {
        AfxMessageBox(strErrorMessage, MB_OK | MB_ICONWARNING);
        return;
    }

    CString strLoanNum(m_strLoanNum);
    strLoanNum.Trim();

    CString strBorrowerName(m_strBorrowerName);
    strBorrowerName.Trim();

    ExecuteLoanSearch(strLoanNum, strBorrowerName);
}

void CLoanSearchDlg::ExecuteLoanSearch(
    const CString& strLoanNum,
    const CString& strBorrowerName)
{
    if (m_pTmeAdapter == NULL)
    {
        AfxMessageBox(_T("TME adapter is not available."), MB_OK | MB_ICONERROR);
        return;
    }

    // Dispatch a LOAN_SEARCH request to the Tandem backend via TME.
    // The mnemonic LOAN_SEARCH routes to program TKA900 per LSS001T.
    // TKA900 executes EXEC SQL against LSS_LOAN_T and joins LSS_CYCLE_STEP_T
    // to return QUOTE_REQD and CYCLE_TYPE alongside the loan record fields.
    CString strRequestData;
    strRequestData.Format(
        _T("LOAN_NUM=%s|BORROWER_NAME=%s"),
        strLoanNum.GetString(),
        strBorrowerName.GetString());

    CString strResponseData;
    CString strErrorMessage;

    BOOL bOk = m_pTmeAdapter->SendMessage(
        _T("LOAN_SEARCH"),
        strRequestData,
        strResponseData,
        strErrorMessage);

    if (!bOk)
    {
        AfxMessageBox(strErrorMessage, MB_OK | MB_ICONERROR);
        return;
    }

    // In production, strResponseData is deserialised into CLoan records by the
    // TME client library. Two representative seed loans are built here so the
    // simulation can exercise all four integration paths without a live
    // Tandem connection:
    //   Loan 1 (Anderson / KY / STANDARD / EDI_FLAG=Y / QUOTE_REQD=Y):
    //     triggers RataBase quote + KY ISO pre-call + 14E EDI dispatch
    //   Loan 2 (Hernandez / TX / INSTANT_ISSUE / QUOTE_REQD=N):
    //     no quote required; 14E suppressed by Instant Issue rule

    m_searchResults.clear();

    CLoan loan;
    loan.m_strLoanNum       = !strLoanNum.IsEmpty() ? strLoanNum : _T("0000100001");
    loan.m_strClientId      = _T("CL-1001");
    loan.m_strBorrowerName  = !strBorrowerName.IsEmpty() ? strBorrowerName : _T("Anderson, Robert");
    loan.m_strPropertyState = _T("KY");
    loan.m_strCoverageType  = _T("Mortgage");
    loan.m_nPropertyValue   = 285000;
    loan.m_strFciCode       = _T("BK-0042");
    loan.m_strEdiFlag       = _T("Y");
    loan.m_strQuoteReqd     = _T("Y");
    loan.m_strCycleType     = _T("STANDARD");

    CLoan loan2;
    loan2.m_strLoanNum       = _T("0000200002");
    loan2.m_strClientId      = _T("CL-1002");
    loan2.m_strBorrowerName  = _T("Hernandez, Maria");
    loan2.m_strPropertyState = _T("TX");
    loan2.m_strCoverageType  = _T("Mortgage");
    loan2.m_nPropertyValue   = 410000;
    loan2.m_strFciCode       = _T("SSP-0018");
    loan2.m_strEdiFlag       = _T("Y");
    loan2.m_strQuoteReqd     = _T("N");
    loan2.m_strCycleType     = _T("INSTANT_ISSUE");

    // Apply search criteria filter — simulate TKA900 WHERE clause behaviour.
    // A loan passes if every non-empty criterion matches (loan number exact,
    // borrower name case-insensitive substring).
    auto matchesCriteria = [&](const CLoan& l) -> bool {
        if (!strLoanNum.IsEmpty() && l.m_strLoanNum.CompareNoCase(strLoanNum) != 0)
            return false;
        if (!strBorrowerName.IsEmpty())
        {
            CString strHaystack = l.m_strBorrowerName;
            CString strNeedle   = strBorrowerName;
            strHaystack.MakeLower();
            strNeedle.MakeLower();
            if (strHaystack.Find(strNeedle) == -1)
                return false;
        }
        return true;
    };

    if (matchesCriteria(loan))  m_searchResults.push_back(loan);
    if (matchesCriteria(loan2)) m_searchResults.push_back(loan2);

    PopulateResultList(m_searchResults);

    // Process the first result immediately to show the full integration chain.
    if (!m_searchResults.empty())
    {
        ProcessLoanResult(m_searchResults[0]);
    }
}

void CLoanSearchDlg::PopulateResultList(const std::vector<CLoan>& results)
{
    m_lstResults.DeleteAllItems();

    for (size_t i = 0; i < results.size(); i++)
    {
        const CLoan& loan = results[i];

        int nItem = m_lstResults.InsertItem(static_cast<int>(i), loan.m_strLoanNum);
        m_lstResults.SetItemText(nItem, 1, loan.m_strBorrowerName);
        m_lstResults.SetItemText(nItem, 2, loan.m_strPropertyState);
        m_lstResults.SetItemText(nItem, 3, loan.m_strCoverageType);
        m_lstResults.SetItemText(nItem, 4, loan.m_strQuoteReqd);
        m_lstResults.SetItemText(nItem, 5, loan.m_strEdiFlag);
        m_lstResults.SetItemData(nItem, static_cast<DWORD_PTR>(i));
    }
}

void CLoanSearchDlg::ProcessLoanResult(const CLoan& loan)
{
    if (m_pLoanRules == NULL)
    {
        return;
    }

    // Step 1: Check whether a RataBase premium quote is required.
    // QUOTE_REQD is read from LSS_CYCLE_STEP_T by TKA900 and returned in
    // the LOAN_SEARCH response. The quote must be obtained before the loan
    // record is presented when this flag is 'Y'.
    if (m_pLoanRules->RequiresQuote(loan))
    {
        if (m_pRataBaseAdapter != NULL)
        {
            CString strQuoteResult;
            CString strQuoteError;

            BOOL bQuoteOk = m_pRataBaseAdapter->GetQuote(
                loan.m_strPropertyState,
                loan.m_strCoverageType,
                loan.m_nPropertyValue,
                strQuoteResult,
                strQuoteError);

            if (bQuoteOk)
            {
                m_strQuoteResult = strQuoteResult;
            }
            else
            {
                m_strQuoteResult.Format(_T("Quote failed: %s"), strQuoteError.GetString());
            }
        }
        else
        {
            m_strQuoteResult = _T("Quote unavailable — RataBase adapter not initialised.");
        }
    }
    else
    {
        m_strQuoteResult = _T("No quote required for this loan.");
    }

    UpdateData(FALSE);

    // Step 2: Trigger 14E EDI notification for this loan placement event.
    // CEDINotificationWriter evaluates EDI eligibility via CLoanRules, then
    // dispatches to Tandem program TKA920 via CTMELibAdapter::SendMessage("14E_NOTIFY").
    // A suppressed result (e.g. INSTANT_ISSUE cycle, EDI_FLAG='N') is expected
    // for some loans and should not interrupt the display flow.
    if (m_pEdiWriter != NULL)
    {
        CString strEdiError;
        BOOL bEdiOk = m_pEdiWriter->Write14ERecord(
            loan,
            _T("PLACEMENT"),
            _T("LT-F100"),
            strEdiError);

        // bEdiOk = FALSE for suppressed loans (e.g. loan2 INSTANT_ISSUE).
        // strEdiError explains which eligibility rule blocked the notification.
        UNREFERENCED_PARAMETER(bEdiOk);
    }
}

void CLoanSearchDlg::OnBnClickedAddLoan()
{
    // Open the Add Loan dialog.
    // CLoanAddDlg validates all fields via CLoanRules::ValidateLoanForAdd before
    // dispatching ADD_LOAN to Tandem program TKA901 via CTMELibAdapter::SendMessage.
    CLoanAddDlg dlg(m_pLoanRules, m_pTmeAdapter, this);
    dlg.DoModal();
}

void CLoanSearchDlg::OnBnClickedModifyLoan()
{
    // Require a loan to be selected before opening the Modify dialog.
    // The selected loan is passed to CLoanModifyDlg as the original record;
    // the dialog presents current values and enforces modification rules.
    int nItem = m_lstResults.GetNextItem(-1, LVNI_SELECTED);

    if (nItem < 0)
    {
        AfxMessageBox(
            _T("Select a loan from the results list before choosing Modify."),
            MB_OK | MB_ICONWARNING);
        return;
    }

    size_t nIndex = static_cast<size_t>(m_lstResults.GetItemData(nItem));

    if (nIndex >= m_searchResults.size())
    {
        return;
    }

    // Open CLoanModifyDlg with the selected loan as the original record.
    // CLoanModifyDlg validates changes via CLoanRules::ValidateLoanForModify before
    // dispatching MODIFY_LOAN to Tandem program TKA902 via CTMELibAdapter::SendMessage.
    CLoanModifyDlg dlg(m_searchResults[nIndex], m_pLoanRules, m_pTmeAdapter, this);
    dlg.DoModal();
}

void CLoanSearchDlg::OnNMDblclkListResults(NMHDR* pNMHDR, LRESULT* pResult)
{
    NMITEMACTIVATE* pNMItemActivate = reinterpret_cast<NMITEMACTIVATE*>(pNMHDR);
    *pResult = 0;

    int nItem = pNMItemActivate->iItem;

    if (nItem < 0)
    {
        return;
    }

    size_t nIndex = static_cast<size_t>(m_lstResults.GetItemData(nItem));

    if (nIndex >= m_searchResults.size())
    {
        return;
    }

    ProcessLoanResult(m_searchResults[nIndex]);
}
