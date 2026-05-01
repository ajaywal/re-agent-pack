// Business rules extracted from legacy codebase — rule_register.governance.md
// Source: LoanRules.cpp, LoanRules.h, TKA900/901/902.cbl, RataBaseServiceAdapter.cpp, EDINotificationWriter.cpp
export const BRS = [
  {
    id: 'R-L-001', cat: 'Search Validation', imp: 'High',
    rule: 'At least one search criterion (loan number or borrower name) must be supplied. An empty request would cause TKA900 on the Tandem backend to execute an unrestricted scan against LSS_LOAN_T — rejected by the COBOL 2000-VALIDATE-INPUT paragraph (STATUS-CODE 9001).',
    legacy: {
      cobol: [{ file: 'TKA900.cbl', para: '2000-VALIDATE-INPUT', lines: '~65-70', desc: 'IF WS-LOAN-NUM = SPACES AND WS-BORROWER-NAME = SPACES MOVE "9001" TO WS-STATUS-CODE.' }],
      cpp: [{ file: 'LoanRules.cpp', func: 'ValidateLoanForSearch()', lines: '~80-89', desc: 'Client-side mirror of TKA900 check. Returns FALSE with "At least one search criterion required." error.' }],
      dataItems: ['WS-LOAN-NUM PIC X(10)', 'WS-BORROWER-NAME PIC X(40)', 'WS-STATUS-CODE PIC X(4)'],
      ksds: ['LSS_LOAN_T'],
    },
    impact: ['LOAN_SEARCH TME message not dispatched if both fields blank', 'User shown error before fgatetcp send', 'TKA900 rejects at 2000-VALIDATE-INPUT if client check bypassed'],
    testCases: ['TC-001 — valid loan number search', 'TC-002 — both fields empty triggers R-L-001'],
    migration: 'Angular FormGroup: at least one of loanNum/borrowerName required. API-layer guard rejects blank request before Tandem call.',
    code: `// Angular validator
function atLeastOne(g: FormGroup) {
  return g.value.loanNum?.trim() || g.value.borrowerName?.trim()
    ? null : { atLeastOne: true };
}`,
  },
  {
    id: 'R-L-002', cat: 'Search Validation', imp: 'High',
    rule: 'Loan number must be exactly 10 numeric digits. LSS_LOAN_T defines LOAN_NUM as CHAR(10) NOT NULL. A shorter value fails the SQL equality match in TKA900 3000-QUERY-LOAN; a longer value is rejected at the TME serialisation layer.',
    legacy: {
      cobol: [{ file: 'TKA900.cbl', para: '3000-QUERY-LOAN', lines: '~80-105', desc: 'WHERE LOAN_NUM = :WS-LOAN-NUM — SQL equality match on CHAR(10) column. Length mismatch causes no match.' }],
      cpp: [{ file: 'LoanRules.cpp', func: 'ValidateLoanForSearch()', lines: '~92-110', desc: 'strNum.GetLength() != 10 → FALSE. Loop _istdigit() check on each character.' }],
      dataItems: ['LSS_LOAN_T.LOAN_NUM CHAR(10) NOT NULL', 'WS-LOAN-NUM PIC X(10)'],
      ksds: ['LSS_LOAN_T'],
    },
    impact: ['LOAN_SEARCH TME message rejected if loan number format invalid', 'Tandem SQL index on LOAN_NUM built on numeric character set — alpha chars cause no match'],
    testCases: ['TC-003 — 9-digit number triggers R-L-002', 'TC-001 — 10-digit valid number succeeds'],
    migration: 'Angular Validators.pattern(/^\\d{10}$/). API validates before SQL query. Azure SQL NVARCHAR(10) preserves CHAR(10) semantics.',
    code: `// Angular validator
loanNum: ['', [Validators.pattern(/^\\d{10}$/)]],`,
  },
  {
    id: 'R-L-003', cat: 'Quote Eligibility', imp: 'Critical',
    rule: 'Property state must be in the approved RataBase carrier coverage list (23 states: AL, AZ, CA, CO, FL, GA, IL, IN, KY, MD, MI, MN, MO, NC, NJ, NY, OH, PA, SC, TN, TX, VA, WI). Loans in non-covered states cannot be rated through RataBase and must follow manual underwriting.',
    legacy: {
      cobol: [],
      cpp: [
        { file: 'LoanRules.cpp', func: 'EnforceCarrierCoverage()', lines: '~115-137', desc: 'IsStateInApprovedCarrierList() check before RataBase quote dispatch. Returns FALSE with state-specific message.' },
        { file: 'LoanRules.cpp', func: 'LoadApprovedCarrierStates()', lines: '~13-31', desc: 'Hardcoded array of 23 state codes. In production loaded from carrier eligibility table at startup.' },
      ],
      dataItems: ['m_approvedCarrierStates std::vector<CString>', 'CLoan.m_strPropertyState CHAR(2)'],
      ksds: [],
    },
    impact: ['RataBase QUOTE_REQUEST TME not dispatched for unapproved states', 'Manual underwriting referral required', 'QUOTE_REQD flag irrelevant if state blocked'],
    testCases: ['TC-004 — WV property (not approved) triggers R-L-003', 'TC-001 — KY approved state proceeds to quote'],
    migration: 'static ImmutableHashSet<string> ApprovedStates loaded from config. QuoteOrchestrationService.ValidateCarrierEligibility() returns 422 if state not in set.',
    code: `private static readonly ImmutableHashSet<string> _approvedStates =
  ImmutableHashSet.Create("AL","AZ","CA","CO","FL","GA","IL","IN",
    "KY","MD","MI","MN","MO","NC","NJ","NY","OH","PA","SC","TN","TX","VA","WI");`,
  },
  {
    id: 'R-L-004', cat: 'Quote Eligibility', imp: 'High',
    rule: 'Kentucky (KY) property loans require an ISO advisory pre-call to Tandem program AIP930 (mnemonic KY_ISO_QUERY) before the RataBase quote request. AIP930 returns fire class, construction type, and territory code used in the rating calculation.',
    legacy: {
      cobol: [],
      cpp: [
        { file: 'RataBaseServiceAdapter.cpp', func: 'GetQuote()', lines: '~55-65', desc: 'if (strState == "KY") m_kyAdapter.GetKentuckyContext() call before QUOTE_REQUEST dispatch.' },
        { file: 'RataBaseServiceAdapter.cpp', func: 'CKentuckyISOAdapter::GetKentuckyContext()', lines: '~1-40', desc: 'Dispatches KY_ISO_QUERY TME to AIP930. Returns fire class, construction type, territory code.' },
      ],
      dataItems: ['CLoan.m_strPropertyState CHAR(2)', 'KY_ISO_QUERY mnemonic → AIP930 in LSS001T'],
      ksds: [],
    },
    impact: ['Extra TME round-trip for KY loans adds ~2s latency', 'KY_ISO_QUERY → AIP930 routing must be preserved in migration', 'ISO context data fed into RataBase quote request body'],
    testCases: ['TC-005 — KY loan triggers ISO pre-call before quote'],
    migration: 'IKentuckyIsoAdapter port injected into QuoteOrchestrationService. KY branch: await _kyIsoAdapter.GetContextAsync(loanNum) before quote call.',
    code: `if (loan.PropertyState == "KY")
{
    var kyCtx = await _kentuckyIsoAdapter.GetContextAsync(loan.LoanNum);
    quoteRequest.FireClass        = kyCtx.FireClass;
    quoteRequest.ConstructionType = kyCtx.ConstructionType;
}`,
  },
  {
    id: 'R-L-005', cat: 'Quote Orchestration', imp: 'High',
    rule: 'A RataBase premium quote is triggered only when QUOTE_REQD = \'Y\' on LSS_CYCLE_STEP_T for the loan\'s client ID. The flag is returned by TKA900 in the LOAN_SEARCH response via the 4000-QUERY-CYCLE-STEP paragraph.',
    legacy: {
      cobol: [{ file: 'TKA900.cbl', para: '4000-QUERY-CYCLE-STEP', lines: '~115-135', desc: 'SELECT QUOTE_REQD, CYCLE_TYPE FROM LSS_CYCLE_STEP_T WHERE CLIENT_ID = :WS-RESP-CLIENT-ID.' }],
      cpp: [{ file: 'LoanRules.cpp', func: 'RequiresQuote()', lines: '~175-179', desc: 'return loan.m_strQuoteReqd.CompareNoCase("Y") == 0. Called in ProcessLoanResult().' }],
      dataItems: ['CLoan.m_strQuoteReqd CHAR(1)', 'LSS_CYCLE_STEP_T.QUOTE_REQD CHAR(1) DEFAULT "N"'],
      ksds: ['LSS_CYCLE_STEP_T'],
    },
    impact: ['RataBase call only made when QUOTE_REQD=Y — avoids unnecessary external service calls', 'ProcessLoanResult() gate controls quote → 14E pipeline'],
    testCases: ['TC-006 — QUOTE_REQD=N skips quote; TC-001 — QUOTE_REQD=Y triggers quote'],
    migration: 'CycleStepService.GetCycleConfig(clientId) returns QuoteRequired bool. QuoteOrchestrationService checks before dispatching to RataBase.',
    code: `var cycleConfig = await _cycleStepService.GetAsync(loan.ClientId);
if (cycleConfig.QuoteRequired)
    quote = await _rataBaseAdapter.GetQuoteAsync(loan);`,
  },
  {
    id: 'R-L-006', cat: 'EDI Eligibility', imp: 'Critical',
    rule: 'EDI_FLAG must be \'Y\' on LSS_LOAN_T for the loan to receive an outbound 14E notification. EDI_FLAG is returned by TKA900 in the LOAN_SEARCH response. Loans without active EDI enrollment do not generate 14E records.',
    legacy: {
      cobol: [{ file: 'TKA900.cbl', para: '3000-QUERY-LOAN', lines: '~80-105', desc: 'SELECT EDI_FLAG FROM LSS_LOAN_T. Returned in WS-RESP-EDI-FLAG PIC X(1).' }],
      cpp: [
        { file: 'LoanRules.cpp', func: 'EnforceEdiEligibility()', lines: '~148-163', desc: 'if (loan.m_strEdiFlag.CompareNoCase("Y") != 0) → FALSE with "EDI notification skipped" message.' },
        { file: 'EDINotificationWriter.cpp', func: 'Write14ERecord()', lines: '~20-30', desc: 'Calls EnforceEdiEligibility() as first gate before 14E dispatch.' },
      ],
      dataItems: ['LSS_LOAN_T.EDI_FLAG CHAR(1) DEFAULT "N"', 'CLoan.m_strEdiFlag CHAR(1)'],
      ksds: ['LSS_LOAN_T'],
    },
    impact: ['14E_NOTIFY TME not dispatched for EDI_FLAG=N loans', 'No audit needed for suppressed notifications', 'Migration must preserve enrollment flag semantics'],
    testCases: ['TC-007 — EDI_FLAG=N blocks 14E dispatch'],
    migration: 'LoanEntity.EdiFlag bool property. EdiNotificationService.EnforceEnrollment() returns EdiSuppressedResult if false.',
    code: `if (!loan.EdiFlag)
    return EdiResult.Suppressed("EDI_FLAG is not Y — notification skipped.");`,
  },
  {
    id: 'R-L-007', cat: 'EDI Eligibility', imp: 'High',
    rule: 'Loans with CYCLE_TYPE = \'INSTANT_ISSUE\' on LSS_CYCLE_STEP_T do not receive 14E notifications. Instant Issue policies generate their own notification path through certificate issuance — a separate 14E would create a duplicate at the servicer\'s EDI processor.',
    legacy: {
      cobol: [{ file: 'TKA900.cbl', para: '4000-QUERY-CYCLE-STEP', lines: '~115-135', desc: 'SELECT CYCLE_TYPE FROM LSS_CYCLE_STEP_T. CYCLE_TYPE INSTANT_ISSUE suppresses 14E output.' }],
      cpp: [{ file: 'LoanRules.cpp', func: 'EnforceEdiEligibility()', lines: '~165-172', desc: 'if (loan.m_strCycleType.CompareNoCase("INSTANT_ISSUE") == 0) → FALSE with suppression message.' }],
      dataItems: ['LSS_CYCLE_STEP_T.CYCLE_TYPE CHAR(20)', 'CLoan.m_strCycleType CHAR(20)'],
      ksds: ['LSS_CYCLE_STEP_T'],
    },
    impact: ['14E suppressed entirely for INSTANT_ISSUE — not an error, expected behavior', 'Servicer receives certificate issuance notification instead', 'Migration must distinguish SUPPRESSED from ERROR'],
    testCases: ['TC-008 — INSTANT_ISSUE cycle suppresses 14E (loan 0000300003)'],
    migration: 'EdiNotificationService checks CycleType == "INSTANT_ISSUE" → return EdiResult.Suppressed("INSTANT_ISSUE cycle does not generate 14E").',
    code: `if (loan.CycleType == "INSTANT_ISSUE")
    return EdiResult.Suppressed("14E blocked: Instant Issue cycle.");`,
  },
  {
    id: 'R-L-008', cat: 'EDI Eligibility', imp: 'High',
    rule: 'The form ID used in the 14E notification must be registered in the lender_target table (LT-F100, LT-F200, LT-F300, LT-F400). An unrecognised form ID would produce a 14E record the downstream EDI processor cannot route, requiring manual correction.',
    legacy: {
      cobol: [],
      cpp: [
        { file: 'LoanRules.cpp', func: 'IsFormIdInLenderTarget()', lines: '~57-66', desc: 'Linear scan of m_lenderTargetForms vector. Case-insensitive CString comparison.' },
        { file: 'LoanRules.cpp', func: 'LoadLenderTargetForms()', lines: '~33-40', desc: 'Hardcoded: LT-F100, LT-F200, LT-F300, LT-F400. In production loaded from lender_target DB table.' },
      ],
      dataItems: ['m_lenderTargetForms std::vector<CString>', 'lender_target table (DB)'],
      ksds: [],
    },
    impact: ['14E not dispatched for unregistered form IDs', 'Servicer EDI processing exception avoided', 'Form registry must be maintained as table in migration'],
    testCases: ['TC-009 — unregistered form ID LT-F999 blocks 14E'],
    migration: 'LenderTargetRepository.ExistsAsync(formId). EdiNotificationService returns 422 with form-not-registered message.',
    code: `if (!await _lenderTargetRepo.ExistsAsync(formId))
    return EdiResult.Rejected($"Form '{formId}' not registered in lender_target.");`,
  },
  {
    id: 'R-L-009', cat: 'Add Loan Validation', imp: 'Critical',
    rule: 'Loan number and borrower name are both required to register a new loan (R-AL-001). A loan record with no identifier or no named borrower cannot be tracked — TKA901 rejects the INSERT if LOAN_NUM or BORROWER_NAME is blank.',
    legacy: {
      cobol: [{ file: 'TKA901.cbl', para: '2000-VALIDATE-ADD', lines: '~60-75', desc: 'STATUS-CODE 9101 if WS-ADD-LOAN-NUM = SPACES. 9102 if WS-ADD-BORROWER-NAME = SPACES.' }],
      cpp: [{ file: 'LoanRules.cpp', func: 'ValidateLoanForAdd()', lines: '~210-230', desc: 'strNum.IsEmpty() || strName.IsEmpty() → FALSE with "Loan number and borrower name are required" message.' }],
      dataItems: ['LSS_LOAN_T.LOAN_NUM CHAR(10) NOT NULL', 'LSS_LOAN_T.BORROWER_NAME CHAR(40)'],
      ksds: ['LSS_LOAN_T'],
    },
    impact: ['ADD_LOAN TME not dispatched if R-AL-001 fails', 'TKA901 enforces same rule server-side as dual-layer protection'],
    testCases: ['TC-010 — blank loan number triggers R-L-009', 'TC-009 — valid add with all required fields'],
    migration: 'Angular required validators on loanNum and borrowerName. CreateLoanCommand validates before EF Core INSERT.',
    code: `[Required] public string LoanNum { get; set; }
[Required] public string BorrowerName { get; set; }`,
  },
  {
    id: 'R-L-010', cat: 'Add Loan Validation', imp: 'High',
    rule: 'Property value must be greater than zero when adding a loan (R-AL-003). A zero or negative property value indicates data entry error — a loan with no collateral value cannot be rated or insured by the LPI system.',
    legacy: {
      cobol: [{ file: 'TKA901.cbl', para: '2000-VALIDATE-ADD', lines: '~77-82', desc: 'STATUS-CODE 9103 if WS-ADD-PROPERTY-VALUE = 0.' }],
      cpp: [{ file: 'LoanRules.cpp', func: 'ValidateLoanForAdd()', lines: '~245-252', desc: 'if (loan.m_nPropertyValue <= 0) → FALSE with "Property value must be greater than zero" message.' }],
      dataItems: ['LSS_LOAN_T.PROPERTY_VALUE NUMERIC(10) DEFAULT 0', 'CLoan.m_nPropertyValue int'],
      ksds: ['LSS_LOAN_T'],
    },
    impact: ['RataBase cannot calculate premium without collateral value', 'ADD_LOAN blocked at client and server layers'],
    testCases: ['TC-011 — zero property value triggers R-L-010'],
    migration: '[Range(1, int.MaxValue)] on PropertyValue. API validator returns 422 for zero/negative value.',
    code: `[Range(1, int.MaxValue, ErrorMessage = "Property value must be > 0")]
public int PropertyValue { get; set; }`,
  },
  {
    id: 'R-L-011', cat: 'Add Loan Validation', imp: 'High',
    rule: 'Property address is required for a new loan record (R-AL-004). The property address identifies collateral location for insurance and lender notification letters. LSS_LOAN_T enforces NOT NULL semantics via TKA901 insert validation.',
    legacy: {
      cobol: [{ file: 'TKA901.cbl', para: '2000-VALIDATE-ADD', lines: '~84-89', desc: 'STATUS-CODE 9104 if WS-ADD-PROPERTY-ADDR = SPACES.' }],
      cpp: [{ file: 'LoanRules.cpp', func: 'ValidateLoanForAdd()', lines: '~255-265', desc: 'strAddr.IsEmpty() → FALSE with "Property address is required to add a loan" message.' }],
      dataItems: ['LSS_LOAN_T.PROPERTY_ADDRESS CHAR(100)', 'CLoan.m_strPropertyAddress CString'],
      ksds: ['LSS_LOAN_T'],
    },
    impact: ['Carrier eligibility and lender notification routing require address', 'ADD_LOAN blocked if address blank'],
    testCases: ['TC-012 — blank address triggers R-L-011'],
    migration: '[Required] on PropertyAddress. API returns 422 if address blank.',
    code: `[Required(ErrorMessage = "Property address is required.")]
public string PropertyAddress { get; set; }`,
  },
  {
    id: 'R-L-012', cat: 'Add Loan Validation', imp: 'Critical',
    rule: 'New loans must have initial status ACTIVE (R-AL-005) and unpaid principal balance > 0 (R-AL-006). All new loans enter the system in ACTIVE status. DELINQUENT and CLOSED are only reached through governed modify-loan transitions. A zero UPB has no outstanding balance to insure.',
    legacy: {
      cobol: [{ file: 'TKA901.cbl', para: '2000-VALIDATE-ADD', lines: '~91-103', desc: 'STATUS-CODE 9105 if LOAN-STATUS != ACTIVE. STATUS-CODE 9106 if UPB = 0.' }],
      cpp: [{ file: 'LoanRules.cpp', func: 'ValidateLoanForAdd()', lines: '~268-292', desc: 'LOAN_STATUS.CompareNoCase("ACTIVE") != 0 → FALSE. m_nUnpaidPrincipalBalance <= 0 → FALSE.' }],
      dataItems: ['LSS_LOAN_T.LOAN_STATUS CHAR(10) DEFAULT "ACTIVE"', 'LSS_LOAN_T.UPB NUMERIC(15) DEFAULT 0'],
      ksds: ['LSS_LOAN_T'],
    },
    impact: ['Status lifecycle integrity — ACTIVE is only valid initial state', 'LPI cycle cannot start without positive UPB'],
    testCases: ['TC-013 — DELINQUENT initial status triggers R-L-012'],
    migration: 'CreateLoanCommand forces Status = LoanStatus.Active. [Range(1, long.MaxValue)] on UnpaidPrincipalBalance.',
    code: `public CreateLoanCommandHandler() {
  loan.LoanStatus = LoanStatus.Active; // always set on create
  if (request.Upb <= 0) throw new ValidationException("UPB must be > 0");
}`,
  },
  {
    id: 'R-L-013', cat: 'Add Loan Validation', imp: 'Medium',
    rule: 'Property type must be RESIDENTIAL or COMMERCIAL (R-AL-007). Only these two classifications are supported by the TrackAll 2.0 rating and letter cycle configuration. An unrecognised type would produce an unresolvable carrier match in the downstream RataBase call.',
    legacy: {
      cobol: [{ file: 'TKA901.cbl', para: '2000-VALIDATE-ADD', lines: '~105-112', desc: 'STATUS-CODE 9107 if PROPERTY-TYPE NOT IN (RESIDENTIAL, COMMERCIAL).' }],
      cpp: [{ file: 'LoanRules.cpp', func: 'IsValidPropertyType()', lines: '~318-322', desc: 'CompareNoCase("RESIDENTIAL") == 0 || CompareNoCase("COMMERCIAL") == 0.' }],
      dataItems: ['LSS_LOAN_T.PROPERTY_TYPE CHAR(20)', 'CLoan.m_strPropertyType CString'],
      ksds: ['LSS_LOAN_T'],
    },
    impact: ['RataBase carrier match requires valid property type', 'ADD_LOAN blocked for unrecognised types'],
    testCases: ['TC-014 — unknown property type INDUSTRIAL triggers R-L-013'],
    migration: 'enum PropertyType { Residential, Commercial }. [EnumDataType(typeof(PropertyType))] on request DTO.',
    code: `public enum PropertyType { Residential, Commercial }
[EnumDataType(typeof(PropertyType))]
public PropertyType PropertyType { get; set; }`,
  },
  {
    id: 'R-L-014', cat: 'Modify Loan Validation', imp: 'Critical',
    rule: 'Modify flow enforces four constraints: (1) R-ML-001: loan number is immutable — LOAN_NUM is the primary key referenced by EDI, audit, and billing; (2) R-ML-002: status transitions only ACTIVE→DELINQUENT and DELINQUENT→CLOSED; (3) R-ML-003: UPB cannot increase — UPB decreases as payments are applied; (4) R-ML-004: if address is changed, new address must not be blank.',
    legacy: {
      cobol: [{ file: 'TKA902.cbl', para: '3000-VALIDATE-MODIFY', lines: '~90-130', desc: '9203: invalid status transition; 9204: UPB increase; 9205: blank address on change. Fetches current record at 2000-FETCH-CURRENT for comparison.' }],
      cpp: [{ file: 'LoanRules.cpp', func: 'ValidateLoanForModify()', lines: '~335-420', desc: 'R-ML-001: loan number CompareNoCase check. R-ML-002: IsLoanStatusTransitionValid(). R-ML-003: UPB comparison. R-ML-004: address blank check.' }],
      dataItems: ['LSS_LOAN_T.LOAN_NUM CHAR(10) — primary key', 'LSS_LOAN_T.LOAN_STATUS CHAR(10)', 'LSS_LOAN_T.UPB NUMERIC(15)'],
      ksds: ['LSS_LOAN_T'],
    },
    impact: ['LOAN_NUM immutability prevents referential integrity breaks across 14E, audit, billing', 'CLOSED is terminal — no re-open allowed', 'UPB increase indicates origination error — handled by separate boarding process'],
    testCases: ['TC-015 — ACTIVE→DELINQUENT valid transition', 'TC-016 — DELINQUENT→ACTIVE blocked by R-ML-002'],
    migration: 'UpdateLoanCommand compares original vs modified record. 4 separate validation checks in UpdateLoanCommandHandler. Returns 422 with specific rule ID on failure.',
    code: `if (orig.LoanNum != mod.LoanNum)
    throw new ValidationException("R-ML-001: Loan number is immutable.");
if (!IsValidTransition(orig.Status, mod.Status))
    throw new ValidationException($"R-ML-002: {orig.Status}→{mod.Status} not permitted.");
if (mod.Upb > orig.Upb)
    throw new ValidationException("R-ML-003: UPB cannot increase.");`,
  },
];
