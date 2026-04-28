# Field Dictionary

Produced by screen-analyzer (Step 2). Documents every field on every screen identified in the legacy codebase.

**Grounding key:** [SG] = source-grounded | [SD] = sample-derived | [inferred] = reasoned from context | [placeholder] = synthetic sample value | [SG concept / SD impl] = concept confirmed, exact implementation is sample-derived

---

## Loan Search (`IDD_LOAN_SEARCH`)

| Field ID | Label | Control Type | Screen | Binding / Data Element | Purpose | Evidence | Grounding | Confidence |
|---|---|---|---|---|---|---|---|---|
| IDC_EDIT_LOAN_NUM | Loan Number | EditText | Loan Search | `m_strLoanNum` | Exact 10-digit loan lookup input | `sample-project/src/LoanSearchDlg.cpp` (`DDX_Text`) + `sample-project/src/TrackAllClientManagerLegacy.rc` | [SG] | High |
| IDC_EDIT_BORROWER_NAME | Borrower Name | EditText | Loan Search | `m_strBorrowerName` | Borrower-name search criterion | `sample-project/src/LoanSearchDlg.cpp` (`DDX_Text`) + `sample-project/src/TrackAllClientManagerLegacy.rc` | [SG] | High |
| IDC_EDIT_PROPERTY_ADDRESS | Property Address | EditText | Loan Search | `m_strPropertyAddress` | Address-based search criterion | `sample-project/src/LoanSearchDlg.cpp` (`DDX_Text`, validation branch) + `sample-project/src/TrackAllClientManagerLegacy.rc` | [SG] | High |
| IDC_BUTTON_LOAN_SEARCH | Search | PushButton | Loan Search | `OnBnClickedSearch` | Triggers validation and LOAN_SEARCH dispatch path | `sample-project/src/LoanSearchDlg.cpp` (`BEGIN_MESSAGE_MAP`, `OnBnClickedSearch`) | [SG] | High |
| IDC_LIST_LOAN_RESULTS | (results list) | SysListView32 | Loan Search | `m_lstResults` | Displays search result set and selection context for Modify | `sample-project/src/LoanSearchDlg.cpp` (`DDX_Control`, `PopulateResultList`) + `sample-project/src/TrackAllClientManagerLegacy.rc` | [SG] | High |
| IDC_STATIC_QUOTE | (quote/status) | StaticText | Loan Search | `m_strQuoteResult` | Displays quote outcome or suppression message | `sample-project/src/LoanSearchDlg.cpp` (`DDX_Text`, `ProcessLoanResult`) + `sample-project/src/TrackAllClientManagerLegacy.rc` | [SG] | High |

## Add Loan (`IDD_LOAN_ADD`)

| Field ID | Label | Control Type | Screen | Binding / Data Element | Purpose | Evidence | Grounding | Confidence |
|---|---|---|---|---|---|---|---|---|
| IDC_EDIT_ADD_LOAN_NUM | Loan Number | EditText | Add Loan | `m_strLoanNum` | New-loan identifier | `sample-project/src/LoanAddDlg.cpp` (`DDX_Text`) + `sample-project/src/TrackAllClientManagerLegacy.rc` | [SG] | High |
| IDC_EDIT_ADD_BORROWER_NAME | Borrower Name | EditText | Add Loan | `m_strBorrowerName` | Borrower display name | `sample-project/src/LoanAddDlg.cpp` (`DDX_Text`) + `sample-project/src/TrackAllClientManagerLegacy.rc` | [SG] | High |
| IDC_EDIT_ADD_PROPERTY_STATE | Property State | EditText | Add Loan | `m_strPropertyState` | State code used in rating/eligibility | `sample-project/src/LoanAddDlg.cpp` (`DDX_Text`) + `sample-project/src/TrackAllClientManagerLegacy.rc` | [SG] | High |
| IDC_EDIT_ADD_COVERAGE_TYPE | Coverage Type | EditText | Add Loan | `m_strCoverageType` | Coverage line selection | `sample-project/src/LoanAddDlg.cpp` + `sample-project/src/TrackAllClientManagerLegacy.rc` | [SG] | High |
| IDC_EDIT_ADD_PROPERTY_ADDR | Property Address | EditText | Add Loan | `m_strPropertyAddress` | Required collateral address field | `sample-project/src/LoanAddDlg.cpp` + `sample-project/src/TrackAllClientManagerLegacy.rc` | [SG] | High |
| IDC_EDIT_ADD_PROPERTY_CITY | City | EditText | Add Loan | `m_strPropertyCity` | Property city | `sample-project/src/LoanAddDlg.cpp` + `sample-project/src/TrackAllClientManagerLegacy.rc` | [SG] | High |
| IDC_EDIT_ADD_PROPERTY_ZIP | ZIP | EditText | Add Loan | `m_strPropertyZip` | Property ZIP/postal code | `sample-project/src/LoanAddDlg.cpp` + `sample-project/src/TrackAllClientManagerLegacy.rc` | [SG] | High |
| IDC_EDIT_ADD_PROPERTY_TYPE | Property Type | EditText | Add Loan | `m_strPropertyType` | Property class (`RESIDENTIAL`/`COMMERCIAL`) | `sample-project/src/LoanAddDlg.cpp` (rule comments) + `sample-project/src/Loan.h` | [SG] | High |
| IDC_EDIT_ADD_BORROWER_PHONE | Borrower Phone | EditText | Add Loan | `m_strBorrowerPhone` | Borrower contact number | `sample-project/src/LoanAddDlg.cpp` + `sample-project/src/TrackAllClientManagerLegacy.rc` | [SG] | High |
| IDC_EDIT_ADD_FCI_CODE | FCI Code | EditText | Add Loan | `m_strFciCode` | Servicer code used by EDI formatter | `sample-project/src/LoanAddDlg.cpp` + `sample-project/src/EDINotificationWriter.cpp` | [SG] | High |
| IDC_EDIT_ADD_LOAN_STATUS | Loan Status | EditText | Add Loan | `m_strLoanStatus` | Initial status; validated to `ACTIVE` at create time | `sample-project/src/LoanAddDlg.cpp` (validation comments) | [SG] | High |
| IDC_EDIT_ADD_PROPERTY_VALUE | Property Value ($) | EditText (numeric) | Add Loan | `m_nPropertyValue` | Collateral value used by rating and checks | `sample-project/src/LoanAddDlg.cpp` + `sample-project/src/TrackAllClientManagerLegacy.rc` | [SG] | High |
| IDC_EDIT_ADD_UPB | UPB ($) | EditText (numeric) | Add Loan | `m_nUpb` | Unpaid principal balance input | `sample-project/src/LoanAddDlg.cpp` + `sample-project/src/TrackAllClientManagerLegacy.rc` | [SG] | High |
| IDC_BUTTON_LOAN_ADD | Add Loan | Default PushButton | Add Loan | `OnBnClickedAdd` | Executes add validation and dispatches `ADD_LOAN` | `sample-project/src/LoanAddDlg.cpp` (`BEGIN_MESSAGE_MAP`, `OnBnClickedAdd`) | [SG] | High |

