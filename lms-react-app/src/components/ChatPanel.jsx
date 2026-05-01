import { useState, useRef, useEffect } from 'react';

const TOPICS = ['General', 'Code', 'Migration', 'Data', 'Rules'];

const OFFLINE_RESPONSES = {
  general: 'I can explain any part of the Assurant LMS — the C++ Win32/MFC UI, QLOTCALC COBOL algorithm, HP Pathway IPC migration strategy, or the .NET 8 architecture. What would you like to know?',
  code: 'The core rate calculation is in qlotcalc.cbl §6000. Monthly payment = P×[r(1+r)^n]/[(1+r)^n-1] using COMP-3 packed decimal arithmetic. In C# you must use decimal (never double) and MidpointRounding.AwayFromZero.',
  migration: 'Key migration risks: (1) COMP-3 vs IEEE 754 precision — use C# decimal. (2) Pathway IPC → Azure Service Bus or gRPC. (3) KSDS sequential scan → Azure SQL with LIKE index. (4) Audit log → Azure Table Storage append-only.',
  data: 'LOAN_MASTER KSDS (15 fields) → Azure SQL dbo.LoanMaster. RATE_TABLE → dbo.RateTable with effective_date versioning. AUDIT_LOG → Azure Table Storage (PartitionKey=date, RowKey=timestamp+sessionId). No UPDATE/DELETE on audit.',
  rules: 'BR-001: Score tiers (≥750=PRIME, 680-749=STD, 620-679=SUB, <620=DS). BR-006: Amortization must use decimal loop — no Math.Pow(). BR-007: Explicit confirm dialog required. BR-008: 4 immutable fields after origination. BR-009: Every QLOTCALC call writes one audit record.',
};

export default function ChatPanel({ onNavigate }) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Ready. Ask me about the C++ Win32/MFC screens, QLOTCALC COBOL algorithm, Pathway IPC migration strategy, KSDS-to-Azure-SQL data migration, or .NET 8 architecture.' },
  ]);
  const [input, setInput] = useState('');
  const [topic, setTopic] = useState('general');
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('lms_api_key') || '');
  const [showApiPanel, setShowApiPanel] = useState(false);
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  function saveApiKey() {
    sessionStorage.setItem('lms_api_key', apiKey.trim());
    setShowApiPanel(false);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setTyping(true);

    if (apiKey.length > 10) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 512,
            system: 'You are the Assurant LMS Modernization Assistant. You know the HP NonStop C++/COBOL codebase (lnmain.cpp, qlotcalc.cbl) and the .NET 8/Azure migration target. Be concise and technical.',
            messages: [{ role: 'user', content: text }],
          }),
        });
        const data = await res.json();
        const reply = data.content?.[0]?.text || 'No response.';
        setTyping(false);
        setMessages(prev => [...prev, { role: 'bot', text: reply }]);
        return;
      } catch {
        // fall through to offline
      }
    }

    setTimeout(() => {
      setTyping(false);
      const lower = text.toLowerCase();
      let reply = OFFLINE_RESPONSES[topic];
      if (lower.includes('br-007') || lower.includes('confirm')) reply = OFFLINE_RESPONSES.rules;
      else if (lower.includes('qlotcalc') || lower.includes('cobol') || lower.includes('§')) reply = OFFLINE_RESPONSES.code;
      else if (lower.includes('azure') || lower.includes('migration') || lower.includes('.net')) reply = OFFLINE_RESPONSES.migration;
      else if (lower.includes('audit') || lower.includes('ksds') || lower.includes('table')) reply = OFFLINE_RESPONSES.data;
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    }, 600);
  }

  const suggestions = {
    general: ['What does QLOTCALC do?', 'Explain the 4-layer architecture', 'What is Pathway IPC?'],
    code:    ['Show BR-006 amortization', 'What is COMP-3?', 'Explain §9000 audit'],
    migration: ['Biggest migration risks?', 'Replace Pathway with Azure', 'KSDS to Azure SQL'],
    data:    ['LOAN_MASTER schema?', 'Audit log migration', 'RATE_TABLE structure'],
    rules:   ['Explain BR-001 tiers', 'What is BR-008?', 'BR-009 compliance'],
  };

  return (
    <div style={{
      width: 'var(--chat-w)', background: 'var(--surface)', borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>🤖 Modernization Assistant</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>Assurant LMS — C++ / COBOL / .NET expertise</div>
          </div>
          <button
            onClick={() => setShowApiPanel(p => !p)}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 8px', fontSize: 10, cursor: 'pointer', color: 'var(--muted)' }}
          >⚙ API Key</button>
        </div>
      </div>

      {/* API Key panel */}
      {showApiPanel && (
        <div style={{ padding: '10px 12px', background: '#0d1117', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Anthropic API Key</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 5, padding: '5px 8px', fontSize: 11, fontFamily: 'monospace' }}
            />
            <button onClick={saveApiKey} style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Save</button>
          </div>
          <div style={{ fontSize: 9, color: '#484f58', lineHeight: 1.5 }}>Stored in sessionStorage only. Without a key, offline fallback responses are used.</div>
        </div>
      )}

      {/* Topic pills */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', padding: '8px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {TOPICS.map(t => (
          <span
            key={t}
            onClick={() => setTopic(t.toLowerCase())}
            style={{
              fontSize: 10, padding: '3px 8px', borderRadius: 12, cursor: 'pointer',
              background: topic === t.toLowerCase() ? '#1f3a5f' : 'var(--surface2)',
              color: topic === t.toLowerCase() ? 'var(--blue)' : 'var(--muted)',
              border: `1px solid ${topic === t.toLowerCase() ? 'var(--blue)' : 'var(--border)'}`,
              transition: '.15s',
            }}
          >{t}</span>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            padding: '8px 10px', borderRadius: 7, fontSize: 11, lineHeight: 1.6,
            background: m.role === 'user' ? '#1f3a5f33' : 'var(--surface2)',
            border: `1px solid ${m.role === 'user' ? '#1f3a5f' : 'var(--border)'}`,
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '100%',
          }}>
            {m.role === 'bot' && <strong style={{ display: 'block', fontSize: 9, fontWeight: 700, color: 'var(--blue)', marginBottom: 4, textTransform: 'uppercase' }}>Assurant Modernization Assistant</strong>}
            <span style={{ whiteSpace: 'pre-wrap' }}>{m.text}</span>
          </div>
        ))}
        {typing && (
          <div style={{ padding: '8px 10px', borderRadius: 7, background: 'var(--surface2)', border: '1px solid var(--border)', alignSelf: 'flex-start', fontSize: 11 }}>
            <span style={{ color: 'var(--muted)' }}>● ● ●</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      <div style={{ padding: '6px 12px', display: 'flex', gap: 5, flexWrap: 'wrap', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        {(suggestions[topic] || []).map(s => (
          <span
            key={s}
            onClick={() => { setInput(s); }}
            style={{ fontSize: 10, padding: '3px 8px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap', transition: '.15s' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = ''; }}
          >{s}</span>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: 6 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Ask about QLOTCALC, migration, C++..."
          rows={1}
          style={{
            flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)',
            borderRadius: 6, padding: '6px 10px', fontSize: 11, resize: 'none', fontFamily: 'inherit',
            height: 36, outline: 'none',
          }}
        />
        <button
          onClick={sendMessage}
          style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '0 10px', cursor: 'pointer', fontSize: 14 }}
        >↑</button>
      </div>
    </div>
  );
}
