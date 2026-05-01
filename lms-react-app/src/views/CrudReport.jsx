import { CRUD_ROWS } from '../data/crudData';

const OP_COLORS = { R: 'var(--blue)', W: 'var(--green)', U: 'var(--orange)', D: 'var(--red)' };

export default function CrudReport() {
  const totalOps = CRUD_ROWS.reduce((s, r) => s + r.ops.length, 0);
  const hasOp = op => CRUD_ROWS.filter(r => r.ops.includes(op));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 8, marginBottom: 12 }}>
        {[
          ['Tables/Files', CRUD_ROWS.length, 'var(--text)'],
          ['Read Ops', hasOp('R').length, 'var(--blue)'],
          ['Write Ops', hasOp('W').length, 'var(--green)'],
          ['Update Ops', hasOp('U').length, 'var(--orange)'],
          ['Total Op Count', totalOps, 'var(--muted)'],
        ].map(([lbl, val, color]) => (
          <div key={lbl} className="kpi">
            <div className="kpi-lbl">{lbl}</div>
            <div className="kpi-val" style={{ color, fontSize: 22 }}>{val}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">CRUD Matrix — KSDS File Access Patterns</div>
        <table className="data-table" style={{ fontSize: 11 }}>
          <thead>
            <tr>
              <th>Table / KSDS</th>
              <th>NSK File</th>
              <th>Program</th>
              <th style={{ textAlign: 'center' }}>Ops</th>
              <th>Access Mode</th>
              <th>Frequency</th>
            </tr>
          </thead>
          <tbody>
            {CRUD_ROWS.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, color: 'var(--orange)', fontFamily: 'monospace', fontSize: 10 }}>{row.table}</td>
                <td className="mono" style={{ fontSize: 9, color: 'var(--muted)' }}>{row.file}</td>
                <td className="mono" style={{ fontSize: 9 }}>{row.prog}</td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                    {['R', 'W', 'U', 'D'].map(op => (
                      <span key={op} style={{
                        fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
                        background: row.ops.includes(op) ? `${OP_COLORS[op]}22` : 'transparent',
                        color: row.ops.includes(op) ? OP_COLORS[op] : '#30363d',
                        border: `1px solid ${row.ops.includes(op) ? OP_COLORS[op] + '55' : '#30363d'}`,
                      }}>{op}</span>
                    ))}
                  </div>
                </td>
                <td style={{ fontSize: 10 }}>{row.access}</td>
                <td style={{ fontSize: 10, color: 'var(--muted)' }}>{row.freq}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-title">Notes &amp; Migration Hints</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CRUD_ROWS.map((row, i) => (
            <div key={i} style={{ padding: '8px 10px', background: 'var(--surface2)', borderRadius: 6, border: '1px solid var(--border)', fontSize: 11 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span className="mono" style={{ color: 'var(--orange)', fontWeight: 700, fontSize: 11 }}>{row.table}</span>
                <span className="mono" style={{ fontSize: 9, color: 'var(--muted)' }}>KEY: {row.key}</span>
                {row.alt !== 'N/A' && row.alt !== 'None' && (
                  <span className="mono" style={{ fontSize: 9, color: 'var(--purple)' }}>ALT: {row.alt}</span>
                )}
              </div>
              <div style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{row.notes}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
