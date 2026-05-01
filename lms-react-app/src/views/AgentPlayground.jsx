import { useReducer, useRef, useCallback, useEffect, useState } from 'react';

const NODE_W = 172;
const NODE_H = 72;

const AGENT_TYPES = [
  { type: 'source-loader',    label: 'Source Loader',            icon: '📁', color: 'var(--purple)', category: 'Input',      desc: 'GitHub repo or ZIP upload',           defaultModel: 'claude-haiku-4-5' },
  { type: 'static-analyst',   label: 'Static Code Analyst',      icon: '🔬', color: 'var(--orange)', category: 'Analysis',   desc: 'Call trees, tech debt, dead code',    defaultModel: 'ibm-granite-code' },
  { type: 'inventory',        label: 'Inventory Scanner',         icon: '📦', color: '#58a6ff',       category: 'Analysis',   desc: 'Files, functions, classes, LOC',      defaultModel: 'claude-haiku-4-5' },
  { type: 'rules-extractor',  label: 'Business Rules Extractor', icon: '📐', color: 'var(--blue)',    category: 'Analysis',   desc: 'BR from conditionals & comments',     defaultModel: 'claude-sonnet-4-6' },
  { type: 'test-generator',   label: 'Test Case Generator',       icon: '🧪', color: 'var(--green)',   category: 'Generation', desc: 'Test cases from rules & code paths',  defaultModel: 'claude-sonnet-4-6' },
  { type: 'doc-writer',       label: 'Document Writer',           icon: '📝', color: '#8b949e',       category: 'Generation', desc: 'FR/NFR, data model, API specs',       defaultModel: 'claude-opus-4-7' },
  { type: 'data-analyst',     label: 'Data Flow Analyst',         icon: '🗄', color: 'var(--orange)', category: 'Analysis',   desc: 'CRUD matrix, data flow diagrams',     defaultModel: 'ibm-granite-3-1' },
  { type: 'human-review',     label: 'Human Reviewer',            icon: '👤', color: 'var(--red)',     category: 'Control',    desc: 'Approval gate — pauses until approved', defaultModel: null },
  { type: 'report-compiler',  label: 'Report Compiler',           icon: '📊', color: 'var(--green)',   category: 'Output',     desc: 'Aggregate results into reports',      defaultModel: 'claude-sonnet-4-6' },
];

const MODELS = [
  { id: 'claude-opus-4-7',    label: 'Claude Opus 4.7',    provider: 'Anthropic',   tier: 'Premium',     icon: '⬡' },
  { id: 'claude-sonnet-4-6',  label: 'Claude Sonnet 4.6',  provider: 'Anthropic',   tier: 'Balanced',    icon: '⬡' },
  { id: 'claude-haiku-4-5',   label: 'Claude Haiku 4.5',   provider: 'Anthropic',   tier: 'Fast',        icon: '⬡' },
  { id: 'ibm-granite-3-1',    label: 'IBM Granite 3.1',    provider: 'IBM watsonx', tier: 'Balanced',    icon: '◆' },
  { id: 'ibm-granite-code',   label: 'IBM Granite Code',   provider: 'IBM watsonx', tier: 'Specialized', icon: '◆' },
  { id: 'llama-3-1-70b',      label: 'Llama 3.1 70B',      provider: 'IBM watsonx', tier: 'Open',        icon: '◈' },
];

const CATEGORY_COLOR = { Input: 'var(--purple)', Analysis: 'var(--blue)', Generation: 'var(--green)', Control: 'var(--red)', Output: 'var(--orange)' };

const FLOWS_KEY = 'lss-agent-flows';

