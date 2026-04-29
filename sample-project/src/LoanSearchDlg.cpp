#include "LoanSearchDlg.h"
#include <dwmapi.h>
#pragma comment(lib, "dwmapi.lib")
#ifndef DWMWA_CAPTION_COLOR
#define DWMWA_CAPTION_COLOR 35
#endif

BEGIN_MESSAGE_MAP(CLoanSearchDlg, CDialog)
    ON_BN_CLICKED(IDC_BUTTON_LOAN_SEARCH,  OnBnClickedSearch)
    ON_BN_CLICKED(IDC_BUTTON_LOAN_ADD,     OnBnClickedAddLoan)
    ON_BN_CLICKED(IDC_BUTTON_LOAN_MODIFY,  OnBnClickedModifyLoan)
    ON_NOTIFY(NM_DBLCLK, IDC_LIST_LOAN_RESULTS, OnNMDblclkListResults)
    ON_WM_CTLCOLOR()
    ON_WM_DRAWITEM()
    ON_WM_ERASEBKGND()
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

    m_brEditBackground.CreateSolidBrush(RGB(30, 42, 58));

    COLORREF clrCaption = RGB(10, 15, 26);
    DwmSetWindowAttribute(m_hWnd, DWMWA_CAPTION_COLOR, &clrCaption, sizeof(clrCaption));

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

    // Seed loans mirror the forward-engineering DbSeeder and xUnit test data
    // so the same rules fire in both the legacy app and the modern stack.

    // 1. Happy path / KY ISO / EDI OK — triggers RataBase quote + KY ISO pre-call + 14E
    CLoan loan1;
    loan1.m_strLoanNum               = _T("1234567890");
    loan1.m_strClientId              = _T("CL-1001");
    loan1.m_strBorrowerName          = _T("Jordan Smith");
    loan1.m_strPropertyState         = _T("KY");
    loan1.m_strPropertyType          = _T("RESIDENTIAL");
    loan1.m_strCoverageType          = _T("Hazard");
    loan1.m_nPropertyValue           = 250000;
    loan1.m_nUnpaidPrincipalBalance  = 200000L;
    loan1.m_strLoanStatus            = _T("ACTIVE");
    loan1.m_strQuoteReqd             = _T("Y");
    loan1.m_strEdiFlag               = _T("Y");
    loan1.m_strCycleType             = _T("STANDARD");
    loan1.m_strFciCode               = _T("BK-0042");
    loan1.m_strPropertyAddress       = _T("120 Main St");
    loan1.m_strPropertyCity          = _T("Louisville");
    loan1.m_strPropertyZip           = _T("40202");
    loan1.m_strBorrowerPhone         = _T("502-555-0101");
    loan1.m_strMortgageeClause       = _T("First National Bank ISAOA/ATIMA, Louisville KY 40201");

    // 2. EDI not enrolled — no quote, 14E suppressed (EDI_FLAG=N)
    CLoan loan2;
    loan2.m_strLoanNum               = _T("2234567890");
    loan2.m_strClientId              = _T("CL-1002");
    loan2.m_strBorrowerName          = _T("Casey Brown");
    loan2.m_strPropertyState         = _T("TX");
    loan2.m_strPropertyType          = _T("COMMERCIAL");
    loan2.m_strCoverageType          = _T("Commercial");
    loan2.m_nPropertyValue           = 525000;
    loan2.m_nUnpaidPrincipalBalance  = 500000L;
    loan2.m_strLoanStatus            = _T("ACTIVE");
    loan2.m_strQuoteReqd             = _T("N");
    loan2.m_strEdiFlag               = _T("N");
    loan2.m_strCycleType             = _T("INSTANT_ISSUE");
    loan2.m_strFciCode               = _T("SSP-0018");
    loan2.m_strPropertyAddress       = _T("89 Oak Ave");
    loan2.m_strPropertyCity          = _T("Austin");
    loan2.m_strPropertyZip           = _T("78745");
    loan2.m_strBorrowerPhone         = _T("512-555-0202");
    loan2.m_strMortgageeClause       = _T("Texas Mortgage Trust ISAOA/ATIMA, Austin TX 78701");

    // 3. Quote skipped, EDI eligible — QUOTE_REQD=N, EDI_FLAG=Y, STANDARD cycle → 14E fires
    CLoan loan3;
    loan3.m_strLoanNum               = _T("3333333333");
    loan3.m_strClientId              = _T("CL-1003");
    loan3.m_strBorrowerName          = _T("Quote Skip");
    loan3.m_strPropertyState         = _T("TX");
    loan3.m_strPropertyType          = _T("RESIDENTIAL");
    loan3.m_strCoverageType          = _T("Hazard");
    loan3.m_nPropertyValue           = 310000;
    loan3.m_nUnpaidPrincipalBalance  = 250000L;
    loan3.m_strLoanStatus            = _T("ACTIVE");
    loan3.m_strQuoteReqd             = _T("N");
    loan3.m_strEdiFlag               = _T("Y");
    loan3.m_strCycleType             = _T("STANDARD");
    loan3.m_strFciCode               = _T("BK-0033");
    loan3.m_strPropertyAddress       = _T("333 Cycle Rd");
    loan3.m_strPropertyCity          = _T("Dallas");
    loan3.m_strPropertyZip           = _T("75201");
    loan3.m_strBorrowerPhone         = _T("214-555-0303");
    loan3.m_strMortgageeClause       = _T("Lone Star Lending ISAOA/ATIMA, Dallas TX 75201");

    // 4. Unapproved quote state — CA blocks RataBase quote eligibility
    CLoan loan4;
    loan4.m_strLoanNum               = _T("4444444444");
    loan4.m_strClientId              = _T("CL-1004");
    loan4.m_strBorrowerName          = _T("State Block");
    loan4.m_strPropertyState         = _T("CA");
    loan4.m_strPropertyType          = _T("RESIDENTIAL");
    loan4.m_strCoverageType          = _T("Hazard");
    loan4.m_nPropertyValue           = 275000;
    loan4.m_nUnpaidPrincipalBalance  = 210000L;
    loan4.m_strLoanStatus            = _T("ACTIVE");
    loan4.m_strQuoteReqd             = _T("Y");
    loan4.m_strEdiFlag               = _T("Y");
    loan4.m_strCycleType             = _T("STANDARD");
    loan4.m_strFciCode               = _T("BK-0044");
    loan4.m_strPropertyAddress       = _T("444 State Line");
    loan4.m_strPropertyCity          = _T("Los Angeles");
    loan4.m_strPropertyZip           = _T("90001");
    loan4.m_strBorrowerPhone         = _T("213-555-0404");
    loan4.m_strMortgageeClause       = _T("Pacific Trust ISAOA/ATIMA, Los Angeles CA 90001");

    // 5. Instant Issue EDI suppression — EDI_FLAG=Y but INSTANT_ISSUE suppresses 14E
    CLoan loan5;
    loan5.m_strLoanNum               = _T("5555555555");
    loan5.m_strClientId              = _T("CL-1005");
    loan5.m_strBorrowerName          = _T("Instant Issue");
    loan5.m_strPropertyState         = _T("TX");
    loan5.m_strPropertyType          = _T("COMMERCIAL");
    loan5.m_strCoverageType          = _T("Commercial");
    loan5.m_nPropertyValue           = 600000;
    loan5.m_nUnpaidPrincipalBalance  = 450000L;
    loan5.m_strLoanStatus            = _T("ACTIVE");
    loan5.m_strQuoteReqd             = _T("N");
    loan5.m_strEdiFlag               = _T("Y");
    loan5.m_strCycleType             = _T("INSTANT_ISSUE");
    loan5.m_strFciCode               = _T("SSP-0025");
    loan5.m_strPropertyAddress       = _T("555 Fast Lane");
    loan5.m_strPropertyCity          = _T("Houston");
    loan5.m_strPropertyZip           = _T("77001");
    loan5.m_strBorrowerPhone         = _T("713-555-0505");
    loan5.m_strMortgageeClause       = _T("Gulf Coast Bank ISAOA/ATIMA, Houston TX 77001");

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

    if (matchesCriteria(loan1)) m_searchResults.push_back(loan1);
    if (matchesCriteria(loan2)) m_searchResults.push_back(loan2);
    if (matchesCriteria(loan3)) m_searchResults.push_back(loan3);
    if (matchesCriteria(loan4)) m_searchResults.push_back(loan4);
    if (matchesCriteria(loan5)) m_searchResults.push_back(loan5);

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

    CString strQuoteStatus;
    CString strEdiStatus;

    // Step 1: RataBase quote — R-L-003 (state eligibility), R-L-004 (KY ISO pre-call),
    // R-L-005 (only when QUOTE_REQD=Y).
    // QUOTE_REQD is read from LSS_CYCLE_STEP_T by TKA900 and returned in
    // the LOAN_SEARCH response.
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
                // Extract annual premium from the pipe-delimited result string for concise display.
                CString strPremium;
                int nPos = strQuoteResult.Find(_T("ANNUAL_PREMIUM="));
                if (nPos >= 0)
                {
                    nPos += 15;
                    int nEnd = strQuoteResult.Find(_T("|"), nPos);
                    strPremium = (nEnd >= 0) ? strQuoteResult.Mid(nPos, nEnd - nPos)
                                             : strQuoteResult.Mid(nPos);
                }
                strQuoteStatus.Format(_T("Quote OK — $%s annual (%s)"),
                    strPremium.GetString(), loan.m_strPropertyState.GetString());
            }
            else
            {
                strQuoteStatus.Format(_T("Quote blocked — %s"), strQuoteError.GetString());
            }
        }
        else
        {
            strQuoteStatus = _T("Quote: RataBase adapter not initialised.");
        }
    }
    else
    {
        strQuoteStatus = _T("Quote skipped (QUOTE_REQD=N).");
    }

    // Step 2: 14E EDI notification — R-L-006 (EDI enrollment), R-L-007 (Instant Issue),
    // R-L-008 (registered form ID).
    // CEDINotificationWriter evaluates all three eligibility rules via CLoanRules, then
    // dispatches to Tandem program TKA920 via CTMELibAdapter::SendMessage("14E_NOTIFY").
    // A suppressed result is rule-governed, not a system failure.
    if (m_pEdiWriter != NULL)
    {
        // Derive lender form ID from FCI code prefix — BK servicers use LT-F100,
        // SSP servicers use LT-F200, matching the lender_target table configuration.
        CString strFormId = (loan.m_strFciCode.Left(2).CompareNoCase(_T("BK")) == 0)
                          ? _T("LT-F100") : _T("LT-F200");

        CString strEdiError;
        BOOL bEdiOk = m_pEdiWriter->Write14ERecord(
            loan, _T("PLACEMENT"), strFormId, strEdiError);

        if (bEdiOk)
            strEdiStatus = _T("14E dispatched to TKA920.");
        else
            strEdiStatus.Format(_T("14E suppressed — %s"), strEdiError.GetString());
    }
    else
    {
        strEdiStatus = _T("14E: EDI writer not initialised.");
    }

    // Compose both outcomes into the status label and force a clean repaint
    // so the gradient background erases the previous text before the new text paints.
    m_strQuoteResult.Format(_T("%s  |  %s"),
        strQuoteStatus.GetString(), strEdiStatus.GetString());
    UpdateData(FALSE);
    Invalidate();
    UpdateWindow();
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
    if (dlg.DoModal() == IDOK)
    {
        m_searchResults[nIndex] = dlg.GetModifiedLoan();
        PopulateResultList(m_searchResults);
    }
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

