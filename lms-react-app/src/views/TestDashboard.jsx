import { TCS } from '../data/testCases';
import { BRS } from '../data/businessRules';

const PASS_RATES = {
  'TC-001': 100, 'TC-002': 100, 'TC-003': 100, 'TC-004': 100,
  'TC-005': 100, 'TC-006': 100, 'TC-007': 100, 'TC-008': 100,
  'TC-009': 0,   'TC-010': 100, 'TC-011': 100, 'TC-012': 100,
  'TC-013': 100, 'TC-014': 100, 'TC-015': 100, 'TC-016': 100,
};

const BR_COVERAGE = {
  'R-L-001': ['TC-001', 'TC-002'],
  'R-L-002': ['TC-001', 'TC-003'],
  'R-L-003': ['TC-004'],
  'R-L-004': ['TC-005'],
  'R-L-005': ['TC-006'],
  'R-L-006': ['TC-007'],
  'R-L-007': ['TC-008'],
  'R-L-008': ['TC-009'],
  'R-L-009': ['TC-010', 'TC-011'],
  'R-L-010': ['TC-010', 'TC-011'],
  'R-L-011': ['TC-010', 'TC-011'],
  'R-L-012': ['TC-010', 'TC-011'],
  'R-L-013': ['TC-010', 'TC-011'],
  'R-L-014': ['TC-012', 'TC-013', 'TC-014', 'TC-015', 'TC-016'],
};

const AC_RESULTS = [
  { id: 'AC-001', req: 'FR-001', status: 'Pass',    note: 'TC-002: Empty criteria rejected before fgatetcp dispatch. R-L-001 enforced.' },
  { id: 'AC-002', req: 'FR-001', status: 'Pass',    note: 'TC-003: 9-digit loan number rejected by R-L-002. TC-001: 10-digit search succeeds.' },
  { id: 'AC-003', req: 'FR-004', status: 'Pass',    note: 'TC-005: KY ISO pre-call to AIP930 verified before TKARB000 QUOTE_REQUEST.' },
  { id: 'AC-004', req: 'FR-005', status: 'Pass',    note: 'TC-007: EDI_FLAG=N blocks 14E. TC-008: INSTANT_ISSUE suppresses 14E (R-L-007).' },
  { id: 'AC-005', req: 'FR-005', status: 'Blocked', note: 'TC-009 FAIL: R-L-008 (LT-F999 invalid form) bypasses Angular validation; reaches TKA920. API-layer guard missing.' },
  { id: 'AC-006', req: 'FR-003', status: 'Pass',    note: 'TC-014: DELINQUENT→ACTIVE blocked. TKA902 STATUS-CODE 9202. TC-015: UPB increase blocked (STATUS-CODE 9203).' },
  { id: 'AC-007', req: 'FR-003', status: 'Pass',    note: 'TC-013: ACTIVE→DELINQUENT valid. TC-016: address blank blocked by R-ML-004.' },
  { id: 'AC-008', req: 'FR-006', status: 'Pass',    note: 'TC-001: All 7 LSS001T routes resolve from CTMELibAdapter cache without SQL/MP query at runtime.' },
];

