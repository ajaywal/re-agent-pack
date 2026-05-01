import { useState } from 'react';
import { IMPACT_ITEMS } from '../data/impactItems';

const SEV_COLOR = { Critical: 'var(--red)', High: 'var(--orange)', Medium: 'var(--blue)', Low: 'var(--green)' };
const EFF_COLOR = { High: 'var(--red)', Medium: 'var(--orange)', Low: 'var(--green)' };

export default function ImpactAnalysis() {
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  const sevCounts = ['Critical', 'High', 'Medium', 'Low'].map(s => ({
    s, count: IMPACT_ITEMS.filter(i => i.sev === s).length,
  }));

  const visible = filter === 'All' ? IMPACT_ITEMS : IMPACT_ITEMS.filter(i => i.sev === filter);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 8, marginBottom: 12 }}>
        {sevCounts.map(({ s, count }) => (
          <div
            key={s}
            className="kpi"
            style={{ cursor: 'pointer', borderColor: filter === s ? SEV_COLOR[s] : undefined }}
            onClick={() => setFilter(filter === s ? 'All' : s)}
          >
            <div className="kpi-lbl">{s}</div>
            <div className="kpi-val" style={{ color: SEV_COLOR[s], fontSize: 22 }}>{count}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 12 }}>
        <div className="card">
          <div className="card-title">Impact Items — Migration Risk Assessment</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visible.map(item => (
              <div
                key={item.id}
                onClick={() => setSelected(selected?.id === item.id ? null : item)}
                style={{
                  padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
                  background: selected?.id === item.id ? '#1f3a5f33' : 'var(--surface2)',
                  border: `1px solid ${selected?.id === item.id ? 'var(--blue)' : 'var(--border)'}`,
                  transition: '.12s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="mono" style={{ color: 'var(--blue)', fontSize: 11, fontWeight: 700 }}>{item.id}</span>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: `${SEV_COLOR[item.sev]}22`, color: SEV_COLOR[item.sev], border: `1px solid ${SEV_COLOR[item.sev]}44` }}>{item.sev}</span>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: `${EFF_COLOR[item.effort]}22`, color: EFF_COLOR[item.effort], border: `1px solid ${EFF_COLOR[item.effort]}44` }}>Effort: {item.effort}</span>
                  <span style={{ fontSize: 9, color: 'var(--muted)', marginLeft: 'auto' }}>{item.area}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{item.component}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace' }}>{item.files}</div>
              </div>
            ))}
          </div>
        </div>

        {selected && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <span className="mono" style={{ color: 'var(--blue)', fontSize: 13, fontWeight: 700 }}>{selected.id}</span>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{selected.component}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>

            {[
              ['Severity', selected.sev, SEV_COLOR[selected.sev]],
              ['Effort', selected.effort, EFF_COLOR[selected.effort]],
              ['Area', selected.area, 'var(--text)'],
              ['Files', selected.files, 'var(--muted)'],
            ].map(([k, v, color]) => (
              <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 11 }}>
                <span style={{ color: 'var(--muted)', minWidth: 70 }}>{k}:</span>
                <span style={{ color, fontFamily: k === 'Files' ? 'monospace' : 'inherit' }}>{v}</span>
              </div>
            ))}

            <div style={{ marginTop: 10, padding: 10, background: '#1f0000', border: '1px solid var(--red)44', borderRadius: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', marginBottom: 4 }}>Risk</div>
              <div style={{ fontSize: 11, color: '#c9d1d9', lineHeight: 1.6 }}>{selected.risk}</div>
            </div>

            <div style={{ marginTop: 8, padding: 10, background: '#0d1f0d', border: '1px solid var(--green)44', borderRadius: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', marginBottom: 4 }}>Migration Strategy</div>
              <div style={{ fontSize: 11, color: '#c9d1d9', lineHeight: 1.6 }}>{selected.migration}</div>
            </div>

            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>Test Coverage</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selected.tests.split(', ').map(tc => (
                  <span key={tc} className="tag tag-blue" style={{ fontSize: 10 }}>{tc}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