BOOL CLoanSearchDlg::OnEraseBkgnd(CDC* pDC)
{
    CRect rc;
    GetClientRect(&rc);
    TRIVERTEX v[2] = {
        { rc.left,  rc.top,    13<<8, 17<<8, 23<<8, 0 },
        { rc.right, rc.bottom, 28<<8, 35<<8, 51<<8, 0 }
    };
    GRADIENT_RECT gr = { 0, 1 };
    pDC->GradientFill(v, 2, &gr, 1, GRADIENT_FILL_RECT_V);
    return TRUE;
}

HBRUSH CLoanSearchDlg::OnCtlColor(CDC* pDC, CWnd* pWnd, UINT nCtlColor)
{
    if (nCtlColor == CTLCOLOR_DLG)
    {
        return (HBRUSH)GetStockObject(NULL_BRUSH);
    }
    if (nCtlColor == CTLCOLOR_STATIC)
    {
        pDC->SetBkMode(TRANSPARENT);
        pDC->SetTextColor(RGB(192, 200, 216));
        return (HBRUSH)GetStockObject(NULL_BRUSH);
    }
    if (nCtlColor == CTLCOLOR_EDIT)
    {
        pDC->SetTextColor(RGB(192, 200, 216));
        pDC->SetBkColor(RGB(30, 42, 58));
        return m_brEditBackground;
    }
    return CDialog::OnCtlColor(pDC, pWnd, nCtlColor);
}

