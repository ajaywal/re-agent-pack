#include "LoanModifyDlg.h"
#include <dwmapi.h>
#pragma comment(lib, "dwmapi.lib")
#ifndef DWMWA_CAPTION_COLOR
#define DWMWA_CAPTION_COLOR 35
#endif

BEGIN_MESSAGE_MAP(CLoanModifyDlg, CDialog)
    ON_BN_CLICKED(IDC_BUTTON_LOAN_MODIFY, OnBnClickedModify)
    ON_WM_CTLCOLOR()
    ON_WM_DRAWITEM()
    ON_WM_ERASEBKGND()
END_MESSAGE_MAP()

CLoanModifyDlg::CLoanModifyDlg(
    const CLoan&    loanOrig,
    CLoanRules*     pLoanRules,
    CTMELibAdapter* pTmeAdapter,
    CWnd*           pParent)
    : CDialog(CLoanModifyDlg::IDD, pParent)
    , m_loanOrig(loanOrig)
    , m_pLoanRules(pLoanRules)
    , m_pTmeAdapter(pTmeAdapter)
    , m_nUpb(loanOrig.m_nUnpaidPrincipalBalance)
    , m_nPropertyValue(loanOrig.m_nPropertyValue)
{
}

void CLoanModifyDlg::DoDataExchange(CDataExchange* pDX)
{
    CDialog::DoDataExchange(pDX);
    DDX_Text(pDX, IDC_STATIC_MODIFY_LOAN_NUM,      m_strLoanNumDisplay);
    DDX_Text(pDX, IDC_EDIT_MODIFY_BORROWER_NAME,   m_strBorrowerName);
    DDX_Text(pDX, IDC_EDIT_MODIFY_PROPERTY_ADDR,   m_strPropertyAddress);
    DDX_Text(pDX, IDC_EDIT_MODIFY_PROPERTY_CITY,   m_strPropertyCity);
    DDX_Text(pDX, IDC_EDIT_MODIFY_PROPERTY_ZIP,    m_strPropertyZip);
    DDX_Text(pDX, IDC_EDIT_MODIFY_BORROWER_PHONE,  m_strBorrowerPhone);
    DDX_Text(pDX, IDC_EDIT_MODIFY_LOAN_STATUS,     m_strLoanStatus);
    DDX_Text(pDX, IDC_EDIT_MODIFY_MORTGAGEE_CLAUSE,m_strMortgageeClause);
    DDX_Text(pDX, IDC_EDIT_MODIFY_UPB,             m_nUpb);
    DDX_Text(pDX, IDC_EDIT_MODIFY_PROPERTY_VALUE,  m_nPropertyValue);
}

BOOL CLoanModifyDlg::OnInitDialog()
{
    CDialog::OnInitDialog();

    m_brEditBackground.CreateSolidBrush(RGB(30, 42, 58));

    COLORREF clrCaption = RGB(10, 15, 26);
    DwmSetWindowAttribute(m_hWnd, DWMWA_CAPTION_COLOR, &clrCaption, sizeof(clrCaption));

    // Pre-populate all editable fields from the original loan record.
    // Loan number is displayed read-only to make the immutability rule visible.
    m_strLoanNumDisplay  = m_loanOrig.m_strLoanNum;  // read-only — R-ML-001
    m_strBorrowerName    = m_loanOrig.m_strBorrowerName;
    m_strPropertyAddress = m_loanOrig.m_strPropertyAddress;
    m_strPropertyCity    = m_loanOrig.m_strPropertyCity;
    m_strPropertyZip     = m_loanOrig.m_strPropertyZip;
    m_strBorrowerPhone   = m_loanOrig.m_strBorrowerPhone;
    m_strLoanStatus      = m_loanOrig.m_strLoanStatus;
    m_strMortgageeClause = m_loanOrig.m_strMortgageeClause;
    m_nUpb               = m_loanOrig.m_nUnpaidPrincipalBalance;
    m_nPropertyValue     = m_loanOrig.m_nPropertyValue;

    UpdateData(FALSE);

    return TRUE;
}

