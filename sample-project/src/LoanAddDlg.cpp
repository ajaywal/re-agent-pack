#include "LoanAddDlg.h"
#include <dwmapi.h>
#pragma comment(lib, "dwmapi.lib")
#ifndef DWMWA_CAPTION_COLOR
#define DWMWA_CAPTION_COLOR 35
#endif

BEGIN_MESSAGE_MAP(CLoanAddDlg, CDialog)
    ON_BN_CLICKED(IDC_BUTTON_LOAN_ADD, OnBnClickedAdd)
    ON_WM_CTLCOLOR()
    ON_WM_DRAWITEM()
    ON_WM_ERASEBKGND()
END_MESSAGE_MAP()

CLoanAddDlg::CLoanAddDlg(
    CLoanRules*     pLoanRules,
    CTMELibAdapter* pTmeAdapter,
    CWnd*           pParent)
    : CDialog(CLoanAddDlg::IDD, pParent)
    , m_pLoanRules(pLoanRules)
    , m_pTmeAdapter(pTmeAdapter)
    , m_nPropertyValue(0)
    , m_nUpb(0)
{
}

void CLoanAddDlg::DoDataExchange(CDataExchange* pDX)
{
    CDialog::DoDataExchange(pDX);
    DDX_Text(pDX, IDC_EDIT_ADD_LOAN_NUM,       m_strLoanNum);
    DDX_Text(pDX, IDC_EDIT_ADD_BORROWER_NAME,  m_strBorrowerName);
    DDX_Text(pDX, IDC_EDIT_ADD_PROPERTY_STATE, m_strPropertyState);
    DDX_Text(pDX, IDC_EDIT_ADD_COVERAGE_TYPE,  m_strCoverageType);
    DDX_Text(pDX, IDC_EDIT_ADD_PROPERTY_ADDR,  m_strPropertyAddress);
    DDX_Text(pDX, IDC_EDIT_ADD_PROPERTY_CITY,  m_strPropertyCity);
    DDX_Text(pDX, IDC_EDIT_ADD_PROPERTY_ZIP,   m_strPropertyZip);
    DDX_Text(pDX, IDC_EDIT_ADD_PROPERTY_TYPE,  m_strPropertyType);
    DDX_Text(pDX, IDC_EDIT_ADD_BORROWER_PHONE, m_strBorrowerPhone);
    DDX_Text(pDX, IDC_EDIT_ADD_FCI_CODE,       m_strFciCode);
    DDX_Text(pDX, IDC_EDIT_ADD_LOAN_STATUS,    m_strLoanStatus);
    DDX_Text(pDX, IDC_EDIT_ADD_PROPERTY_VALUE, m_nPropertyValue);
    DDX_Text(pDX, IDC_EDIT_ADD_UPB,            m_nUpb);
}

BOOL CLoanAddDlg::OnInitDialog()
{
    CDialog::OnInitDialog();

    m_brEditBackground.CreateSolidBrush(RGB(30, 42, 58));

    COLORREF clrCaption = RGB(10, 15, 26);
    DwmSetWindowAttribute(m_hWnd, DWMWA_CAPTION_COLOR, &clrCaption, sizeof(clrCaption));

    // Pre-populate with a representative seed loan so the walkthrough can
    // demonstrate the Add Loan validation path without manual data entry.
    // In production, all fields start blank and the user enters loan details
    // received from the 48R file or SSP/Black Knight boarding feed.

    m_strLoanNum        = _T("0000300003");
    m_strBorrowerName   = _T("Williams, James");
    m_strPropertyState  = _T("FL");
    m_strCoverageType   = _T("Hazard");
    m_strPropertyAddress= _T("742 Evergreen Terrace");
    m_strPropertyCity   = _T("Miami");
    m_strPropertyZip    = _T("33101");
    m_strPropertyType   = _T("RESIDENTIAL");
    m_strBorrowerPhone  = _T("305-555-0142");
    m_strFciCode        = _T("BK-0099");
    m_strLoanStatus     = _T("ACTIVE");   // R-AL-005: must be ACTIVE on creation
    m_nPropertyValue    = 320000;
    m_nUpb              = 295000;

    UpdateData(FALSE);

    return TRUE;
}

