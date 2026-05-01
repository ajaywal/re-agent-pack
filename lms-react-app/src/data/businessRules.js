export const BRS = [
  {
    id: 'BR-001', cat: 'Credit Tier Classification', imp: 'High',
    rule: 'Credit score ≥ 750 → PRIME (PR); 680–749 → STANDARD (ST); 620–679 → SUBPRIME (SP); <620 → DEEP-SUBPRIME (DS). Implemented via COBOL 88-level condition names evaluated sequentially.',
    legacy: {
      cobol: [{ file: 'qlotcalc.cbl', para: '§3000-DETERMINE-CREDIT-TIER', lines: '222–244', desc: 'EVALUATE TRUE chain testing 88-level conditions. Sets WS-RATE-TIER PIC X(2) to PR/ST/SP/DS.' }],
      cpp: [
        { file: 'lnmain.cpp', func: 'create_loan_screen()', lines: '301–304', desc: 'Displays tier result from QLOTCALC in CConfirmDialog quote summary panel.' },
        { file: 'validation.cpp', func: 'validate_loan_input_cpp()', lines: '45–52', desc: 'Pre-IPC client-side check: score 300–850 range only — does NOT classify tier (that is COBOL-only).' },
      ],
      dataItems: ['WS-CREDIT-SCORE PIC 9(3)', 'WS-RATE-TIER PIC X(2)', '88 TIER-PRIME VALUE "PR"', '88 TIER-STANDARD VALUE "ST"', '88 TIER-SUBPRIME VALUE "SP"', '88 TIER-DEEP-SUB VALUE "DS"'],
      ksds: [],
    },
    impact: ['§4000-FETCH-BASE-RATE: uses WS-RATE-TIER as composite KSDS key component', '§7000-CALC-PREMIUM: tier multiplier selected by WS-RATE-TIER', 'CConfirmDialog: tier label shown to user (BR-007)'],
    testCases: ['TC-005 — boundary values 750/749, 680/679, 620/619', 'TC-001 — Prime home loan e2e', 'TC-002 — Subprime boundary 625'],
    migration: 'C# enum CreditTier. Ternary chain preserving exact boundaries. Unit-test all 4 boundary pairs.',
    code: `public static CreditTier GetTier(int score) =>
  score >= 750 ? CreditTier.Prime :
  score >= 680 ? CreditTier.Standard :
  score >= 620 ? CreditTier.Subprime : CreditTier.DeepSub;`,
  },
  {
    id: 'BR-002', cat: 'Premium Tier Multipliers', imp: 'High',
    rule: 'PRIME=0.90× (10% discount), STANDARD=1.00× (base), SUBPRIME=1.20× (+20%), DEEP-SUB=1.45× (+45%). Multiplied against type base premium.',
    legacy: {
      cobol: [{ file: 'qlotcalc.cbl', para: '§7000-CALCULATE-INSURANCE-PREMIUM', lines: '362–395', desc: 'EVALUATE WS-RATE-TIER → MULTIPLY WS-BASE-PREMIUM BY tier-multiplier GIVING WS-INS-PREMIUM ROUNDED.' }],
      cpp: [{ file: 'lnmain.cpp', func: 'create_loan_screen()', lines: '306', desc: 'Displays WS-INS-PREMIUM result from PATHWAY_WRITEREAD in quote panel.' }],
      dataItems: ['WS-INS-PREMIUM PIC 9(8)V99 COMP-3', 'WS-TIER-MULTIPLIER PIC 9V99 COMP-3', 'WS-BASE-PREMIUM PIC 9(8)V99 COMP-3'],
      ksds: [],
    },
    impact: ['§8000-CALCULATE-TOTALS: WS-INS-PREMIUM feeds total cost', 'CConfirmDialog: premium shown to user pre-confirmation', 'LOAN_MASTER: ins_premium field stored on create'],
    testCases: ['TC-001 — Prime 0.90× multiplier', 'TC-002 — Subprime 1.20× multiplier'],
    migration: 'Dictionary<CreditTier,decimal> stored in config. Regulatory changes without recompile.',
    code: `static readonly Dictionary<CreditTier, decimal> Mult = new() {
  [CreditTier.Prime]    = 0.90m,
  [CreditTier.Standard] = 1.00m,
  [CreditTier.Subprime] = 1.20m,
  [CreditTier.DeepSub]  = 1.45m };`,
  },
  {
    id: 'BR-003', cat: 'Input Validation Bounds', imp: 'Critical',
    rule: 'Amount $1–$5,000,000 (RC=11), Term 12–360 months (RC=12), Credit score 300–850 (RC=13). All fields validated BEFORE any KSDS read or calculation. Failures still write audit (BR-009).',
    legacy: {
      cobol: [{ file: 'qlotcalc.cbl', para: '§2000-VALIDATE-INPUT', lines: '152–204', desc: 'IF/ELSE chain. Any failure: MOVE error text to WS-ERROR-MESSAGE, MOVE RC to WS-RETURN-CODE, PERFORM §9000-WRITE-AUDIT-LOG, STOP RUN.' }],
      cpp: [
        { file: 'validation.cpp', func: 'validate_loan_input_cpp()', lines: '22–80', desc: 'Client-side mirror of §2000. Same bounds, same return code values. First line of defense before Pathway IPC call.' },
        { file: 'lnmain.cpp', func: 'create_loan_screen()', lines: '290–298', desc: 'Calls validate_loan_input_cpp(). On failure: MessageBox with RC-mapped message, returns to form.' },
      ],
      dataItems: ['WS-LOAN-AMOUNT PIC 9(9)V99 COMP-3', 'WS-TERM-MONTHS PIC 9(3) COMP', 'WS-CREDIT-SCORE PIC 9(3)', 'WS-RETURN-CODE PIC 9(2)', 'WS-ERROR-MESSAGE PIC X(80)'],
      ksds: [],
    },
    impact: ['§4000/§5000/§6000/§7000: never reached if validation fails', '§9000-WRITE-AUDIT-LOG: called even on validation failure (BR-009)', 'C++ MessageBox: displays WS-ERROR-MESSAGE on RC=11/12/13'],
    testCases: ['TC-003 — Amount > $5M → RC=11', 'TC-004 — Term < 12 → RC=12', 'TC-005 — Score boundaries'],
    migration: 'FluentValidation rules with matching error codes. Validate in both API layer AND service layer.',
    code: `RuleFor(x => x.Amount)
  .InclusiveBetween(1m, 5_000_000m).WithErrorCode("11");
RuleFor(x => x.TermMonths)
  .InclusiveBetween(12, 360).WithErrorCode("12");
RuleFor(x => x.CreditScore)
  .InclusiveBetween(300, 850).WithErrorCode("13");`,
  },
  {
    id: 'BR-004', cat: 'Premium Base Rates by Loan Type', imp: 'High',
    rule: 'Base annual premium rates: Home=0.28%, Auto=0.35%, Commercial=0.42%, Specialty=0.55%, Life=0.20%. Stored in RATE_TABLE KSDS. Multiplied by loan amount to get annual base premium.',
    legacy: {
      cobol: [
        { file: 'qlotcalc.cbl', para: '§4000-FETCH-BASE-RATE', lines: '246–270', desc: 'Random READ RATE_TABLE KSDS using composite key WS-LOAN-TYPE + WS-RATE-TIER. Returns WS-BASE-RATE, WS-RATE-FLOOR, WS-RATE-CEILING, WS-PREM-BASE-RATE.' },
        { file: 'qlotcalc.cbl', para: '§7000-CALCULATE-INSURANCE-PREMIUM', lines: '362–395', desc: 'MULTIPLY WS-LOAN-AMOUNT BY WS-PREM-BASE-RATE GIVING WS-BASE-PREMIUM COMP-3 ROUNDED. Then apply tier multiplier (BR-002).' },
      ],
      cpp: [],
      dataItems: ['WS-PREM-BASE-RATE PIC 9V9(4) COMP-3', 'WS-BASE-PREMIUM PIC 9(8)V99 COMP-3', 'RATE-KEY: LOAN-TYPE(30)+CREDIT-TIER(2)'],
      ksds: ['RATE_TABLE ($DATA.RATEDB) — 20 records (5 types × 4 tiers). RC=20 if key not found.'],
    },
    impact: ['§7000: WS-PREM-BASE-RATE feeds premium calculation', 'LOAN_MASTER: insurance_premium stored on origination', '§9000: RC=20 audit if RATE_TABLE key missing'],
    testCases: ['TC-001 — Home 0.28% × Prime 0.90×', 'TC-002 — Auto 0.35% × Subprime 1.20×'],
    migration: 'Store in dbo.RateTable with effective_date versioning. Never hardcode rates.',
    code: `"PremiumBaseRates": {
  "Home Insurance Loan":         0.0028,
  "Auto Insurance Loan":         0.0035,
  "Commercial Property Loan":    0.0042,
  "Specialty Equipment Loan":    0.0055,
  "Life Insurance Premium Loan": 0.0020
}`,
  },
  {
    id: 'BR-005', cat: 'State Rate Adjustments', imp: 'High',
    rule: 'State-specific surcharges from STATE_SURCHARGE KSDS applied after base rate. Final rate clamped to [FLOOR_RATE, CEILING_RATE] from RATE_TABLE. Regulatory requirement — cannot bypass.',
    legacy: {
      cobol: [{ file: 'qlotcalc.cbl', para: '§5000-APPLY-STATE-ADJUSTMENT', lines: '271–313', desc: 'READ STATE_SURCHARGE by WS-STATE-CODE. ADD WS-RATE-ADJ TO WS-INTEREST-RATE. IF WS-INTEREST-RATE < WS-RATE-FLOOR MOVE WS-RATE-FLOOR TO WS-INTEREST-RATE. If > CEILING, clamp to ceiling.' }],
      cpp: [{ file: 'lnmain.cpp', func: 'create_loan_screen()', lines: '290', desc: 'Collects state_code via combo box — routes to QLOTCALC in CALC-AREA struct.' }],
      dataItems: ['WS-STATE-CODE PIC X(2)', 'WS-RATE-ADJ PIC S9V9(4) COMP-3 (signed — can be negative)', 'WS-RATE-FLOOR PIC 9V9(4) COMP-3', 'WS-RATE-CEILING PIC 9V9(4) COMP-3'],
      ksds: ['STATE_SURCHARGE ($DATA.RATEDB) — keyed by state_code(2). Contains rate_adjustment, premium_surcharge.'],
    },
    impact: ['§6000-CALC-PAYMENT: uses state-adjusted WS-INTEREST-RATE', '§7000-CALC-PREMIUM: premium_surcharge from STATE_SURCHARGE also applied', 'All 5 loan states (GA/FL/OH/IL) have different surcharges'],
    testCases: ['TC-001 — GA state surcharge applied', 'TC-006 — FL record search'],
    migration: 'SELECT rate_adjustment FROM dbo.StateSurcharge WHERE state_code=@s. Math.Clamp for floor/ceiling.',
    code: `var surcharge = await _stateRepo.GetAsync(stateCode);
adjRate = Math.Clamp(
  baseRate + (surcharge?.RateAdjustment ?? 0m),
  rateRecord.FloorRate,
  rateRecord.CeilingRate);`,
  },
  {
    id: 'BR-006', cat: 'Amortization Formula — COMP-3 Precision', imp: 'Critical',
    rule: 'Monthly payment = P×[r(1+r)^n]/[(1+r)^n-1]. r = annual_rate/12/100, n = term_months. ALL arithmetic in COMP-3 packed decimal. IEEE 754 floating point PROHIBITED. (1+r)^n computed by iterative loop — never via power function.',
    legacy: {
      cobol: [{ file: 'qlotcalc.cbl', para: '§6000-CALCULATE-MONTHLY-PAYMENT', lines: '315–360', desc: 'COMPUTE loop: MULTIPLY (1 + WS-MONTHLY-RATE) BY WS-POWER GIVING WS-POWER COMP-3 ROUNDED. n iterations. DIVIDE numerator BY denominator GIVING WS-MONTHLY-PAYMENT ROUNDED.' }],
      cpp: [{ file: 'lnmain.cpp', func: 'create_loan_screen()', lines: '305', desc: 'Displays WS-MONTHLY-PAYMENT in CConfirmDialog and stored in CALC-AREA.calc_monthly_payment.' }],
      dataItems: ['WS-MONTHLY-PAYMENT PIC 9(8)V99 COMP-3', 'WS-MONTHLY-RATE PIC 9V9(6) COMP-3', 'WS-POWER PIC 9(4)V9(8) COMP-3', 'WS-NUMERATOR PIC 9(12)V99 COMP-3', 'WS-DENOMINATOR PIC 9(4)V9(8) COMP-3'],
      ksds: [],
    },
    impact: ['§8000: WS-MONTHLY-PAYMENT feeds total cost calculation', 'LOAN_MASTER: monthly_payment field stored at origination', 'CConfirmDialog: displayed to user pre-confirmation (BR-007)', 'TC-010: $0.01 tolerance verification across 1000 scenarios'],
    testCases: ['TC-001 — Prime 60mo $50K = $946.39', 'TC-010 — Precision: decimal vs COMP-3 within $0.01'],
    migration: 'C# decimal throughout. Loop for (1+r)^n. MidpointRounding.AwayFromZero matches COBOL ROUNDED.',
    code: `var r = annualRate / 100m / 12m;
var power = 1m;
for (int i = 0; i < termMonths; i++) power *= (1m + r);
var payment = P * r * power / (power - 1m);
return decimal.Round(payment, 2, MidpointRounding.AwayFromZero);`,
  },
  {
    id: 'BR-007', cat: 'Explicit Loan Creation Confirmation', imp: 'Medium',
    rule: 'Loan creation requires EXPLICIT user confirmation via CConfirmDialog after quote display. Auto-proceed is prohibited. Confirmation dialog must display: rate tier, interest rate, monthly payment, insurance premium, total cost.',
    legacy: {
      cobol: [],
      cpp: [
        { file: 'lnmain.cpp', func: 'create_loan_screen()', lines: '320–354', desc: 'After PATHWAY_WRITEREAD returns: populates CConfirmDialog with all 5 quote values. DoModal() blocks. If IDOK: proceeds to generate_loan_id(). If IDCANCEL: returns to input form.' },
        { file: 'lnmain.cpp', class: 'CConfirmDialog', lines: '480–542', desc: 'MFC dialog class. OnInitDialog() populates 5 static text controls with quote fields. OK/Cancel buttons. No auto-dismiss timer.' },
      ],
      dataItems: ['CALC-AREA.calc_interest_rate', 'CALC-AREA.calc_monthly_payment', 'CALC-AREA.calc_insurance_premium', 'CALC-AREA.calc_total_cost', 'CALC-AREA.rate_tier'],
      ksds: [],
    },
    impact: ['generate_loan_id(): only reached after IDOK', 'LOAN_MASTER INSERT: only reached after confirmation', 'UX flow: form → get-quote → confirm → create', 'AC-001/TC-001: confirm dialog must appear in test'],
    testCases: ['TC-001 — CConfirmDialog must appear and show all 5 fields', 'TC-009 — Confirmation cancel: no loan created'],
    migration: 'Web modal with 5 quote fields. POST /api/loans/quote → quoteToken (5min TTL). POST /api/loans requires token.',
    code: `// POST /api/loans/quote → returns { quoteToken, tier, rate, payment, premium, totalCost }
// POST /api/loans  → requires { quoteToken } in body
// HTTP 422 if quoteToken missing or expired
// quoteToken = GUID stored in cache with 5-min TTL`,
  },
  {
    id: 'BR-008', cat: 'Post-Origination Field Immutability', imp: 'High',
    rule: 'After loan origination, these fields are IMMUTABLE: borrower_name, policy_id, loan_type, loan_amount. Editable fields: status, loan_officer, collateral, state_code. Optional QLOTCALC recalculation on update.',
    legacy: {
      cobol: [],
      cpp: [
        { file: 'lnmain.cpp', func: 'update_loan_screen()', lines: '355–399', desc: 'After fetch_loan_by_id(): calls GetDlgItem(IDC_BORROWER)->EnableWindow(FALSE), GetDlgItem(IDC_AMOUNT)->EnableWindow(FALSE) etc. for all 4 immutable fields.' },
        { file: 'lnmain.cpp', class: 'CUpdateDialog', lines: '400–478', desc: 'OnSave(): builds UPDATE_REQUEST struct. Does NOT include immutable fields. Validates editable fields only. Calls PATHWAY REWRITE.' },
        { file: 'db_connector.cpp', func: 'update_loan_record()', lines: '572–610', desc: 'Builds LOAN_RECORD for REWRITE. Copies original immutable values from fetched record unchanged. PATHWAY_WRITEREAD REWRITE operation.' },
      ],
      dataItems: ['LOAN_RECORD.borrower_name (read-only in CUpdateDialog)', 'LOAN_RECORD.policy_id (read-only)', 'LOAN_RECORD.loan_type (read-only)', 'LOAN_RECORD.loan_amount (read-only)'],
      ksds: ['LOAN_MASTER ($DATA.LOANDB) — REWRITE op: all fields rewritten, immutability enforced at C++ layer'],
    },
    impact: ['CUpdateDialog: 4 fields greyed out (EnableWindow=FALSE)', 'LOAN_MASTER REWRITE: immutable fields copied from original fetch', 'Audit record if QLOTCALC recalculation occurs', 'AC-008: API must reject HTTP PATCH with immutable fields'],
    testCases: ['TC-008 — UI: immutable fields disabled in CUpdateDialog'],
    migration: 'UI read-only fields. PATCH /api/loans/{id} — whitelist only status/officer/collateral. HTTP 422 if borrower/amount/type in request body.',
    code: `// PATCH /api/loans/{id}
// Accepted: { status, loanOfficer, collateral }
// Rejected (HTTP 422): { amount, loanType, borrowerName, policyId }
public record UpdateLoanRequest(
  string? Status, string? LoanOfficer, string? Collateral);`,
  },
  {
    id: 'BR-009', cat: 'Mandatory Audit Trail — All Invocations', imp: 'High',
    rule: 'EVERY QLOTCALC invocation MUST write exactly ONE audit record to AUDIT_LOG KSDS — including validation failures (RC=11/12/13), RATE_TABLE misses (RC=20), and all success paths. No exception path may bypass §9000.',
    legacy: {
      cobol: [
        { file: 'qlotcalc.cbl', para: '§9000-WRITE-AUDIT-LOG', lines: '420–452', desc: 'WRITE AUDIT-LOG-RECORD. Fields: timestamp, loan_type, amount, term, score, rate, payment, premium, rc, error_msg, session_id. Sequential WRITE to $LOG.QLOTAUDT.' },
        { file: 'qlotcalc.cbl', para: '§2000-VALIDATE-INPUT', lines: '192–204', desc: 'On any validation failure: PERFORM §9000-WRITE-AUDIT-LOG before STOP RUN.' },
        { file: 'qlotcalc.cbl', para: '§4000-FETCH-BASE-RATE', lines: '257–260', desc: 'On RC=20 (RATE_TABLE not found): PERFORM §9000-WRITE-AUDIT-LOG before STOP RUN.' },
        { file: 'qlotcalc.cbl', para: '§8000-CALCULATE-TOTALS', lines: '404–419', desc: 'Success path: PERFORM §9000-WRITE-AUDIT-LOG as final paragraph before return.' },
      ],
      cpp: [],
      dataItems: ['AUDIT-LOG-RECORD: timestamp(26), session-id(12), loan-type(30), amount(9V2 COMP-3), term(3), score(3), rate(2V4 COMP-3), payment(8V2 COMP-3), rc(2), error-msg(80)'],
      ksds: ['AUDIT_LOG ($LOG.QLOTAUDT) — sequential WRITE-ONLY. Never READ in normal operation. Regulatory/compliance archive.'],
    },
    impact: ['ALL QLOTCALC exit paths: §2000 failure, §4000 RC=20, §8000 success — all PERFORM §9000', 'AC-005: 100% audit write rate across 100 scenarios including 10 failures', 'Azure migration: append-only Azure Table Storage'],
    testCases: ['TC-003 — RC=11 failure still writes audit', 'TC-001 — Success path writes audit', 'TC-010 — Audit written with correct field values'],
    migration: 'C# try/finally: finally block ALWAYS executes. Azure Table Storage PartitionKey=date, RowKey=timestamp+sessionId. No UPDATE/DELETE.',
    code: `QuoteResult result;
try {
  result = await CalculateAsync(request);
} catch (Exception ex) {
  result = QuoteResult.Failed(ex.Message);
} finally {
  // always executes — mirrors §9000 on ALL exit paths
  await _auditLog.WriteAsync(new AuditEntry(request, result));
}`,
  },
];
