import { useState, useRef } from 'react';

const ANALYSES = [
  { id: 'static',    icon: '🔬', label: 'Static Code Analysis',       desc: 'Call trees, functional decomp, tech debt, dead code, LOC metrics', time: 18 },
  { id: 'inventory', icon: '📦', label: 'Inventory Scanner',           desc: 'Files, functions, classes, modules — full inventory report', time: 8 },
  { id: 'rules',     icon: '📐', label: 'Business Rules Extraction',   desc: 'Extract BR from conditionals, validation logic, comments', time: 24 },
  { id: 'testgen',   icon: '🧪', label: 'Test Case Generation',        desc: 'Generate test cases mapped to extracted business rules', time: 16 },
  { id: 'data',      icon: '🗄', label: 'Data Flow Analysis',          desc: 'CRUD matrix, entity relationships, data flow diagrams', time: 12 },
  { id: 'docs',      icon: '📝', label: 'Document Generation',         desc: 'FR/NFR, data model, API specs, architecture overview', time: 20 },
];

const LANGS = ['Auto-detect', 'C++ (VC++/MFC)', 'COBOL', 'Java', 'C#/.NET', 'Python', 'JavaScript/TypeScript', 'Mixed'];

const SAMPLE_RESULTS = {
  static:    { rulesFound: 14, functions: 42, files: 8, deadCode: 3, debtScore: 72, callDepth: 6 },
  inventory: { files: 8, functions: 42, classes: 12, loc: 3840, languages: ['C++', 'COBOL', 'SQL'] },
  rules:     { rulesExtracted: 14, confidence: 0.91, categories: 5, subrules: 22 },
  testgen:   { testCases: 16, coverage: 94, categories: 5, criticalCovered: 6 },
  data:      { tables: 3, entities: 5, crudOps: 18, dataFlows: 7 },
  docs:      { pages: 24, fr: 8, nfr: 6, diagrams: 5, ac: 8 },
};

const RUNS_KEY = 'lss-runs';

function loadRuns() {
  try { return JSON.parse(localStorage.getItem(RUNS_KEY) || '[]'); }
  catch { return []; }
}
function saveRun(run) {
  const runs = loadRuns();
  runs.unshift(run);
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs.slice(0, 50)));
}

