import { useState } from 'react';
import { TREE, TYPE_COLORS } from '../data/callTree';

function TreeNode({ node, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2);
  const colors = TYPE_COLORS[node.type] || TYPE_COLORS.func;
  const hasChildren = node.children?.length > 0;

  return (
    <div style={{ marginLeft: depth * 20, marginBottom: 3 }}>
      <div
        onClick={() => hasChildren && setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 10px', background: colors.bg, border: `1px solid ${colors.stroke}`, borderRadius: 5, cursor: hasChildren ? 'pointer' : 'default' }}
      >
        <span style={{ fontSize: 10, color: colors.color, minWidth: 10, marginTop: 1 }}>
          {hasChildren ? (open ? '▼' : '▶') : '·'}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: depth < 2 ? 700 : 500, color: colors.color, fontFamily: 'monospace' }}>{node.id}</span>
            <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 2, background: `${colors.stroke}33`, color: colors.color }}>{node.file}</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, lineHeight: 1.4 }}>{node.desc}</div>
        </div>
      </div>
      {open && hasChildren && (
        <div style={{ borderLeft: `1px dashed ${colors.stroke}66`, marginLeft: 14, paddingLeft: 4, marginTop: 3 }}>
          {node.children.map((c, i) => <TreeNode key={i} node={c} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

function containsType(node, type) {
  if (node.type === type) return true;
  return node.children?.some(c => containsType(c, type)) || false;
}

function FilteredTree({ node, filter, depth = 0 }) {
  const show = !filter || filter === 'all' || containsType(node, filter);
  if (!show) return null;
  return (
    <div style={{ marginLeft: depth * 20, marginBottom: 3 }}>
      <TreeNode node={node} depth={depth} />
    </div>
  );
}

export default function CallTree() {
  const [filter, setFilter] = useState('all');
  const types = [
    { id: 'all',     label: 'All',       color: 'var(--text)' },
    { id: 'entry',   label: 'Entry',     color: 'var(--text)' },
    { id: 'func',    label: 'C++ Func',  color: 'var(--orange)' },
    { id: 'cobol',   label: 'COBOL',     color: 'var(--green)' },
    { id: 'pathway', label: 'TME/IPC',   color: 'var(--purple)' },
    { id: 'db',      label: 'SQL/MP DB', color: 'var(--blue)' },
  ];

  const countNodes = (n) => 1 + (n.children?.reduce((s, c) => s + countNodes(c), 0) || 0);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 8, marginBottom: 12 }}>
        {types.slice(1).map(t => (
          <div key={t.id} className="kpi" onClick={() => setFilter(t.id)} style={{ cursor: 'pointer', border: filter === t.id ? `1px solid ${t.color}` : '1px solid var(--border)' }}>
            <div className="kpi-lbl">{t.label}</div>
            <div className="kpi-val" style={{ color: t.color, fontSize: 18 }}>{t.id}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {types.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)} className={`pill ${filter === t.id ? 'pill-blue' : ''}`}
            style={{ fontSize: 10, background: filter === t.id ? '' : 'var(--surface2)', border: '1px solid var(--border)', color: filter === t.id ? '' : t.color }}>
            {t.label}
          </button>
        ))}
        <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 'auto', alignSelf: 'center' }}>{countNodes(TREE)} nodes total</span>
      </div>

      <div className="card" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 260px)' }}>
        <div className="card-title">TrackAll Call Graph — InitInstance → TKA900 / TKA901 / TKA902 / TKA920</div>
        <TreeNode node={TREE} depth={0} />
      </div>
    </div>
  );
}
