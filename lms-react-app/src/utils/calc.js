import { TIER_RATES, PREM_BASE, TIER_MULT } from '../data/loans';

export function calcQuote(amount, term, type, score) {
  const tier = score >= 750 ? 'PR' : score >= 680 ? 'ST' : score >= 620 ? 'SP' : 'DS';
  const tierName = { PR: 'Prime', ST: 'Standard', SP: 'Subprime', DS: 'DeepSub' }[tier];
  const rate = TIER_RATES[tier];
  const r = rate / 100 / 12;
  const pow = Math.pow(1 + r, term);
  const payment = Math.round((amount * r * pow / (pow - 1)) * 100) / 100;
  const baseRate = PREM_BASE[type] || 0.003;
  const premium = Math.round(amount * baseRate * TIER_MULT[tier] / 12 * 100) / 100;
  const totalCost = Math.round((payment * term + premium * term) * 100) / 100;
  return { tier: tierName, rate, payment, premium, totalCost };
}

export function fmt$(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}
