import { useState } from 'react';
import { CapgeminiMark } from './CapgeminiLogo';

const ROLES = [
  { id: 'PM',  icon: '📋', name: 'Project Manager',    desc: 'Full platform access — all views', color: 'var(--blue)' },
  { id: 'BA',  icon: '📑', name: 'Business Analyst',   desc: 'Requirements, flows, rules, screens', color: 'var(--green)' },
  { id: 'DBA', icon: '🗄',  name: 'Database Architect', desc: 'CRUD, DB connections, schemas', color: 'var(--orange)' },
  { id: 'DEV', icon: '💻', name: 'Developer',           desc: 'Code, call tree, test cases, decomp', color: 'var(--purple)' },
];

export default function Login({ onLogin }) {
  const [selected, setSelected] = useState('PM');

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #050d18 0%, #0d1117 55%, #08172b 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      {/* Background accent blobs */}
      <div style={{ position: 'absolute', top: '15%', left: '10%', width: 340, height: 340, borderRadius: '50%', background: '#0070AD0d', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '8%',  width: 280, height: 280, borderRadius: '50%', background: '#0070AD08', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '44px 52px',
        width: 440,
        textAlign: 'center',
        boxShadow: '0 24px 64px #00000088',
        position: 'relative',
      }}>

        {/* ── Capgemini branding ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 6 }}>
          <CapgeminiMark size={52} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#0070AD', textTransform: 'uppercase', letterSpacing: 2, lineHeight: 1 }}>
              Capgemini
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#e6edf3', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              Infinity
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 32, marginTop: 10 }}>
          Agentic Reverse Engineering Platform<br />
          <span style={{ fontSize: 10, color: '#484f58' }}>HP NonStop C++ / COBOL → .NET 8 / Azure</span>
        </div>

        {/* Role selector */}
        <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'left', marginBottom: 8 }}>Select your role to begin:</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 26 }}>
          {ROLES.map(r => (
            <div
              key={r.id}
              onClick={() => setSelected(r.id)}
              style={{
                background: selected === r.id ? '#0070AD18' : 'var(--surface2)',
                border: `2px solid ${selected === r.id ? '#0070AD' : 'var(--border)'}`,
                borderRadius: 8,
                padding: '14px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color .15s, background .15s',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, color: r.color }}>{r.icon} {r.name}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{r.desc}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => onLogin(selected)}
          style={{
            width: '100%', padding: '12px 0',
            background: '#0070AD', color: '#fff',
            border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            transition: 'background .15s',
            letterSpacing: '0.2px',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#0085cc'}
          onMouseOut={e  => e.currentTarget.style.background = '#0070AD'}
        >
          Enter Platform →
        </button>

        {/* Footer */}
        <div style={{ marginTop: 20, fontSize: 9, color: '#30363d' }}>
          © 2026 Capgemini SE · All rights reserved
        </div>
      </div>
    </div>
  );
}
