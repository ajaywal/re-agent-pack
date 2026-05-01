import { useState } from 'react';
import { FLOWS } from '../data/processFlow';

const NODE_COLORS = {
  start:    { bg: '#1f3a5f', stroke: '#58a6ff', text: '#58a6ff' },
  end:      { bg: '#1a2d1a', stroke: '#3fb950', text: '#3fb950' },
  step:     { bg: '#21262d', stroke: '#484f58', text: '#c9d1d9' },
  decision: { bg: '#3a2a00', stroke: '#e3b341', text: '#e3b341' },
  cobol:    { bg: '#1a2d1a', stroke: '#3fb950', text: '#3fb950' },
  db:       { bg: '#3a2a00', stroke: '#e3b341', text: '#e3b341' },
};

const LANE_COLORS = [
  '#58a6ff18', '#a371f718', '#3fb95018', '#e3b34118',
];

const LANE_W = 200;
const NODE_W = 160;
const NODE_H = 52;
const ROW_H = 90;

export default function ProcessFlow() {
  const [active, setActive] = useState('create');
  const flow = FLOWS[active];

  const laneCount = flow.lanes.length;
  const svgW = laneCount * LANE_W + 40;

  // Position nodes: lane determines x, sequential index within lane determines y
  const laneCounters = {};
  const positioned = flow.nodes.map(n => {
    const idx = laneCounters[n.lane] || 0;
    laneCounters[n.lane] = idx + 1;
    const cx = n.lane * LANE_W + LANE_W / 2;
    const cy = 80 + idx * ROW_H;
    return { ...n, cx, cy };
  });

  const nodeMap = Object.fromEntries(positioned.map(n => [n.id, n]));
  const maxY = Math.max(...positioned.map(n => n.cy)) + 80;

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {Object.entries(FLOWS).map(([key, f]) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`pill ${active === key ? 'pill-blue' : ''}`}
            style={{ fontSize: 11, background: active === key ? '' : 'var(--surface2)', border: '1px solid var(--border)' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <div className="card-title">{flow.label} — HP NonStop Process Architecture</div>
        <svg width={svgW} height={maxY} style={{ display: 'block' }}>
          {/* Lane backgrounds */}
          {flow.lanes.map((lane, i) => (
            <g key={lane}>
              <rect
                x={i * LANE_W} y={0}
                width={LANE_W} height={maxY}
                fill={LANE_COLORS[i % LANE_COLORS.length]}
                stroke="#30363d" strokeWidth={1}
              />
              <text
                x={i * LANE_W + LANE_W / 2} y={22}
                textAnchor="middle" fill="#8b949e"
                fontSize={10} fontWeight={700}
                style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}
              >{lane}</text>
              <line x1={i * LANE_W} y1={36} x2={i * LANE_W + LANE_W} y2={36} stroke="#30363d" strokeWidth={1} />
            </g>
          ))}

          {/* Edges */}
          {flow.edges.map(([fromId, toId], i) => {
            const from = nodeMap[fromId];
            const to = nodeMap[toId];
            if (!from || !to) return null;
            const sameLane = from.lane === to.lane;
            if (sameLane) {
              return (
                <line key={i}
                  x1={from.cx} y1={from.cy + NODE_H / 2}
                  x2={to.cx} y2={to.cy - NODE_H / 2}
                  stroke="#484f58" strokeWidth={1.5} markerEnd="url(#arrow)"
                />
              );
            }
            const midY = (from.cy + to.cy) / 2;
            const d = `M ${from.cx} ${from.cy + NODE_H / 2} L ${from.cx} ${midY} L ${to.cx} ${midY} L ${to.cx} ${to.cy - NODE_H / 2}`;
            return <path key={i} d={d} stroke="#484f58" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />;
          })}

          {/* Arrow marker */}
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#484f58" />
            </marker>
          </defs>

          {/* Nodes */}
          {positioned.map(n => {
            const colors = NODE_COLORS[n.type] || NODE_COLORS.step;
            const x = n.cx - NODE_W / 2;
            const y = n.cy - NODE_H / 2;
            const lines = n.label.split('\n');
            const isDecision = n.type === 'decision';

            if (isDecision) {
              const hw = NODE_W / 2;
              const hh = NODE_H / 2;
              const pts = `${n.cx},${n.cy - hh} ${n.cx + hw},${n.cy} ${n.cx},${n.cy + hh} ${n.cx - hw},${n.cy}`;
              return (
                <g key={n.id}>
                  <polygon points={pts} fill={colors.bg} stroke={colors.stroke} strokeWidth={1.5} />
                  {lines.map((line, li) => (
                    <text key={li} x={n.cx} y={n.cy + (li - (lines.length - 1) / 2) * 13}
                      textAnchor="middle" fill={colors.text} fontSize={9} fontWeight={600}>
                      {line}
                    </text>
                  ))}
                </g>
              );
            }

            const isRound = n.type === 'start' || n.type === 'end';
            return (
              <g key={n.id}>
                <rect x={x} y={y} width={NODE_W} height={NODE_H}
                  rx={isRound ? 26 : 6} ry={isRound ? 26 : 6}
                  fill={colors.bg} stroke={colors.stroke} strokeWidth={1.5}
                />
                {lines.map((line, li) => (
                  <text key={li} x={n.cx} y={n.cy + (li - (lines.length - 1) / 2) * 13}
                    textAnchor="middle" fill={colors.text} fontSize={9} fontWeight={600}>
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
