import { useReducer, useRef, useState, useEffect } from 'react';
import { MODELS, getModel, requiredApiKeys, runAgentNode, mergeIntoContext, topoSort } from '../utils/agentRunners';

const NODE_W = 178;
const NODE_H = 76;
const DRAG_THRESHOLD = 6;

const AGENT_TYPES = [
  { type: 'source-loader',   label: 'Source Loader',           icon: '📁', color: 'var(--purple)', category: 'Input',      desc: 'Load code from GitHub or ZIP',
    inputs: [],                                outputs: ['source'],
    defaultModel: 'claude-haiku-4-5-20251001',
    defaultParams: { repoUrl: 'https://github.com/ajaywal/re-agent-pack', branch: 'main', githubToken: '', fileTypes: '.cpp,.h,.cbl,.js,.ts,.sql,.md' } },
  { type: 'static-analyst',  label: 'Static Code Analyst',     icon: '🔬', color: 'var(--orange)', category: 'Analysis',   desc: 'Call trees, tech debt, dead code',
    inputs: ['source'],                        outputs: ['analysis'],
    defaultModel: 'ibm-granite-34b-code',
    defaultParams: { temperature: 0.1, maxTokens: 4096, prompt: '' } },
  { type: 'inventory',       label: 'Inventory Scanner',        icon: '📦', color: '#58a6ff',       category: 'Analysis',   desc: 'Files, functions, classes, LOC',
    inputs: ['source'],                        outputs: ['inventory'],
    defaultModel: 'claude-haiku-4-5-20251001',
    defaultParams: { temperature: 0.1, maxTokens: 2048, prompt: '' } },
  { type: 'rules-extractor', label: 'Business Rules Extractor',icon: '📐', color: 'var(--blue)',    category: 'Analysis',   desc: 'BR from conditionals & comments',
    inputs: ['source', 'analysis'],            outputs: ['rules'],
    defaultModel: 'claude-sonnet-4-6',
    defaultParams: { temperature: 0.2, maxTokens: 6000, prompt: '' } },
  { type: 'test-generator',  label: 'Test Case Generator',      icon: '🧪', color: 'var(--green)',   category: 'Generation', desc: 'Test cases from rules & code paths',
    inputs: ['rules', 'source', 'analysis'],   outputs: ['tests'],
    defaultModel: 'claude-sonnet-4-6',
    defaultParams: { temperature: 0.3, maxTokens: 4096, prompt: '' } },
  { type: 'doc-writer',      label: 'Document Writer',          icon: '📝', color: '#8b949e',       category: 'Generation', desc: 'FR/NFR, data model, API specs',
    inputs: ['rules', 'tests', 'analysis', 'inventory'], outputs: ['docs'],
    defaultModel: 'claude-opus-4-7',
    defaultParams: { temperature: 0.3, maxTokens: 6000, prompt: '' } },
  { type: 'data-analyst',    label: 'Data Flow Analyst',        icon: '🗄', color: 'var(--orange)', category: 'Analysis',   desc: 'CRUD matrix, data flow diagrams',
    inputs: ['source'],                        outputs: ['data'],
    defaultModel: 'ibm-granite-3-1-8b',
    defaultParams: { temperature: 0.1, maxTokens: 3000, prompt: '' } },
  { type: 'human-review',    label: 'Human Reviewer',           icon: '👤', color: 'var(--red)',     category: 'Control',    desc: 'Approval gate — pauses flow',
    inputs: ['*'],                             outputs: ['approved'],
    defaultModel: null,
    defaultParams: { approvers: 'PM, BA', autoApprove: true, timeout: '24h' } },
  { type: 'report-compiler', label: 'Report Compiler',          icon: '📊', color: 'var(--green)',   category: 'Output',     desc: 'Aggregate results into report',
    inputs: ['*'],                             outputs: ['report'],
    defaultModel: 'claude-sonnet-4-6',
    defaultParams: { temperature: 0.3, maxTokens: 4096, prompt: '' } },
];

const CATEGORY_COLOR = { Input: 'var(--purple)', Analysis: 'var(--blue)', Generation: 'var(--green)', Control: 'var(--red)', Output: 'var(--orange)' };

function getAgentDef(type) { return AGENT_TYPES.find(a => a.type === type) || AGENT_TYPES[0]; }
function uid() { return `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`; }

const FLOWS_KEY   = 'lss-agent-flows';
const RUNS_KEY    = 'lss-agent-runs';

