export default function Header({ role, currentView, onLogout }) {
  return (
    <div style={{
      height: 'var(--hdr-h)', background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0,
    }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--blue)', whiteSpace: 'nowrap' }}>⬡ Assurant LMS</div>
      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
      <div style={{ fontSize: 11, color: 'var(--muted)' }}>HP NonStop → .NET 8 / Azure Migration Platform</div>
      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
      <span className="tag tag-warn" style={{ fontSize: 10 }}>C++ Win32/MFC</span>
      <span className="tag tag-success" style={{ fontSize: 10 }}>HP Tandem COBOL</span>
      <span className="tag tag-blue" style={{ fontSize: 10 }}>Pathway IPC</span>
      <div style={{ flex: 1 }} />
      {currentView && (
        <div style={{ fontSize: 10, color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 10px' }}>
          {currentView}
        </div>
      )}
      <div
        onClick={onLogout}
        style={{ fontSize: 11, color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', transition: '.15s' }}
        onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--text)'; }}
        onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
      >
        Role: {role} ▾
      </div>
    </div>
  );
}
