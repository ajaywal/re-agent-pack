export const DB_CONNS = [
  {
    name: 'LOAN_MASTER', type: 'KSDS Indexed', nsk: '$DATA.LOANDB', via: 'Pathway $LNSVR1', key: 'LOAN_ID (12-char)',
    target: 'Azure SQL dbo.LoanMaster',
    schema: 'loan_id NVARCHAR(12) PK, borrower_name NVARCHAR(50), policy_id NVARCHAR(11), loan_type NVARCHAR(30), amount DECIMAL(11,2), rate DECIMAL(6,4), term SMALLINT, payment DECIMAL(9,2), status NVARCHAR(15), premium DECIMAL(9,2), credit_score SMALLINT, loan_officer NVARCHAR(30), state CHAR(2), coverage NVARCHAR(30), collateral NVARCHAR(80), orig_date DATE',
  },
  {
    name: 'RATE_TABLE', type: 'KSDS Indexed', nsk: '$DATA.RATEDB', via: 'Direct File I/O', key: 'LOAN_TYPE(30)+TIER(2)',
    target: 'Azure SQL dbo.RateTable',
    schema: 'loan_type NVARCHAR(30), credit_tier CHAR(2), base_rate DECIMAL(6,4), spread DECIMAL(5,4), floor_rate DECIMAL(6,4), ceiling_rate DECIMAL(6,4), effective_date DATE — PK(loan_type, credit_tier, effective_date). Supports rate history.',
  },
  {
    name: 'STATE_SURCHARGE', type: 'KSDS Indexed', nsk: '$DATA.RATEDB', via: 'Direct File I/O', key: 'STATE_CODE (2-char)',
    target: 'Azure SQL dbo.StateSurcharge',
    schema: 'state_code CHAR(2) PK, rate_adjustment DECIMAL(5,4), premium_surcharge DECIMAL(5,4), min_premium DECIMAL(9,2), effective_date DATE. Supports regulatory change history without code recompile.',
  },
  {
    name: 'AUDIT_LOG', type: 'Sequential (append-only)', nsk: '$LOG.QLOTAUDT', via: 'Direct File I/O', key: 'N/A — FIFO append',
    target: 'Azure Table Storage — partition by date',
    schema: "PartitionKey=YYYYMMDD (string), RowKey=HHmmss_sessionId (unique). Fields: loan_type, amount, term_months, credit_score, calc_rate, calc_payment, calc_premium, return_code, error_message, timestamp. NO UPDATE, NO DELETE policy.",
  },
  {
    name: 'LOAN_SEQ', type: 'KSDS Indexed (atomic)', nsk: '$DATA.LOANDB', via: 'Pathway $LNSVR1 (locked)', key: 'SEQ_NAME (string)',
    target: 'Azure SQL CREATE SEQUENCE',
    schema: "CREATE SEQUENCE dbo.LoanSeq START WITH 1 INCREMENT BY 1 NO CYCLE NO CACHE. Application formats: 'LN-' + YEAR + '-' + FORMAT(NEXT VALUE FOR dbo.LoanSeq, '000')",
  },
];
