import { useState } from 'react';
import { TCS } from '../data/testCases';

const CAT_COLOR = { Search: 'var(--blue)', Quote: 'var(--orange)', EDI: 'var(--purple)', Add: 'var(--green)', Modify: 'var(--red)' };
const PRI_COLOR = { Critical: 'var(--red)', High: 'var(--orange)', Medium: 'var(--blue)', Low: 'var(--green)' };

export default function TestCases() {
  const [open, setOpen] = useState(new Set(['TC-001']));
  const [cat, setCat] = useState('All');

  const cats = ['All', ...new Set(TCS.map(t => t.cat))];
  const visible = cat === 'All' ? TCS : TCS.filter(t => t.cat === cat);

  function toggle(id) {
    setOpen(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px,1fr))', gap: 8, marginBottom: 12 }}>
        {Object.entries({ Search: 0, Quote: 0, EDI: 0, Add: 0, Modify: 0 }).map(([c]) => {
          const n = TCS.filter(t => t.cat === c).length;
          return (
            <div key={c} className="kpi" onClick={() => setCat(cat === c ? 'All' : c)} style={{ cursor: 'pointer', border: cat === c ? `1px solid ${CAT_COLOR[c]}` : '1px solid var(--border)' }}>
              <div className="kpi-lbl">{c}</div>
              <div className="kpi-val" style={{ color: CAT_COLOR[c], fontSize: 20 }}>{n}</div>
            </div>
          );
        })}
        <div className="kpi"><div className="kpi-lbl">Total</div><div className="kpi-val" style={{ fontSize: 20 }}>{TCS.length}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)} className={`pill ${cat === c ? 'pill-blue' : ''}`}
            style={{ fontSize: 11, background: cat === c ? '' : 'var(--surface2)', border: '1px solid var(--border)', color: cat === c ? '' : (CAT_COLOR[c] || 'var(--muted)') }}>
            {c} {c !== 'All' && `(${TCS.filter(t => t.cat === c).length})`}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visible.map(tc => {
          const isOpen = open.has(tc.id);
          return (
            <div key={tc.id} className="rule-card">
              <div className="rule-header" onClick={() => toggle(tc.id)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <span className="mono" style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 13 }}>{tc.id}</span>
                  <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: `${CAT_COLOR[tc.cat]}22`, color: CAT_COLOR[tc.cat] }}>{tc.cat}</span>
                  <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: `${PRI_COLOR[tc.pri]}22`, color: PRI_COLOR[tc.pri] }}>{tc.pri}</span>
                  {tc.rules.map(r => <span key={r} className="tag tag-blue" style={{ fontSize: 8 }}>{r}</span>)}
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', flex: 1 }}>{tc.name}</span>
                </div>
                <span style={{ fontSize: 9, color: 'var(--muted)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>▶</span>
              </div>

              {isOpen && (
                <div className="rule-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', marginBottom: 6 }}>Test Steps</div>
                      {tc.steps.map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 9, color: 'var(--muted)', minWidth: 16 }}>{i + 1}.</span>
                          <span style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5 }}>{s}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', marginBottom: 6 }}>Expected Result</div>
                      <div style={{ fontSize: 10, color: '#c9d1d9', lineHeight: 1.6, background: '#0d1117', borderRadius: 4, padding: '8px 10px', border: '1px solid var(--border)', fontFamily: 'monospace' }}>
                        {tc.expected}
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>Rules Covered</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {tc.rules.map(r => <span key={r} className="tag tag-blue" style={{ fontSize: 9 }}>{r}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
