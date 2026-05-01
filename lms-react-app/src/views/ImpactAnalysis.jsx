import { useState } from 'react';
import { IMPACT_ITEMS } from '../data/impactItems';

const SEV_COLOR = { Critical: 'var(--red)', High: 'var(--orange)', Medium: 'var(--blue)', Low: 'var(--green)' };
const EFF_COLOR = { High: 'var(--red)', Medium: 'var(--orange)', Low: 'var(--green)' };

export default function ImpactAnalysis() {
  const [sev, setSev] = useState('All');
  const [sel, setSel] = useState(IMPACT_ITEMS[0]);

  const sevs = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const visible = sev === 'All' ? IMPACT_ITEMS : IMPACT_ITEMS.filter(i => i.sev === sev);

  const counts = sevs.slice(1).map(s => [s, IMPACT_ITEMS.filter(i => i.sev === s).length]);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px,1fr))', gap: 8, marginBottom: 12 }}>
        {counts.map(([s, n]) => (
          <div key={s} className="kpi" onClick={() => setSev(sev === s ? 'All' : s)} style={{ cursor: 'pointer', border: sev === s ? `1px solid ${SEV_COLOR[s]}` : '1px solid var(--border)' }}>
            <div className="kpi-lbl">{s}</div>
            <div className="kpi-val" style={{ color: SEV_COLOR[s], fontSize: 22 }}>{n}</div>
          </div>
        ))}
        <div className="kpi"><div className="kpi-lbl">Total Items</div><div className="kpi-val" style={{ fontSize: 22 }}>{IMPACT_ITEMS.length}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {sevs.map(s => (
          <button key={s} onClick={() => setSev(s)} className={`pill ${sev === s ? 'pill-blue' : ''}`}
            style={{ fontSize: 11, background: sev === s ? '' : 'var(--surface2)', border: '1px solid var(--border)' }}>
            {s} {s !== 'All' && `(${IMPACT_ITEMS.filter(i => i.sev === s).length})`}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {visible.map(item => (
            <div key={item.id} onClick={() => setSel(item)}
              style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: sel?.id === item.id ? 'var(--surface2)' : 'var(--surface)', border: `1px solid ${sel?.id === item.id ? SEV_COLOR[item.sev] : 'var(--border)'}` }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
                <span className="mono" style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 10 }}>{item.id}</span>
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${SEV_COLOR[item.sev]}22`, color: SEV_COLOR[item.sev] }}>{item.sev}</span>
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${EFF_COLOR[item.effort]}22`, color: EFF_COLOR[item.effort] }}>{item.effort}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text)', fontWeight: 600 }}>{item.component}</div>
              <div style={{ fontSize: 9, color: 'var(--muted)' }}>{item.area}</div>
            </div>
          ))}
        </div>

        {sel && (
          <div className="card">
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-start' }}>
              <span className="mono" style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 14 }}>{sel.id}</span>
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: `${SEV_COLOR[sel.sev]}22`, color: SEV_COLOR[sel.sev] }}>{sel.sev}</span>
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: `${EFF_COLOR[sel.effort]}22`, color: EFF_COLOR[sel.effort] }}>Effort: {sel.effort}</span>
              <span className="tag tag-blue" style={{ fontSize: 9 }}>{sel.area}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>{sel.component}</div>

            {[
              ['Source Files', sel.files, 'var(--orange)'],
              ['Risk', sel.risk, 'var(--red)'],
              ['Migration Strategy', sel.migration, 'var(--green)'],
              ['Test Cases', sel.tests, 'var(--blue)'],
            ].map(([label, content, color]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, background: 'var(--surface2)', borderRadius: 4, padding: '8px 10px', border: `1px solid ${color}22` }}>{content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
