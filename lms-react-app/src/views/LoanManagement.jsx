import { useState } from 'react';
import { LOANS, LOAN_TYPES } from '../data/loans';
import { calcQuote, fmt$ } from '../utils/calc';

const statusColor = s => s === 'Active' ? 'green' : s === 'Delinquent' ? 'red' : s === 'Under Review' ? 'orange' : 'muted';

export default function LoanManagement({ onToast }) {
  const [selected, setSelected] = useState(LOANS[0]);
  const [quote, setQuote] = useState(null);
  const [form, setForm] = useState({ amount: 45000, term: 120, type: LOAN_TYPES[0], score: 742 });

  function runQuote() {
    const q = calcQuote(form.amount, form.term, form.type, form.score);
    setQuote(q);
    onToast?.('QLOTCALC simulation complete');
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {/* Left: Loan list + detail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card">
          <div className="card-title">LOAN_MASTER — Active Records</div>
          <table className="data-table" style={{ fontSize: 11 }}>
            <thead><tr><th>Loan ID</th><th>Borrower</th><th>Amount</th><th>Rate</th><th>Status</th></tr></thead>
            <tbody>
              {LOANS.map(l => (
                <tr
                  key={l.id}
                  onClick={() => setSelected(l)}
                  style={{ cursor: 'pointer', background: selected?.id === l.id ? '#1f3a5f33' : '' }}
                >
                  <td className="mono" style={{ color: 'var(--blue)' }}>{l.id}</td>
                  <td>{l.borrower.split(',')[0]}</td>
                  <td>{fmt$(l.amount)}</td>
                  <td>{l.rate}%</td>
                  <td>
                    <span className={`status-dot dot-${statusColor(l.status)}`} />
                    {l.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="card">
            <div className="card-title">Loan Detail — {selected.id}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                ['Borrower', selected.borrower],
                ['Policy', selected.policy],
                ['Type', selected.type],
                ['Amount', fmt$(selected.amount)],
                ['Rate', `${selected.rate}%`],
                ['Term', `${selected.term} months`],
                ['Payment', fmt$(selected.payment) + '/mo'],
                ['Credit Score', selected.creditScore],
                ['Officer', selected.officer],
                ['State', selected.state],
                ['Ins. Premium', fmt$(selected.premium) + '/mo'],
                ['Collateral', selected.collateral],
              ].map(([k, v]) => (
                <div key={k} style={{ fontSize: 11, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)', display: 'block', fontSize: 9, textTransform: 'uppercase' }}>{k}</span>
                  <span className="mono">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: QLOTCALC Quote Simulator */}
      <div className="card">
        <div className="card-title">QLOTCALC Quote Simulator</div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 12 }}>
          Replicates HP Tandem COBOL qlotcalc.cbl — PATHWAY_WRITEREAD() RPC call simulation
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {[
            ['Loan Amount ($)', 'amount', 'number', 1, 5000000],
            ['Term (months)', 'term', 'number', 12, 360],
            ['Credit Score', 'score', 'number', 300, 850],
          ].map(([label, key, type, min, max]) => (
            <div key={key}>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>{label}</div>
              <input
                type={type}
                min={min}
                max={max}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                style={{
                  width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
                  color: 'var(--text)', borderRadius: 5, padding: '6px 10px', fontSize: 11,
                }}
              />
            </div>
          ))}
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>Loan Type</div>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              style={{
                width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text)', borderRadius: 5, padding: '6px 10px', fontSize: 11,
              }}
            >
              {LOAN_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <button
            onClick={runQuote}
            style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Run QLOTCALC Simulation →
          </button>
        </div>

        {quote && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Quote Result</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['Credit Tier', quote.tier, quote.tier === 'PRIME' ? 'var(--green)' : quote.tier === 'STANDARD' ? 'var(--blue)' : quote.tier === 'SUBPRIME' ? 'var(--orange)' : 'var(--red)'],
                ['Interest Rate', `${quote.rate}%`, 'var(--text)'],
                ['Monthly Payment', fmt$(quote.payment), 'var(--green)'],
                ['Insurance Premium', fmt$(quote.premium) + '/mo', 'var(--blue)'],
                ['Total Cost', fmt$(quote.totalCost), 'var(--orange)'],
                ['Total Interest', fmt$(quote.totalInterest), 'var(--muted)'],
              ].map(([k, v, color]) => (
                <div key={k} className="kpi" style={{ padding: '8px 10px' }}>
                  <div className="kpi-lbl">{k}</div>
                  <div className="kpi-val" style={{ color, fontSize: 16 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, padding: 10, background: 'var(--surface2)', borderRadius: 6, border: '1px solid var(--border)', fontSize: 10, color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--text)' }}>§6000 Formula:</strong> P×[r(1+r)^n]/[(1+r)^n−1] using decimal arithmetic (BR-006)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
