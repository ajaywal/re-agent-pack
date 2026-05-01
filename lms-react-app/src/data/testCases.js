export const TCS = [
  {
    id: 'TC-001', cat: 'Create', pri: 'Critical',
    name: 'Prime credit home loan — end-to-end create with QLOTCALC',
    steps: [
      'Open LNCRT01 (C++ CCreateLoanDialog)',
      'Enter: Borrower=Test User, Policy=POL-000001, Type=Home Insurance Loan, Amount=50000, Term=60, Score=780, State=GA',
      'Click Get Quote — PATHWAY_WRITEREAD → QLOTCALC §0000',
      'Review CConfirmDialog (BR-007) — must show rate tier, payment, premium, total cost',
      'Click OK to confirm — loan created',
      'Verify loan_id = LN-YYYY-NNN format',
    ],
    expected: [
      'Rate tier = PRIME (score 780 ≥ 750 per §3000)',
      'Interest rate = 5.50% (PRIME from RATE_TABLE)',
      'Monthly payment = $946.39 (amortization: P×[r(1+r)^60]/[(1+r)^60-1] at r=5.5/100/12)',
      'Premium = $50,000×0.0028×0.90 = $126.00/mo (PRIME 0.90× discount)',
      'Total cost = $946.39×60 + $126.00×60 = $64,343.40',
      'Loan ID assigned: LN-2025-NNN',
      'Status = Active, 1 AUDIT_LOG record written',
    ],
  },
  {
    id: 'TC-002', cat: 'Create', pri: 'Critical',
    name: 'Subprime credit auto loan — boundary score 625',
    steps: [
      'Enter: Type=Auto Insurance Loan, Amount=15000, Term=36, Score=625 (subprime: 620≤625<680)',
      'Run QLOTCALC — verify §3000 assigns SUBPRIME',
    ],
    expected: [
      'Tier = SUBPRIME (620 ≤ 625 < 680 — not deep-sub)',
      'Rate = 8.25% (SUBPRIME from RATE_TABLE)',
      'Payment = $15,000×(8.25%/12)×(1+8.25%/12)^36/((1+8.25%/12)^36-1)',
      'Premium = $15,000×0.0035×1.20 = $63.00/mo (SUBPRIME 1.20× surcharge)',
      'Confirm no DS tier applied — score 625 ≥ 620',
    ],
  },
  {
    id: 'TC-003', cat: 'Validation', pri: 'Critical',
    name: 'Amount exceeds $5M maximum — QLOTCALC §2000 RC=11',
    steps: [
      'Submit loan with amount=5,500,000',
      'Observe C++ client validation first, then QLOTCALC',
    ],
    expected: [
      'C++ validate_loan_input_cpp: blocks first with UI dialog',
      'QLOTCALC §2000 returns RC=11: "LOAN AMOUNT MUST BE $1-$5,000,000"',
      'No LOAN_MASTER write',
      'AUDIT_LOG STILL written (BR-009: failures also audited)',
      'Error shown in C++ MessageBox',
    ],
  },
  {
    id: 'TC-004', cat: 'Validation', pri: 'High',
    name: 'Term below 12 months — QLOTCALC §2000 RC=12',
    steps: ['Submit with term=6 months'],
    expected: [
      'QLOTCALC §2000 RC=12: "TERM MUST BE 12-360 MONTHS"',
      '§4000-FETCH-BASE-RATE not reached (exits before)',
      'Audit record written with RC=12',
    ],
  },
  {
    id: 'TC-005', cat: 'Boundary', pri: 'Critical',
    name: 'Credit score boundary 750 PRIME/STANDARD threshold',
    steps: [
      'Test score=750 → must be PRIME',
      'Test score=749 → must be STANDARD',
      'Test score=620 → must be SUBPRIME',
      'Test score=619 → must be DEEP-SUB',
    ],
    expected: [
      'Score 750 → TIER-PRIME=TRUE → rate 5.50%',
      'Score 749 → TIER-STANDARD=TRUE → rate 6.75%',
      'Score 620 → TIER-SUBPRIME=TRUE → rate 8.25%',
      'Score 619 → TIER-DEEP-SUB=TRUE → rate 10.50%',
      'In C#: use >= not >: score >= 750 → Prime (exact match)',
    ],
  },
  {
    id: 'TC-006', cat: 'Search', pri: 'High',
    name: 'Search by Loan ID — exact KSDS random access',
    steps: [
      'Open LNSRCH01 (CSearchDialog)',
      'Enter Loan ID: LN-2024-001',
      'Click Search — Pathway IPC → LOAN_MASTER random READ',
    ],
    expected: [
      'Returns exactly 1 record',
      'All 15 fields match James Hartford record',
      'CListCtrl shows record in first row',
    ],
  },
  {
    id: 'TC-007', cat: 'Search', pri: 'Medium',
    name: "Search by partial borrower name — sequential KSDS scan",
    steps: [
      "Enter borrower: 'Dela' (partial)",
      'Execute — triggers sequential scan of LOAN_MASTER',
    ],
    expected: [
      'Returns Maria Delgado (POL-774512) only',
      'No false positives',
      'Note: sequential scan = O(n) — SQL LIKE with index resolves this',
    ],
  },
  {
    id: 'TC-008', cat: 'Update', pri: 'High',
    name: 'Update loan — immutable fields locked (BR-008)',
    steps: [
      'Open LNUPD01 (CUpdateDialog)',
      'Fetch LN-2023-098 (Linda Kowalski, Delinquent)',
      'Verify: borrower/policy/type/amount fields are ReadOnly (grey, no edit)',
      'Change status to Active, check Recalculate checkbox',
      'Click Save',
    ],
    expected: [
      'GetDlgItem(IDC_BORROWER)->EnableWindow(FALSE) — confirmed disabled',
      'Status changes: Delinquent → Active',
      'QLOTCALC recalculates with current rates',
      'LOAN_MASTER REWRITE via Pathway',
      'Audit written if QLOTCALC ran',
    ],
  },
  {
    id: 'TC-009', cat: 'Audit', pri: 'Critical',
    name: 'Audit completeness — every QLOTCALC call produces one record',
    steps: [
      'Create 5 valid loans (one per type)',
      'Submit 2 invalid loans: amount=6M (RC=11), term=6 (RC=12)',
      'Query AUDIT_LOG KSDS (or Azure Table Storage in .NET)',
    ],
    expected: [
      '7 total audit records',
      '5 success records: return_code=0, all calc fields populated',
      '2 failure records: return_code=11/12, error_msg populated, calc fields zeroed',
      'Sequential ordering preserved — append-only',
      'BR-009: no QLOTCALC exit path exists without audit write',
    ],
  },
  {
    id: 'TC-010', cat: 'Precision', pri: 'Critical',
    name: 'COMP-3 vs C# decimal precision — 1,000 scenario test',
    steps: [
      'Run same 1,000 loan scenarios through legacy QLOTCALC output and C# decimal implementation',
      'Compare monthly payment and premium for each',
    ],
    expected: [
      'Monthly payment difference < $0.01 for all 1,000 scenarios',
      'Premium difference < $0.01 for all',
      'No rounding divergence over 360-month maximum term loans',
      'Use decimal loop (not Math.Pow) for (1+r)^n',
      'MidpointRounding.AwayFromZero matches COBOL ROUNDED',
    ],
  },
];
