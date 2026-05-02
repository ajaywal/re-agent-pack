import { useState, useEffect } from 'react';

const RUNS_KEY = 'lss-runs';
const AGENT_RUNS_KEY = 'lss-agent-runs';

const ANALYSIS_LABELS = {
  static:    { label: 'Static Analysis',  icon: '🔬', color: 'var(--orange)' },
  inventory: { label: 'Inventory',        icon: '📦', color: 'var(--blue)' },
  rules:     { label: 'Business Rules',   icon: '📐', color: 'var(--blue)' },
  testgen:   { label: 'Test Generation',  icon: '🧪', color: 'var(--green)' },
  data:      { label: 'Data Flow',        icon: '🗄', color: 'var(--orange)' },
  docs:      { label: 'Documents',        icon: '📝', color: 'var(--muted)' },
};

const SEED_RUNS = [
  {
    id: 'run-seed-001',
    ts: '2026-04-29T09:14:22Z',
    source: { type: 'github', url: 'https://github.com/ajaywal/re-agent-pack', branch: 'main' },
    language: 'C++ (VC++/MFC)',
    analyses: ['static', 'inventory'],
    results: {
      static:    { rulesFound: 11, functions: 38, files: 8, deadCode: 7, debtScore: 58, callDepth: 6 },
      inventory: { files: 8, functions: 38, classes: 12, loc: 3840, languages: ['C++', 'COBOL'] },
    },
    status: 'success', duration: 14,
  },
  {
    id: 'run-seed-002',
    ts: '2026-04-29T16:33:05Z',
    source: { type: 'github', url: 'https://github.com/ajaywal/re-agent-pack', branch: 'main' },
    language: 'C++ (VC++/MFC)',
    analyses: ['static', 'inventory', 'rules', 'testgen'],
    results: {
      static:    { rulesFound: 12, functions: 39, files: 8, deadCode: 5, debtScore: 63, callDepth: 6 },
      inventory: { files: 8, functions: 39, classes: 12, loc: 3840, languages: ['C++', 'COBOL', 'SQL'] },
      rules:     { rulesExtracted: 12, confidence: 0.88, categories: 5, subrules: 18 },
      testgen:   { testCases: 14, coverage: 88, categories: 5, criticalCovered: 5 },
    },
    status: 'success', duration: 31,
  },
  {
    id: 'run-seed-003',
    ts: '2026-04-30T09:14:00Z',
    source: { type: 'github', url: 'https://github.com/ajaywal/re-agent-pack', branch: 'main' },
    language: 'C++ (VC++/MFC)',
    analyses: ['static', 'inventory', 'rules', 'testgen', 'data', 'docs'],
    results: {
      static:    { rulesFound: 14, functions: 42, files: 8, deadCode: 3, debtScore: 72, callDepth: 6 },
      inventory: { files: 8, functions: 42, classes: 12, loc: 3840, languages: ['C++', 'COBOL', 'SQL'] },
      rules:     { rulesExtracted: 14, confidence: 0.91, categories: 5, subrules: 22 },
      testgen:   { testCases: 16, coverage: 94, categories: 5, criticalCovered: 6 },
      data:      { tables: 3, entities: 5, crudOps: 18, dataFlows: 7 },
      docs:      { pages: 24, fr: 8, nfr: 6, diagrams: 5, ac: 8 },
    },
    status: 'success', duration: 87,
  },
];

function loadRuns() {
  try {
    const stored = JSON.parse(localStorage.getItem(RUNS_KEY) || '[]');
    const agentRuns = JSON.parse(localStorage.getItem(AGENT_RUNS_KEY) || '[]');
    // Normalise agent playground runs so they render in the same list
    const normalised = agentRuns.map(r => ({
      id: r.id,
      ts: r.ts,
      source: r.source || { type: 'playground', url: '—' },
      language: 'Agent Flow',
      analyses: r.nodes ? r.nodes.map(n => n.type) : [],
      results: r.results || {},
      status: r.status || 'success',
      duration: r.duration || 0,
      flowName: r.flowName,
      _raw: r,
    }));
    const combined = [...normalised, ...stored];
    if (combined.length === 0) {
      localStorage.setItem(RUNS_KEY, JSON.stringify(SEED_RUNS));
      return SEED_RUNS;
    }
    return combined.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  } catch { return SEED_RUNS; }
}