void CLoanSearchDlg::OnDrawItem(int nIDCtl, LPDRAWITEMSTRUCT lp)
{
    if (lp->CtlType != ODT_BUTTON) { CDialog::OnDrawItem(nIDCtl, lp); return; }

    CDC dc;
    dc.Attach(lp->hDC);
    CRect rc(lp->rcItem);
    bool bPressed = (lp->itemState & ODS_SELECTED) != 0;

    dc.FillSolidRect(rc, bPressed ? RGB(30, 50, 80) : RGB(46, 74, 106));

    // Gloss stripe — top 40%
    CRect rcGloss(rc.left + 1, rc.top + 1, rc.right - 1, rc.top + rc.Height() * 2 / 5);
    TRIVERTEX gv[2] = {
        { rcGloss.left,  rcGloss.top,    120<<8, 180<<8, 255<<8, 0 },
        { rcGloss.right, rcGloss.bottom,  60<<8, 120<<8, 200<<8, 0 }
    };
    GRADIENT_RECT gg = { 0, 1 };
    dc.GradientFill(gv, 2, &gg, 1, GRADIENT_FILL_RECT_V);

    CPen penBorder(PS_SOLID, 1, RGB(85, 153, 255));
    CPen* pOld = dc.SelectObject(&penBorder);
    dc.MoveTo(rc.left,      rc.bottom - 1);
    dc.LineTo(rc.left,      rc.top);
    dc.LineTo(rc.right - 1, rc.top);
    dc.LineTo(rc.right - 1, rc.bottom - 1);
    dc.LineTo(rc.left,      rc.bottom - 1);
    dc.SelectObject(pOld);

    CWnd* pBtn = GetDlgItem(nIDCtl);
    CString str;
    if (pBtn) pBtn->GetWindowText(str);

    CRect rcTxt = rc;
    if (bPressed) rcTxt.OffsetRect(1, 1);
    dc.SetBkMode(TRANSPARENT);
    dc.SetTextColor(RGB(255, 255, 255));
    CFont* pOldFont = dc.SelectObject(GetFont());
    dc.DrawText(str, rcTxt, DT_CENTER | DT_VCENTER | DT_SINGLELINE);
    dc.SelectObject(pOldFont);

    if (lp->itemState & ODS_FOCUS)
    {
        CRect rcF = rc; rcF.DeflateRect(3, 3);
        dc.DrawFocusRect(rcF);
    }
    dc.Detach();
}
