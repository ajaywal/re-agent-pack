import { CapgeminiMark } from './CapgeminiLogo';

export default function Header({ role, currentView, onLogout }) {
  return (
    <div style={{
      height: 'var(--hdr-h)',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 12, flexShrink: 0,
    }}>

      {/* ── Capgemini Infinity brand ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
        <CapgeminiMark size={28} />
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: '#0070AD', textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Capgemini
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Infinity
          </div>
        </div>
      </div>

      <div style={{ width: 1, height: 24, background: 'var(--border)', flexShrink: 0 }} />

      <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
        Agentic RE Platform
      </div>

      <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

      <span className="tag tag-warn"    style={{ fontSize: 10 }}>C++ Win32/MFC</span>
      <span className="tag tag-success" style={{ fontSize: 10 }}>HP Tandem COBOL</span>
      <span className="tag tag-blue"    style={{ fontSize: 10 }}>Pathway IPC</span>

      <div style={{ flex: 1 }} />

      {currentView && (
        <div style={{ fontSize: 10, color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 10px', whiteSpace: 'nowrap' }}>
          {currentView}
        </div>
      )}

      <div
        onClick={onLogout}
        style={{ fontSize: 11, color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', whiteSpace: 'nowrap', transition: '.15s' }}
        onMouseOver={e => { e.currentTarget.style.borderColor = '#0070AD'; e.currentTarget.style.color = 'var(--text)'; }}
        onMouseOut={e  => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
      >
        Role: {role} ▾
      </div>
    </div>
  );
}
