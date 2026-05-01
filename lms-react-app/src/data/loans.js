export const LOAN_TYPES = [
  'Home Insurance Loan',
  'Auto Insurance Loan',
  'Commercial Property Loan',
  'Specialty Equipment Loan',
  'Life Insurance Premium Loan',
];

export const LOANS = [
  { id: 'LN-2024-001', borrower: 'Hartford, James R.', policy: 'POL-447821', type: 'Home Insurance Loan', amount: 45000, rate: 5.50, term: 120, payment: 487.44, status: 'Active', creditScore: 742, officer: 'Susan Merrill', state: 'GA', collateral: 'Primary residence — 1201 Magnolia Dr', premium: 10.50 },
  { id: 'LN-2024-002', borrower: 'Delgado, Maria C.', policy: 'POL-338910', type: 'Auto Insurance Loan', amount: 22000, rate: 6.75, term: 60, payment: 433.50, status: 'Active', creditScore: 698, officer: 'Kevin Zhao', state: 'FL', collateral: '2022 Honda Accord VIN 1HG...', premium: 6.42 },
  { id: 'LN-2024-003', borrower: 'Pemberton, Arthur L.', policy: 'POL-552341', type: 'Commercial Property Loan', amount: 275000, rate: 6.00, term: 240, payment: 1969.46, status: 'Under Review', creditScore: 778, officer: 'Derek Okafor', state: 'FL', collateral: 'Commercial warehouse — 4400 Industrial Blvd', premium: 96.25 },
  { id: 'LN-2023-098', borrower: 'Kowalski, Diane B.', policy: 'POL-119823', type: 'Specialty Equipment Loan', amount: 15500, rate: 8.25, term: 48, payment: 381.62, status: 'Delinquent', creditScore: 611, officer: 'Susan Merrill', state: 'OH', collateral: 'CNC milling machine SN-9821', premium: 10.37 },
  { id: 'LN-2023-055', borrower: 'Nguyen, Phillip T.', policy: 'POL-883001', type: 'Life Insurance Premium Loan', amount: 8200, rate: 5.50, term: 36, payment: 246.87, status: 'Closed', creditScore: 805, officer: 'Kevin Zhao', state: 'IL', collateral: 'Policy CSV balance', premium: 1.37 },
];

export const TIER_RATES = { PR: 5.50, ST: 6.75, SP: 8.25, DS: 10.50 };
export const PREM_BASE = {
  'Home Insurance Loan': 0.0028,
  'Auto Insurance Loan': 0.0035,
  'Commercial Property Loan': 0.0042,
  'Specialty Equipment Loan': 0.0055,
  'Life Insurance Premium Loan': 0.0020,
};
export const TIER_MULT = { PR: 0.90, ST: 1.00, SP: 1.20, DS: 1.45 };
