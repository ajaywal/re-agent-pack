// Seed loan records mirroring CLoanSearchDlg in-memory data
// (LoanSearchDlg.cpp — 5 loans covering all integration paths)
// Fields map directly to LSS_LOAN_T + LSS_CYCLE_STEP_T columns (Loan.h)
export const LOANS = [
  {
    loanNum: '0000100001', clientId: 'CLI-0001', borrowerName: 'Anderson, Robert',
    state: 'KY', coverageType: 'Hazard', propertyValue: 275000,
    fciCode: 'BK-0012', ediFlag: 'Y', loanStatus: 'ACTIVE',
    upb: 262500, mortgageeClause: 'First National Bank ISAOA ATIMA',
    propertyAddress: '145 Cardinal Lane', propertyCity: 'Louisville', propertyZip: '40201',
    propertyType: 'RESIDENTIAL', borrowerPhone: '502-555-0181',
    quoteReqd: 'Y', cycleType: 'STANDARD',
    // KY → R-L-004 KY ISO pre-call required; QUOTE_REQD=Y → R-L-005; EDI=Y → 14E eligible
  },
  {
    loanNum: '0000200002', clientId: 'CLI-0002', borrowerName: 'Martinez, Elena',
    state: 'FL', coverageType: 'Flood', propertyValue: 480000,
    fciCode: 'SSP-0044', ediFlag: 'Y', loanStatus: 'ACTIVE',
    upb: 455000, mortgageeClause: 'Coastal Lending Group ISAOA',
    propertyAddress: '2301 Ocean Drive', propertyCity: 'Miami', propertyZip: '33139',
    propertyType: 'RESIDENTIAL', borrowerPhone: '305-555-0202',
    quoteReqd: 'Y', cycleType: 'STANDARD',
    // FL coastal → 0.62% rate loading; SSP fciCode → delimited v4 14E format
  },
  {
    loanNum: '0000300003', clientId: 'CLI-0003', borrowerName: 'Williams, James',
    state: 'FL', coverageType: 'Hazard', propertyValue: 320000,
    fciCode: 'BK-0099', ediFlag: 'Y', loanStatus: 'ACTIVE',
    upb: 295000, mortgageeClause: 'Sunbelt Mortgage ISAOA ATIMA',
    propertyAddress: '742 Evergreen Terrace', propertyCity: 'Miami', propertyZip: '33101',
    propertyType: 'RESIDENTIAL', borrowerPhone: '305-555-0142',
    quoteReqd: 'N', cycleType: 'INSTANT_ISSUE',
    // INSTANT_ISSUE → R-L-007 blocks 14E; no quote required
  },
  {
    loanNum: '0000400004', clientId: 'CLI-0004', borrowerName: 'Thompson, Sarah',
    state: 'TX', coverageType: 'Hazard', propertyValue: 195000,
    fciCode: 'BK-0031', ediFlag: 'N', loanStatus: 'DELINQUENT',
    upb: 178000, mortgageeClause: 'Lone Star Financial ISAOA',
    propertyAddress: '800 Commerce Blvd', propertyCity: 'Houston', propertyZip: '77002',
    propertyType: 'COMMERCIAL', borrowerPhone: '713-555-0091',
    quoteReqd: 'Y', cycleType: 'STANDARD',
    // EDI_FLAG=N → R-L-006 blocks 14E; DELINQUENT status
  },
  {
    loanNum: '0000500005', clientId: 'CLI-0005', borrowerName: 'Jackson, Michael',
    state: 'WV', coverageType: 'Hazard', propertyValue: 145000,
    fciCode: 'BK-0078', ediFlag: 'Y', loanStatus: 'ACTIVE',
    upb: 138000, mortgageeClause: 'Mountain State Bank ISAOA',
    propertyAddress: '12 Mountainview Road', propertyCity: 'Charleston', propertyZip: '25301',
    propertyType: 'RESIDENTIAL', borrowerPhone: '304-555-0315',
    quoteReqd: 'N', cycleType: 'STANDARD',
    // WV not in approved carrier list → R-L-003 blocks RataBase quote
  },
];

// TME mnemonic routing table (LSS001T seed — LSS_SCHEMA.sql)
export const TME_ROUTES = [
  { mnemonic: 'LOAN_SEARCH',   program: 'TKA900',   desc: 'Loan search and retrieval' },
  { mnemonic: 'QUOTE_REQUEST', program: 'TKARB000', desc: 'RataBase premium quote request' },
  { mnemonic: 'LOAN_UPDATE',   program: 'TKA910',   desc: 'Loan record update' },
  { mnemonic: '14E_NOTIFY',    program: 'TKA920',   desc: '14E outbound EDI notification trigger' },
  { mnemonic: 'KY_ISO_QUERY',  program: 'AIP930',   desc: 'Kentucky ISO advisory pre-call' },
  { mnemonic: 'ADD_LOAN',      program: 'TKA901',   desc: 'Add new loan record to LSS_LOAN_T' },
  { mnemonic: 'MODIFY_LOAN',   program: 'TKA902',   desc: 'Update existing loan record in LSS_LOAN_T' },
];

// Property coverage types
export const COVERAGE_TYPES = ['Hazard', 'Flood', 'Wind', 'Earthquake', 'Fire'];

// Property types (R-L-013)
export const PROPERTY_TYPES = ['RESIDENTIAL', 'COMMERCIAL'];

// Valid status transitions (R-L-014)
export const STATUS_TRANSITIONS = {
  ACTIVE: ['DELINQUENT'],
  DELINQUENT: ['CLOSED'],
  CLOSED: [],
};
