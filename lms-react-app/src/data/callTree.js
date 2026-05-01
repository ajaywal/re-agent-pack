// Call tree for TrackAll Loan Servicing System
// Source: TrackAllClientManagerLegacy.cpp, LoanSearchDlg.cpp, LoanAddDlg.cpp, LoanModifyDlg.cpp
export const TREE = {
  id: 'CTrackAllClientManagerLegacyApp::InitInstance', file: 'TrackAllClientManagerLegacy.cpp', type: 'entry',
  desc: 'MFC WinApp entry point. Initialises CLoanRules, CTMELibAdapter, CRataBaseServiceAdapter, CEDINotificationWriter. Creates and shows CLoanSearchDlg as main window.',
  children: [
    {
      id: 'CLoanRules::CLoanRules()', file: 'LoanRules.cpp', type: 'func',
      desc: 'Loads approved carrier states (23 states) and lender target forms (LT-F100/200/300/400) into in-memory vectors at startup.',
      children: [
        { id: 'LoadApprovedCarrierStates()', file: 'LoanRules.cpp', type: 'func', desc: 'Populates m_approvedCarrierStates with 23 US state codes. In production loaded from carrier eligibility table.', children: [] },
        { id: 'LoadLenderTargetForms()', file: 'LoanRules.cpp', type: 'func', desc: 'Populates m_lenderTargetForms: LT-F100, LT-F200, LT-F300, LT-F400.', children: [] },
      ],
    },
    {
      id: 'CTMELibAdapter::LoadRoutingTable()', file: 'TMELibAdapter.cpp', type: 'func',
      desc: 'Reads LSS001T routing table at startup. Caches 7 mnemonic→program mappings. Used for all subsequent TME dispatches.',
      children: [
        { id: 'SELECT FROM LSS001T', file: 'LSS_SCHEMA.sql', type: 'db', desc: 'Fetches MNEMONIC, PROGRAM_NM pairs. 7 entries: LOAN_SEARCH/ADD_LOAN/MODIFY_LOAN/QUOTE_REQUEST/14E_NOTIFY/KY_ISO_QUERY/LOAN_UPDATE.', children: [] },
      ],
    },
    {
      id: 'CLoanSearchDlg::OnBnClickedSearch()', file: 'LoanSearchDlg.cpp', type: 'func',
      desc: 'Primary search handler. Calls ValidateLoanForSearch(), then dispatches LOAN_SEARCH TME. On result: populates list, optionally triggers ProcessLoanResult().',
      children: [
        {
          id: 'CLoanRules::ValidateLoanForSearch()', file: 'LoanRules.cpp', type: 'func',
          desc: 'R-L-001: at least one criterion required. R-L-002: loan number must be 10 numeric digits. Returns FALSE with error message on failure.',
          children: [],
        },
        {
          id: 'CTMELibAdapter::SendMessage(LOAN_SEARCH)', file: 'TMELibAdapter.cpp', type: 'pathway',
          desc: 'Serialises request to TME buffer. fgatetcp TCP dispatch to Tandem node. Routes to TKA900 via LSS001T. 30-second timeout.',
          children: [
            {
              id: 'TKA900::0000-MAIN', file: 'TKA900.cbl', type: 'cobol',
              desc: 'HP NonStop Tandem COBOL server. Orchestrates: 1000-RECEIVE → 2000-VALIDATE → 3000-QUERY-LOAN → 4000-QUERY-CYCLE-STEP → 9000-SEND-RESPONSE.',
              children: [
                { id: 'TKA900::2000-VALIDATE-INPUT', file: 'TKA900.cbl', type: 'cobol', desc: 'STATUS-CODE 9001 if both WS-LOAN-NUM and WS-BORROWER-NAME are SPACES.', children: [] },
                { id: 'TKA900::3000-QUERY-LOAN', file: 'TKA900.cbl', type: 'cobol', desc: 'EXEC SQL SELECT from LSS_LOAN_T WHERE LOAN_NUM = :var OR BORROWER_NAME LIKE :var. Returns 8 fields.', children: [
                  { id: 'LSS_LOAN_T (READ)', file: 'HP NonStop SQL/MP', type: 'db', desc: 'Equality match on LOAN_NUM CHAR(10) PK or LIKE on BORROWER_NAME. FETCH FIRST 1 ROWS ONLY.', children: [] },
                ] },
                { id: 'TKA900::4000-QUERY-CYCLE-STEP', file: 'TKA900.cbl', type: 'cobol', desc: 'EXEC SQL SELECT QUOTE_REQD, CYCLE_TYPE FROM LSS_CYCLE_STEP_T WHERE CLIENT_ID = :var. Returns flags for R-L-005/007.', children: [
                  { id: 'LSS_CYCLE_STEP_T (READ)', file: 'HP NonStop SQL/MP', type: 'db', desc: 'Joined on CLIENT_ID returned from LSS_LOAN_T. Returns QUOTE_REQD and CYCLE_TYPE.', children: [] },
                ] },
              ],
            },
          ],
        },
        {
          id: 'ProcessLoanResult()', file: 'LoanSearchDlg.cpp', type: 'func',
          desc: 'After successful loan search: checks RequiresQuote() for R-L-005, then checks EnforceEdiEligibility() for R-L-006/007/008.',
          children: [
            {
              id: 'CLoanRules::RequiresQuote()', file: 'LoanRules.cpp', type: 'func',
              desc: 'Returns TRUE if QUOTE_REQD = "Y" (R-L-005). Gates the RataBase quote call.', children: [],
            },
            {
              id: 'CRataBaseServiceAdapter::GetQuote()', file: 'RataBaseServiceAdapter.cpp', type: 'func',
              desc: 'R-L-003: EnforceCarrierCoverage() check. R-L-004: KY branch → CKentuckyISOAdapter::GetKentuckyContext(). Then dispatches QUOTE_REQUEST.',
              children: [
                { id: 'CKentuckyISOAdapter::GetKentuckyContext()', file: 'RataBaseServiceAdapter.cpp', type: 'func', desc: 'KY loans only. Dispatches KY_ISO_QUERY TME → AIP930. Returns fire class, construction type, territory code.', children: [
                  { id: 'CTMELibAdapter::SendMessage(KY_ISO_QUERY)', file: 'TMELibAdapter.cpp', type: 'pathway', desc: 'Routes to AIP930 on Tandem. Returns KY ISO context for premium calculation.', children: [] },
                ] },
                { id: 'CTMELibAdapter::SendMessage(QUOTE_REQUEST)', file: 'TMELibAdapter.cpp', type: 'pathway', desc: 'Routes to TKARB000. Returns annual premium at 0.45% (standard) or 0.62% (coastal FL/TX). 5-second timeout.', children: [] },
              ],
            },
            {
              id: 'CEDINotificationWriter::Write14ERecord()', file: 'EDINotificationWriter.cpp', type: 'func',
              desc: 'Three gates: R-L-006 EDI_FLAG=Y, R-L-007 not INSTANT_ISSUE, R-L-008 form ID in lender_target. Format selected by FCI_CODE prefix.',
              children: [
                { id: 'CLoanRules::EnforceEdiEligibility()', file: 'LoanRules.cpp', type: 'func', desc: 'Checks EDI_FLAG, CYCLE_TYPE, and form ID registration. Returns FALSE with suppression/rejection message.', children: [] },
                { id: 'CTMELibAdapter::SendMessage(14E_NOTIFY)', file: 'TMELibAdapter.cpp', type: 'pathway', desc: 'Routes to TKA920 on Tandem. Sends formatted 14E record. BK→fixed-width v2.3; SSP→delimited v4.', children: [] },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'CLoanAddDlg::OnBnClickedAdd()', file: 'LoanAddDlg.cpp', type: 'func',
      desc: 'Add Loan handler. Builds CLoan from dialog fields. Calls ValidateLoanForAdd(). Dispatches ADD_LOAN TME to TKA901.',
      children: [
        {
          id: 'CLoanRules::ValidateLoanForAdd()', file: 'LoanRules.cpp', type: 'func',
          desc: 'R-AL-001 to R-AL-007: loan number, borrower name, property value > 0, address, ACTIVE status, UPB > 0, property type. Returns FALSE on first failure.', children: [],
        },
        {
          id: 'CTMELibAdapter::SendMessage(ADD_LOAN)', file: 'TMELibAdapter.cpp', type: 'pathway',
          desc: 'Routes to TKA901. Passes all CLoan fields as pipe-delimited request. 5-second timeout.',
          children: [
            {
              id: 'TKA901::0000-MAIN', file: 'TKA901.cbl', type: 'cobol',
              desc: '1000-RECEIVE → 2000-VALIDATE-ADD (7 checks, STATUS-CODES 9101-9107) → 3000-INSERT-LOAN → 9000-SEND-RESPONSE.',
              children: [
                { id: 'TKA901::2000-VALIDATE-ADD', file: 'TKA901.cbl', type: 'cobol', desc: 'Server-side mirror of ValidateLoanForAdd(). Dual-layer protection. STATUS-CODES 9101-9107 map to R-AL-001 to R-AL-007.', children: [] },
                { id: 'TKA901::3000-INSERT-LOAN', file: 'TKA901.cbl', type: 'cobol', desc: 'EXEC SQL INSERT INTO LSS_LOAN_T. All fields from WS-ADD-REQUEST-BLOCK.', children: [
                  { id: 'LSS_LOAN_T (INSERT)', file: 'HP NonStop SQL/MP', type: 'db', desc: 'New loan record. LOAN_NUM as PK. LOAN_STATUS = ACTIVE. All 16 fields written.', children: [] },
                ] },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'CLoanModifyDlg::OnBnClickedModify()', file: 'LoanModifyDlg.cpp', type: 'func',
      desc: 'Modify Loan handler. Pre-loads original loan (loan number shown read-only). Builds modified CLoan. Calls ValidateLoanForModify(). Dispatches MODIFY_LOAN TME to TKA902.',
      children: [
        {
          id: 'CLoanRules::ValidateLoanForModify()', file: 'LoanRules.cpp', type: 'func',
          desc: 'R-ML-001: loan number immutable. R-ML-002: valid status transition only. R-ML-003: UPB cannot increase. R-ML-004: address cannot be cleared.', children: [],
        },
        {
          id: 'CTMELibAdapter::SendMessage(MODIFY_LOAN)', file: 'TMELibAdapter.cpp', type: 'pathway',
          desc: 'Routes to TKA902. Sends modified CLoan fields. 5-second timeout.',
          children: [
            {
              id: 'TKA902::0000-MAIN', file: 'TKA902.cbl', type: 'cobol',
              desc: '1000-RECEIVE → 2000-FETCH-CURRENT → 3000-VALIDATE-MODIFY → 4000-UPDATE-LOAN → 9000-SEND-RESPONSE.',
              children: [
                { id: 'TKA902::2000-FETCH-CURRENT', file: 'TKA902.cbl', type: 'cobol', desc: 'SELECT current LOAN_STATUS and UPB for comparison. Needed for R-ML-002 and R-ML-003 checks.', children: [
                  { id: 'LSS_LOAN_T (READ current)', file: 'HP NonStop SQL/MP', type: 'db', desc: 'Reads existing record for validation comparison before update.', children: [] },
                ] },
                { id: 'TKA902::3000-VALIDATE-MODIFY', file: 'TKA902.cbl', type: 'cobol', desc: 'STATUS-CODE 9203: invalid status transition. 9204: UPB increase. 9205: blank address. Mirrors ValidateLoanForModify().', children: [] },
                { id: 'TKA902::4000-UPDATE-LOAN', file: 'TKA902.cbl', type: 'cobol', desc: 'EXEC SQL UPDATE LSS_LOAN_T SET ... WHERE LOAN_NUM = :var. Checks ROWS-UPDATED = 1.', children: [
                  { id: 'LSS_LOAN_T (UPDATE)', file: 'HP NonStop SQL/MP', type: 'db', desc: 'Updates LOAN_STATUS, UPB, address, and other modifiable fields. LOAN_NUM (PK) never updated.', children: [] },
                ] },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const TYPE_COLORS = {
  entry:   { color: 'var(--text)',    bg: '#21262d', stroke: '#484f58' },
  func:    { color: 'var(--orange)',  bg: '#3a2a00', stroke: '#e3b341' },
  cobol:   { color: 'var(--green)',   bg: '#1a2d1a', stroke: '#3fb950' },
  pathway: { color: 'var(--purple)',  bg: '#2d1f5e', stroke: '#a371f7' },
  db:      { color: 'var(--blue)',    bg: '#1f3a5f', stroke: '#58a6ff' },
};