function getKpiSummary(run) {
  const kpis = [];
  if (run.results.rules)  kpis.push({ label: 'Rules', value: run.results.rules.rulesExtracted, color: 'var(--blue)' });
  if (run.results.testgen) kpis.push({ label: 'Tests', value: run.results.testgen.testCases, color: 'var(--green)' });
  if (run.results.static)  kpis.push({ label: 'Debt', value: run.results.static.debtScore, color: 'var(--orange)' });
  if (run.results.testgen) kpis.push({ label: 'Coverage', value: `${run.results.testgen.coverage}%`, color: 'var(--green)' });
  return kpis;
}

function fmt(ts) {
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ResultKV({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--border)22', fontSize: 10 }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontWeight: 700, color: color || 'var(--text)' }}>{value}</span>
    </div>
  );
}

export default function RunHistory({ onNavigate }) {
  const [runs, setRuns] = useState(loadRuns);
  const [selected, setSelected] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [filterAnalysis, setFilterAnalysis] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  function refresh() { setRuns(loadRuns()); }

  function toggleCompare(id) {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  function clearRuns() {
    if (!window.confirm('Delete all run history?')) return;
    localStorage.removeItem(RUNS_KEY);
    setRuns(SEED_RUNS);
    setSelected(null);
  }

  const filtered = runs.filter(r => {
    if (filterAnalysis !== 'all' && !r.analyses.includes(filterAnalysis)) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const compareRuns = compareIds.map(id => runs.find(r => r.id === id)).filter(Boolean);

  const allAnalyses = [...new Set(runs.flatMap(r => r.analyses))];

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 8, marginBottom: 12 }}>
        {[
          ['Total Runs', runs.length, 'var(--text)'],
          ['Successful', runs.filter(r => r.status === 'success').length, 'var(--green)'],
          ['Full Suite', runs.filter(r => r.analyses.length === 6).length, 'var(--blue)'],
          ['Latest Run', runs.length > 0 ? fmt(runs[0].ts).split(',')[0] : '—', 'var(--muted)'],
        ].map(([l, v, c]) => (
          <div key={l} className="kpi"><div className="kpi-lbl">{l}</div><div className="kpi-val" style={{ color: c, fontSize: 18 }}>{v}</div></div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterAnalysis} onChange={e => setFilterAnalysis(e.target.value)}
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px', color: 'var(--text)', fontSize: 11 }}>
          <option value="all">All analyses</option>
          {Object.entries(ANALYSIS_LABELS).map(([id, a]) => <option key={id} value={id}>{a.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px', color: 'var(--text)', fontSize: 11 }}>
          <option value="all">All statuses</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>
        <button onClick={() => { setCompareMode(!compareMode); setCompareIds([]); }} className={`pill ${compareMode ? 'pill-blue' : ''}`}
          style={{ fontSize: 11, background: compareMode ? '' : 'var(--surface2)', border: '1px solid var(--border)' }}>
          {compareMode ? '✕ Cancel Compare' : '⇄ Compare Runs'}
        </button>
        <button onClick={refresh} className="pill" style={{ fontSize: 11, background: 'var(--surface2)', border: '1px solid var(--border)' }}>↻ Refresh</button>
        <button onClick={clearRuns} className="pill" style={{ fontSize: 11, background: 'var(--surface2)', border: '1px solid var(--red)33', color: 'var(--red)' }}>🗑 Clear</button>
        <button onClick={() => onNavigate?.('sourceupload')} style={{ marginLeft: 'auto', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ New Run</button>
      </div>

      {compareMode && compareIds.length === 2 && (
        <CompareView runs={compareRuns} />
      )}

      {compareMode && compareIds.length < 2 && (
        <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 6, marginBottom: 10, fontSize: 11, color: 'var(--blue)', border: '1px solid var(--blue)44' }}>
          Select {2 - compareIds.length} more run{2 - compareIds.length !== 1 ? 's' : ''} to compare
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 12 }}>
        {/* Run list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>No runs match filters</div>
          )}
          {filtered.map((run, idx) => {
            const kpis = getKpiSummary(run);
            const isSelected = selected?.id === run.id;
            const isCompared = compareIds.includes(run.id);
            return (
              <div key={run.id}
                onClick={() => compareMode ? toggleCompare(run.id) : setSelected(isSelected ? null : run)}
                style={{ padding: '10px 12px', borderRadius: 6, cursor: 'pointer', background: isSelected || isCompared ? 'var(--surface2)' : 'var(--surface)', border: `1px solid ${isCompared ? 'var(--blue)' : isSelected ? 'var(--green)' : 'var(--border)'}`, transition: 'all .15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--muted)' }}>#{runs.length - runs.findIndex(r => r.id === run.id)}</span>
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: run.status === 'success' ? 'var(--green)22' : 'var(--red)22', color: run.status === 'success' ? 'var(--green)' : 'var(--red)' }}>{run.status}</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 'auto' }}>{fmt(run.ts)}</span>
                  {compareMode && <span style={{ fontSize: 9, color: isCompared ? 'var(--blue)' : 'var(--muted)' }}>{isCompared ? '✓ Selected' : 'Select'}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: run.source.type === 'github' ? 'var(--blue)' : 'var(--orange)' }}>
                    {run.source.type === 'github' ? '🔗' : '📁'}
                  </span>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {run.source.type === 'github' ? `${run.source.url?.split('/').slice(-2).join('/')} (${run.source.branch})` : run.source.name}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--muted)' }}>{run.duration}s</span>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                  {run.analyses.map(a => {
                    const def = ANALYSIS_LABELS[a];
                    return def ? <span key={a} style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: `${def.color}22`, color: def.color }}>{def.icon} {def.label}</span> : null;
                  })}
                </div>
                {kpis.length > 0 && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {kpis.map(k => (
                      <div key={k.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: k.color }}>{k.value}</div>
                        <div style={{ fontSize: 8, color: 'var(--muted)' }}>{k.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selected && !compareMode && (
          <div className="card" style={{ alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="card-title" style={{ margin: 0 }}>Run Detail</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>

            <ResultKV label="Run ID" value={selected.id} />
            <ResultKV label="Timestamp" value={fmt(selected.ts)} />
            <ResultKV label="Duration" value={`${selected.duration}s`} />
            <ResultKV label="Status" value={selected.status} color={selected.status === 'success' ? 'var(--green)' : 'var(--red)'} />
            <ResultKV label="Source" value={selected.source.type === 'github' ? selected.source.url?.split('/').slice(-2).join('/') : selected.source.name} />
            {selected.source.branch && <ResultKV label="Branch" value={selected.source.branch} />}
            <ResultKV label="Language" value={selected.language} />

            {selected.results.static && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', marginBottom: 6 }}>🔬 Static Analysis</div>
                <ResultKV label="Rules Found" value={selected.results.static.rulesFound} color="var(--blue)" />
                <ResultKV label="Functions" value={selected.results.static.functions} />
                <ResultKV label="Dead Code Files" value={selected.results.static.deadCode} color="var(--red)" />
                <ResultKV label="Debt Score" value={`${selected.results.static.debtScore}/100`} color="var(--orange)" />
                <ResultKV label="Call Depth" value={selected.results.static.callDepth} />
              </div>
            )}
            {selected.results.rules && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', marginBottom: 6 }}>📐 Business Rules</div>
                <ResultKV label="Rules Extracted" value={selected.results.rules.rulesExtracted} color="var(--blue)" />
                <ResultKV label="Confidence" value={`${Math.round(selected.results.rules.confidence * 100)}%`} color="var(--green)" />
                <ResultKV label="Categories" value={selected.results.rules.categories} />
                <ResultKV label="Sub-rules" value={selected.results.rules.subrules} />
              </div>
            )}
            {selected.results.testgen && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', marginBottom: 6 }}>🧪 Test Generation</div>
                <ResultKV label="Test Cases" value={selected.results.testgen.testCases} color="var(--green)" />
                <ResultKV label="Coverage" value={`${selected.results.testgen.coverage}%`} color="var(--green)" />
                <ResultKV label="Critical Covered" value={selected.results.testgen.criticalCovered} />
              </div>
            )}
            {selected.results.data && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', marginBottom: 6 }}>🗄 Data Flow</div>
                <ResultKV label="Tables" value={selected.results.data.tables} />
                <ResultKV label="CRUD Ops" value={selected.results.data.crudOps} />
                <ResultKV label="Data Flows" value={selected.results.data.dataFlows} />
              </div>
            )}
            {selected.results.docs && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>📝 Documents</div>
                <ResultKV label="Pages Generated" value={selected.results.docs.pages} />
                <ResultKV label="FRs" value={selected.results.docs.fr} />
                <ResultKV label="NFRs" value={selected.results.docs.nfr} />
                <ResultKV label="Diagrams" value={selected.results.docs.diagrams} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CompareView({ runs }) {
  if (runs.length < 2) return null;
  const [a, b] = runs;

  const metrics = [
    { label: 'Rules Extracted',  va: a.results.rules?.rulesExtracted,  vb: b.results.rules?.rulesExtracted,  higherBetter: true },
    { label: 'Test Cases',       va: a.results.testgen?.testCases,      vb: b.results.testgen?.testCases,      higherBetter: true },
    { label: 'Test Coverage %',  va: a.results.testgen?.coverage,       vb: b.results.testgen?.coverage,       higherBetter: true },
    { label: 'Debt Score',       va: a.results.static?.debtScore,       vb: b.results.static?.debtScore,       higherBetter: true },
    { label: 'Dead Code Files',  va: a.results.static?.deadCode,        vb: b.results.static?.deadCode,        higherBetter: false },
    { label: 'Rule Confidence %',va: a.results.rules ? Math.round(a.results.rules.confidence * 100) : null, vb: b.results.rules ? Math.round(b.results.rules.confidence * 100) : null, higherBetter: true },
    { label: 'Duration (s)',     va: a.duration,                        vb: b.duration,                        higherBetter: false },
  ].filter(m => m.va !== undefined && m.vb !== undefined);

  function fmt(ts) { return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="card-title">Run Comparison</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr', gap: 0, marginBottom: 8 }}>
        <div style={{ padding: '6px 10px', background: 'var(--surface2)', borderRadius: '6px 0 0 0', textAlign: 'left' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)' }}>Run A</div>
          <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'monospace' }}>{a.id.slice(-8)}</div>
          <div style={{ fontSize: 9, color: 'var(--muted)' }}>{fmt(a.ts)}</div>
        </div>
        <div style={{ padding: '6px 10px', textAlign: 'center', background: 'var(--bg)' }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, marginTop: 8 }}>vs</div>
        </div>
        <div style={{ padding: '6px 10px', background: 'var(--surface2)', borderRadius: '0 6px 0 0', textAlign: 'right' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--orange)' }}>Run B</div>
          <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'monospace' }}>{b.id.slice(-8)}</div>
          <div style={{ fontSize: 9, color: 'var(--muted)' }}>{fmt(b.ts)}</div>
        </div>
      </div>
      {metrics.map(m => {
        const aWins = m.higherBetter ? m.va > m.vb : m.va < m.vb;
        const bWins = m.higherBetter ? m.vb > m.va : m.vb < m.va;
        const diff = m.vb - m.va;
        const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
        return (
          <div key={m.label} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', borderBottom: '1px solid var(--border)22', padding: '5px 0' }}>
            <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: aWins ? 'var(--green)' : bWins ? 'var(--muted)' : 'var(--text)', paddingRight: 10 }}>{m.va}</div>
            <div style={{ textAlign: 'center', fontSize: 9, color: 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div>{m.label}</div>
              <div style={{ color: diff > 0 ? 'var(--green)' : diff < 0 ? 'var(--red)' : 'var(--muted)' }}>{diffStr}</div>
            </div>
            <div style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: bWins ? 'var(--green)' : aWins ? 'var(--muted)' : 'var(--text)', paddingLeft: 10 }}>{m.vb}</div>
          </div>
        );
      })}
    </div>
  );
}
