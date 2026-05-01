import { LOANS } from '../data/loans';
import { ALL_VIEWS, ROLE_VIEWS } from '../data/views';
import { fmt$ } from '../utils/calc';

export default function Dashboard({ role, onNavigate }) {
  const allowed = ROLE_VIEWS[role] || [];
  const total = LOANS.reduce((s, l) => s + l.amount, 0);
  const active = LOANS.filter(l => l.status === 'Active').length;
  const delinq = LOANS.filter(l => l.status === 'Delinquent').length;

  const statusColor = s => s === 'Active' ? 'green' : s === 'Delinquent' ? 'red' : s === 'Under Review' ? 'orange' : 'muted';

  const track = [
    ['C++ Win32/MFC Frontend', 'lnmain.cpp (~900 lines)', 'tag-warn', 'screens'],
    ['HP Tandem COBOL Backend', 'qlotcalc.cbl (~550 lines)', 'tag-success', 'codeviewer'],
    ['HP Pathway IPC Bus', 'PATHWAY_WRITEREAD() RPC', 'tag-blue', 'dependency'],
    ['5 KSDS Files', 'LOAN_MASTER / RATE_TABLE / …', 'tag-purple', 'dbconn'],
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
        {[
          ['Total Portfolio', fmt$(total), `${LOANS.length} loans — LOAN_MASTER KSDS`, 'var(--blue)'],
          ['Active Loans', active, 'Status = Active', 'var(--green)'],
          ['Delinquent', delinq, 'Requires review', 'var(--red)'],
          ['Business Rules', 9, 'BR-001 – BR-009 mapped', 'var(--orange)'],
        ].map(([lbl, val, sub, color]) => (
          <div key={lbl} className="kpi">
            <div className="kpi-lbl">{lbl}</div>
            <div className="kpi-val" style={{ color }}>{val}</div>
            <div className="kpi-sub">{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div className="card">
          <div className="card-title">Migration Track — Legacy → .NET 8</div>
          {track.map(([a, b, t, v]) => (
            <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span className={`tag ${t}`} style={{ minWidth: 80, textAlign: 'center', fontSize: 9 }}>{a.split(' ')[0]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{a}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{b}</div>
              </div>
              {allowed.includes(v) && (
                <button className="pill pill-blue" onClick={() => onNavigate(v)} style={{ fontSize: 9 }}>View →</button>
              )}
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">Loan Portfolio</div>
          <table className="data-table" style={{ fontSize: 11 }}>
            <thead><tr><th>Loan ID</th><th>Borrower</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {LOANS.map(l => (
                <tr key={l.id} onClick={() => onNavigate('loanmgmt')} style={{ cursor: 'pointer' }}>
                  <td className="mono" style={{ color: 'var(--blue)' }}>{l.id}</td>
                  <td>{l.borrower.split(',')[0]}</td>
                  <td>{fmt$(l.amount)}</td>
                  <td>
                    <span className={`status-dot dot-${statusColor(l.status)}`} />
                    {l.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Quick Navigation</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ALL_VIEWS.filter(v => allowed.includes(v.id)).map(v => (
            <button key={v.id} className="pill pill-blue" onClick={() => onNavigate(v.id)}>
              {v.icon} {v.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
