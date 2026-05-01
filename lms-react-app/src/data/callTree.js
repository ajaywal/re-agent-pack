export const TREE = {
  id: 'LOAN_MANAGEMENT_MAIN', file: 'lnmain.cpp', type: 'entry',
  desc: 'C++ main() — opens Pathway connection to $LNSVR1, authenticates user (privilege check), enters show_main_menu() loop',
  children: [
    { id: 'authenticate_user', file: 'auth.cpp', type: 'func', desc: 'Validates user credentials, sets SESSION_CONTEXT.privilege_level (0=ADMIN 1=USER 2=READONLY), binds to terminal_id', children: [] },
    {
      id: 'show_main_menu', file: 'lnmain.cpp', type: 'func', desc: 'Displays main menu (LNMAIN01). Routes to search/create/update based on menu selection. Loops until user selects Exit.',
      children: [
        {
          id: 'search_loan_screen', file: 'lnmain.cpp', type: 'func', desc: 'Opens CSearchDialog (LNSRCH01). Collects criteria. Calls execute_loan_search(). Displays results in CResultsDialog with CListCtrl.',
          children: [
            {
              id: 'execute_loan_search', file: 'db_connector.cpp', type: 'db', desc: 'Determines access mode: ID→random KSDS READ, Policy→alternate key, Name→sequential scan. Returns LOAN_RECORD array.',
              children: [
                { id: 'PATHWAY_WRITEREAD (SEARCH)', file: 'tandem_pathway.h', type: 'pathway', desc: 'Synchronous IPC to $LNSVR1. Sends search criteria struct. Receives LOAN_RECORD[MAX_RESULTS]. Timeout: 30 seconds.', children: [] },
                { id: 'build_search_criteria', file: 'db_connector.cpp', type: 'func', desc: 'Normalizes input, determines KSDS key type (primary/alternate/sequential), builds access structure for Pathway call.', children: [] },
              ],
            },
            { id: 'display_loan_results', file: 'lnmain.cpp', type: 'func', desc: 'Populates CListCtrl columns in CResultsDialog. Double-click opens detail. Allows select+Update.', children: [] },
          ],
        },
        {
          id: 'create_loan_screen', file: 'lnmain.cpp', type: 'func', desc: 'Opens CCreateLoanDialog (LNCRT01). Validates → QLOTCALC → CConfirmDialog (BR-007) → generate_loan_id → insert_loan_record.',
          children: [
            { id: 'validate_loan_input_cpp', file: 'validation.cpp', type: 'func', desc: 'C++ client-side validation mirroring QLOTCALC §2000: amount $1-$5M, term 12-360, score 300-850, required fields.', children: [] },
            {
              id: 'call_quote_calculator', file: 'lnmain.cpp', type: 'cobol', desc: 'Builds QUOTE_REQUEST struct with loan params. Calls PATHWAY_WRITEREAD to invoke QLOTCALC on HP Tandem COBOL server.',
              children: [
                {
                  id: 'QLOTCALC (COBOL Entry)', file: 'qlotcalc.cbl:0000', type: 'cobol', desc: 'HP Tandem COBOL/MP Pathway IPC server. Receives CALC-AREA LINKAGE SECTION. Executes §1000-§9000 sequence.',
                  children: [
                    { id: '§1000-INITIALIZE', file: 'qlotcalc.cbl', type: 'cobol', desc: 'OPEN RATE_TABLE, STATE_SURCHARGE, AUDIT_LOG files. MOVE ZERO to return-code. MOVE SPACES to error-message.', children: [] },
                    { id: '§2000-VALIDATE-INPUT', file: 'qlotcalc.cbl', type: 'cobol', desc: 'Amount $1-$5M (RC=11), Term 12-360mo (RC=12), Score 300-850 (RC=13). Exits to audit+close on any failure.', children: [] },
                    { id: '§3000-DETERMINE-CREDIT-TIER', file: 'qlotcalc.cbl', type: 'cobol', desc: 'EVALUATE score: ≥750→PR/PRIME, 680-749→ST/STANDARD, 620-679→SP/SUBPRIME, <620→DS/DEEP-SUB. Sets 88-level conditions.', children: [] },
                    { id: '§4000-FETCH-BASE-RATE', file: 'qlotcalc.cbl', type: 'cobol', desc: 'READ RATE_TABLE by composite key (LOAN_TYPE 30chars + TIER 2chars). Gets BASE_RATE, SPREAD, FLOOR, CEILING. RC=20 if not found.', children: [] },
                    { id: '§5000-APPLY-STATE-ADJUSTMENT', file: 'qlotcalc.cbl', type: 'cobol', desc: 'READ STATE_SURCHARGE by STATE_CODE. ADD rate-adjustment to base rate. CLAMP between floor and ceiling per RATE_TABLE.', children: [] },
                    { id: '§6000-CALCULATE-MONTHLY-PAYMENT', file: 'qlotcalc.cbl', type: 'cobol', desc: 'P×[r(1+r)^n]/[(1+r)^n-1]. COMP-3 packed decimal. Loop computes (1+r)^n iteratively — never IEEE 754 float.', children: [] },
                    { id: '§7000-CALCULATE-INSURANCE-PREMIUM', file: 'qlotcalc.cbl', type: 'cobol', desc: 'Base = amount×type-rate. Multiplier: PR=0.90×, ST=1.00×, SP=1.20×, DS=1.45×. Add SS-PREM-SURCHG if >0.', children: [] },
                    { id: '§8000-CALCULATE-TOTALS', file: 'qlotcalc.cbl', type: 'cobol', desc: 'CA-CALC-TOTAL = (monthly-pmt × term) + (premium × term). All COMP-3 arithmetic.', children: [] },
                    { id: '§9000-WRITE-AUDIT-LOG', file: 'qlotcalc.cbl', type: 'cobol', desc: 'BR-009: ALWAYS executes. WRITE to AUDIT_LOG sequential KSDS. Captures all inputs+outputs+return-code. Even on validation failures.', children: [] },
                  ],
                },
              ],
            },
            {
              id: 'generate_loan_id', file: 'db_connector.cpp', type: 'db', desc: 'READ+UPDATE LOAN_SEQ KSDS atomically (Pathway lock). Increments sequence. Formats LN-YYYY-NNN. Prevents duplicate IDs.', children: [],
            },
            {
              id: 'insert_loan_record', file: 'db_connector.cpp', type: 'db', desc: 'PATHWAY_WRITEREAD INSERT to LOAN_MASTER KSDS. Atomic. Key=LOAN_ID. All 15 fields written. Rolls back on failure.',
              children: [
                { id: 'PATHWAY_WRITEREAD (INSERT)', file: 'tandem_pathway.h', type: 'pathway', desc: 'Synchronous WRITE to LOAN_MASTER. Holds KSDS lock during write. Returns loan_id confirmation.', children: [] },
              ],
            },
          ],
        },
        {
          id: 'update_loan_screen', file: 'lnmain.cpp', type: 'func', desc: 'CUpdateDialog (LNUPD01). Fetch record, lock immutable fields (BR-008), edit status/officer/collateral, optional QLOTCALC recalc.',
          children: [
            { id: 'fetch_loan_by_id', file: 'db_connector.cpp', type: 'db', desc: 'Random READ on LOAN_MASTER KSDS by LOAN_ID primary key. Returns full LOAN_RECORD. MessageBox if not found.', children: [] },
            { id: 'call_quote_calculator (recalc)', file: 'lnmain.cpp', type: 'cobol', desc: 'Optional: if user checks Recalculate, re-invokes QLOTCALC via Pathway. Same code path as create.', children: [] },
            { id: 'validate_loan_input_cpp (update)', file: 'validation.cpp', type: 'func', desc: 'Validates only editable fields. Immutable fields skipped (already validated at origination).', children: [] },
            {
              id: 'update_loan_record', file: 'db_connector.cpp', type: 'db', desc: 'PATHWAY_WRITEREAD REWRITE on LOAN_MASTER KSDS. Overwrites editable fields. Key unchanged. Pathway lock held.',
              children: [
                { id: 'PATHWAY_WRITEREAD (UPDATE)', file: 'tandem_pathway.h', type: 'pathway', desc: 'Synchronous REWRITE. Acquires record lock, writes updated LOAN_RECORD, releases lock.', children: [] },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const TYPE_COLORS = {
  entry:   { bg: '#1f3a5f99', stroke: '#58a6ff', text: '#58a6ff', badge: '#0d2340' },
  func:    { bg: '#21262d',   stroke: '#484f58', text: '#c9d1d9', badge: '#161b22' },
  db:      { bg: '#3a2a0066', stroke: '#e3b341', text: '#e3b341', badge: '#2a1d00' },
  cobol:   { bg: '#1a2d1a99', stroke: '#3fb950', text: '#3fb950', badge: '#0d1f0d' },
  pathway: { bg: '#2d1f5e99', stroke: '#a371f7', text: '#a371f7', badge: '#1a0f40' },
};