function loadCatalog() { try { return JSON.parse(localStorage.getItem(FLOWS_KEY) || '[]'); } catch { return []; } }
function loadRuns()    { try { return JSON.parse(localStorage.getItem(RUNS_KEY) || '[]'); } catch { return []; } }
function saveFlow(flow) {
  const catalog = loadCatalog();
  const idx = catalog.findIndex(f => f.id === flow.id);
  const entry = { id: flow.id, name: flow.name, savedAt: new Date().toISOString(), flow };
  if (idx >= 0) catalog[idx] = entry; else catalog.unshift(entry);
  localStorage.setItem(FLOWS_KEY, JSON.stringify(catalog.slice(0, 20)));
}
function saveRun(run) {
  const runs = loadRuns();
  runs.unshift(run);
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs.slice(0, 30)));
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_NODE': {
      const def = getAgentDef(action.agentType);
      const id = uid();
      return { ...state, nodes: { ...state.nodes, [id]: {
        id, type: action.agentType, x: action.x, y: action.y,
        model: def.defaultModel || 'claude-sonnet-4-6',
        params: { ...def.defaultParams }, status: null, result: null,
      }}};
    }
    case 'MOVE_NODE':
      return { ...state, nodes: { ...state.nodes, [action.id]: { ...state.nodes[action.id], x: action.x, y: action.y } } };
    case 'ADD_EDGE':
      if (action.fromId === action.toId) return state;
      if (state.edges.some(e => e.fromId === action.fromId && e.toId === action.toId)) return state;
      return { ...state, edges: [...state.edges, { id: uid(), fromId: action.fromId, toId: action.toId }] };
    case 'DELETE_EDGE':
      return { ...state, edges: state.edges.filter(e => e.id !== action.id) };
    case 'DELETE_NODE': {
      const { [action.id]: _, ...rest } = state.nodes;
      return { ...state, nodes: rest, edges: state.edges.filter(e => e.fromId !== action.id && e.toId !== action.id) };
    }
    case 'SET_MODEL':   return { ...state, nodes: { ...state.nodes, [action.id]: { ...state.nodes[action.id], model: action.model } } };
    case 'SET_PARAM':   return { ...state, nodes: { ...state.nodes, [action.id]: { ...state.nodes[action.id], params: { ...state.nodes[action.id].params, [action.key]: action.value } } } };
    case 'SET_STATUS':  return { ...state, nodes: { ...state.nodes, [action.id]: { ...state.nodes[action.id], status: action.status, result: action.result ?? state.nodes[action.id]?.result } } };
    case 'RESET':       return { ...state, nodes: Object.fromEntries(Object.entries(state.nodes).map(([id, n]) => [id, { ...n, status: null, result: null }])) };
    case 'LOAD':        return { ...action.flow, nodes: Object.fromEntries(Object.entries(action.flow.nodes).map(([id, n]) => [id, { ...n, status: null, result: null }])) };
    case 'LOAD_RESULTS':
      return { ...state, nodes: Object.fromEntries(Object.entries(state.nodes).map(([id, n]) => [id, { ...n, status: action.results[id]?.status || null, result: action.results[id]?.result || null }])) };
    case 'SET_NAME':    return { ...state, name: action.name };
    case 'CLEAR':       return { name: state.name, id: state.id, nodes: {}, edges: [] };
    default:            return state;
  }
}

// ─── API Key Modal ────────────────────────────────────────────────────────────

function ApiKeyModal({ needed, savedKeys, onConfirm, onCancel }) {
  const [keys, setKeys] = useState({ anthropic: '', watsonx: '', watsonxProjectId: '', github: '', ...savedKeys });

  function set(k, v) { setKeys(prev => ({ ...prev, [k]: v })); }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24, width: 440, maxWidth: '90vw' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>API Keys Required</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>Keys are stored in sessionStorage only — cleared when the tab closes.</div>

        {needed.anthropic && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', display: 'block', marginBottom: 4 }}>
              ⬡ Anthropic API Key <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(for Claude models)</span>
            </label>
            <input type="password" value={keys.anthropic} onChange={e => set('anthropic', e.target.value)}
              placeholder="sk-ant-api03-..." autoComplete="off"
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '7px 10px', color: 'var(--text)', fontSize: 12, fontFamily: 'monospace', boxSizing: 'border-box' }} />
          </div>
        )}

        {needed.watsonx && (
          <>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', display: 'block', marginBottom: 4 }}>
                ◆ IBM watsonx API Key
              </label>
              <input type="password" value={keys.watsonx} onChange={e => set('watsonx', e.target.value)}
                placeholder="IBM Cloud API key..." autoComplete="off"
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '7px 10px', color: 'var(--text)', fontSize: 12, fontFamily: 'monospace', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', display: 'block', marginBottom: 4 }}>
                ◆ watsonx Project ID
              </label>
              <input value={keys.watsonxProjectId} onChange={e => set('watsonxProjectId', e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '7px 10px', color: 'var(--text)', fontSize: 12, fontFamily: 'monospace', boxSizing: 'border-box' }} />
            </div>
          </>
        )}

        {needed.github && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', display: 'block', marginBottom: 4 }}>
              GitHub Token <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional — needed for private repos)</span>
            </label>
            <input type="password" value={keys.github} onChange={e => set('github', e.target.value)}
              placeholder="ghp_... (leave blank for public repos)"
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '7px 10px', color: 'var(--text)', fontSize: 12, fontFamily: 'monospace', boxSizing: 'border-box' }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onCancel} style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onConfirm(keys)} style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            ▶ Run with these keys
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Node Result Viewer ───────────────────────────────────────────────────────

