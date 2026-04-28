#include "LoanAddDlg.h"

BEGIN_MESSAGE_MAP(CLoanAddDlg, CDialog)
    ON_BN_CLICKED(IDC_BUTTON_LOAN_ADD, OnBnClickedAdd)
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
