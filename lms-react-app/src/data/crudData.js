// CRUD operations per Tandem program per LSS table
// Source: LSS_SCHEMA.sql, TKA900/901/902/920.cbl, TrackAllClientManagerLegacy.cpp
export const CRUD_ROWS = [
  {
    table: 'LSS_LOAN_T', file: 'HP NonStop SQL/MP', prog: 'TKA900 (LOAN_SEARCH)',
    ops: ['R'], key: 'LOAN_NUM CHAR(10) PK', alt: 'BORROWER_NAME (LIKE search)',
    access: 'SQL equality + LIKE', freq: 'High — every search operation',
    notes: 'FETCH FIRST 1 ROWS ONLY. R-L-001/002 validated client-side before dispatch. Trailing-space semantics on CHAR(10) key.',
  },
  {
    table: 'LSS_LOAN_T', file: 'HP NonStop SQL/MP', prog: 'TKA901 (ADD_LOAN)',
    ops: ['C'], key: 'LOAN_NUM CHAR(10) PK (must be unique)', alt: 'CLIENT_ID FK',
    access: 'SQL INSERT', freq: 'Medium — new loan creation',
    notes: 'R-AL-001 to R-AL-007 validated by both CLoanRules (C++) and TKA901 2000-VALIDATE-ADD. LOAN_STATUS defaults to ACTIVE.',
  },
  {
    table: 'LSS_LOAN_T', file: 'HP NonStop SQL/MP', prog: 'TKA902 (MODIFY_LOAN)',
    ops: ['R', 'U'], key: 'LOAN_NUM CHAR(10) PK', alt: 'None',
    access: 'SQL SELECT then UPDATE', freq: 'Medium — loan modifications',
    notes: '2000-FETCH-CURRENT reads existing record for R-ML comparison. 3000-VALIDATE-MODIFY enforces R-L-014 (R-ML-001 to R-ML-004). ROWS-UPDATED check after UPDATE.',
  },
  {
    table: 'LSS_LOAN_T', file: 'HP NonStop SQL/MP', prog: 'TKA920 (14E_NOTIFY)',
    ops: ['R'], key: 'LOAN_NUM CHAR(10) PK', alt: 'None',
    access: 'SQL SELECT (read-only)', freq: 'Medium — 14E processing',
    notes: 'TKA920 reads EDI_FLAG and coverage details for 14E record construction. No write to LSS_LOAN_T.',
  },
  {
    table: 'LSS_CYCLE_STEP_T', file: 'HP NonStop SQL/MP', prog: 'TKA900 (LOAN_SEARCH)',
    ops: ['R'], key: 'CLIENT_ID + CYCLE_TYPE (composite PK)', alt: 'None',
    access: 'SQL SELECT joined on CLIENT_ID', freq: 'High — every search (joined)',
    notes: '4000-QUERY-CYCLE-STEP: returns QUOTE_REQD and CYCLE_TYPE. Drives R-L-005 and R-L-007 at client layer.',
  },
  {
    table: 'LSS001T', file: 'HP NonStop SQL/MP', prog: 'CTMELibAdapter (C++ startup)',
    ops: ['R'], key: 'MNEMONIC CHAR(20) PK', alt: 'None',
    access: 'SQL SELECT at startup — cached in memory', freq: 'Once at startup',
    notes: '7 routing entries: LOAN_SEARCH→TKA900, ADD_LOAN→TKA901, MODIFY_LOAN→TKA902, 14E_NOTIFY→TKA920, KY_ISO_QUERY→AIP930, QUOTE_REQUEST→TKARB000, LOAN_UPDATE→TKA910. Cache used for all TME dispatches.',
  },
];