export default function SourceUpload({ onNavigate, onToast }) {
  const [tab, setTab] = useState('github');
  const [githubUrl, setGithubUrl] = useState('https://github.com/ajaywal/re-agent-pack');
  const [branch, setBranch] = useState('main');
  const [token, setToken] = useState('');
  const [language, setLanguage] = useState('Auto-detect');
  const [selected, setSelected] = useState(new Set(['static', 'rules', 'testgen']));
  const [dropHover, setDropHover] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | running | done | error
  const [progress, setProgress] = useState({});
  const [currentStep, setCurrentStep] = useState('');
  const [runId, setRunId] = useState(null);
  const fileRef = useRef();
  const timerRefs = useRef([]);

  function toggleAnalysis(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() { setSelected(new Set(ANALYSES.map(a => a.id))); }
  function selectNone() { setSelected(new Set()); }

  function handleFileDrop(e) {
    e.preventDefault();
    setDropHover(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.zip') || file.name.endsWith('.tar.gz'))) {
      setUploadedFile(file);
      setTab('upload');
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) setUploadedFile(file);
  }

  function clearTimers() {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }

  async function startAnalysis() {
    if (selected.size === 0) { onToast('Select at least one analysis type'); return; }
    const src = tab === 'github' ? githubUrl : uploadedFile?.name;
    if (!src) { onToast('Provide a GitHub URL or upload a file'); return; }

    clearTimers();
    setPhase('running');
    setProgress({});

    const analyses = ANALYSES.filter(a => selected.has(a.id));
    const id = `run-${Date.now()}`;
    setRunId(id);

    let delay = 0;
    for (const analysis of analyses) {
      const steps = analysis.time;
      for (let i = 1; i <= steps; i++) {
        const t = setTimeout(() => {
          setCurrentStep(`${analysis.label} — step ${i}/${steps}`);
          setProgress(prev => ({ ...prev, [analysis.id]: Math.round(i / steps * 100) }));
        }, (delay + i) * 200);
        timerRefs.current.push(t);
      }
      delay += steps;
    }

    const totalDelay = delay * 200 + 400;
    const doneTimer = setTimeout(() => {
      const results = {};
      analyses.forEach(a => { results[a.id] = SAMPLE_RESULTS[a.id]; });

      const run = {
        id,
        ts: new Date().toISOString(),
        source: tab === 'github' ? { type: 'github', url: githubUrl, branch } : { type: 'zip', name: uploadedFile?.name },
        language,
        analyses: analyses.map(a => a.id),
        results,
        status: 'success',
        duration: Math.round(totalDelay / 1000),
      };
      saveRun(run);
      setPhase('done');
      setCurrentStep('');
      onToast('Analysis complete — saved to Run History');
    }, totalDelay);
    timerRefs.current.push(doneTimer);
  }

  function reset() {
    clearTimers();
    setPhase('idle');
    setProgress({});
    setCurrentStep('');
    setRunId(null);
  }

  const sourceOk = tab === 'github' ? githubUrl.trim() !== '' : !!uploadedFile;
  const analyses = ANALYSES.filter(a => selected.has(a.id));
  const estTime = analyses.reduce((s, a) => s + a.time, 0) * 0.2;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 8, marginBottom: 14 }}>
        {[
          ['Analyses Available', ANALYSES.length, 'var(--blue)'],
          ['Selected', selected.size, 'var(--orange)'],
          ['Est. Duration', `~${Math.round(estTime)}s`, 'var(--muted)'],
          ['Saved Runs', loadRuns().length, 'var(--green)'],
        ].map(([l, v, c]) => (
          <div key={l} className="kpi"><div className="kpi-lbl">{l}</div><div className="kpi-val" style={{ color: c, fontSize: 20 }}>{v}</div></div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Left: Source selection */}
        <div className="card">
          <div className="card-title">Source Code</div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {['github', 'upload'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`pill ${tab === t ? 'pill-blue' : ''}`}
                style={{ fontSize: 11, background: tab === t ? '' : 'var(--surface2)', border: '1px solid var(--border)' }}>
                {t === 'github' ? '🔗 GitHub' : '📁 ZIP Upload'}
              </button>
            ))}
          </div>

          {tab === 'github' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Repository URL</div>
                <input
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  disabled={phase === 'running'}
                  style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', color: 'var(--text)', fontSize: 11, fontFamily: 'monospace', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Branch</div>
                  <input value={branch} onChange={e => setBranch(e.target.value)} disabled={phase === 'running'}
                    style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', color: 'var(--text)', fontSize: 11, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Access Token (optional)</div>
                  <input value={token} onChange={e => setToken(e.target.value)} type="password" placeholder="ghp_..." disabled={phase === 'running'}
                    style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', color: 'var(--text)', fontSize: 11, boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
          )}

          {tab === 'upload' && (
            <div
              onDragOver={e => { e.preventDefault(); setDropHover(true); }}
              onDragLeave={() => setDropHover(false)}
              onDrop={handleFileDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dropHover ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius: 8, padding: 32, textAlign: 'center', cursor: 'pointer',
                background: dropHover ? '#1f3a5f22' : 'var(--surface2)',
                transition: 'all .2s',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
              {uploadedFile
                ? <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>{uploadedFile.name}</div>
                : <div style={{ fontSize: 11, color: 'var(--muted)' }}>Drop .zip or .tar.gz here<br />or click to browse</div>
              }
              <input ref={fileRef} type="file" accept=".zip,.tar.gz" style={{ display: 'none' }} onChange={handleFileSelect} />
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Language / Platform</div>
            <select value={language} onChange={e => setLanguage(e.target.value)} disabled={phase === 'running'}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', color: 'var(--text)', fontSize: 11 }}>
              {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Right: Analysis selection */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="card-title" style={{ margin: 0 }}>Analysis Types</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={selectAll} className="pill" style={{ fontSize: 10, background: 'var(--surface2)', border: '1px solid var(--border)' }}>All</button>
              <button onClick={selectNone} className="pill" style={{ fontSize: 10, background: 'var(--surface2)', border: '1px solid var(--border)' }}>None</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ANALYSES.map(a => {
              const checked = selected.has(a.id);
              return (
                <div key={a.id} onClick={() => phase === 'idle' && toggleAnalysis(a.id)}
                  style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 6, cursor: phase === 'idle' ? 'pointer' : 'default', background: checked ? 'var(--surface2)' : 'var(--surface)', border: `1px solid ${checked ? 'var(--blue)' : 'var(--border)'}`, transition: 'all .15s' }}>
                  <div style={{ width: 16, height: 16, border: `2px solid ${checked ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 3, background: checked ? 'var(--blue)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13 }}>{a.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{a.label}</span>
                      <span style={{ fontSize: 9, color: 'var(--muted)', marginLeft: 'auto' }}>~{a.time * 0.2}s</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{a.desc}</div>
                    {progress[a.id] !== undefined && (
                      <div style={{ marginTop: 6, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress[a.id]}%`, background: progress[a.id] === 100 ? 'var(--green)' : 'var(--blue)', borderRadius: 2, transition: 'width .3s' }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Run controls */}
      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            {phase === 'idle' && (
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Ready — {selected.size} analysis type{selected.size !== 1 ? 's' : ''} selected
                {sourceOk ? ` · Source: ${tab === 'github' ? githubUrl.split('/').slice(-1)[0] : uploadedFile?.name}` : ' · No source selected'}
              </div>
            )}
            {phase === 'running' && (
              <div style={{ fontSize: 11, color: 'var(--blue)' }}>⟳ {currentStep}</div>
            )}
            {phase === 'done' && (
              <div style={{ fontSize: 11, color: 'var(--green)' }}>
                ✓ Analysis complete — Run ID: <span style={{ fontFamily: 'monospace' }}>{runId}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {phase === 'done' && (
              <button onClick={() => onNavigate?.('runhistory')}
                style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                View Results →
              </button>
            )}
            {phase !== 'idle' && (
              <button onClick={reset}
                style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>
                Reset
              </button>
            )}
            {phase === 'idle' && (
              <button onClick={startAnalysis} disabled={!sourceOk || selected.size === 0}
                style={{ background: sourceOk && selected.size > 0 ? 'var(--blue)' : 'var(--surface2)', color: sourceOk && selected.size > 0 ? '#fff' : 'var(--muted)', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: sourceOk && selected.size > 0 ? 'pointer' : 'default' }}>
                ▶ Start Analysis
              </button>
            )}
            {phase === 'running' && (
              <button onClick={reset}
                style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>
                ✕ Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
