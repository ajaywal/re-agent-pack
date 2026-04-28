-- ==========================================================================
-- LSS_SCHEMA.sql — HP NonStop Tandem SQL/MP DDL
-- TrackAll — Loan Servicing System (LSS) table definitions
--
-- Dialect: HP SQL/MP (NonStop SQL). Key differences from ANSI SQL:
--   - Table names include the guardian volume/subvolume in production:
--     e.g. \TKATANDEM.$DATA01.TRACKALL.LSS_LOAN_T
--   - CHAR columns use fixed-width storage; trailing spaces are significant
--     for index lookups — application code must TRIM before comparison.
--   - NUMERIC without SCALE is equivalent to INTEGER on SQL/MX.
--   - DEFAULT values are enforced at insert time by the SQL/MP engine.
-- ==========================================================================


-- --------------------------------------------------------------------------
-- LSS_LOAN_T — Loan master record table
--
-- One row per loan. Indexed by LOAN_NUM (primary) and CLIENT_ID (secondary).
-- PROPERTY_STATE drives carrier eligibility checks (RataBase approved list).
-- EDI_FLAG controls outbound 14E EDI notification eligibility.
-- --------------------------------------------------------------------------

CREATE TABLE LSS_LOAN_T
(
    LOAN_NUM          CHAR(10)     NOT NULL,   -- 10-digit zero-padded loan identifier
    CLIENT_ID         CHAR(8)      NOT NULL,   -- foreign key to TB_CLIENT.CLIENT_ID
    BORROWER_NAME     CHAR(40),
    PROPERTY_STATE    CHAR(2),                 -- 2-letter US state code
    COVERAGE_TYPE     CHAR(10),                -- e.g. 'Mortgage', 'Hazard', 'Flood'
    PROPERTY_VALUE    NUMERIC(10)  DEFAULT 0,
    FCI_CODE          CHAR(6),                 -- servicer code; 'BK' prefix = Black Knight
    EDI_FLAG          CHAR(1)      DEFAULT 'N', -- 'Y' = eligible for 14E outbound EDI

    -- Extended fields — Loan Maintenance module (Add/Modify operations)
    LOAN_STATUS       CHAR(10)     DEFAULT 'ACTIVE',   -- 'ACTIVE', 'DELINQUENT', 'CLOSED'
    UPB               NUMERIC(15)  DEFAULT 0,          -- unpaid principal balance in dollars
    MORTGAGEE_CLAUSE  CHAR(255),                       -- lender rights clause text
    PROPERTY_ADDRESS  CHAR(100),                       -- street address; required on add
    PROPERTY_CITY     CHAR(50),
    PROPERTY_ZIP      CHAR(10),
    PROPERTY_TYPE     CHAR(20),                        -- 'RESIDENTIAL' or 'COMMERCIAL'
    BORROWER_PHONE    CHAR(20),

    PRIMARY KEY (LOAN_NUM)
);

CREATE INDEX LSS_LOAN_T_CLIENT_IDX
    ON LSS_LOAN_T (CLIENT_ID);

CREATE INDEX LSS_LOAN_T_BORROWER_IDX
    ON LSS_LOAN_T (BORROWER_NAME);


-- --------------------------------------------------------------------------
-- LSS_CYCLE_STEP_T — Client cycle and step configuration table
--
-- One row per CLIENT_ID / CYCLE_TYPE combination. Stores whether a premium
-- quote is required (QUOTE_REQD) for loans processed under that cycle.
-- CYCLE_TYPE = 'INSTANT_ISSUE' suppresses 14E EDI notification output.
-- Joined to LSS_LOAN_T by TKA900 on CLIENT_ID after the loan lookup.
-- --------------------------------------------------------------------------

CREATE TABLE LSS_CYCLE_STEP_T
(
    CLIENT_ID       CHAR(8)      NOT NULL,
    CYCLE_TYPE      CHAR(20)     NOT NULL,   -- e.g. 'STANDARD', 'INSTANT_ISSUE', 'RENEWAL'
    QUOTE_REQD      CHAR(1)      DEFAULT 'N', -- 'Y' = RataBase quote required before display

    PRIMARY KEY (CLIENT_ID, CYCLE_TYPE)
);


-- --------------------------------------------------------------------------
-- LSS001T — TME mnemonic routing table
--
-- Maps outbound TME message mnemonics to their corresponding Tandem server
-- program names. The VC++ CTMELibAdapter reads this table at startup and
-- caches the routing entries in memory. At send time, the mnemonic is looked
-- up in the cache to resolve the Tandem program name before the fgatetcp
-- TCP dispatch. An unmapped mnemonic is rejected before the send proceeds.
-- --------------------------------------------------------------------------

CREATE TABLE LSS001T
(
    MNEMONIC        CHAR(20)     NOT NULL,   -- TME message mnemonic (e.g. 'LOAN_SEARCH')
    PROGRAM_NM      CHAR(12)     NOT NULL,   -- Tandem server program name (e.g. 'TKA900')
    DESCRIPTION     CHAR(60),

    PRIMARY KEY (MNEMONIC)
);

-- Routing table seed data — mirrors CTMELibAdapter::LoadRoutingTable() entries
INSERT INTO LSS001T VALUES ('LOAN_SEARCH',    'TKA900',    'Loan search and retrieval');
INSERT INTO LSS001T VALUES ('QUOTE_REQUEST',  'TKARB000',  'RataBase premium quote request');
INSERT INTO LSS001T VALUES ('LOAN_UPDATE',    'TKA910',    'Loan record update');
INSERT INTO LSS001T VALUES ('14E_NOTIFY',     'TKA920',    '14E outbound EDI notification trigger');
INSERT INTO LSS001T VALUES ('KY_ISO_QUERY',   'AIP930',    'Kentucky ISO advisory pre-call for RataBase rating');
INSERT INTO LSS001T VALUES ('ADD_LOAN',       'TKA901',    'Add new loan record to LSS_LOAN_T');
INSERT INTO LSS001T VALUES ('MODIFY_LOAN',    'TKA902',    'Update existing loan record in LSS_LOAN_T');
