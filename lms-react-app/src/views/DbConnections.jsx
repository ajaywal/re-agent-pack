import { useState } from 'react';
import { DB_CONNS } from '../data/dbConnections';

const TYPE_BADGE = {
  'KSDS Indexed': { bg: '#e3b34122', color: 'var(--orange)' },
  'Sequential (append-only)': { bg: '#a371f722', color: 'var(--purple)' },
  'KSDS Indexed (atomic)': { bg: '#58a6ff22', color: 'var(--blue)' },
};

export default function DbConnections() {
  const [selected, setSelected] = useState(DB_CONNS[0]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 12 }}>
      {/* Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {DB_CONNS.map(conn => {
          const badge = TYPE_BADGE[conn.type] || { bg: '#21262d', color: 'var(--muted)' };
          const isActive = selected?.name === conn.name;
          return (
            <div
              key={conn.name}
              onClick={() => setSelected(conn)}
              style={{
                padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
                background: isActive ? '#1f3a5f33' : 'var(--surface)',
                border: `1px solid ${isActive ? 'var(--blue)' : 'var(--border)'}`,
                transition: '.12s',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? 'var(--blue)' : 'var(--text)', fontFamily: 'monospace', marginBottom: 4 }}>
                {conn.name}
              </div>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: badge.bg, color: badge.color }}>
                {conn.type}
              </span>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, fontFamily: 'monospace' }}>{conn.nsk}</div>
            </div>
          );
        })}
      </div>

      {/* Detail */}
      {selected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div className="card-title" style={{ margin: 0 }}>{selected.name}</div>
              <span style={{
                fontSize: 9, padding: '2px 8px', borderRadius: 3,
                ...(TYPE_BADGE[selected.type] || {}),
              }}>{selected.type}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                ['NSK File Path', selected.nsk],
                ['Access Via', selected.via],
                ['Primary Key', selected.key],
                ['Migration Target', selected.target],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: '8px 10px', background: 'var(--surface2)', borderRadius: 6, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text)', lineHeight: 1.5 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Migration arrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#0d1117', borderRadius: 6, border: '1px solid var(--border)', marginBottom: 12 }}>
              <div style={{ flex: 1, padding: '6px 10px', background: '#21262d', borderRadius: 4, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 2 }}>LEGACY</div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--orange)' }}>{selected.nsk}</div>
                <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 1 }}>{selected.via}</div>
              </div>
              <div style={{ fontSize: 18, color: 'var(--blue)' }}>→</div>
              <div style={{ flex: 1, padding: '6px 10px', background: '#1f3a5f33', borderRadius: 4, textAlign: 'center', border: '1px solid var(--blue)44' }}>
                <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 2 }}>TARGET</div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--blue)' }}>{selected.target}</div>
              </div>
            </div>

            {/* Schema */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Target Schema
              </div>
              <div style={{
                background: '#0d1117', border: '1px solid var(--border)', borderRadius: 6,
                padding: '10px 12px', fontFamily: 'monospace', fontSize: 10, color: '#e6edf3',
                lineHeight: 1.8, whiteSpace: 'pre-wrap',
              }}>
                {selected.schema.split(', ').join(',\n')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
