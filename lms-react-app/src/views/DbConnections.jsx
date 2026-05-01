import { useState } from 'react';
import { DB_CONNS } from '../data/dbConnections';

export default function DbConnections() {
  const [sel, setSel] = useState(DB_CONNS[0]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {DB_CONNS.map(c => (
          <div key={c.name} onClick={() => setSel(c)}
            style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: sel?.name === c.name ? 'var(--surface2)' : 'var(--surface)', border: `1px solid ${sel?.name === c.name ? 'var(--blue)' : 'var(--border)'}` }}>
            <div style={{ fontFamily: 'monospace', color: 'var(--blue)', fontWeight: 700, fontSize: 10 }}>{c.name}</div>
            <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>{c.type}</div>
            <div style={{ fontSize: 9, color: 'var(--orange)', marginTop: 2, fontFamily: 'monospace' }}>{c.nsk.split('.').slice(0, 3).join('.')}</div>
          </div>
        ))}
      </div>

      {sel && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontFamily: 'monospace', color: 'var(--orange)', fontSize: 13, fontWeight: 700 }}>{sel.nsk}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>→</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--green)', fontSize: 13, fontWeight: 700 }}>{sel.target}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              ['Type', sel.type, 'var(--muted)'],
              ['Via', sel.via, 'var(--purple)'],
              ['Primary Key', sel.key, 'var(--blue)'],
              ['Migration Target', sel.target, 'var(--green)'],
            ].map(([k, v, c]) => (
              <div key={k} style={{ background: 'var(--surface2)', borderRadius: 4, padding: '6px 10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 10, color: c, fontFamily: 'monospace' }}>{v}</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Schema / DDL</div>
            <pre style={{ background: '#0d1117', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', fontSize: 10, color: '#e6edf3', overflowX: 'auto', margin: 0, lineHeight: 1.6 }}>
              {sel.schema}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
