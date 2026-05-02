import { useState, useEffect } from 'react';
import { GOVERNANCE_KEY } from '../utils/agentRunners';

const KPIS = [
  { label: 'Rules Extracted',    value: 14,    unit: '',   color: 'var(--blue)',   trend: '+2', icon: '📐', desc: 'Business rules identified from source' },
  { label: 'Test Coverage',      value: 94,    unit: '%',  color: 'var(--green)',  trend: '+6%', icon: '🧪', desc: 'Test cases covering extracted rules' },
  { label: 'Tech Debt Score',    value: 72,    unit: '/100', color: 'var(--orange)', trend: '+5', icon: '⚠', desc: 'Higher = less debt (100 = clean)' },
  { label: 'Doc Coverage',       value: 68,    unit: '%',  color: 'var(--orange)', trend: '+12%', icon: '📝', desc: 'Code modules with generated docs' },
  { label: 'Dead Code',          value: 3,     unit: ' files', color: 'var(--red)', trend: '−1', icon: '🗑', desc: 'Unreachable/unused code units' },
  { label: 'Model Drift',        value: 'Low', unit: '',   color: 'var(--green)',  trend: '↔',  icon: '📊', desc: 'Output consistency across runs' },
  { label: 'Fairness Score',     value: 98,    unit: '%',  color: 'var(--green)',  trend: '↔',  icon: '⚖', desc: 'Bias detection across analysis outputs' },
  { label: 'Avg Confidence',     value: 91,    unit: '%',  color: 'var(--green)',  trend: '+3%', icon: '🎯', desc: 'Mean model confidence on extractions' },
];

