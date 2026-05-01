import { LOANS, TME_ROUTES } from '../data/loans';
import { ROLE_VIEWS } from '../data/views';
import { BRS } from '../data/businessRules';
import { TCS } from '../data/testCases';
import { fmt$ } from '../utils/calc';

export default function Dashboard({ setView, role }) {
  const viewIds = ROLE_VIEWS[role] || ROLE_VIEWS.PM;
  const totalPortfolioValue = LOANS.reduce((s, l) => s + l.propertyValue, 0);
  const totalUpb = LOANS.reduce((s, l) => s + l.upb, 0);
  const ediEligible = LOANS.filter(l => l.ediFlag === 'Y' && l.cycleType !== 'INSTANT_ISSUE').length;

  const kpis = [
    ['Business Rules', BRS.length, 'var(--blue)', 'bizrules'],
    ['Test Cases', TCS.length, 'var(--green)', 'testcases'],
    ['Seed Loans', LOANS.length, 'var(--orange)', 'loanmgmt'],
    ['TME Routes', TME_ROUTES.length, 'var(--purple)', 'dbconn'],
    ['Tandem Programs', 4, 'var(--green)', 'calltree'],
    ['EDI Eligible', ediEligible, 'var(--blue)', 'testdash'],
  ];

  const migrationTracks = [
    { label: 'Reverse Engineering', status: 'Complete', color: 'var(--green)', items: '14 rules extracted, 3 screens inventoried, full call tree mapped' },
    { label: 'Requirements', status: 'Complete', color: 'var(--green)', items: 'FR/NFR/Data Model/AC documented from source artifacts' },
    { label: 'Forward Engineering', status: 'In Progress', color: 'var(--orange)', items: 'Angular 17 + .NET 8 Core + Azure SQL + Azure Service Bus' },
    { label: 'Test Coverage', status: 'In Progress', color: 'var(--orange)', items: `${TCS.length} TCs mapped to R-L-001–R-L-014` },
  ];

  const statusColor = { ACTIVE: 'var(--green)', DELINQUENT: 'var(--orange)', CLOSED: 'var(--muted)' };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 8, marginBottom: 12 }}>
        {kpis.map(([lbl, val, color, vid]) => (
          <div key={lbl} className="kpi" onClick={() => vid && viewIds.includes(vid) && setView(vid)} style={{ cursor: vid ? 'pointer' : 'default' }}>
            <div className="kpi-lbl">{lbl}</div>
            <div className="kpi-val" style={{ color, fontSize: 22 }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div className="card">
          <div className="card-title">TrackAll Loan Servicing System (LSS)</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.9 }}>
            {[
              ['System', 'TrackAllClientManagerLegacy'],
              ['Legacy UI', 'VC++ Win32/MFC — LoanSearchDlg, LoanAddDlg, LoanModifyDlg'],
              ['Backend', 'HP NonStop Tandem COBOL — TKA900 / TKA901 / TKA902 / TKA920'],
              ['Transport', 'TME mnemonic routing via fgatetcp TCP'],
              ['External', 'RataBase (premium quotes) + Kentucky ISO adapter (AIP930)'],
              ['Database', 'HP NonStop SQL/MP — LSS_LOAN_T, LSS_CYCLE_STEP_T, LSS001T'],
              ['Target', 'Angular 17 + .NET 8 + Azure SQL + Azure Service Bus'],
              ['Domain', 'LPI — Lender Placed Insurance loan tracking'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--blue)', minWidth: 90 }}>{k}:</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Migration Pipeline Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {migrationTracks.map(t => (
              <div key={t.label} style={{ background: 'var(--surface2)', borderRadius: 6, padding: '8px 10px', border: `1px solid ${t.color}33` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{t.label}</span>
                  <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: `${t.color}22`, color: t.color }}>{t.status}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{t.items}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-title">LSS001T — TME Mnemonic Routing Table (cached at CTMELibAdapter startup)</div>
        <table style={{ borderCollapse: 'collapse', fontSize: 10, width: '100%' }}>
          <thead>
            <tr>{['Mnemonic', 'Tandem Program', 'Description'].map(h => (
              <th key={h} style={{ padding: '4px 10px', textAlign: 'left', color: 'var(--muted)', fontWeight: 400, borderBottom: '1px solid var(--border)' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {TME_ROUTES.map(r => (
              <tr key={r.mnemonic} style={{ borderBottom: '1px solid var(--border)22' }}>
                <td style={{ padding: '4px 10px', fontFamily: 'monospace', color: 'var(--blue)', fontWeight: 700 }}>{r.mnemonic}</td>
                <td style={{ padding: '4px 10px', fontFamily: 'monospace', color: 'var(--green)' }}>{r.program}</td>
                <td style={{ padding: '4px 10px', color: 'var(--muted)' }}>{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-title">
          Seed Loan Portfolio — LSS_LOAN_T ({LOANS.length} records)
          <span style={{ float: 'right', fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>
            Portfolio: {fmt$(totalPortfolioValue)} | UPB: {fmt$(totalUpb)}
          </span>
        </div>
        <table style={{ borderCollapse: 'collapse', fontSize: 10, width: '100%' }}>
          <thead>
            <tr>{['LOAN_NUM', 'BORROWER_NAME', 'STATE', 'COVERAGE', 'VALUE', 'UPB', 'STATUS', 'EDI', 'CYCLE_TYPE'].map(h => (
              <th key={h} style={{ padding: '4px 8px', textAlign: 'left', color: 'var(--muted)', fontWeight: 400, borderBottom: '1px solid var(--border)', fontSize: 9 }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {LOANS.map(l => (
              <tr key={l.loanNum} onClick={() => setView('loanmgmt')} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)22' }}>
                <td style={{ padding: '4px 8px', fontFamily: 'monospace', color: 'var(--blue)', fontWeight: 700 }}>{l.loanNum}</td>
                <td style={{ padding: '4px 8px' }}>{l.borrowerName}</td>
                <td style={{ padding: '4px 8px', fontFamily: 'monospace' }}>{l.state}</td>
                <td style={{ padding: '4px 8px', color: 'var(--muted)' }}>{l.coverageType}</td>
                <td style={{ padding: '4px 8px' }}>{fmt$(l.propertyValue)}</td>
                <td style={{ padding: '4px 8px', color: 'var(--orange)' }}>{fmt$(l.upb)}</td>
                <td style={{ padding: '4px 8px' }}>
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${statusColor[l.loanStatus] || 'var(--muted)'}22`, color: statusColor[l.loanStatus] || 'var(--muted)' }}>{l.loanStatus}</span>
                </td>
                <td style={{ padding: '4px 8px', color: l.ediFlag === 'Y' ? 'var(--green)' : 'var(--red)', fontFamily: 'monospace', fontWeight: 700 }}>{l.ediFlag}</td>
                <td style={{ padding: '4px 8px', color: l.cycleType === 'INSTANT_ISSUE' ? 'var(--orange)' : 'var(--muted)', fontSize: 9 }}>{l.cycleType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
