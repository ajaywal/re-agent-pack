// Approved carrier states for RataBase rating (LoanRules.cpp::LoadApprovedCarrierStates)
export const APPROVED_STATES = new Set([
  'AL','AZ','CA','CO','FL','GA','IL','IN','KY','MD',
  'MI','MN','MO','NC','NJ','NY','OH','PA','SC','TN','TX','VA','WI',
]);

// Coastal-loading states — 0.62% annual base rate vs 0.45% standard
const COASTAL_STATES = new Set(['FL','TX','SC','NC']);

// Lender target forms — LoanRules.cpp::LoadLenderTargetForms
export const LENDER_TARGET_FORMS = ['LT-F100','LT-F200','LT-F300','LT-F400'];

// Premium calculation based on RataBase adapter logic
// RataBaseServiceAdapter.cpp: base 0.0045, coastal loading 0.0062
export function calcPremium(propertyValue, state) {
  const isCoastal = COASTAL_STATES.has(state?.toUpperCase());
  const annualRate = isCoastal ? 0.0062 : 0.0045;
  const annualPremium = Math.round(propertyValue * annualRate * 100) / 100;
  const monthlyPremium = Math.round(annualPremium / 12 * 100) / 100;
  return { annualPremium, monthlyPremium, rate: annualRate, isCoastal };
}

// Validate loan number: exactly 10 numeric digits (LoanRules.cpp::ValidateLoanForSearch)
export function validateLoanNum(loanNum) {
  const n = (loanNum || '').trim();
  if (!n) return 'R-L-001: At least one search criterion required.';
  if (n.length !== 10) return 'R-L-002: Loan number must be exactly 10 digits.';
  if (!/^\d{10}$/.test(n)) return 'R-L-002: Loan number must contain digits only.';
  return null;
}

// Validate carrier state eligibility (LoanRules.cpp::EnforceCarrierCoverage)
export function validateCarrierState(state) {
  if (!state) return 'R-L-003: Property state is required for RataBase rating.';
  if (!APPROVED_STATES.has(state.toUpperCase())) {
    return `R-L-003: State '${state}' is not in the approved carrier list.`;
  }
  return null;
}

export function fmt$(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}
