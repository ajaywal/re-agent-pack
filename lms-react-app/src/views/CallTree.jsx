import { useState } from 'react';
import { TREE, TYPE_COLORS } from '../data/callTree';

const TYPE_LABELS = {
  entry: 'ENTRY', func: 'FUNC', db: 'KSDS', cobol: 'COBOL', pathway: 'IPC',
};

function TreeNode({ node, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const colors = TYPE_COLORS[node.type] || TYPE_COLORS.func;

  return (
    <div style={{ marginLeft: depth * 20, marginBottom: 4 }}>
      <div
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '6px 10px', borderRadius: 6, cursor: hasChildren ? 'pointer' : 'default',
          background: colors.bg, border: `1px solid ${colors.stroke}`,
          transition: '.12s',
        }}
        onClick={() => hasChildren && setOpen(o => !o)}
      >
        {hasChildren && (
          <span style={{ fontSize: 9, color: colors.text, marginTop: 2, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>▶</span>
        )}
        {!hasChildren && <span style={{ width: 12, flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
              background: colors.badge, color: colors.text, border: `1px solid ${colors.stroke}`,
              fontFamily: 'monospace', flexShrink: 0,
            }}>{TYPE_LABELS[node.type]}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: colors.text, fontFamily: 'monospace' }}>{node.id}</span>
            <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'monospace' }}>{node.file}</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>{node.desc}</div>
        </div>
        {hasChildren && (
          <span style={{ fontSize: 9, color: 'var(--muted)', flexShrink: 0, marginTop: 2 }}>
            {node.children.length} child{node.children.length !== 1 ? 'ren' : ''}
          </span>
        )}
      </div>
      {hasChildren && open && (
        <div style={{ borderLeft: `1px dashed ${colors.stroke}44`, marginLeft: 14, paddingLeft: 4, marginTop: 4 }}>
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CallTree() {
  const [filter, setFilter] = useState('all');

  const typeStats = {};
  function countTypes(node) {
    typeStats[node.type] = (typeStats[node.type] || 0) + 1;
    node.children?.forEach(countTypes);
  }
  countTypes(TREE);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginRight: 4 }}>Filter:</div>
        {['all', 'entry', 'func', 'db', 'cobol', 'pathway'].map(t => {
          const colors = t === 'all' ? { text: 'var(--text)', stroke: 'var(--border)' } : TYPE_COLORS[t];
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                fontSize: 10, padding: '3px 10px', borderRadius: 12, cursor: 'pointer',
                background: filter === t ? colors.badge || 'var(--surface2)' : 'var(--surface2)',
                color: filter === t ? colors.text : 'var(--muted)',
                border: `1px solid ${filter === t ? colors.stroke : 'var(--border)'}`,
              }}
            >
              {t === 'all' ? 'All' : TYPE_LABELS[t]}
              {t !== 'all' && typeStats[t] ? ` (${typeStats[t]})` : ''}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 10, color: 'var(--muted)' }}>Click nodes to expand/collapse</div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        {Object.entries(TYPE_COLORS).map(([type, colors]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: colors.bg, border: `1px solid ${colors.stroke}` }} />
            <span style={{ color: colors.text }}>{TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>

      <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 260px)' }}>
        <FilteredTree node={TREE} filter={filter} depth={0} />
      </div>
    </div>
  );
}

function FilteredTree({ node, filter, depth }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const colors = TYPE_COLORS[node.type] || TYPE_COLORS.func;

  const visible = filter === 'all' || node.type === filter;
  const childrenMatchFilter = filter !== 'all' && hasChildren && containsType(node, filter);

  if (!visible && !childrenMatchFilter) return null;

  return (
    <div style={{ marginLeft: depth * 18, marginBottom: 4 }}>
      {visible && (
        <div
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '6px 10px', borderRadius: 6,
            cursor: hasChildren ? 'pointer' : 'default',
            background: colors.bg, border: `1px solid ${colors.stroke}`,
            opacity: !visible ? 0.3 : 1,
          }}
          onClick={() => hasChildren && setOpen(o => !o)}
        >
          {hasChildren && (
            <span style={{ fontSize: 9, color: colors.text, marginTop: 2, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>▶</span>
          )}
          {!hasChildren && <span style={{ width: 12, flexShrink: 0 }} />}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: colors.badge, color: colors.text, border: `1px solid ${colors.stroke}`, fontFamily: 'monospace' }}>
                {TYPE_LABELS[node.type]}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: colors.text, fontFamily: 'monospace' }}>{node.id}</span>
              <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'monospace' }}>{node.file}</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>{node.desc}</div>
          </div>
        </div>
      )}
      {hasChildren && (open || !visible) && (
        <div style={{ borderLeft: `1px dashed ${colors.stroke}44`, marginLeft: visible ? 14 : 0, paddingLeft: visible ? 4 : 0, marginTop: visible ? 4 : 0 }}>
          {node.children.map(child => (
            <FilteredTree key={child.id} node={child} filter={filter} depth={visible ? depth + 1 : depth} />
          ))}
        </div>
      )}
    </div>
  );
}

function containsType(node, type) {
  if (node.type === type) return true;
  return node.children?.some(c => containsType(c, type)) || false;
}