## Modify Loan (`IDD_LOAN_MODIFY`)

| Field ID | Label | Control Type | Screen | Binding / Data Element | Purpose | Evidence | Grounding | Confidence |
|---|---|---|---|---|---|---|---|---|
| IDC_STATIC_MODIFY_LOAN_NUM | Loan Number | StaticText | Modify Loan | `m_strLoanNumDisplay` | Read-only immutable loan identifier | `sample-project/src/LoanModifyDlg.cpp` (`OnInitDialog`) + `sample-project/src/TrackAllClientManagerLegacy.rc` | [SG] | High |
| IDC_EDIT_MODIFY_BORROWER_NAME | Borrower Name | EditText | Modify Loan | `m_strBorrowerName` | Borrower name update field | `sample-project/src/LoanModifyDlg.cpp` | [SG] | High |
| IDC_EDIT_MODIFY_PROPERTY_ADDR | Property Address | EditText | Modify Loan | `m_strPropertyAddress` | Address update field (cannot be cleared by rule) | `sample-project/src/LoanModifyDlg.cpp` (validation comments) | [SG] | High |
| IDC_EDIT_MODIFY_PROPERTY_CITY | City | EditText | Modify Loan | `m_strPropertyCity` | Property city update | `sample-project/src/LoanModifyDlg.cpp` | [SG] | High |
| IDC_EDIT_MODIFY_PROPERTY_ZIP | ZIP | EditText | Modify Loan | `m_strPropertyZip` | Property ZIP update | `sample-project/src/LoanModifyDlg.cpp` | [SG] | High |
| IDC_EDIT_MODIFY_BORROWER_PHONE | Borrower Phone | EditText | Modify Loan | `m_strBorrowerPhone` | Borrower contact update | `sample-project/src/LoanModifyDlg.cpp` | [SG] | High |
| IDC_EDIT_MODIFY_LOAN_STATUS | Loan Status | EditText | Modify Loan | `m_strLoanStatus` | Status transition field (`ACTIVE`->`DELINQUENT`->`CLOSED`) | `sample-project/src/LoanModifyDlg.cpp` (validation comments) | [SG] | High |
| IDC_EDIT_MODIFY_MORTGAGEE_CLAUSE | Mortgagee Clause | EditText | Modify Loan | `m_strMortgageeClause` | Clause text update | `sample-project/src/LoanModifyDlg.cpp` | [SG] | High |
| IDC_EDIT_MODIFY_UPB | UPB ($) | EditText (numeric) | Modify Loan | `m_nUpb` | UPB adjustment (cannot increase by rule) | `sample-project/src/LoanModifyDlg.cpp` (validation comments) | [SG] | High |
| IDC_EDIT_MODIFY_PROPERTY_VALUE | Property Value ($) | EditText (numeric) | Modify Loan | `m_nPropertyValue` | Property value update | `sample-project/src/LoanModifyDlg.cpp` | [SG] | High |
| IDC_BUTTON_LOAN_MODIFY | Save Changes | Default PushButton | Modify Loan | `OnBnClickedModify` | Executes modify validation and dispatches `MODIFY_LOAN` | `sample-project/src/LoanModifyDlg.cpp` (`BEGIN_MESSAGE_MAP`, `OnBnClickedModify`) | [SG] | High |
