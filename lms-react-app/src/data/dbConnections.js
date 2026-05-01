// Database connections and migration DDL
// Source: LSS_SCHEMA.sql, traceability_matrix.md, Forward_Engineering_Modernization_Blueprint.md
export const DB_CONNS = [
  {
    name: 'LSS_LOAN_T', type: 'HP NonStop SQL/MP Table', nsk: '\\TKATANDEM.$DATA01.TRACKALL.LSS_LOAN_T',
    via: 'fgatetcp → TME → TKA900/901/902', key: 'LOAN_NUM CHAR(10) PK',
    target: 'Azure SQL dbo.LoanMaster',
    schema: `LOAN_NUM          NVARCHAR(10)  NOT NULL PRIMARY KEY,
CLIENT_ID         NVARCHAR(8)   NOT NULL,
BORROWER_NAME     NVARCHAR(40)  NULL,
PROPERTY_STATE    NCHAR(2)      NULL,
COVERAGE_TYPE     NVARCHAR(10)  NULL,
PROPERTY_VALUE    BIGINT        NOT NULL DEFAULT 0,
FCI_CODE          NVARCHAR(6)   NULL,
EDI_FLAG          NCHAR(1)      NOT NULL DEFAULT 'N',
LOAN_STATUS       NVARCHAR(10)  NOT NULL DEFAULT 'ACTIVE',
UPB               BIGINT        NOT NULL DEFAULT 0,
MORTGAGEE_CLAUSE  NVARCHAR(255) NULL,
PROPERTY_ADDRESS  NVARCHAR(100) NULL,
PROPERTY_CITY     NVARCHAR(50)  NULL,
PROPERTY_ZIP      NVARCHAR(10)  NULL,
PROPERTY_TYPE     NVARCHAR(20)  NULL,
BORROWER_PHONE    NVARCHAR(20)  NULL

CREATE INDEX IX_LoanMaster_ClientId ON dbo.LoanMaster (CLIENT_ID);
CREATE INDEX IX_LoanMaster_BorrowerName ON dbo.LoanMaster (BORROWER_NAME);`,
  },
  {
    name: 'LSS_CYCLE_STEP_T', type: 'HP NonStop SQL/MP Table', nsk: '\\TKATANDEM.$DATA01.TRACKALL.LSS_CYCLE_STEP_T',
    via: 'fgatetcp → TKA900 (joined on CLIENT_ID)', key: 'CLIENT_ID + CYCLE_TYPE (composite PK)',
    target: 'Azure SQL dbo.CycleStep',
    schema: `CLIENT_ID    NVARCHAR(8)  NOT NULL,
CYCLE_TYPE   NVARCHAR(20) NOT NULL,
QUOTE_REQD   NCHAR(1)     NOT NULL DEFAULT 'N',

CONSTRAINT PK_CycleStep PRIMARY KEY (CLIENT_ID, CYCLE_TYPE),
CONSTRAINT FK_CycleStep_Client FOREIGN KEY (CLIENT_ID)
    REFERENCES dbo.Client(CLIENT_ID)`,
  },
  {
    name: 'LSS001T', type: 'HP NonStop SQL/MP Table (routing)', nsk: '\\TKATANDEM.$DATA01.TRACKALL.LSS001T',
    via: 'CTMELibAdapter loads at startup — cached in memory', key: 'MNEMONIC CHAR(20) PK',
    target: 'Azure App Configuration / API Gateway routes',
    schema: `-- Original DDL preserved as reference:
MNEMONIC    NVARCHAR(20) NOT NULL PRIMARY KEY,
PROGRAM_NM  NVARCHAR(12) NOT NULL,
DESCRIPTION NVARCHAR(60) NULL

-- Seed data (7 routes):
-- LOAN_SEARCH   → TKA900  (Loan search and retrieval)
-- QUOTE_REQUEST → TKARB000 (RataBase premium quote)
-- LOAN_UPDATE   → TKA910  (Loan record update)
-- 14E_NOTIFY    → TKA920  (14E outbound EDI trigger)
-- KY_ISO_QUERY  → AIP930  (Kentucky ISO advisory)
-- ADD_LOAN      → TKA901  (Add new loan)
-- MODIFY_LOAN   → TKA902  (Update existing loan)

-- Migration: routes become API Gateway endpoint registrations.`,
  },
  {
    name: 'RataBase (External)', type: 'Third-party Rating Engine', nsk: 'TKARB000 / QUOTE_REQUEST mnemonic',
    via: 'Pathway TCP → TKARB000 (external RataBase endpoint)', key: 'N/A — request/response',
    target: 'HttpClient → IRataBaseServiceAdapter',
    schema: `-- QuoteRequestDto:
PropertyState   string   (2-char state code — must be in 23 approved states)
PropertyValue   long     (property value in dollars)
CoverageType    string   (Hazard / Flood / Wind / Earthquake / Fire)
ClientId        string   (8-char client ID)
LoanNum         string   (10-digit loan number)
KyFireClass     string?  (KY loans only — from AIP930 pre-call)
KyConstruction  string?  (KY loans only)

-- QuoteResultDto:
AnnualPremium   decimal  (base rate × property value)
MonthlyPremium  decimal  (annual / 12)
BaseRate        decimal  (0.0045 standard / 0.0062 coastal)
IsCoastal       bool`,
  },
  {
    name: 'EDI 14E (TKA920)', type: 'HP NonStop Tandem Program', nsk: '\\TKATANDEM.$DATA01.TKA920',
    via: 'fgatetcp → 14E_NOTIFY mnemonic', key: 'N/A — fire-and-forward',
    target: 'Azure Service Bus topic: edi-14e-notifications',
    schema: `-- 14E message format (two paths based on FCI_CODE prefix):
-- BK-prefix → fixed-width v2.3 format
-- SSP-prefix → delimited v4 format

-- Eligibility gates (must all pass before dispatch):
-- R-L-006: EDI_FLAG = 'Y' on LSS_LOAN_T
-- R-L-007: CYCLE_TYPE != 'INSTANT_ISSUE'
-- R-L-008: formId in lender_target (LT-F100/200/300/400)

-- Azure Service Bus message properties:
-- Subject: "14E-NOTIFY"
-- FormId, LoanNum, ClientId, ServicerCode (FCI_CODE)
-- Format: BKFixedWidth23 | SSPDelimited4`,
  },
];
