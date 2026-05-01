import { CRUD_ROWS } from '../data/crudData';

const OP_COLOR = { C: 'var(--green)', R: 'var(--blue)', U: 'var(--orange)', D: 'var(--red)' };

export default function CrudReport() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 8, marginBottom: 12 }}>
        {[
          ['LSS Tables', 3, 'var(--blue)'],
          ['Programs', 4, 'var(--orange)'],
          ['Total Ops', CRUD_ROWS.reduce((s, r) => s + r.ops.length, 0), 'var(--green)'],
          ['Write Ops', CRUD_ROWS.reduce((s, r) => s + r.ops.filter(o => o !== 'R').length, 0), 'var(--orange)'],
          ['Read Ops', CRUD_ROWS.reduce((s, r) => s + r.ops.filter(o => o === 'R').length, 0), 'var(--blue)'],
        ].map(([l, v, c]) => (
          <div key={l} className="kpi"><div className="kpi-lbl">{l}</div><div className="kpi-val" style={{ color: c, fontSize: 20 }}>{v}</div></div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-title">CRUD Matrix — LSS_LOAN_T / LSS_CYCLE_STEP_T / LSS001T</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 10, width: '100%' }}>
            <thead>
              <tr>{['Table', 'Backend', 'Program', 'Ops', 'Primary Key', 'Access Mode', 'Frequency'].map(h => (
                <th key={h} style={{ padding: '4px 10px', textAlign: 'left', color: 'var(--muted)', fontWeight: 400, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {CRUD_ROWS.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)22' }}>
                  <td style={{ padding: '5px 10px', fontFamily: 'monospace', color: 'var(--blue)', fontWeight: 700 }}>{row.table}</td>
                  <td style={{ padding: '5px 10px', color: 'var(--muted)', fontSize: 9 }}>{row.file}</td>
                  <td style={{ padding: '5px 10px', fontFamily: 'monospace', color: 'var(--orange)', fontSize: 9 }}>{row.prog}</td>
                  <td style={{ padding: '5px 10px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {row.ops.map(op => (
                        <span key={op} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${OP_COLOR[op]}22`, color: OP_COLOR[op], fontWeight: 700 }}>{op}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '5px 10px', fontFamily: 'monospace', fontSize: 9 }}>{row.key}</td>
                  <td style={{ padding: '5px 10px', fontSize: 9, color: 'var(--muted)' }}>{row.access}</td>
                  <td style={{ padding: '5px 10px', fontSize: 9, color: 'var(--muted)' }}>{row.freq}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Migration Notes</div>
        {CRUD_ROWS.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 10px', background: 'var(--surface2)', borderRadius: 5, border: '1px solid var(--border)', marginBottom: 6 }}>
            <span style={{ fontFamily: 'monospace', color: 'var(--blue)', fontWeight: 700, fontSize: 10, minWidth: 200, flexShrink: 0 }}>{row.table}</span>
            <span style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5 }}>{row.notes}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