function uid() { return `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

function getAgentType(type) { return AGENT_TYPES.find(a => a.type === type) || AGENT_TYPES[0]; }

const INITIAL_FLOW = { name: 'Untitled Flow', nodes: {}, edges: [] };

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_NODE': {
      const def = getAgentType(action.agentType);
      const id = uid();
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [id]: { id, type: action.agentType, x: action.x, y: action.y, model: def.defaultModel || 'claude-sonnet-4-6', params: { temperature: 0.2, maxTokens: 4096, prompt: '' }, status: null },
        },
      };
    }
    case 'MOVE_NODE':
      return { ...state, nodes: { ...state.nodes, [action.id]: { ...state.nodes[action.id], x: action.x, y: action.y } } };
    case 'ADD_EDGE':
      if (action.fromId === action.toId) return state;
      if (state.edges.some(e => e.fromId === action.fromId && e.toId === action.toId)) return state;
      return { ...state, edges: [...state.edges, { id: uid(), fromId: action.fromId, toId: action.toId }] };
    case 'DELETE_EDGE':
      return { ...state, edges: state.edges.filter(e => e.id !== action.id) };
    case 'DELETE_NODE':
      const { [action.id]: _removed, ...rest } = state.nodes;
      return { ...state, nodes: rest, edges: state.edges.filter(e => e.fromId !== action.id && e.toId !== action.id) };
    case 'SET_MODEL':
      return { ...state, nodes: { ...state.nodes, [action.id]: { ...state.nodes[action.id], model: action.model } } };
    case 'SET_PARAM':
      return { ...state, nodes: { ...state.nodes, [action.id]: { ...state.nodes[action.id], params: { ...state.nodes[action.id].params, [action.key]: action.value } } } };
    case 'SET_STATUS':
      return { ...state, nodes: { ...state.nodes, [action.id]: { ...state.nodes[action.id], status: action.status } } };
    case 'RESET_STATUSES':
      return { ...state, nodes: Object.fromEntries(Object.entries(state.nodes).map(([id, n]) => [id, { ...n, status: null }])) };
    case 'LOAD_FLOW':
      return { ...action.flow, nodes: Object.fromEntries(Object.entries(action.flow.nodes).map(([id, n]) => [id, { ...n, status: null }])) };
    case 'SET_NAME':
      return { ...state, name: action.name };
    case 'CLEAR':
      return { ...INITIAL_FLOW, name: state.name };
    default:
      return state;
  }
}

function saveToCatalog(flow) {
  try {
    const saved = JSON.parse(localStorage.getItem(FLOWS_KEY) || '[]');
    const idx = saved.findIndex(f => f.id === flow.id);
    const entry = { id: flow.id || uid(), name: flow.name, savedAt: new Date().toISOString(), flow };
    if (idx >= 0) saved[idx] = entry; else saved.unshift(entry);
    localStorage.setItem(FLOWS_KEY, JSON.stringify(saved.slice(0, 20)));
    return entry.id;
  } catch { return null; }
}
function loadCatalog() {
  try { return JSON.parse(localStorage.getItem(FLOWS_KEY) || '[]'); }
  catch { return []; }
}

export default function AgentPlayground({ onToast }) {
  const [flow, dispatch] = useReducer(reducer, { ...INITIAL_FLOW, id: uid() });
  const [selectedId, setSelectedId] = useState(null);
  const [pendingEdge, setPendingEdge] = useState(null); // fromId
  const [execLog, setExecLog] = useState([]);
  const [executing, setExecuting] = useState(false);
  const [catalog, setCatalog] = useState(loadCatalog);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef();
  const gestureRef = useRef(null); // { kind:'node', id, offsetX, offsetY }
  const execTimers = useRef([]);

  const nodes = Object.values(flow.nodes);
  const selectedNode = selectedId ? flow.nodes[selectedId] : null;
  const selectedDef = selectedNode ? getAgentType(selectedNode.type) : null;

  function canvasCoord(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left + canvasRef.current.scrollLeft,
      y: e.clientY - rect.top + canvasRef.current.scrollTop,
    };
  }

  // Sidebar drag (HTML5) → canvas drop
  function onSidebarDragStart(e, agentType) {
    e.dataTransfer.setData('agentType', agentType);
  }
  function onCanvasDragOver(e) { e.preventDefault(); }
  function onCanvasDrop(e) {
    e.preventDefault();
    const agentType = e.dataTransfer.getData('agentType');
    if (!agentType) return;
    const { x, y } = canvasCoord(e);
    dispatch({ type: 'ADD_NODE', agentType, x: Math.max(0, x - NODE_W / 2), y: Math.max(0, y - NODE_H / 2) });
  }

  // Node pointer drag (reposition)
  function onNodePointerDown(e, id) {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (pendingEdge) {
      // this is a connection target (input port click already pending)
      return;
    }
    setSelectedId(id);
    const node = flow.nodes[id];
    const rect = e.currentTarget.getBoundingClientRect();
    gestureRef.current = { kind: 'node', id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onNodePointerMove(e) {
    if (!gestureRef.current || gestureRef.current.kind !== 'node') return;
    const { id, offsetX, offsetY } = gestureRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - offsetX + canvasRef.current.scrollLeft;
    const y = e.clientY - rect.top - offsetY + canvasRef.current.scrollTop;
    dispatch({ type: 'MOVE_NODE', id, x: Math.max(0, x), y: Math.max(0, y) });
  }
  function onNodePointerUp(e) {
    gestureRef.current = null;
  }

  // Canvas mouse move for rubber-band edge
  function onCanvasMouseMove(e) {
    if (!pendingEdge) return;
    const { x, y } = canvasCoord(e);
    setMousePos({ x, y });
  }

  // Output port click → start edge
  function onOutputPortClick(e, fromId) {
    e.stopPropagation();
    if (pendingEdge === fromId) { setPendingEdge(null); return; }
    setPendingEdge(fromId);
    const { x, y } = canvasCoord(e);
    setMousePos({ x, y });
  }

  // Input port click → finish edge
  function onInputPortClick(e, toId) {
    e.stopPropagation();
    if (pendingEdge && pendingEdge !== toId) {
      dispatch({ type: 'ADD_EDGE', fromId: pendingEdge, toId });
    }
    setPendingEdge(null);
  }

  // Click canvas background → deselect
  function onCanvasClick() {
    if (pendingEdge) { setPendingEdge(null); return; }
    setSelectedId(null);
  }

  // SVG bezier path between two node centers
  function edgePath(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1) * 0.5 + 60;
    return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  }

  function nodeOutputPos(node) { return { x: node.x + NODE_W, y: node.y + NODE_H / 2 }; }
  function nodeInputPos(node) { return { x: node.x, y: node.y + NODE_H / 2 }; }

  // Execution simulation
  function clearExecTimers() { execTimers.current.forEach(clearTimeout); execTimers.current = []; }

  async function executeFlow() {
    if (nodes.length === 0) { onToast('Add at least one agent to the canvas'); return; }
    clearExecTimers();
    setExecuting(true);
    setExecLog([]);
    dispatch({ type: 'RESET_STATUSES' });

    // Topological order: sources first, then dependents
    const nodeIds = nodes.map(n => n.id);
    const log = (msg, level = 'info') => setExecLog(prev => [...prev, { ts: new Date().toLocaleTimeString(), msg, level }]);

    log(`▶ Starting flow "${flow.name}" — ${nodeIds.length} agents`, 'info');

    let delay = 0;
    for (const nodeId of nodeIds) {
      const def = getAgentType(flow.nodes[nodeId]?.type);
      const model = flow.nodes[nodeId]?.model;
      const modelDef = MODELS.find(m => m.id === model);
      const runTime = 1200 + Math.random() * 1800;

      const startTimer = setTimeout(() => {
        dispatch({ type: 'SET_STATUS', id: nodeId, status: 'running' });
        log(`  ⟳ ${def.label} [${modelDef?.label || 'No Model'}]`, 'info');
        if (def.type === 'human-review') {
          log(`  ⏳ Human Reviewer — awaiting approval (auto-approved in 2s)`, 'warn');
        }
      }, delay);
      execTimers.current.push(startTimer);

      const doneTimer = setTimeout(() => {
        const failed = Math.random() < 0.05; // 5% random failure
        dispatch({ type: 'SET_STATUS', id: nodeId, status: failed ? 'error' : 'done' });
        if (failed) log(`  ✗ ${def.label} — error (retrying)`, 'error');
        else log(`  ✓ ${def.label} — complete`, 'success');
      }, delay + runTime);
      execTimers.current.push(doneTimer);

      delay += runTime + 200;
    }

    const finalTimer = setTimeout(() => {
      setExecuting(false);
      log(`✓ Flow complete — ${nodeIds.length} agents executed`, 'success');
      onToast(`Flow "${flow.name}" completed`);
    }, delay + 400);
    execTimers.current.push(finalTimer);
  }

  function stopExecution() {
    clearExecTimers();
    setExecuting(false);
    dispatch({ type: 'RESET_STATUSES' });
    setExecLog(prev => [...prev, { ts: new Date().toLocaleTimeString(), msg: '✕ Execution cancelled', level: 'error' }]);
  }

  function saveFlow() {
    const id = saveToCatalog({ ...flow, id: flow.id || uid() });
    setCatalog(loadCatalog());
    onToast(`Flow "${flow.name}" saved`);
  }

  function loadFlow(entry) {
    dispatch({ type: 'LOAD_FLOW', flow: entry.flow });
    setShowCatalog(false);
    setSelectedId(null);
    setExecLog([]);
    onToast(`Loaded "${entry.flow.name}"`);
  }

  function newFlow() {
    clearExecTimers();
    dispatch({ type: 'CLEAR' });
    setSelectedId(null);
    setExecLog([]);
    setPendingEdge(null);
  }

  const LOG_COLOR = { info: 'var(--muted)', success: 'var(--green)', warn: 'var(--orange)', error: 'var(--red)' };
  const STATUS_COLOR = { running: 'var(--blue)', done: 'var(--green)', error: 'var(--red)' };

  const canvasMinW = Math.max(800, ...nodes.map(n => n.x + NODE_W + 60));
  const canvasMinH = Math.max(500, ...nodes.map(n => n.y + NODE_H + 60));

  const categories = [...new Set(AGENT_TYPES.map(a => a.category))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 90px)', gap: 0 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', marginBottom: 8, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {showNameEdit ? (
          <input autoFocus value={flow.name} onChange={e => dispatch({ type: 'SET_NAME', name: e.target.value })}
            onBlur={() => setShowNameEdit(false)} onKeyDown={e => e.key === 'Enter' && setShowNameEdit(false)}
            style={{ background: 'var(--surface2)', border: '1px solid var(--blue)', borderRadius: 4, padding: '4px 8px', color: 'var(--text)', fontSize: 13, fontWeight: 700, minWidth: 160 }} />
        ) : (
          <span onClick={() => setShowNameEdit(true)} style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, border: '1px solid transparent' }}
            title="Click to rename">{flow.name}</span>
        )}
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button onClick={newFlow} className="pill" style={{ fontSize: 11, background: 'var(--surface2)', border: '1px solid var(--border)' }}>+ New</button>
          <button onClick={() => setShowCatalog(!showCatalog)} className="pill" style={{ fontSize: 11, background: showCatalog ? 'var(--surface2)' : 'var(--surface)', border: `1px solid ${showCatalog ? 'var(--blue)' : 'var(--border)'}` }}>
            📂 Load {catalog.length > 0 && `(${catalog.length})`}
          </button>
          <button onClick={saveFlow} className="pill" style={{ fontSize: 11, background: 'var(--surface2)', border: '1px solid var(--border)' }}>💾 Save</button>
          {executing
            ? <button onClick={stopExecution} style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✕ Stop</button>
            : <button onClick={executeFlow} style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>▶ Execute</button>
          }
        </div>
      </div>

      {/* Saved flow catalog dropdown */}
      {showCatalog && (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: 8, marginBottom: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {catalog.length === 0 && <span style={{ fontSize: 11, color: 'var(--muted)' }}>No saved flows yet</span>}
          {catalog.map(entry => (
            <button key={entry.id} onClick={() => loadFlow(entry)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: 'var(--text)' }}>
              {entry.flow.name} <span style={{ color: 'var(--muted)', fontSize: 9 }}>{new Date(entry.savedAt).toLocaleDateString()}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, gap: 10, overflow: 'hidden', minHeight: 0 }}>
        {/* Left: Agent palette */}
        <div style={{ width: 190, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Agent Library</div>
          {categories.map(cat => (
            <div key={cat} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: CATEGORY_COLOR[cat] || 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{cat}</div>
              {AGENT_TYPES.filter(a => a.category === cat).map(agent => (
                <div key={agent.type} draggable onDragStart={e => onSidebarDragStart(e, agent.type)}
                  style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '5px 7px', borderRadius: 4, marginBottom: 3, cursor: 'grab', background: 'var(--surface2)', border: '1px solid var(--border)', userSelect: 'none' }}>
                  <span style={{ fontSize: 13 }}>{agent.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: agent.color }}>{agent.label}</div>
                    <div style={{ fontSize: 8, color: 'var(--muted)', lineHeight: 1.3 }}>{agent.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 4, textAlign: 'center', lineHeight: 1.5 }}>Drag agents onto canvas →</div>
        </div>

        {/* Center: Canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div
            ref={canvasRef}
            onDragOver={onCanvasDragOver}
            onDrop={onCanvasDrop}
            onMouseMove={onCanvasMouseMove}
            onClick={onCanvasClick}
            style={{ flex: 1, overflow: 'auto', position: 'relative', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, cursor: pendingEdge ? 'crosshair' : 'default' }}
          >
            <div style={{ position: 'relative', minWidth: canvasMinW, minHeight: canvasMinH }}>
              {/* SVG edges overlay */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
                <defs>
                  <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="var(--muted)" />
                  </marker>
                  <marker id="arrow-pending" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="var(--blue)" />
                  </marker>
                </defs>
                {flow.edges.map(edge => {
                  const from = flow.nodes[edge.fromId];
                  const to = flow.nodes[edge.toId];
                  if (!from || !to) return null;
                  const fp = nodeOutputPos(from);
                  const tp = nodeInputPos(to);
                  return (
                    <g key={edge.id} style={{ pointerEvents: 'all', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_EDGE', id: edge.id }); }}>
                      <path d={edgePath(fp.x, fp.y, tp.x, tp.y)} fill="none" stroke="transparent" strokeWidth={12} />
                      <path d={edgePath(fp.x, fp.y, tp.x, tp.y)} fill="none" stroke="var(--border)" strokeWidth={1.5} markerEnd="url(#arrow)" />
                    </g>
                  );
                })}
                {/* Rubber-band pending edge */}
                {pendingEdge && flow.nodes[pendingEdge] && (() => {
                  const from = flow.nodes[pendingEdge];
                  const fp = nodeOutputPos(from);
                  return <path d={edgePath(fp.x, fp.y, mousePos.x, mousePos.y)} fill="none" stroke="var(--blue)" strokeWidth={1.5} strokeDasharray="5,3" markerEnd="url(#arrow-pending)" />;
                })()}
              </svg>

              {/* Agent nodes */}
              {nodes.map(node => {
                const def = getAgentType(node.type);
                const model = MODELS.find(m => m.id === node.model);
                const isSelected = selectedId === node.id;
                const statusColor = node.status ? STATUS_COLOR[node.status] : null;
                return (
                  <div key={node.id}
                    onPointerDown={e => onNodePointerDown(e, node.id)}
                    onPointerMove={onNodePointerMove}
                    onPointerUp={onNodePointerUp}
                    style={{
                      position: 'absolute', left: node.x, top: node.y, width: NODE_W, height: NODE_H,
                      background: 'var(--surface2)', borderRadius: 8,
                      border: `2px solid ${isSelected ? def.color : statusColor || 'var(--border)'}`,
                      boxShadow: isSelected ? `0 0 0 1px ${def.color}44` : 'none',
                      cursor: 'grab', userSelect: 'none', transition: 'border-color .15s',
                      display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 14px',
                    }}
                  >
                    {/* Input port */}
                    <div onClick={e => onInputPortClick(e, node.id)}
                      style={{ position: 'absolute', left: -7, top: NODE_H / 2 - 7, width: 14, height: 14, borderRadius: '50%', background: pendingEdge && pendingEdge !== node.id ? 'var(--blue)' : 'var(--surface)', border: `2px solid ${pendingEdge && pendingEdge !== node.id ? 'var(--blue)' : 'var(--border)'}`, cursor: 'pointer', zIndex: 2 }} />

                    {/* Content */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16 }}>{def.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: def.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{def.label}</div>
                        <div style={{ fontSize: 8, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {model ? `${model.icon} ${model.label}` : 'No model'}
                        </div>
                      </div>
                      {node.status && (
                        <span style={{ fontSize: 11, color: statusColor }}>
                          {node.status === 'running' ? '⟳' : node.status === 'done' ? '✓' : '✗'}
                        </span>
                      )}
                    </div>

                    {/* Output port */}
                    <div onClick={e => onOutputPortClick(e, node.id)}
                      style={{ position: 'absolute', right: -7, top: NODE_H / 2 - 7, width: 14, height: 14, borderRadius: '50%', background: pendingEdge === node.id ? 'var(--blue)' : 'var(--surface)', border: `2px solid ${pendingEdge === node.id ? 'var(--blue)' : 'var(--border)'}`, cursor: 'pointer', zIndex: 2 }} />

                    {/* Delete button */}
                    {isSelected && (
                      <div onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_NODE', id: node.id }); setSelectedId(null); }}
                        style={{ position: 'absolute', top: -8, right: -8, width: 16, height: 16, borderRadius: '50%', background: 'var(--red)', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 700, zIndex: 3 }}>×</div>
                    )}
                  </div>
                );
              })}

              {nodes.length === 0 && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', color: 'var(--muted)', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🤖</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Drag agents here to build your flow</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>Connect agents by clicking output → input ports</div>
                </div>
              )}
            </div>
          </div>

          {/* Execution log */}
          <div style={{ height: 100, marginTop: 8, background: '#0d1117', border: '1px solid var(--border)', borderRadius: 6, overflow: 'auto', padding: '6px 10px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>Execution Log</div>
            {execLog.length === 0 && <div style={{ fontSize: 10, color: 'var(--muted)' }}>No runs yet — click ▶ Execute to start</div>}
            {execLog.map((entry, i) => (
              <div key={i} style={{ fontSize: 10, color: LOG_COLOR[entry.level] || 'var(--muted)', fontFamily: 'monospace', lineHeight: 1.5 }}>
                <span style={{ opacity: 0.5 }}>{entry.ts} </span>{entry.msg}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Config panel */}
        <div style={{ width: 220, flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 10, overflowY: 'auto' }}>
          {!selectedNode ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 40 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⚙</div>
              <div style={{ fontSize: 11 }}>Click an agent to configure</div>
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

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Model</div>
                {MODELS.map(m => (
                  <div key={m.id} onClick={() => dispatch({ type: 'SET_MODEL', id: selectedId, model: m.id })}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 4, marginBottom: 3, cursor: 'pointer', background: selectedNode.model === m.id ? 'var(--surface2)' : 'transparent', border: `1px solid ${selectedNode.model === m.id ? (m.provider === 'Anthropic' ? 'var(--orange)' : 'var(--blue)') : 'var(--border)'}` }}>
                    <span style={{ fontSize: 10, color: m.provider === 'Anthropic' ? 'var(--orange)' : 'var(--blue)' }}>{m.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text)' }}>{m.label}</div>
                      <div style={{ fontSize: 8, color: 'var(--muted)' }}>{m.provider} · {m.tier}</div>
                    </div>
                    {selectedNode.model === m.id && <span style={{ fontSize: 9, color: 'var(--green)' }}>✓</span>}
                  </div>
                ))}
              </div>

              {selectedNode.type !== 'human-review' && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Parameters</div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 3 }}>Temperature ({selectedNode.params.temperature})</div>
                    <input type="range" min={0} max={1} step={0.05} value={selectedNode.params.temperature}
                      onChange={e => dispatch({ type: 'SET_PARAM', id: selectedId, key: 'temperature', value: parseFloat(e.target.value) })}
                      style={{ width: '100%' }} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 3 }}>Max Tokens</div>
                    <select value={selectedNode.params.maxTokens}
                      onChange={e => dispatch({ type: 'SET_PARAM', id: selectedId, key: 'maxTokens', value: parseInt(e.target.value) })}
                      style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 6px', color: 'var(--text)', fontSize: 10 }}>
                      {[1024, 2048, 4096, 8192, 16384].map(v => <option key={v} value={v}>{v.toLocaleString()}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 3 }}>System Prompt</div>
                    <textarea value={selectedNode.params.prompt}
                      onChange={e => dispatch({ type: 'SET_PARAM', id: selectedId, key: 'prompt', value: e.target.value })}
                      placeholder="Custom instructions for this agent..."
                      rows={4}
                      style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 6px', color: 'var(--text)', fontSize: 10, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                  </div>
                </div>
              )}

              {selectedNode.type === 'human-review' && (
                <div style={{ fontSize: 10, color: 'var(--orange)', background: '#3a2a0044', border: '1px solid var(--orange)44', borderRadius: 4, padding: '8px 10px', lineHeight: 1.6 }}>
                  Human Reviewer pauses the flow and waits for manual approval before proceeding. No LLM model needed.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
