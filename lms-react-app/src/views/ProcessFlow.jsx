import { useState } from 'react';
import { FLOWS } from '../data/processFlow';

const NODE_COLORS = {
  start:    { bg: '#1f3a5f', stroke: '#58a6ff', text: '#58a6ff' },
  end:      { bg: '#1a2d1a', stroke: '#3fb950', text: '#3fb950' },
  step:     { bg: '#21262d', stroke: '#484f58', text: '#c9d1d9' },
  decision: { bg: '#3a2a00', stroke: '#e3b341', text: '#e3b341' },
  cobol:    { bg: '#1a2d1a', stroke: '#3fb950', text: '#3fb950' },
  db:       { bg: '#2d1f5e', stroke: '#a371f7', text: '#a371f7' },
};

const LANE_W = 220;
const NODE_H = 52;
const NODE_W = 180;
const ROW_H = 100;

export default function ProcessFlow() {
  const [flow, setFlow] = useState('search');
  const f = FLOWS[flow];

  const laneCount = f.lanes.length;
  const svgW = laneCount * LANE_W + 20;
  const maxY = f.nodes.reduce((m, n) => Math.max(m, n.y), 0);
  const svgH = maxY + NODE_H + 40;

  const nodeX = (n) => n.lane * LANE_W + (LANE_W - NODE_W) / 2;
  const nodeMap = {};
  f.nodes.forEach(n => { nodeMap[n.id] = n; });

  function nodeCenter(id) {
    const n = nodeMap[id];
    if (!n) return [0, 0];
    return [nodeX(n) + NODE_W / 2, n.y + NODE_H / 2];
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {Object.entries(FLOWS).map(([key, v]) => (
          <button key={key} onClick={() => setFlow(key)} className={`pill ${flow === key ? 'pill-blue' : ''}`}
            style={{ fontSize: 11, background: flow === key ? '' : 'var(--surface2)', border: '1px solid var(--border)' }}>
            {v.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
        <svg width={svgW} height={svgH} style={{ display: 'block' }}>
          {/* Lane backgrounds */}
          {f.lanes.map((lane, i) => (
            <g key={i}>
              <rect x={i * LANE_W} y={0} width={LANE_W} height={svgH} fill={i % 2 === 0 ? '#0d111722' : '#13181f22'} />
              <line x1={i * LANE_W} y1={0} x2={i * LANE_W} y2={svgH} stroke="#21262d" strokeWidth={1} />
              <text x={i * LANE_W + LANE_W / 2} y={16} textAnchor="middle" fontSize={9} fill="#484f58">{lane}</text>
            </g>
          ))}

          {/* Edges */}
          {f.edges.map(([a, b], i) => {
            const [ax, ay] = nodeCenter(a);
            const [bx, by] = nodeCenter(b);
            const same = nodeMap[a]?.lane === nodeMap[b]?.lane;
            const d = same
              ? `M ${ax} ${ay + NODE_H / 2 - 2} L ${bx} ${by - NODE_H / 2 + 2}`
              : `M ${ax} ${ay} C ${ax} ${(ay + by) / 2}, ${bx} ${(ay + by) / 2}, ${bx} ${by}`;
            return <path key={i} d={d} fill="none" stroke="#484f58" strokeWidth={1.5} markerEnd="url(#arr)" />;
          })}

          {/* Arrow marker */}
          <defs>
            <marker id="arr" markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#484f58" />
            </marker>
          </defs>

          {/* Nodes */}
          {f.nodes.map(n => {
            const colors = NODE_COLORS[n.type] || NODE_COLORS.step;
            const x = nodeX(n);
            const isDiamond = n.type === 'decision';
            const lines = n.label.split('\n');
            return (
              <g key={n.id}>
                {isDiamond ? (
                  <polygon
                    points={`${x + NODE_W / 2},${n.y} ${x + NODE_W},${n.y + NODE_H / 2} ${x + NODE_W / 2},${n.y + NODE_H} ${x},${n.y + NODE_H / 2}`}
                    fill={colors.bg} stroke={colors.stroke} strokeWidth={1.5}
                  />
                ) : (
                  <rect x={x} y={n.y} width={NODE_W} height={NODE_H} rx={4} fill={colors.bg} stroke={colors.stroke} strokeWidth={1.5} />
                )}
                {lines.map((line, j) => (
                  <text key={j} x={x + NODE_W / 2} y={n.y + NODE_H / 2 + (j - (lines.length - 1) / 2) * 13}
                    textAnchor="middle" fontSize={9} fill={colors.text} fontWeight={500}>{line}</text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
