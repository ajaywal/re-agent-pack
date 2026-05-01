import { useState } from 'react';
import { BRS } from '../data/businessRules';

const IMP_COLOR = { Critical: 'var(--red)', High: 'var(--orange)', Medium: 'var(--blue)', Low: 'var(--green)' };

export default function BusinessRules() {
  const [open, setOpen] = useState(new Set(['R-L-001']));
  const [filter, setFilter] = useState('All');

  const imps = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const visible = filter === 'All' ? BRS : BRS.filter(b => b.imp === filter);

  function toggle(id) {
    setOpen(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {imps.map(imp => (
          <button
            key={imp}
            onClick={() => setFilter(imp)}
            className={`pill ${filter === imp ? 'pill-blue' : ''}`}
            style={{ fontSize: 11, background: filter === imp ? '' : 'var(--surface2)', border: '1px solid var(--border)' }}
          >
            {imp} {imp !== 'All' && `(${BRS.filter(b => b.imp === imp).length})`}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{visible.length} rules</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map(br => {
          const isOpen = open.has(br.id);
          return (
            <div key={br.id} className="rule-card">
              <div className="rule-header" onClick={() => toggle(br.id)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <span className="mono" style={{ color: IMP_COLOR[br.imp], fontWeight: 700, fontSize: 13 }}>{br.id}</span>
                  <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: `${IMP_COLOR[br.imp]}22`, color: IMP_COLOR[br.imp], border: `1px solid ${IMP_COLOR[br.imp]}44` }}>{br.imp}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{br.cat}</span>
                </div>
                <span style={{ fontSize: 9, color: 'var(--muted)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>▶</span>
              </div>

              {isOpen && (
                <div className="rule-body">
                  {/* Rule description */}
                  <div style={{ padding: '10px 12px', background: '#0d1117', borderRadius: 6, border: '1px solid var(--border)', marginBottom: 10, fontSize: 11, color: '#c9d1d9', lineHeight: 1.6 }}>
                    {br.rule}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {/* Legacy references */}
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', marginBottom: 6 }}>Legacy Implementation</div>
                      {br.legacy.cobol.map((c, i) => (
                        <div key={i} className="trace-ref" style={{ marginBottom: 6 }}>
                          <span className="tag tag-success" style={{ fontSize: 9 }}>COBOL</span>
                          <span className="mono" style={{ fontSize: 10, marginLeft: 6 }}>{c.file} {c.para}</span>
                          <span style={{ color: 'var(--muted)', fontSize: 9, marginLeft: 6 }}>lines {c.lines}</span>
                          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, marginLeft: 2 }}>{c.desc}</div>
                        </div>
                      ))}
                      {br.legacy.cpp.map((c, i) => (
                        <div key={i} className="trace-ref" style={{ marginBottom: 6 }}>
                          <span className="tag tag-warn" style={{ fontSize: 9 }}>C++</span>
                          <span className="mono" style={{ fontSize: 10, marginLeft: 6 }}>{c.file} {c.func}</span>
                          <span style={{ color: 'var(--muted)', fontSize: 9, marginLeft: 6 }}>lines {c.lines}</span>
                          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, marginLeft: 2 }}>{c.desc}</div>
                        </div>
                      ))}
                      {br.legacy.dataItems.length > 0 && (
                        <div style={{ marginTop: 6 }}>
                          <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 4 }}>Data Items:</div>
                          {br.legacy.dataItems.map(d => (
                            <div key={d} className="mono" style={{ fontSize: 9, color: 'var(--purple)', padding: '1px 0' }}>{d}</div>
                          ))}
                        </div>
                      )}
                      {br.legacy.ksds.length > 0 && (
                        <div style={{ marginTop: 6 }}>
                          <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 4 }}>KSDS Files:</div>
                          {br.legacy.ksds.map(k => (
                            <div key={k} className="mono" style={{ fontSize: 9, color: 'var(--orange)', padding: '1px 0' }}>{k}</div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Migration + code */}
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', marginBottom: 6 }}>Migration Strategy</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 10 }}>{br.migration}</div>

                      {br.code && (
                        <div>
                          <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 4 }}>.NET 8 Implementation:</div>
                          <pre style={{
                            background: '#0d1117', border: '1px solid var(--border)', borderRadius: 6,
                            padding: '8px 10px', fontSize: 10, color: '#e6edf3',
                            overflowX: 'auto', margin: 0, lineHeight: 1.6,
                          }}>{br.code}</pre>
                        </div>
                      )}

                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 4 }}>Downstream Impact:</div>
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {br.impact.map(imp => (
                            <li key={imp} style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>{imp}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {br.testCases.map(tc => (
                          <span key={tc} className="tag tag-blue" style={{ fontSize: 9 }}>{tc.split(' —')[0]}</span>
                        ))}
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