void CLoanAddDlg::OnBnClickedAdd()
{
    if (!UpdateData(TRUE))
    {
        return;
    }

    // Build CLoan from dialog fields for validation.
    m_loan.m_strLoanNum              = m_strLoanNum;
    m_loan.m_strBorrowerName         = m_strBorrowerName;
    m_loan.m_strPropertyState        = m_strPropertyState;
    m_loan.m_strCoverageType         = m_strCoverageType;
    m_loan.m_strPropertyAddress      = m_strPropertyAddress;
    m_loan.m_strPropertyCity         = m_strPropertyCity;
    m_loan.m_strPropertyZip          = m_strPropertyZip;
    m_loan.m_strPropertyType         = m_strPropertyType;
    m_loan.m_strBorrowerPhone        = m_strBorrowerPhone;
    m_loan.m_strFciCode              = m_strFciCode;
    m_loan.m_strLoanStatus           = m_strLoanStatus;
    m_loan.m_nPropertyValue          = m_nPropertyValue;
    m_loan.m_nUnpaidPrincipalBalance = m_nUpb;

    if (m_pLoanRules == NULL)
    {
        AfxMessageBox(_T("Loan rules are not available."), MB_OK | MB_ICONERROR);
        return;
    }

    CString strErrorMessage;

    // Delegate all input validation to CLoanRules::ValidateLoanForAdd.
    // Rules enforced:
    //   R-AL-001: loan number + borrower name required
    //   R-AL-002: loan number exactly 10 digits, digits only
    //   R-AL-003: property value > 0
    //   R-AL-004: property address non-empty
    //   R-AL-005: initial status must be ACTIVE
    //   R-AL-006: UPB must be > 0
    //   R-AL-007: property type must be RESIDENTIAL or COMMERCIAL
    if (!m_pLoanRules->ValidateLoanForAdd(m_loan, strErrorMessage))
    {
        AfxMessageBox(strErrorMessage, MB_OK | MB_ICONWARNING);
        return;
    }

    if (m_pTmeAdapter == NULL)
    {
        AfxMessageBox(_T("TME adapter is not available."), MB_OK | MB_ICONERROR);
        return;
    }

    // Dispatch ADD_LOAN request to Tandem backend via TME.
    // The mnemonic ADD_LOAN routes to program TKA901 per LSS001T.
    // TKA901 inserts the new loan record into LSS_LOAN_T with LOAN_STATUS = 'ACTIVE'.
    CString strRequestData;
    strRequestData.Format(
        _T("LOAN_NUM=%s|BORROWER_NAME=%s|PROPERTY_STATE=%s|COVERAGE_TYPE=%s")
        _T("|PROPERTY_VALUE=%d|UPB=%ld|LOAN_STATUS=%s|PROPERTY_TYPE=%s")
        _T("|PROPERTY_ADDRESS=%s|FCI_CODE=%s"),
        m_loan.m_strLoanNum.GetString(),
        m_loan.m_strBorrowerName.GetString(),
        m_loan.m_strPropertyState.GetString(),
        m_loan.m_strCoverageType.GetString(),
        m_loan.m_nPropertyValue,
        m_loan.m_nUnpaidPrincipalBalance,
        m_loan.m_strLoanStatus.GetString(),
        m_loan.m_strPropertyType.GetString(),
        m_loan.m_strPropertyAddress.GetString(),
        m_loan.m_strFciCode.GetString());

    CString strResponseData;
    CString strTmeError;

    BOOL bOk = m_pTmeAdapter->SendMessage(
        _T("ADD_LOAN"),
        strRequestData,
        strResponseData,
        strTmeError);

    if (!bOk)
    {
        AfxMessageBox(strTmeError, MB_OK | MB_ICONERROR);
        return;
    }

    AfxMessageBox(
        _T("Loan added successfully."),
        MB_OK | MB_ICONINFORMATION);

    EndDialog(IDOK);
}

BOOL CLoanAddDlg::OnEraseBkgnd(CDC* pDC)
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

HBRUSH CLoanAddDlg::OnCtlColor(CDC* pDC, CWnd* pWnd, UINT nCtlColor)
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

void CLoanAddDlg::OnDrawItem(int nIDCtl, LPDRAWITEMSTRUCT lp)
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