const MODEL_REGISTRY = [
  { id: 'claude-opus-4-7',   label: 'Claude Opus 4.7',    provider: 'Anthropic',   riskTier: 'Low',    validated: '2026-04-28', drift: 'Stable',   tasks: 'Document Writer, Rules (complex)' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6',  provider: 'Anthropic',   riskTier: 'Low',    validated: '2026-04-28', drift: 'Stable',   tasks: 'Rules Extractor, Test Generator' },
  { id: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5',   provider: 'Anthropic',   riskTier: 'Low',    validated: '2026-04-28', drift: 'Stable',   tasks: 'Inventory Scanner, Source Loader' },
  { id: 'ibm-granite-3-1',   label: 'IBM Granite 3.1',    provider: 'IBM watsonx', riskTier: 'Medium', validated: '2026-04-20', drift: 'Monitor',  tasks: 'Data Flow Analyst' },
  { id: 'ibm-granite-code',  label: 'IBM Granite Code',   provider: 'IBM watsonx', riskTier: 'Low',    validated: '2026-04-20', drift: 'Stable',   tasks: 'Static Code Analyst' },
  { id: 'llama-3-1-70b',     label: 'Llama 3.1 70B',      provider: 'IBM watsonx', riskTier: 'Medium', validated: '2026-03-15', drift: 'Review',   tasks: 'General tasks (cost-optimized)' },
];

const LIFECYCLE = [
  { stage: 'Ingest',    status: 'done',    desc: 'Source code loaded — ajaywal/re-agent-pack (main)', ts: '2026-04-30 09:14' },
  { stage: 'Analyze',   status: 'done',    desc: 'Static + inventory + rules extraction complete', ts: '2026-04-30 09:18' },
  { stage: 'Review',    status: 'done',    desc: 'Business rules reviewed — 14/14 validated', ts: '2026-04-30 10:02' },
  { stage: 'Approve',   status: 'current', desc: 'Awaiting PM sign-off on test cases (16 pending)', ts: 'In progress' },
  { stage: 'Generate',  status: 'pending', desc: 'Forward engineering artifacts — Angular 17 + .NET 8', ts: '—' },
  { stage: 'Archive',   status: 'pending', desc: 'Run archived with full provenance metadata', ts: '—' },
];

const AUDIT_LOG = [
  { ts: '2026-04-30 10:02', user: 'ajaywal', action: 'Approved', target: '14 business rules (R-L-001..R-L-014)', model: 'claude-sonnet-4-6', outcome: 'pass' },
  { ts: '2026-04-30 09:44', user: 'System',  action: 'Executed',  target: 'Static Code Analysis flow', model: 'ibm-granite-code', outcome: 'pass' },
  { ts: '2026-04-30 09:38', user: 'System',  action: 'Executed',  target: 'Business Rules Extraction', model: 'claude-sonnet-4-6', outcome: 'pass' },
  { ts: '2026-04-30 09:22', user: 'System',  action: 'Executed',  target: 'Inventory Scanner', model: 'claude-haiku-4-5', outcome: 'pass' },
  { ts: '2026-04-30 09:14', user: 'ajaywal', action: 'Uploaded',  target: 'ajaywal/re-agent-pack (main branch)', model: '—', outcome: 'pass' },
  { ts: '2026-04-29 16:33', user: 'ba-user', action: 'Rejected',  target: 'TC-009 R-L-008 validation (defect)', model: 'claude-sonnet-4-6', outcome: 'fail' },
];

const DRIFT_RUNS = ['Run-1', 'Run-2', 'Run-3', 'Run-4', 'Run-5 (latest)'];
const DRIFT_METRICS = [
  { label: 'Rules Extracted',  values: [11, 12, 13, 14, 14], color: 'var(--blue)', max: 14 },
  { label: 'Test Coverage %',  values: [76, 80, 88, 92, 94], color: 'var(--green)', max: 100 },
  { label: 'Tech Debt Score',  values: [58, 63, 67, 70, 72], color: 'var(--orange)', max: 100 },
  { label: 'Confidence %',     values: [84, 86, 89, 90, 91], color: 'var(--purple)', max: 100 },
];

const EXPLAINABILITY = [
  { agent: 'Business Rules Extractor', confidence: 91, method: 'Pattern matching + LLM semantic analysis', samples: 14 },
  { agent: 'Static Code Analyst',      confidence: 96, method: 'AST traversal + call graph heuristics', samples: 42 },
  { agent: 'Test Case Generator',      confidence: 87, method: 'Rule-to-test mapping + boundary analysis', samples: 16 },
  { agent: 'Data Flow Analyst',        confidence: 93, method: 'SQL parse + COBOL WORKING-STORAGE trace', samples: 18 },
  { agent: 'Document Writer',          confidence: 82, method: 'Template grounding + context retrieval', samples: 24 },
];

const RISK_COLOR = { Low: 'var(--green)', Medium: 'var(--orange)', High: 'var(--red)' };
const DRIFT_COLOR = { Stable: 'var(--green)', Monitor: 'var(--orange)', Review: 'var(--red)' };
const STATUS_COLOR = { done: 'var(--green)', current: 'var(--blue)', pending: 'var(--muted)' };
const OUTCOME_COLOR = { pass: 'var(--green)', fail: 'var(--red)' };

export default function Governance() {
  const [section, setSection] = useState('overview');
  const [liveRuns, setLiveRuns] = useState([]);

  useEffect(() => {
    function load() {
      try { setLiveRuns(JSON.parse(localStorage.getItem(GOVERNANCE_KEY) || '[]')); } catch { setLiveRuns([]); }
    }
    load();
    // Refresh when storage changes (e.g. a playground run completes)
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  const sections = [
    { id: 'overview',    label: 'Overview' },
    { id: 'models',      label: 'Model Registry' },
    { id: 'lifecycle',   label: 'Lifecycle' },
    { id: 'audit',       label: 'Audit Trail' },
    { id: 'drift',       label: 'Drift Detection' },
    { id: 'explainability', label: 'Explainability' },
    { id: 'live',        label: `Live Runs${liveRuns.length ? ` (${liveRuns.length})` : ''}` },
  ];

  return (
    <div>
      {/* watsonx.gov branding header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '10px 14px', background: 'linear-gradient(135deg, #001d6c22, #0530ad22)', border: '1px solid #0530ad44', borderRadius: 8 }}>
        <span style={{ fontSize: 22 }}>⚖</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#58a6ff' }}>IBM watsonx.gov — Governance Framework</div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>AI lifecycle management · Model risk · Drift detection · Audit trail · Explainability</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: 'var(--muted)' }}>Monitored Project</div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--blue)' }}>ajaywal/re-agent-pack</div>
        </div>
      </div>

      {/* KPI row — always visible */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 8, marginBottom: 14 }}>
        {KPIS.map(k => (
          <div key={k.label} className="kpi" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 6, right: 8, fontSize: 9, color: k.trend.startsWith('+') ? 'var(--green)' : k.trend.startsWith('−') ? 'var(--red)' : 'var(--muted)' }}>{k.trend}</div>
            <div style={{ fontSize: 14, marginBottom: 2 }}>{k.icon}</div>
            <div className="kpi-lbl">{k.label}</div>
            <div className="kpi-val" style={{ color: k.color, fontSize: 18 }}>{k.value}{k.unit}</div>
          </div>
        ))}
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} className={`pill ${section === s.id ? 'pill-blue' : ''}`}
            style={{ fontSize: 11, background: section === s.id ? '' : 'var(--surface2)', border: '1px solid var(--border)' }}>
            {s.label}
          </button>
        ))}
      </div>

      {section === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card">
            <div className="card-title">Risk Summary</div>
            {[
              ['Code Analysis Coverage', '96%', 'var(--green)', '8 of 8 source modules analyzed'],
              ['Rule Extraction Fidelity', '91%', 'var(--green)', 'Avg confidence across 14 rules'],
              ['Model Compliance', '5/6', 'var(--orange)', '1 model overdue for validation refresh'],
              ['Human Review Rate', '100%', 'var(--green)', 'All critical rules reviewed by BA/PM'],
              ['Open Defects', '1', 'var(--red)', 'TC-009 R-L-008 API validation gap'],
            ].map(([label, val, color, note]) => (
              <div key={label} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)22' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)' }}>{note}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color }}>{val}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title">Agent Performance</div>
            {EXPLAINABILITY.map(e => (
              <div key={e.agent} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 11 }}>
                  <span>{e.agent}</span>
                  <span style={{ color: e.confidence >= 90 ? 'var(--green)' : e.confidence >= 80 ? 'var(--orange)' : 'var(--red)', fontWeight: 700 }}>{e.confidence}%</span>
                </div>
                <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${e.confidence}%`, background: e.confidence >= 90 ? 'var(--green)' : e.confidence >= 80 ? 'var(--orange)' : 'var(--red)', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'models' && (
        <div className="card">
          <div className="card-title">Model Registry — Registered Models ({MODEL_REGISTRY.length})</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 11, width: '100%' }}>
              <thead>
                <tr>{['Model', 'Provider', 'Risk Tier', 'Last Validated', 'Drift Status', 'Used For'].map(h => (
                  <th key={h} style={{ padding: '5px 10px', textAlign: 'left', color: 'var(--muted)', fontWeight: 400, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {MODEL_REGISTRY.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border)22' }}>
                    <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: m.provider === 'Anthropic' ? 'var(--orange)' : 'var(--blue)', fontWeight: 700 }}>{m.label}</td>
                    <td style={{ padding: '6px 10px', fontSize: 10, color: 'var(--muted)' }}>{m.provider}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: `${RISK_COLOR[m.riskTier]}22`, color: RISK_COLOR[m.riskTier] }}>{m.riskTier}</span>
                    </td>
                    <td style={{ padding: '6px 10px', fontSize: 10, fontFamily: 'monospace', color: 'var(--muted)' }}>{m.validated}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: `${DRIFT_COLOR[m.drift]}22`, color: DRIFT_COLOR[m.drift] }}>{m.drift}</span>
                    </td>
                    <td style={{ padding: '6px 10px', fontSize: 10, color: 'var(--muted)' }}>{m.tasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === 'lifecycle' && (
        <div className="card">
          <div className="card-title">Analysis Lifecycle — Current Run</div>
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: 9, top: 8, bottom: 8, width: 2, background: 'var(--border)' }} />
            {LIFECYCLE.map((stage, i) => (
              <div key={stage.stage} style={{ display: 'flex', gap: 12, marginBottom: 16, position: 'relative' }}>
                <div style={{ position: 'absolute', left: -20, top: 2, width: 14, height: 14, borderRadius: '50%', background: STATUS_COLOR[stage.status], border: '2px solid var(--bg)', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {stage.status === 'done' && <span style={{ fontSize: 7, color: '#fff' }}>✓</span>}
                  {stage.status === 'current' && <span style={{ fontSize: 7, color: '#fff' }}>●</span>}
                </div>
                <div style={{ flex: 1, padding: '8px 12px', background: stage.status === 'current' ? 'var(--surface2)' : 'transparent', borderRadius: 6, border: `1px solid ${stage.status === 'current' ? 'var(--blue)' : 'var(--border)22'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLOR[stage.status] }}>{stage.stage}</span>
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--muted)' }}>{stage.ts}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{stage.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'audit' && (
        <div className="card">
          <div className="card-title">Audit Trail — Last {AUDIT_LOG.length} events</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {AUDIT_LOG.map((entry, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 10px', background: 'var(--surface2)', borderRadius: 5, border: `1px solid ${OUTCOME_COLOR[entry.outcome]}33` }}>
                <span style={{ fontSize: 12, color: OUTCOME_COLOR[entry.outcome], marginTop: 1 }}>{entry.outcome === 'pass' ? '✓' : '✗'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text)' }}>{entry.action}</span>
                    <span style={{ fontSize: 9, color: 'var(--blue)' }}>{entry.user}</span>
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--muted)', marginLeft: 'auto' }}>{entry.ts}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{entry.target}</div>
                  {entry.model !== '—' && <div style={{ fontSize: 9, color: 'var(--orange)', marginTop: 2, fontFamily: 'monospace' }}>{entry.model}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'drift' && (
        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-title">Drift Detection — Metric Trends Across 5 Runs</div>
            {DRIFT_METRICS.map(metric => (
              <div key={metric.label} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: metric.color, marginBottom: 6 }}>{metric.label}</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 60 }}>
                  {metric.values.map((val, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: '100%', height: `${Math.round(val / metric.max * 52)}px`, background: i === metric.values.length - 1 ? metric.color : `${metric.color}66`, borderRadius: '3px 3px 0 0', transition: 'height .3s', minHeight: 4 }} />
                      <div style={{ fontSize: 8, color: 'var(--muted)', textAlign: 'center' }}>{val}{metric.max === 100 ? '%' : ''}</div>
                      <div style={{ fontSize: 7, color: 'var(--muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>{DRIFT_RUNS[i].split(' ')[0]}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title">Drift Assessment</div>
            {[
              ['Business Rules', 'Increasing (+3 over 5 runs)', 'Improving', 'var(--green)'],
              ['Test Coverage', '+18% over 5 runs', 'Improving', 'var(--green)'],
              ['Model Confidence', 'Stable — variance < 2%', 'Stable', 'var(--green)'],
              ['Tech Debt Score', 'Improving (+14 over 5 runs)', 'Improving', 'var(--green)'],
              ['Dead Code', 'Decreasing (7 → 3 files)', 'Improving', 'var(--green)'],
            ].map(([metric, trend, status, color]) => (
              <div key={metric} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)22' }}>
                <span style={{ fontSize: 11, flex: 1, color: 'var(--text)' }}>{metric}</span>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{trend}</span>
                <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: `${color}22`, color }}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'explainability' && (
        <div className="card">
          <div className="card-title">Explainability — Agent Confidence & Methods</div>
          {EXPLAINABILITY.map(e => (
            <div key={e.agent} style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 6, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{e.agent}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: e.confidence >= 90 ? 'var(--green)' : 'var(--orange)' }}>{e.confidence}% confidence</span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${e.confidence}%`, background: e.confidence >= 90 ? 'var(--green)' : 'var(--orange)', borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}><strong>Method:</strong> {e.method}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}><strong>Samples:</strong> {e.samples} items analyzed</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Live Runs (from playground) ── */}
      {section === 'live' && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Live Run Telemetry</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14 }}>
            Every Agent Playground execution writes here. Custom agents and MCP tools appear alongside built-in agents.
          </div>
          {liveRuns.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: 6 }}>
              No runs yet — execute a flow in the Agent Playground to populate this view.
            </div>
          )}
          {liveRuns.map(run => (
            <div key={run.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{run.flowName}</span>
                <span style={{ fontSize: 9, background: run.status === 'success' ? '#1f6a2522' : '#6a1f1f22', color: run.status === 'success' ? 'var(--green)' : 'var(--red)', border: `1px solid ${run.status === 'success' ? 'var(--green)' : 'var(--red)'}44`, borderRadius: 3, padding: '1px 6px' }}>
                  {run.status}
                </span>
                <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 'auto' }}>{new Date(run.ts).toLocaleString()}</span>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>⏱ {run.duration}s</span>
                <span style={{ fontSize: 10, color: 'var(--blue)' }}>⬡ {run.totalTokens?.toLocaleString() || 0} tokens</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(run.agents || []).map((a, i) => (
                  <div key={i} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 9, background: a.status === 'done' ? '#1f6a2522' : a.status === 'error' ? '#6a1f1f22' : '#21262d',
                    color: a.status === 'done' ? 'var(--green)' : a.status === 'error' ? 'var(--red)' : 'var(--muted)',
                    border: `1px solid ${a.status === 'done' ? 'var(--green)' : a.status === 'error' ? 'var(--red)' : 'var(--border)'}44` }}>
                    {a.status === 'done' ? '✓' : a.status === 'error' ? '✗' : '○'} {a.label}
                    {a.outputTokens > 0 && <span style={{ opacity: 0.6, marginLeft: 4 }}>{a.outputTokens}tok</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
