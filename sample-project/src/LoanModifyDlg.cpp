#include "LoanModifyDlg.h"

BEGIN_MESSAGE_MAP(CLoanModifyDlg, CDialog)
    ON_BN_CLICKED(IDC_BUTTON_LOAN_MODIFY, OnBnClickedModify)
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

    EndDialog(IDOK);
}
