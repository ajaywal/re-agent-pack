import { useState, useRef, useEffect } from 'react';
const TOPICS = ['General', 'Code', 'Migration', 'Data', 'Rules'];
const OFFLINE = {
  general: 'I can explain any part of the Assurant LMS — the C++ Win32/MFC UI, QLOTCALC COBOL algorithm, HP Pathway IPC migration strategy, or the .NET 8 architecture.',
  code: 'The core rate calculation is in qlotcalc.cbl §6000. Monthly payment = P×[r(1+r)^n]/[(1+r)^n-1] using COMP-3 packed decimal. In C# use decimal and MidpointRounding.AwayFromZero.',
  migration: 'Key risks: (1) COMP-3 vs IEEE 754 — use C# decimal. (2) Pathway IPC → Azure Service Bus or gRPC. (3) KSDS scan → Azure SQL LIKE index. (4) Audit log → Azure Table Storage append-only.',
  data: 'LOAN_MASTER KSDS (15 fields) → Azure SQL dbo.LoanMaster. AUDIT_LOG → Azure Table Storage (PartitionKey=date, RowKey=timestamp+sessionId). No UPDATE/DELETE on audit.',
  rules: 'BR-001: Score tiers (≥750=PRIME, 680-749=STD, 620-679=SUB, <620=DS). BR-006: Decimal loop, no Math.Pow(). BR-007: Explicit confirm dialog. BR-008: 4 immutable fields. BR-009: Every QLOTCALC call writes audit.',
};
const SUGGESTIONS = {
  general: ['What does QLOTCALC do?', 'Explain the 4-layer architecture', 'What is Pathway IPC?'],
  code: ['Show BR-006 amortization', 'What is COMP-3?', 'Explain §9000 audit'],
  migration: ['Biggest migration risks?', 'Replace Pathway with Azure', 'KSDS to Azure SQL'],
  data: ['LOAN_MASTER schema?', 'Audit log migration', 'RATE_TABLE structure'],
  rules: ['Explain BR-001 tiers', 'What is BR-008?', 'BR-009 compliance'],
};
export default function ChatPanel() {
  const [messages, setMessages] = useState([{ role: 'bot', text: 'Ready. Ask me about the C++ Win32/MFC screens, QLOTCALC COBOL algorithm, Pathway IPC migration, or .NET 8 architecture.' }]);
  const [input, setInput] = useState('');
  const [topic, setTopic] = useState('general');
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('lms_api_key') || '');
  const [showApi, setShowApi] = useState(false);
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);
  async function send() {
    const text = input.trim(); if (!text) return;
    setInput(''); setMessages(p => [...p, { role: 'user', text }]); setTyping(true);
    if (apiKey.length > 10) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 512, system: 'You are the Assurant LMS Modernization Assistant. Be concise and technical.', messages: [{ role: 'user', content: text }] }) });
        const data = await res.json(); setTyping(false); setMessages(p => [...p, { role: 'bot', text: data.content?.[0]?.text || 'No response.' }]); return;
      } catch {}
    }
    setTimeout(() => {
      setTyping(false);
      const lower = text.toLowerCase();
      let reply = OFFLINE[topic];
      if (lower.includes('cobol') || lower.includes('qlotcalc')) reply = OFFLINE.code;
      else if (lower.includes('azure') || lower.includes('migration')) reply = OFFLINE.migration;
      else if (lower.includes('ksds') || lower.includes('audit')) reply = OFFLINE.data;
      else if (lower.includes('br-')) reply = OFFLINE.rules;
      setMessages(p => [...p, { role: 'bot', text: reply }]);
    }, 600);
  }
  return (
    <div style={{ width: 'var(--chat-w)', background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div><div style={{ fontSize: 12, fontWeight: 700 }}>🤖 Modernization Assistant</div><div style={{ fontSize: 10, color: 'var(--muted)' }}>Assurant LMS — C++ / COBOL / .NET</div></div>
          <button onClick={() => setShowApi(p => !p)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 8px', fontSize: 10, cursor: 'pointer', color: 'var(--muted)' }}>⚙ API Key</button>
        </div>
      </div>
      {showApi && <div style={{ padding: '10px 12px', background: '#0d1117', borderBottom: '1px solid var(--border)', flexShrink: 0 }}><div style={{ display: 'flex', gap: 6 }}><input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-..." style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 5, padding: '5px 8px', fontSize: 11, fontFamily: 'monospace' }} /><button onClick={() => { sessionStorage.setItem('lms_api_key', apiKey.trim()); setShowApi(false); }} style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Save</button></div></div>}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', padding: '8px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {TOPICS.map(t => <span key={t} onClick={() => setTopic(t.toLowerCase())} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 12, cursor: 'pointer', background: topic === t.toLowerCase() ? '#1f3a5f' : 'var(--surface2)', color: topic === t.toLowerCase() ? 'var(--blue)' : 'var(--muted)', border: `1px solid ${topic === t.toLowerCase() ? 'var(--blue)' : 'var(--border)'}` }}>{t}</span>)}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((m, i) => <div key={i} style={{ padding: '8px 10px', borderRadius: 7, fontSize: 11, lineHeight: 1.6, background: m.role === 'user' ? '#1f3a5f33' : 'var(--surface2)', border: `1px solid ${m.role === 'user' ? '#1f3a5f' : 'var(--border)'}`, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>{m.role === 'bot' && <strong style={{ display: 'block', fontSize: 9, color: 'var(--blue)', marginBottom: 4, textTransform: 'uppercase' }}>Assistant</strong>}<span style={{ whiteSpace: 'pre-wrap' }}>{m.text}</span></div>)}
        {typing && <div style={{ padding: '8px 10px', borderRadius: 7, background: 'var(--surface2)', border: '1px solid var(--border)', alignSelf: 'flex-start', fontSize: 11 }}><span style={{ color: 'var(--muted)' }}>● ● ●</span></div>}
        <div ref={endRef} />
      </div>
      <div style={{ padding: '6px 12px', display: 'flex', gap: 5, flexWrap: 'wrap', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        {(SUGGESTIONS[topic] || []).map(s => <span key={s} onClick={() => setInput(s)} style={{ fontSize: 10, padding: '3px 8px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}>{s}</span>)}
      </div>
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: 6 }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask about QLOTCALC, migration, C++..." rows={1} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 10px', fontSize: 11, resize: 'none', fontFamily: 'inherit', height: 36, outline: 'none' }} />
        <button onClick={send} style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '0 10px', cursor: 'pointer', fontSize: 14 }}>↑</button>
      </div>
    </div>
  );
}
