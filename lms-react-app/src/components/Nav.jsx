import { useState } from 'react';
import { NAV_STRUCTURE, ROLE_VIEWS } from '../data/views';

export default function Nav({ role, currentView, onNavigate }) {
  const allowed = ROLE_VIEWS[role] || [];
  const [openGroups, setOpenGroups] = useState(() => {
    const init = new Set();
    NAV_STRUCTURE.forEach(g => {
      if (g.type === 'group' && g.items?.some(it => it.id === currentView)) {
        init.add(g.label);
      }
    });
    if (init.size === 0) init.add('Reverse Engineering');
    return init;
  });

  function toggleGroup(label) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  return (
    <div style={{
      width: 'var(--nav-w)', background: 'var(--surface)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', padding: '10px 0 16px', overflowY: 'auto', flexShrink: 0,
    }}>
      {NAV_STRUCTURE.map((entry, i) => {
        if (entry.type === 'sep') {
          return <div key={i} style={{ height: 1, background: 'var(--border)', margin: '6px 12px' }} />;
        }

        if (entry.type === 'standalone') {
          if (!allowed.includes(entry.id)) return null;
          const isActive = currentView === entry.id;
          return (
            <div
              key={entry.id}
              onClick={() => onNavigate(entry.id)}
              style={{
                padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                borderLeft: `2px solid ${isActive ? 'var(--blue)' : 'transparent'}`,
                background: isActive ? '#1f3a5f55' : 'transparent',
                color: isActive ? 'var(--blue)' : 'var(--muted)',
                fontSize: 11, transition: '.12s',
              }}
              onMouseOver={e => !isActive && (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseOut={e => !isActive && (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: 14 }}>{entry.icon}</span>
              <span style={{ fontWeight: 600 }}>{entry.label}</span>
            </div>
          );
        }

        if (entry.type === 'group') {
          const visible = (entry.items || []).filter(it => allowed.includes(it.id));
          if (!visible.length) return null;
          const isOpen = openGroups.has(entry.label);
          return (
            <div key={entry.label} style={{ marginBottom: 2 }}>
              <div
                onClick={() => toggleGroup(entry.label)}
                style={{
                  padding: '5px 10px 5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                  borderLeft: `2px solid ${entry.color}44`, userSelect: 'none', transition: '.12s',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 13, color: entry.color }}>{entry.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: entry.color, flex: 1 }}>{entry.label}</span>
                <span style={{ fontSize: 9, color: 'var(--muted)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>▶</span>
              </div>
              <div className={`nav-sub-list${isOpen ? ' open' : ''}`}>
                {visible.map(it => {
                  const isActive = currentView === it.id;
                  return (
                    <div
                      key={it.id + entry.label}
                      onClick={() => onNavigate(it.id)}
                      style={{
                        padding: '5px 12px 5px 30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                        fontSize: 11, color: isActive ? 'var(--blue)' : 'var(--muted)',
                        borderLeft: `2px solid ${isActive ? 'var(--blue)' : 'transparent'}`,
                        background: isActive ? '#1f3a5f55' : 'transparent',
                        transition: '.1s',
                      }}
                      onMouseOver={e => !isActive && (e.currentTarget.style.background = 'var(--surface2)')}
                      onMouseOut={e => !isActive && (e.currentTarget.style.background = isActive ? '#1f3a5f55' : 'transparent')}
                    >
                      <span style={{ fontSize: 12 }}>{it.icon}</span>
                      <span style={{ flex: 1 }}>{it.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
