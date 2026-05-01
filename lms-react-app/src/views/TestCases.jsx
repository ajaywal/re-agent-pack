import { useState } from 'react';
import { TCS } from '../data/testCases';

const PRI_COLOR = { Critical: 'var(--red)', High: 'var(--orange)', Medium: 'var(--blue)', Low: 'var(--green)' };
const CAT_COLOR = {
  Create: 'var(--green)', Validation: 'var(--orange)', Search: 'var(--blue)',
  Update: 'var(--purple)', Precision: 'var(--red)',
};

export default function TestCases() {
  const [open, setOpen] = useState(new Set(['TC-001']));
  const [filter, setFilter] = useState('All');

  const cats = ['All', ...new Set(TCS.map(t => t.cat))];
  const visible = filter === 'All' ? TCS : TCS.filter(t => t.cat === filter);

  function toggle(id) {
    setOpen(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div>
      {/* Filter + summary */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {cats.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`pill ${filter === c ? 'pill-blue' : ''}`}
            style={{ fontSize: 11, background: filter === c ? '' : 'var(--surface2)', border: '1px solid var(--border)' }}
          >
            {c} {c !== 'All' && `(${TCS.filter(t => t.cat === c).length})`}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{visible.length} test cases</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map(tc => {
          const isOpen = open.has(tc.id);
          return (
            <div key={tc.id} className="tc-card">
              <div
                className="tc-header"
                onClick={() => toggle(tc.id)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <span className="mono" style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 12 }}>{tc.id}</span>
                  <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: `${PRI_COLOR[tc.pri]}22`, color: PRI_COLOR[tc.pri], border: `1px solid ${PRI_COLOR[tc.pri]}44` }}>{tc.pri}</span>
                  <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: `${CAT_COLOR[tc.cat] || 'var(--muted)'}22`, color: CAT_COLOR[tc.cat] || 'var(--muted)' }}>{tc.cat}</span>
                  <span style={{ fontSize: 11, color: 'var(--text)' }}>{tc.name}</span>
                </div>
                <span style={{ fontSize: 9, color: 'var(--muted)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>▶</span>
              </div>

              {isOpen && (
                <div className="tc-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', marginBottom: 8 }}>Test Steps</div>
                      <ol style={{ margin: 0, paddingLeft: 18 }}>
                        {tc.steps.map((step, i) => (
                          <li key={i} style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5, lineHeight: 1.5 }}>{step}</li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', marginBottom: 8 }}>Expected Results</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {tc.expected.map((exp, i) => (
                          <li key={i} style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5, lineHeight: 1.5 }}>{exp}</li>
                        ))}
                      </ul>
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
