const MODULES = [
  { id: 'lnmain',     label: 'lnmain.cpp',      type: 'cpp',     fanIn: 0,  fanOut: 6, desc: 'Main C++ Win32/MFC frontend. UI entry, menu routing, dialog orchestration.' },
  { id: 'validation', label: 'validation.cpp',   type: 'cpp',     fanIn: 2,  fanOut: 0, desc: 'Client-side input validation. Mirrors COBOL §2000. Called by create and update screens.' },
  { id: 'db_conn',    label: 'db_connector.cpp', type: 'cpp',     fanIn: 2,  fanOut: 3, desc: 'KSDS access layer. Handles read/write/rewrite via Pathway IPC. Generates Loan IDs.' },
  { id: 'pathway',    label: 'tandem_pathway.h', type: 'pathway', fanIn: 3,  fanOut: 2, desc: 'HP Pathway IPC API. PATHWAY_WRITEREAD synchronous RPC. Connects to $LNSVR1.' },
  { id: 'qlotcalc',   label: 'qlotcalc.cbl',    type: 'cobol',   fanIn: 1,  fanOut: 4, desc: 'HP Tandem COBOL calculation engine. §1000-§9000. Rate, payment, premium, audit.' },
  { id: 'rate_ksds',  label: 'RATE_TABLE',       type: 'ksds',    fanIn: 1,  fanOut: 0, desc: 'KSDS file. Base rates by type+tier. Composite key: loan_type(30) + tier(2).' },
  { id: 'state_ksds', label: 'STATE_SURCHARGE',  type: 'ksds',    fanIn: 1,  fanOut: 0, desc: 'KSDS file. State-specific rate adjustments. Key: state_code(2).' },
  { id: 'loan_ksds',  label: 'LOAN_MASTER',      type: 'ksds',    fanIn: 3,  fanOut: 0, desc: 'Primary KSDS. 15 fields. Primary key: loan_id. Alt key: policy_number.' },
  { id: 'audit_ksds', label: 'AUDIT_LOG',        type: 'ksds',    fanIn: 1,  fanOut: 0, desc: 'Sequential KSDS. Append-only. Every QLOTCALC invocation writes one record (BR-009).' },
  { id: 'auth',       label: 'auth.cpp',         type: 'cpp',     fanIn: 1,  fanOut: 0, desc: 'Authentication. Sets SESSION_CONTEXT.privilege_level. Binds terminal_id.' },
];

const DEPS = [
  ['lnmain', 'validation'],
  ['lnmain', 'db_conn'],
  ['lnmain', 'pathway'],
  ['lnmain', 'auth'],
  ['db_conn', 'pathway'],
  ['db_conn', 'loan_ksds'],
  ['pathway', 'qlotcalc'],
  ['pathway', 'loan_ksds'],
  ['qlotcalc', 'rate_ksds'],
  ['qlotcalc', 'state_ksds'],
  ['qlotcalc', 'audit_ksds'],
  ['lnmain', 'db_conn'],
  ['db_conn', 'loan_ksds'],
];

const TYPE_COLORS = {
  cpp:     { bg: 'var(--orange)', badge: '#e3b34122', label: 'C++ MFC' },
  cobol:   { bg: 'var(--green)',  badge: '#3fb95022', label: 'COBOL' },
  pathway: { bg: 'var(--purple)', badge: '#a371f722', label: 'IPC' },
  ksds:    { bg: 'var(--blue)',   badge: '#58a6ff22', label: 'KSDS' },
};

const MATRIX_MODULES = ['lnmain', 'validation', 'db_conn', 'pathway', 'qlotcalc', 'rate_ksds', 'state_ksds', 'loan_ksds', 'audit_ksds', 'auth'];

function hasDep(from, to) {
  return DEPS.some(([f, t]) => f === from && t === to);
}

export default function Dependency() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 8 }}>
        {Object.entries(TYPE_COLORS).map(([type, colors]) => {
          const count = MODULES.filter(m => m.type === type).length;
          return (
            <div key={type} className="kpi" style={{ borderColor: colors.bg }}>
              <div className="kpi-lbl">{colors.label} Modules</div>
              <div className="kpi-val" style={{ color: colors.bg, fontSize: 22 }}>{count}</div>
            </div>
          );
        })}
        <div className="kpi">
          <div className="kpi-lbl">Total Dependencies</div>
          <div className="kpi-val" style={{ color: 'var(--muted)', fontSize: 22 }}>{DEPS.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card">
          <div className="card-title">Module Catalogue — Fan-In / Fan-Out</div>
          <table className="data-table" style={{ fontSize: 11 }}>
            <thead>
              <tr><th>Module</th><th>Type</th><th style={{ textAlign: 'center' }}>Fan-In</th><th style={{ textAlign: 'center' }}>Fan-Out</th></tr>
            </thead>
            <tbody>
              {MODULES.map(m => {
                const colors = TYPE_COLORS[m.type];
                return (
                  <tr key={m.id}>
                    <td className="mono" style={{ fontSize: 10 }}>{m.label}</td>
                    <td>
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: colors.badge, color: colors.bg, border: `1px solid ${colors.bg}55` }}>
                        {colors.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', color: m.fanIn > 2 ? 'var(--orange)' : 'var(--text)' }}>{m.fanIn}</td>
                    <td style={{ textAlign: 'center', color: m.fanOut > 4 ? 'var(--red)' : 'var(--text)' }}>{m.fanOut}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-title">Coupling Matrix</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 9, fontFamily: 'monospace' }}>
              <thead>
                <tr>
                  <th style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--muted)', fontWeight: 400 }}>FROM ↓ TO →</th>
                  {MATRIX_MODULES.map(m => (
                    <th key={m} style={{ padding: '4px 4px', color: 'var(--muted)', fontWeight: 400, writingMode: 'vertical-rl', textOrientation: 'mixed', height: 80 }}>
                      {MODULES.find(x => x.id === m)?.label.replace('.cpp', '').replace('.cbl', '').replace('.h', '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX_MODULES.map(fromId => (
                  <tr key={fromId}>
                    <td style={{ padding: '3px 8px', textAlign: 'right', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {MODULES.find(x => x.id === fromId)?.label.replace('.cpp', '').replace('.cbl', '').replace('.h', '')}
                    </td>
                    {MATRIX_MODULES.map(toId => {
                      const has = hasDep(fromId, toId);
                      const same = fromId === toId;
                      return (
                        <td key={toId} style={{
                          width: 22, height: 22, textAlign: 'center',
                          background: same ? '#21262d' : has ? '#1f3a5f' : 'transparent',
                          border: '1px solid #21262d',
                        }}>
                          {has && <span style={{ color: 'var(--blue)', fontSize: 11, lineHeight: 1 }}>●</span>}
                          {same && <span style={{ color: '#484f58', fontSize: 11, lineHeight: 1 }}>╲</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 8, fontSize: 9, color: 'var(--muted)' }}>
            ● = dependency exists (from → to)
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Module Descriptions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {MODULES.map(m => {
            const colors = TYPE_COLORS[m.type];
            return (
              <div key={m.id} style={{ padding: '8px 10px', background: 'var(--surface2)', borderRadius: 6, border: `1px solid ${colors.bg}44` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 11, color: colors.bg }}>{m.label}</span>
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: colors.badge, color: colors.bg }}>{colors.label}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5 }}>{m.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