void CLoanModifyDlg::OnBnClickedModify()
{
    if (!UpdateData(TRUE))
    {
        return;
    }

    // Build the proposed modified loan from dialog fields.
    // Loan number is copied from original — the UI does not expose it for editing.
    CLoan loanMod;
    loanMod.m_strLoanNum              = m_loanOrig.m_strLoanNum;  // R-ML-001: immutable
    loanMod.m_strClientId             = m_loanOrig.m_strClientId;
    loanMod.m_strBorrowerName         = m_strBorrowerName;
    loanMod.m_strPropertyState        = m_loanOrig.m_strPropertyState;
    loanMod.m_strCoverageType         = m_loanOrig.m_strCoverageType;
    loanMod.m_strFciCode              = m_loanOrig.m_strFciCode;
    loanMod.m_strEdiFlag              = m_loanOrig.m_strEdiFlag;
    loanMod.m_strQuoteReqd            = m_loanOrig.m_strQuoteReqd;
    loanMod.m_strCycleType            = m_loanOrig.m_strCycleType;
    loanMod.m_strPropertyAddress      = m_strPropertyAddress;
    loanMod.m_strPropertyCity         = m_strPropertyCity;
    loanMod.m_strPropertyZip          = m_strPropertyZip;
    loanMod.m_strBorrowerPhone        = m_strBorrowerPhone;
    loanMod.m_strLoanStatus           = m_strLoanStatus;
    loanMod.m_strMortgageeClause      = m_strMortgageeClause;
    loanMod.m_nUnpaidPrincipalBalance = m_nUpb;
    loanMod.m_nPropertyValue          = m_nPropertyValue;
    loanMod.m_strPropertyType         = m_loanOrig.m_strPropertyType;

    if (m_pLoanRules == NULL)
    {
        AfxMessageBox(_T("Loan rules are not available."), MB_OK | MB_ICONERROR);
        return;
    }

    CString strErrorMessage;

    // Delegate modification validation to CLoanRules::ValidateLoanForModify.
    // Rules enforced:
    //   R-ML-001: loan number cannot be changed
    //   R-ML-002: status transition must be ACTIVE→DELINQUENT or DELINQUENT→CLOSED
    //   R-ML-003: UPB cannot increase
    //   R-ML-004: property address cannot be cleared
    if (!m_pLoanRules->ValidateLoanForModify(m_loanOrig, loanMod, strErrorMessage))
    {
        AfxMessageBox(strErrorMessage, MB_OK | MB_ICONWARNING);
        return;
    }

    if (m_pTmeAdapter == NULL)
    {
        AfxMessageBox(_T("TME adapter is not available."), MB_OK | MB_ICONERROR);
        return;
    }

    // Dispatch MODIFY_LOAN request to Tandem backend via TME.
    // The mnemonic MODIFY_LOAN routes to program TKA902 per LSS001T.
    // TKA902 performs a final server-side validation and executes the
    // UPDATE against LSS_LOAN_T for the matching LOAN_NUM.
    CString strRequestData;
    strRequestData.Format(
        _T("LOAN_NUM=%s|BORROWER_NAME=%s|LOAN_STATUS=%s|UPB=%ld")
        _T("|PROPERTY_VALUE=%d|PROPERTY_ADDRESS=%s|MORTGAGEE_CLAUSE=%s"),
        loanMod.m_strLoanNum.GetString(),
        loanMod.m_strBorrowerName.GetString(),
        loanMod.m_strLoanStatus.GetString(),
        loanMod.m_nUnpaidPrincipalBalance,
        loanMod.m_nPropertyValue,
        loanMod.m_strPropertyAddress.GetString(),
        loanMod.m_strMortgageeClause.GetString());

    CString strResponseData;
    CString strTmeError;

    BOOL bOk = m_pTmeAdapter->SendMessage(
        _T("MODIFY_LOAN"),
        strRequestData,
        strResponseData,
        strTmeError);

    if (!bOk)
    {
        AfxMessageBox(strTmeError, MB_OK | MB_ICONERROR);
        return;
    }

    AfxMessageBox(
        _T("Loan updated successfully."),
        MB_OK | MB_ICONINFORMATION);

    m_loanModified = loanMod;
    EndDialog(IDOK);
}

BOOL CLoanModifyDlg::OnEraseBkgnd(CDC* pDC)
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

HBRUSH CLoanModifyDlg::OnCtlColor(CDC* pDC, CWnd* pWnd, UINT nCtlColor)
{
    if (nCtlColor == CTLCOLOR_DLG)
    {
        return (HBRUSH)GetStockObject(NULL_BRUSH);
    }
    if (nCtlColor == CTLCOLOR_STATIC)
    {
        pDC->SetBkMode(TRANSPARENT);
        UINT nID = static_cast<UINT>(pWnd->GetDlgCtrlID());
        if (nID == IDC_STATIC_MODIFY_LOAN_NUM)
            pDC->SetTextColor(RGB(85, 153, 255));  // electric blue — read-only, R-ML-001
        else
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

void CLoanModifyDlg::OnDrawItem(int nIDCtl, LPDRAWITEMSTRUCT lp)
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
