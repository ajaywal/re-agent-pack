import { useState } from 'react';

const ROLES = [
  { id: 'PM',  icon: '📋', name: 'Project Manager',  desc: 'Full platform access — all 16 views', color: 'var(--blue)' },
  { id: 'BA',  icon: '📑', name: 'Business Analyst', desc: 'Requirements, flows, rules, screens', color: 'var(--green)' },
  { id: 'DBA', icon: '🗄',  name: 'Database Architect', desc: 'CRUD, DB connections, schemas', color: 'var(--orange)' },
  { id: 'DEV', icon: '💻', name: 'Developer',         desc: 'Code, call tree, test cases, decomp', color: 'var(--purple)' },
];

export default function Login({ onLogin }) {
  const [selected, setSelected] = useState('PM');

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '40px 48px', width: 420, textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--blue)', marginBottom: 4, letterSpacing: -1 }}>⬡ Assurant LMS</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 28 }}>
          Loan Management System — Modernization Analysis Platform<br />
          HP NonStop C++ / COBOL → .NET 8 / Azure
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'left', marginBottom: 6 }}>Select your role to begin:</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {ROLES.map(r => (
            <div
              key={r.id}
              onClick={() => setSelected(r.id)}
              style={{
                background: selected === r.id ? '#1f3a5f66' : 'var(--surface2)',
                border: `2px solid ${selected === r.id ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius: 8,
                padding: '14px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: '.15s',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, color: r.color }}>{r.icon} {r.name}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{r.desc}</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => onLogin(selected)}
          style={{ width: '100%', padding: 12, background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: '.15s' }}
          onMouseOver={e => e.target.style.background = '#79b8ff'}
          onMouseOut={e => e.target.style.background = 'var(--blue)'}
        >
          Enter Platform →
        </button>
      </div>
    </div>
  );
}