function NodeResultDrawer({ node, onClose }) {
  if (!node?.result) return null;
  const def = getAgentDef(node.type);
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 90, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end' }}>
      <div style={{ width: Math.min(680, window.innerWidth * 0.8), background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 18 }}>{def.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: def.color }}>{def.label}</span>
          <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>
            {node.result.inputTokens > 0 && `${node.result.inputTokens} in / ${node.result.outputTokens} out tokens`}
          </span>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '16px', fontFamily: 'monospace', fontSize: 11, color: '#e6edf3', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: '#0d1117' }}>
          {node.result.output || '(no output)'}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AgentPlayground({ onToast }) {
  const initFlow = { id: uid(), name: 'Untitled Flow', nodes: {}, edges: [] };
  const [flow, dispatch] = useReducer(reducer, initFlow);
  const [selectedId, setSelectedId] = useState(null);
  const [pendingEdge, setPendingEdge] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [execLog, setExecLog] = useState([]);
  const [executing, setExecuting] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [savedApiKeys, setSavedApiKeys] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('lss-api-keys') || '{}'); } catch { return {}; }
  });
  const [resultNode, setResultNode] = useState(null);
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [catalog, setCatalog] = useState(loadCatalog);
  const [runs, setRuns] = useState(loadRuns);
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedRun, setSelectedRun] = useState('');
  const canvasRef = useRef();
  const gestureRef = useRef(null);
  const abortRef = useRef(false);
  const logRef = useRef();

  const nodes = Object.values(flow.nodes);
  const selectedNode = selectedId ? flow.nodes[selectedId] : null;
  const selectedDef = selectedNode ? getAgentDef(selectedNode.type) : null;

  function addLog(msg, level = 'info') {
    const entry = { ts: new Date().toLocaleTimeString(), msg, level };
    setExecLog(prev => [...prev, entry]);
    setTimeout(() => { logRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }); }, 50);
  }

  function canvasCoord(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left + canvasRef.current.scrollLeft, y: e.clientY - rect.top + canvasRef.current.scrollTop };
  }

  // ── Sidebar → Canvas drop ────────────────────────────────────────────────
  function onSidebarDragStart(e, agentType) { e.dataTransfer.setData('agentType', agentType); }
  function onCanvasDragOver(e) { e.preventDefault(); }
  function onCanvasDrop(e) {
    e.preventDefault();
    const agentType = e.dataTransfer.getData('agentType');
    if (!agentType) return;
    const { x, y } = canvasCoord(e);
    dispatch({ type: 'ADD_NODE', agentType, x: Math.max(8, x - NODE_W / 2), y: Math.max(8, y - NODE_H / 2) });
  }

  // ── Node drag (with threshold) ────────────────────────────────────────────
  function onNodePointerDown(e, id) {
    if (e.button !== 0) return;
    e.stopPropagation();          // stop pointer bubbling
    e.nativeEvent?.stopPropagation?.();
    const rect = e.currentTarget.getBoundingClientRect();
    gestureRef.current = {
      id,
      startClientX: e.clientX, startClientY: e.clientY,
      offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    // Select immediately on press
    if (!pendingEdge) setSelectedId(id);
  }

  function onNodePointerMove(e) {
    if (!gestureRef.current) return;
    const g = gestureRef.current;
    const dist = Math.hypot(e.clientX - g.startClientX, e.clientY - g.startClientY);
    if (!g.moved && dist < DRAG_THRESHOLD) return;
    g.moved = true;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - g.offsetX + canvasRef.current.scrollLeft;
    const y = e.clientY - rect.top - g.offsetY + canvasRef.current.scrollTop;
    dispatch({ type: 'MOVE_NODE', id: g.id, x: Math.max(0, x), y: Math.max(0, y) });
  }

  function onNodePointerUp() { gestureRef.current = null; }

  // Separate click handler on node — prevents canvas click from deselecting
  function onNodeClick(e, id) {
    e.stopPropagation();
    if (!gestureRef.current?.moved) setSelectedId(id);
  }

  // ── Edge drawing ──────────────────────────────────────────────────────────
  function onOutputPortClick(e, fromId) {
    e.stopPropagation();
    if (pendingEdge === fromId) { setPendingEdge(null); return; }
    setPendingEdge(fromId);
    const { x, y } = canvasCoord(e);
    setMousePos({ x, y });
  }

  function onInputPortClick(e, toId) {
    e.stopPropagation();
    if (pendingEdge && pendingEdge !== toId) dispatch({ type: 'ADD_EDGE', fromId: pendingEdge, toId });
    setPendingEdge(null);
  }

  function onCanvasClick() {
    if (pendingEdge) { setPendingEdge(null); return; }
    setSelectedId(null);
  }

  function onCanvasMouseMove(e) {
    if (!pendingEdge) return;
    setMousePos(canvasCoord(e));
  }

  // ── SVG helpers ───────────────────────────────────────────────────────────
  function edgePath(x1, y1, x2, y2) {
    const cx = Math.abs(x2 - x1) * 0.5 + 60;
    return `M${x1},${y1} C${x1 + cx},${y1} ${x2 - cx},${y2} ${x2},${y2}`;
  }
  // Ports sit at the outside edge of the node, vertically centred
  const outPos = n => ({ x: n.x + NODE_W + 9, y: n.y + NODE_H / 2 });
  const inPos  = n => ({ x: n.x - 9,           y: n.y + NODE_H / 2 });

  // Returns true when the pending-edge's output type is compatible with `toType`
  function isCompatible(toType) {
    if (!pendingEdge) return false;
    const fromDef = getAgentDef(flow.nodes[pendingEdge]?.type);
    const toDef = getAgentDef(toType);
    if (!fromDef || !toDef) return false;
    if (toDef.inputs.includes('*')) return true;
    return fromDef.outputs.some(o => toDef.inputs.includes(o));
  }

  // ── Execution ─────────────────────────────────────────────────────────────
  function startExecution(apiKeys) {
    setShowApiModal(false);
    sessionStorage.setItem('lss-api-keys', JSON.stringify(apiKeys));
    setSavedApiKeys(apiKeys);
    doExecute(apiKeys);
  }

  async function doExecute(apiKeys) {
    abortRef.current = false;
    setExecuting(true);
    dispatch({ type: 'RESET' });
    setExecLog([]);
    const startTime = Date.now();

    addLog(`▶ Starting "${flow.name}" — ${nodes.length} agents`, 'info');

    const order = topoSort(flow.nodes, flow.edges);
    let context = {};
    const nodeResults = {};

    for (const nodeId of order) {
      if (abortRef.current) break;
      const node = flow.nodes[nodeId];
      if (!node) continue;
      const def = getAgentDef(node.type);
      const model = getModel(node.model);

      dispatch({ type: 'SET_STATUS', id: nodeId, status: 'running' });
      addLog(`  ⟳ ${def.label}${model ? ` [${model.label}]` : ''}`, 'info');

      try {
        const result = await runAgentNode(node, context, apiKeys, msg => addLog(`    ${msg}`, 'info'));
        context = mergeIntoContext(context, result);
        nodeResults[nodeId] = { status: 'done', result };
        dispatch({ type: 'SET_STATUS', id: nodeId, status: 'done', result });
        addLog(`  ✓ ${def.label}${result.outputTokens > 0 ? ` (${result.outputTokens} tokens)` : ''}`, 'success');
      } catch (err) {
        nodeResults[nodeId] = { status: 'error', result: { agentType: node.type, output: `ERROR: ${err.message}`, inputTokens: 0, outputTokens: 0 } };
        dispatch({ type: 'SET_STATUS', id: nodeId, status: 'error', result: nodeResults[nodeId].result });
        addLog(`  ✗ ${def.label}: ${err.message}`, 'error');
        // Don't abort entire flow on single agent error
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    const passCount = Object.values(nodeResults).filter(r => r.status === 'done').length;

    addLog(`\n✓ Flow complete — ${passCount}/${order.length} agents succeeded in ${duration}s`, 'success');
    setExecuting(false);

    // Persist run
    const run = {
      id: `run-${Date.now()}`,
      ts: new Date().toISOString(),
      flowId: flow.id,
      flowName: flow.name,
      flow: { ...flow, nodes: { ...flow.nodes } },
      nodeResults,
      passCount,
      totalAgents: order.length,
      duration,
      status: passCount === order.length ? 'success' : 'partial',
    };
    saveRun(run);
    setRuns(loadRuns());
    onToast?.(`Flow "${flow.name}" complete — ${passCount}/${order.length} agents succeeded`);
  }

  function onExecuteClick() {
    if (nodes.length === 0) { onToast?.('Add at least one agent to the canvas'); return; }
    const needed = requiredApiKeys(flow.nodes);
    const hasAll = (!needed.anthropic || savedApiKeys.anthropic) && (!needed.watsonx || (savedApiKeys.watsonx && savedApiKeys.watsonxProjectId));
    if (!hasAll) { setShowApiModal(true); return; }
    doExecute(savedApiKeys);
  }

  function stopExecution() {
    abortRef.current = true;
    setExecuting(false);
    addLog('✕ Execution cancelled', 'error');
  }

  // ── Flow catalog ──────────────────────────────────────────────────────────
  function onSaveFlow() {
    saveFlow(flow);
    setCatalog(loadCatalog());
    onToast?.(`Saved "${flow.name}"`);
  }

  function onLoadFlow(entry) {
    dispatch({ type: 'LOAD', flow: entry.flow });
    setSelectedId(null);
    setExecLog([]);
    setShowCatalog(false);
    onToast?.(`Loaded "${entry.flow.name}"`);
  }

  // ── Load run for viewing ──────────────────────────────────────────────────
  function onLoadRun(runId) {
    setSelectedRun(runId);
    if (!runId) return;
    const run = runs.find(r => r.id === runId);
    if (!run) return;

    dispatch({ type: 'LOAD', flow: run.flow });
    setSelectedId(null);
    setExecLog([]);

    // Replay log
    const log = [{ ts: new Date(run.ts).toLocaleTimeString(), msg: `▶ Loaded run from ${new Date(run.ts).toLocaleString()} — ${run.passCount}/${run.totalAgents} agents succeeded`, level: 'info' }];
    const order = topoSort(run.flow.nodes, run.flow.edges);
    for (const nid of order) {
      const nr = run.nodeResults?.[nid];
      const def = getAgentDef(run.flow.nodes[nid]?.type);
      if (nr?.status === 'done') log.push({ ts: '', msg: `  ✓ ${def?.label || nid} (${nr.result?.outputTokens || 0} tokens)`, level: 'success' });
      else if (nr?.status === 'error') log.push({ ts: '', msg: `  ✗ ${def?.label || nid}: ${nr.result?.output?.slice(0, 80)}`, level: 'error' });
    }
    setExecLog(log);

    // Restore node statuses and results
    dispatch({ type: 'LOAD_RESULTS', results: run.nodeResults || {} });
    onToast?.(`Viewing run: ${run.flowName}`);
  }

  // ── Config panel field renderer ───────────────────────────────────────────
  function renderConfigFields() {
    if (!selectedNode) return null;
    const { type } = selectedNode;

    if (type === 'source-loader') {
      return (
        <>
          {[['repoUrl','Repository URL','https://github.com/owner/repo'],['branch','Branch','main'],['fileTypes','File Extensions','.cpp,.h,.cbl,.js,.ts,.sql']].map(([k, label, ph]) => (
            <div key={k} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>{label}</div>
              <input value={selectedNode.params[k] || ''} onChange={e => dispatch({ type: 'SET_PARAM', id: selectedId, key: k, value: e.target.value })}
                placeholder={ph}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '5px 7px', color: 'var(--text)', fontSize: 10, fontFamily: 'monospace', boxSizing: 'border-box' }} />
            </div>
          ))}
          <div style={{ fontSize: 9, color: 'var(--orange)', padding: '6px 8px', background: '#3a2a0044', borderRadius: 4, border: '1px solid var(--orange)33' }}>
            GitHub token is entered when you click ▶ Execute — not stored here.
          </div>
        </>
      );
    }

    if (type === 'human-review') {
      return (
        <>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>Approvers</div>
            <input value={selectedNode.params.approvers || ''} onChange={e => dispatch({ type: 'SET_PARAM', id: selectedId, key: 'approvers', value: e.target.value })}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '5px 7px', color: 'var(--text)', fontSize: 10, boxSizing: 'border-box' }} />
          </div>
          <div style={{ fontSize: 9, color: 'var(--orange)', padding: '6px 8px', background: '#3a2a0044', borderRadius: 4, border: '1px solid var(--orange)33' }}>
            In simulation mode, Human Reviewer auto-approves after 2s. In production, it would pause and wait.
          </div>
        </>
      );
    }

    return (
      <>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>Temperature: {selectedNode.params.temperature ?? 0.2}</div>
          <input type="range" min={0} max={1} step={0.05} value={selectedNode.params.temperature ?? 0.2}
            onChange={e => dispatch({ type: 'SET_PARAM', id: selectedId, key: 'temperature', value: parseFloat(e.target.value) })}
            style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>Max Tokens</div>
          <select value={selectedNode.params.maxTokens || 4096}
            onChange={e => dispatch({ type: 'SET_PARAM', id: selectedId, key: 'maxTokens', value: parseInt(e.target.value) })}
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 6px', color: 'var(--text)', fontSize: 10 }}>
            {[1024, 2048, 4096, 6000, 8192].map(v => <option key={v} value={v}>{v.toLocaleString()}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>Additional Instructions</div>
          <textarea value={selectedNode.params.prompt || ''} rows={4}
            onChange={e => dispatch({ type: 'SET_PARAM', id: selectedId, key: 'prompt', value: e.target.value })}
            placeholder="Extra instructions appended to the system prompt..."
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '5px 7px', color: 'var(--text)', fontSize: 10, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }} />
        </div>
      </>
    );
  }

  const LOG_COLOR = { info: 'var(--muted)', success: 'var(--green)', warn: 'var(--orange)', error: 'var(--red)' };
  const STATUS_COLOR = { running: 'var(--blue)', done: 'var(--green)', error: 'var(--red)' };
  const canvasW = Math.max(900, ...nodes.map(n => n.x + NODE_W + 80));
  const canvasH = Math.max(560, ...nodes.map(n => n.y + NODE_H + 80));
  const cats = [...new Set(AGENT_TYPES.map(a => a.category))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 90px)' }}>
      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, marginBottom: 6, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {showNameEdit
          ? <input autoFocus value={flow.name} onChange={e => dispatch({ type: 'SET_NAME', name: e.target.value })}
              onBlur={() => setShowNameEdit(false)} onKeyDown={e => e.key === 'Enter' && setShowNameEdit(false)}
              style={{ background: 'var(--surface2)', border: '1px solid var(--blue)', borderRadius: 4, padding: '4px 8px', color: 'var(--text)', fontSize: 13, fontWeight: 700, minWidth: 160 }} />
          : <span onClick={() => setShowNameEdit(true)} title="Click to rename"
              style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', cursor: 'pointer', padding: '4px 6px', borderRadius: 4 }}>{flow.name} ✎</span>
        }

        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Last run viewer */}
          <select value={selectedRun} onChange={e => onLoadRun(e.target.value)}
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px', color: 'var(--text)', fontSize: 11, maxWidth: 200 }}>
            <option value="">📂 View past run…</option>
            {runs.map(r => (
              <option key={r.id} value={r.id}>
                {new Date(r.ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} — {r.flowName} ({r.passCount}/{r.totalAgents})
              </option>
            ))}
          </select>

          <button onClick={() => setShowCatalog(!showCatalog)} className="pill"
            style={{ fontSize: 11, background: 'var(--surface2)', border: `1px solid ${showCatalog ? 'var(--blue)' : 'var(--border)'}` }}>
            Load Flow {catalog.length > 0 && `(${catalog.length})`}
          </button>
          <button onClick={onSaveFlow} className="pill" style={{ fontSize: 11, background: 'var(--surface2)', border: '1px solid var(--border)' }}>💾 Save</button>
          <button onClick={() => dispatch({ type: 'CLEAR' })} className="pill" style={{ fontSize: 11, background: 'var(--surface2)', border: '1px solid var(--border)' }}>+ New</button>

          {executing
            ? <button onClick={stopExecution} style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✕ Stop</button>
            : <button onClick={onExecuteClick} style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>▶ Execute</button>
          }
        </div>
      </div>

      {/* Saved flow catalog */}
      {showCatalog && (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: 8, marginBottom: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {catalog.length === 0 && <span style={{ fontSize: 11, color: 'var(--muted)' }}>No saved flows yet — click 💾 Save</span>}
          {catalog.map(entry => (
            <button key={entry.id} onClick={() => onLoadFlow(entry)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: 'var(--text)' }}>
              {entry.flow.name} <span style={{ color: 'var(--muted)', fontSize: 9 }}>{new Date(entry.savedAt).toLocaleDateString()}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, gap: 10, overflow: 'hidden', minHeight: 0 }}>
        {/* ── Agent Palette ── */}
        <div style={{ width: 185, flexShrink: 0, overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Agent Library</div>
          {cats.map(cat => (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: CATEGORY_COLOR[cat], fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, paddingBottom: 2, borderBottom: `1px solid ${CATEGORY_COLOR[cat]}33` }}>{cat}</div>
              {AGENT_TYPES.filter(a => a.category === cat).map(agent => (
                <div key={agent.type} draggable onDragStart={e => onSidebarDragStart(e, agent.type)}
                  style={{ padding: '5px 7px', borderRadius: 4, marginBottom: 3, cursor: 'grab', background: 'var(--surface2)', border: '1px solid var(--border)', userSelect: 'none' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{agent.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: agent.color, lineHeight: 1.2 }}>{agent.label}</div>
                      <div style={{ fontSize: 8, color: 'var(--muted)', lineHeight: 1.3, marginTop: 1 }}>{agent.desc}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    {agent.inputs.length > 0 && agent.inputs.map(t => (
                      <span key={`in-${t}`} style={{ fontSize: 7, background: '#58a6ff18', color: '#58a6ff', border: '1px solid #58a6ff44', borderRadius: 2, padding: '0 4px' }}>{t}</span>
                    ))}
                    {agent.outputs.map(t => (
                      <span key={`out-${t}`} style={{ fontSize: 7, background: '#a371f718', color: '#a371f7', border: '1px solid #a371f744', borderRadius: 2, padding: '0 4px' }}>{t} ▶</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div style={{ fontSize: 9, color: 'var(--muted)', textAlign: 'center', marginTop: 4 }}>Drag → canvas</div>
        </div>

        {/* ── Canvas ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div ref={canvasRef} onDragOver={onCanvasDragOver} onDrop={onCanvasDrop}
            onMouseMove={onCanvasMouseMove} onClick={onCanvasClick}
            style={{ flex: 1, overflow: 'auto', position: 'relative', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, cursor: pendingEdge ? 'crosshair' : 'default' }}>
            <div style={{ position: 'relative', minWidth: canvasW, minHeight: canvasH }}>
              {/* SVG edges */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
                <defs>
                  <marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#484f58" />
                  </marker>
                  <marker id="ahb" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#58a6ff" />
                  </marker>
                </defs>
                {flow.edges.map(edge => {
                  const from = flow.nodes[edge.fromId], to = flow.nodes[edge.toId];
                  if (!from || !to) return null;
                  const fp = outPos(from), tp = inPos(to);
                  return (
                    <g key={edge.id} style={{ pointerEvents: 'all', cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_EDGE', id: edge.id }); }}
                      title="Click to delete edge">
                      <path d={edgePath(fp.x, fp.y, tp.x, tp.y)} fill="none" stroke="transparent" strokeWidth={14} />
                      <path d={edgePath(fp.x, fp.y, tp.x, tp.y)} fill="none" stroke="var(--border)" strokeWidth={2} markerEnd="url(#ah)" />
                    </g>
                  );
                })}
                {pendingEdge && flow.nodes[pendingEdge] && (() => {
                  const fp = outPos(flow.nodes[pendingEdge]);
                  return <path d={edgePath(fp.x, fp.y, mousePos.x, mousePos.y)} fill="none" stroke="var(--blue)" strokeWidth={1.5} strokeDasharray="5,3" markerEnd="url(#ahb)" />;
                })()}
              </svg>

              {/* Agent nodes */}
              {nodes.map(node => {
                const def = getAgentDef(node.type);
                const model = getModel(node.model);
                const isSel = selectedId === node.id;
                const sc = node.status ? STATUS_COLOR[node.status] : null;
                const compat = pendingEdge && pendingEdge !== node.id && isCompatible(node.type);
                const incompatPort = pendingEdge && pendingEdge !== node.id && !compat;
                // Port colours
                const inPortColor  = compat ? 'var(--green)' : pendingEdge && pendingEdge !== node.id ? '#484f58' : '#58a6ff';
                const outPortColor = pendingEdge === node.id ? 'var(--orange)' : '#a371f7';
                return (
                  <div key={node.id}
                    onPointerDown={e => onNodePointerDown(e, node.id)}
                    onPointerMove={onNodePointerMove}
                    onPointerUp={onNodePointerUp}
                    onClick={e => onNodeClick(e, node.id)}
                    style={{
                      position: 'absolute', left: node.x, top: node.y, width: NODE_W, height: NODE_H,
                      background: 'var(--surface2)', borderRadius: 8,
                      border: `2px solid ${isSel ? def.color : sc || (compat ? 'var(--green)' : 'var(--border)')}`,
                      boxShadow: isSel ? `0 0 0 3px ${def.color}44` : compat ? '0 0 0 3px var(--green)44' : 'none',
                      userSelect: 'none', touchAction: 'none',
                      display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px 0 20px',
                      cursor: 'pointer',
                    }}>

                    {/* ── Input port (left) ── */}
                    <div
                      onPointerDown={e => e.stopPropagation()}
                      onClick={e => onInputPortClick(e, node.id)}
                      title={def.inputs.length === 0 ? 'No input (source agent)' : `Accepts: ${def.inputs.join(', ')}`}
                      style={{
                        position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                        cursor: def.inputs.length === 0 ? 'not-allowed' : 'crosshair', zIndex: 5,
                        opacity: def.inputs.length === 0 ? 0.35 : 1,
                      }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: incompatPort ? '#21262d' : inPortColor + '33', border: `2.5px solid ${inPortColor}`, transition: 'all 0.15s' }} />
                      <span style={{ fontSize: 7, color: inPortColor, fontWeight: 700, letterSpacing: 0.3 }}>IN</span>
                    </div>

                    {/* ── Node body ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{def.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: def.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{def.label}</div>
                        <div style={{ fontSize: 8, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {model ? `${model.icon} ${model.label}` : '— no model —'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        {node.status && (
                          <span style={{ fontSize: 12, color: sc }}>{node.status === 'running' ? '⟳' : node.status === 'done' ? '✓' : '✗'}</span>
                        )}
                        {node.result && (
                          <span
                            onPointerDown={e => e.stopPropagation()}
                            onClick={e => { e.stopPropagation(); setResultNode(node); }}
                            title="View output"
                            style={{ fontSize: 9, cursor: 'pointer', color: 'var(--blue)', padding: '1px 4px', background: 'var(--blue)22', borderRadius: 3 }}>👁</span>
                        )}
                      </div>
                    </div>

                    {/* ── Output port (right) ── */}
                    <div
                      onPointerDown={e => e.stopPropagation()}
                      onClick={e => onOutputPortClick(e, node.id)}
                      title={`Outputs: ${def.outputs.join(', ')} — click then click target IN port`}
                      style={{
                        position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                        cursor: 'crosshair', zIndex: 5,
                      }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: outPortColor + '33', border: `2.5px solid ${outPortColor}`, transition: 'all 0.15s' }} />
                      <span style={{ fontSize: 7, color: outPortColor, fontWeight: 700, letterSpacing: 0.3 }}>OUT</span>
                    </div>

                    {/* ── Delete button — always visible when selected ── */}
                    {isSel && (
                      <div
                        onPointerDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_NODE', id: node.id }); setSelectedId(null); }}
                        title="Delete agent"
                        style={{ position: 'absolute', top: -9, right: -9, width: 20, height: 20, borderRadius: '50%', background: 'var(--red)', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 700, zIndex: 6, boxShadow: '0 1px 4px #0008' }}>×</div>
                    )}
                  </div>
                );
              })}

              {nodes.length === 0 && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', color: 'var(--muted)', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🤖</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Drag agents from the left panel</div>
                  <div style={{ fontSize: 11, marginTop: 6 }}>Connect via ports · Click to configure · ▶ Execute to run</div>
                </div>
              )}
            </div>
          </div>

          {/* Execution log */}
          <div ref={logRef} style={{ height: 110, marginTop: 8, background: '#0d1117', border: '1px solid var(--border)', borderRadius: 6, overflow: 'auto', padding: '6px 10px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>Execution Log</div>
            {execLog.length === 0 && <div style={{ fontSize: 10, color: 'var(--muted)' }}>Click ▶ Execute to run the flow — real API calls will be made</div>}
            {execLog.map((e, i) => (
              <div key={i} style={{ fontSize: 10, color: LOG_COLOR[e.level] || 'var(--muted)', fontFamily: 'monospace', lineHeight: 1.5 }}>
                {e.ts && <span style={{ opacity: 0.5 }}>{e.ts} </span>}{e.msg}
              </div>
            ))}
          </div>
        </div>

        {/* ── Config Panel ── */}
        <div style={{ width: 230, flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 10, overflowY: 'auto' }}>
          {!selectedNode ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 50 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⚙</div>
              <div style={{ fontSize: 11 }}>Click an agent to configure</div>
              <div style={{ fontSize: 9, marginTop: 6 }}>Set model, temperature, and instructions per agent</div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>{selectedDef.icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: selectedDef.color }}>{selectedDef.label}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)' }}>{selectedDef.category}</div>
                </div>
              </div>

              {/* Input / Output compatibility chips */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, color: '#58a6ff', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Accepts</div>
                  {selectedDef.inputs.length === 0
                    ? <span style={{ fontSize: 9, color: 'var(--muted)' }}>—</span>
                    : selectedDef.inputs.map(t => (
                        <span key={t} style={{ display: 'inline-block', fontSize: 8, background: '#58a6ff22', color: '#58a6ff', border: '1px solid #58a6ff55', borderRadius: 3, padding: '1px 5px', marginRight: 3, marginBottom: 2 }}>{t}</span>
                      ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, color: '#a371f7', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Outputs</div>
                  {selectedDef.outputs.map(t => (
                    <span key={t} style={{ display: 'inline-block', fontSize: 8, background: '#a371f722', color: '#a371f7', border: '1px solid #a371f755', borderRadius: 3, padding: '1px 5px', marginRight: 3, marginBottom: 2 }}>{t}</span>
                  ))}
                </div>
              </div>

              {selectedNode.type !== 'human-review' && selectedNode.type !== 'source-loader' && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Model</div>
                  {MODELS.map(m => (
                    <div key={m.id} onClick={() => dispatch({ type: 'SET_MODEL', id: selectedId, model: m.id })}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 7px', borderRadius: 4, marginBottom: 3, cursor: 'pointer', background: selectedNode.model === m.id ? 'var(--surface2)' : 'transparent', border: `1px solid ${selectedNode.model === m.id ? (m.provider === 'anthropic' ? 'var(--orange)' : 'var(--blue)') : 'var(--border)'}` }}>
                      <span style={{ fontSize: 9, color: m.provider === 'anthropic' ? 'var(--orange)' : 'var(--blue)' }}>{m.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.label}</div>
                        <div style={{ fontSize: 8, color: 'var(--muted)' }}>{m.tier}</div>
                      </div>
                      {selectedNode.model === m.id && <span style={{ fontSize: 9, color: 'var(--green)', flexShrink: 0 }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Parameters</div>
                {renderConfigFields()}
              </div>

              {selectedNode.result && (
                <div style={{ marginTop: 12 }}>
                  <button onClick={() => setResultNode(selectedNode)}
                    style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--blue)', borderRadius: 5, padding: '7px', fontSize: 11, color: 'var(--blue)', cursor: 'pointer', fontWeight: 700 }}>
                    👁 View Output ({selectedNode.result.outputTokens} tokens)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showApiModal && (
        <ApiKeyModal
          needed={requiredApiKeys(flow.nodes)}
          savedKeys={savedApiKeys}
          onConfirm={startExecution}
          onCancel={() => setShowApiModal(false)}
        />
      )}
      {resultNode && <NodeResultDrawer node={resultNode} onClose={() => setResultNode(null)} />}
    </div>
  );
}