export default function TestDashboard() {
  const passed = Object.values(PASS_RATES).filter(r => r === 100).length;
  const failed = Object.values(PASS_RATES).filter(r => r === 0).length;
  const passRate = Math.round(passed / TCS.length * 100);
  const brCovered = Object.keys(BR_COVERAGE).length;

  const cats = [...new Set(TCS.map(t => t.cat))];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 8, marginBottom: 12 }}>
        {[
          ['Total Tests', TCS.length, 'var(--text)'],
          ['Passed', passed, 'var(--green)'],
          ['Failed', failed, 'var(--red)'],
          ['Pass Rate', `${passRate}%`, passRate >= 90 ? 'var(--green)' : 'var(--orange)'],
          ['Business Rules', BRS.length, 'var(--blue)'],
          ['BR Covered', brCovered, brCovered === BRS.length ? 'var(--green)' : 'var(--orange)'],
        ].map(([lbl, val, color]) => (
          <div key={lbl} className="kpi">
            <div className="kpi-lbl">{lbl}</div>
            <div className="kpi-val" style={{ color, fontSize: 20 }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div className="card">
          <div className="card-title">Coverage by Test Category</div>
          {cats.map(cat => {
            const catTcs = TCS.filter(t => t.cat === cat);
            const catPass = catTcs.filter(t => PASS_RATES[t.id] === 100).length;
            const pct = Math.round(catPass / catTcs.length * 100);
            return (
              <div key={cat} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                  <span>{cat}</span>
                  <span style={{ color: pct === 100 ? 'var(--green)' : pct === 0 ? 'var(--red)' : 'var(--orange)' }}>
                    {catPass}/{catTcs.length} ({pct}%)
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--green)' : pct === 0 ? 'var(--red)' : 'var(--orange)', borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-title">Test Case Results</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {TCS.map(tc => {
              const pass = PASS_RATES[tc.id] === 100;
              return (
                <div key={tc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 4, background: pass ? '#0d1f0d' : '#1f0000', fontSize: 11 }}>
                  <span style={{ color: pass ? 'var(--green)' : 'var(--red)', fontSize: 12 }}>{pass ? '✓' : '✗'}</span>
                  <span className="mono" style={{ color: 'var(--blue)', minWidth: 50 }}>{tc.id}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 9, flex: 1 }} title={tc.name}>{tc.name.slice(0, 40)}{tc.name.length > 40 ? '…' : ''}</span>
                  <span style={{ fontSize: 9, color: pass ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{pass ? 'PASS' : 'FAIL'}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-title">Business Rule → Test Case Coverage Matrix</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 10, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '4px 10px', textAlign: 'left', color: 'var(--muted)', fontWeight: 400, minWidth: 70 }}>Rule</th>
                {TCS.map(tc => (
                  <th key={tc.id} style={{ padding: '4px 4px', color: PASS_RATES[tc.id] === 100 ? 'var(--green)' : 'var(--red)', fontWeight: 400, textAlign: 'center', minWidth: 46, fontSize: 9 }}>
                    {tc.id}
                  </th>
                ))}
                <th style={{ padding: '4px 6px', color: 'var(--muted)', fontWeight: 400, textAlign: 'center' }}>TCs</th>
              </tr>
            </thead>
            <tbody>
              {BRS.map(br => {
                const covered = BR_COVERAGE[br.id] || [];
                return (
                  <tr key={br.id} style={{ borderBottom: '1px solid var(--border)22' }}>
                    <td style={{ padding: '3px 10px', fontFamily: 'monospace', color: 'var(--blue)', fontWeight: 700 }}>{br.id}</td>
                    {TCS.map(tc => {
                      const has = covered.includes(tc.id);
                      const pass = PASS_RATES[tc.id] === 100;
                      return (
                        <td key={tc.id} style={{ textAlign: 'center', padding: '3px 2px', background: has ? (pass ? '#0d1f0d' : '#1f0000') : 'transparent', border: '1px solid #21262d' }}>
                          {has && <span style={{ color: pass ? 'var(--green)' : 'var(--red)', fontSize: 11 }}>{pass ? '✓' : '✗'}</span>}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center', padding: '3px 8px', color: 'var(--muted)' }}>{covered.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Acceptance Criteria Status</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {AC_RESULTS.map(ac => {
            const color = ac.status === 'Pass' ? 'var(--green)' : ac.status === 'Fail' ? 'var(--red)' : 'var(--orange)';
            return (
              <div key={ac.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 10px', background: 'var(--surface2)', borderRadius: 5, border: `1px solid ${color}33` }}>
                <span style={{ color, fontSize: 12, marginTop: 1 }}>{ac.status === 'Pass' ? '✓' : ac.status === 'Fail' ? '✗' : '⚠'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
                    <span className="mono" style={{ color, fontWeight: 700, fontSize: 11 }}>{ac.id}</span>
                    <span className="tag tag-blue" style={{ fontSize: 9 }}>{ac.req}</span>
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${color}22`, color }}>{ac.status}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{ac.note}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
