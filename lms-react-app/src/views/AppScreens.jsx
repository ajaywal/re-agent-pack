import { useState } from 'react';
import { LOANS, LOAN_TYPES } from '../data/loans';
import { calcQuote, fmt$ } from '../utils/calc';

const SCREENS = [
  { id: 'menu', label: 'Main Menu' },
  { id: 'search', label: 'Search Loan' },
  { id: 'create', label: 'Create Loan' },
  { id: 'update', label: 'Update Loan' },
];

function WinGroup({ title, children, style }) {
  return (
    <div className="win-group" style={style}>
      <div className="win-group-title">{title}</div>
      {children}
    </div>
  );
}

function WinField({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: '#c9d1d9', minWidth: 120 }}>{label}:</span>
      <span style={{
        flex: 1, background: '#0d1117', border: '1px solid #444c56',
        padding: '2px 6px', fontSize: 11, fontFamily: mono ? 'monospace' : 'inherit',
        color: '#e6edf3', borderRadius: 2, minWidth: 160,
      }}>{value || ' '}</span>
    </div>
  );
}

function MainMenuScreen({ onSelect }) {
  return (
    <div className="win-root">
      <div className="win-titlebar">
        <span>Assurant LMS — HP NonStop Win32/MFC Application</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {['─', '□', '×'].map(c => <button key={c} className="win-ctrl">{c}</button>)}
        </div>
      </div>
      <div className="win-content">
        <WinGroup title="Loan Management System — Main Menu">
          <div style={{ textAlign: 'center', padding: '8px 0 12px', fontSize: 12, color: '#8b949e' }}>
            Select an operation to continue
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 20px' }}>
            {[
              ['F1', 'search', 'Search / Retrieve Loan'],
              ['F2', 'create', 'Create New Loan'],
              ['F3', 'update', 'Update Existing Loan'],
            ].map(([key, screen, label]) => (
              <button key={key} className="win-btn" onClick={() => onSelect(screen)}
                style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 12px', fontSize: 12 }}>
                <span style={{ color: 'var(--yellow, #e3b341)', fontWeight: 700, minWidth: 28 }}>{key}</span>
                <span>{label}</span>
              </button>
            ))}
            <div style={{ borderTop: '1px solid #30363d', marginTop: 4, paddingTop: 8 }}>
              <button className="win-btn" style={{ padding: '5px 12px', fontSize: 11, color: '#8b949e' }}>
                ESC — Exit Application
              </button>
            </div>
          </div>
        </WinGroup>
        <div style={{ textAlign: 'center', fontSize: 9, color: '#484f58', marginTop: 8 }}>
          HP NonStop Tandem | Pathway IPC Connected | lnmain.cpp build 2.14.1
        </div>
      </div>
    </div>
  );
}

function SearchScreen({ onSelect }) {
  const [loanId, setLoanId] = useState('');
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);

  function doSearch() {
    const found = LOANS.find(l => l.id.toLowerCase().includes(loanId.toLowerCase()));
    setResult(found || null);
    setSearched(true);
  }

  return (
    <div className="win-root">
      <div className="win-titlebar">
        <span>Search Loan — lnmain.cpp: search_loan_screen()</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {['─', '□', '×'].map(c => <button key={c} className="win-ctrl">{c}</button>)}
        </div>
      </div>
      <div className="win-content">
        <WinGroup title="Search Criteria">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: '#c9d1d9', minWidth: 120 }}>Loan ID:</span>
            <input
              value={loanId}
              onChange={e => setLoanId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="LN-2024-001"
              style={{
                flex: 1, background: '#0d1117', border: '1px solid #58a6ff',
                color: '#e6edf3', padding: '3px 8px', fontSize: 11, fontFamily: 'monospace',
                borderRadius: 2, outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button className="win-btn win-btn-primary" onClick={doSearch}>F5 — Search</button>
            <button className="win-btn" onClick={() => { setLoanId(''); setResult(null); setSearched(false); }}>F3 — Clear</button>
          </div>
        </WinGroup>

        {searched && (
          <WinGroup title={result ? 'Search Result — LOAN_MASTER KSDS Read' : 'No Record Found'} style={{ marginTop: 8 }}>
            {result ? (
              <>
                <WinField label="Loan ID" value={result.id} mono />
                <WinField label="Borrower" value={result.borrower} />
                <WinField label="Policy #" value={result.policy} mono />
                <WinField label="Amount" value={fmt$(result.amount)} mono />
                <WinField label="Status" value={result.status} />
                <WinField label="Credit Score" value={result.creditScore} mono />
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button className="win-btn win-btn-primary" onClick={() => onSelect('update')}>F4 — Update</button>
                  <button className="win-btn">F6 — Print</button>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 11, color: 'var(--red)', padding: 6 }}>
                RC=04 — Record not found in LOAN_MASTER. Verify Loan ID and retry.
              </div>
            )}
          </WinGroup>
        )}
      </div>
    </div>
  );
}

function CreateScreen({ onToast }) {
  const [form, setForm] = useState({
    borrower: '', policy: '', type: LOAN_TYPES[0], amount: '', term: '', score: '',
  });
  const [quote, setQuote] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  function calcAndConfirm() {
    if (!form.amount || !form.term || !form.score) return;
    const q = calcQuote(Number(form.amount), Number(form.term), form.type, Number(form.score));
    setQuote(q);
  }

  function confirmCreate() {
    setConfirmed(true);
    onToast?.('Loan created — LOAN_MASTER KSDS write + audit record (BR-009)');
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="win-root">
      <div className="win-titlebar">
        <span>Create Loan — lnmain.cpp: create_loan_screen()</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {['─', '□', '×'].map(c => <button key={c} className="win-ctrl">{c}</button>)}
        </div>
      </div>
      <div className="win-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <WinGroup title="Borrower Information">
            {[['Borrower Name', 'borrower', 'text'], ['Policy Number', 'policy', 'text']].map(([lbl, key, type]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: '#c9d1d9', minWidth: 120 }}>{lbl}:</span>
                <input value={form[key]} onChange={e => f(key, e.target.value)} type={type}
                  style={{ flex: 1, background: '#0d1117', border: '1px solid #58a6ff', color: '#e6edf3', padding: '3px 8px', fontSize: 11, borderRadius: 2, outline: 'none' }} />
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: '#c9d1d9', minWidth: 120 }}>Loan Type:</span>
              <select value={form.type} onChange={e => f('type', e.target.value)}
                style={{ flex: 1, background: '#0d1117', border: '1px solid #58a6ff', color: '#e6edf3', padding: '3px 6px', fontSize: 11, borderRadius: 2 }}>
                {LOAN_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </WinGroup>

          <WinGroup title="Loan Parameters" style={{ marginTop: 8 }}>
            {[['Amount ($)', 'amount', 'number'], ['Term (months)', 'term', 'number'], ['Credit Score', 'score', 'number']].map(([lbl, key, type]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: '#c9d1d9', minWidth: 120 }}>{lbl}:</span>
                <input value={form[key]} onChange={e => f(key, e.target.value)} type={type}
                  style={{ flex: 1, background: '#0d1117', border: '1px solid #58a6ff', color: '#e6edf3', padding: '3px 8px', fontSize: 11, fontFamily: 'monospace', borderRadius: 2, outline: 'none' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button className="win-btn win-btn-primary" onClick={calcAndConfirm}>F8 — QLOTCALC Quote</button>
            </div>
          </WinGroup>
        </div>

        <div>
          {quote ? (
            <WinGroup title="CConfirmDialog — Quote Summary (BR-007)">
              <WinField label="Credit Tier" value={quote.tier} mono />
              <WinField label="Interest Rate" value={`${quote.rate}%`} mono />
              <WinField label="Monthly Payment" value={fmt$(quote.payment)} mono />
              <WinField label="Ins. Premium" value={fmt$(quote.premium) + '/mo'} mono />
              <WinField label="Total Cost" value={fmt$(quote.totalCost)} mono />
              <div style={{ margin: '10px 0 6px', padding: 8, background: '#161b22', border: '1px solid #e3b341', borderRadius: 4, fontSize: 10, color: '#e3b341' }}>
                ⚠ Explicit confirmation required (BR-007). Review all terms before proceeding.
              </div>
              {!confirmed ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="win-btn win-btn-primary" onClick={confirmCreate}>F10 — Confirm &amp; Create</button>
                  <button className="win-btn" onClick={() => setQuote(null)}>ESC — Cancel</button>
                </div>
              ) : (
                <div style={{ padding: 8, background: '#0d1117', border: '1px solid var(--green)', borderRadius: 4, fontSize: 11, color: 'var(--green)' }}>
                  ✓ Loan created. LOAN_MASTER KSDS write complete. Audit record written.
                </div>
              )}
            </WinGroup>
          ) : (
            <WinGroup title="Quote Panel">
              <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: '#484f58' }}>
                Complete loan parameters and press F8 to run QLOTCALC simulation via Pathway IPC.
              </div>
            </WinGroup>
          )}
        </div>
      </div>
    </div>
  );
}

function UpdateScreen() {
  const [loanId, setLoanId] = useState('');
  const [loan, setLoan] = useState(null);
  const [officer, setOfficer] = useState('');
  const [status, setStatus] = useState('');
  const [saved, setSaved] = useState(false);

  function load() {
    const found = LOANS.find(l => l.id === loanId.trim());
    if (found) {
      setLoan(found);
      setOfficer(found.officer);
      setStatus(found.status);
      setSaved(false);
    }
  }

  return (
    <div className="win-root">
      <div className="win-titlebar">
        <span>Update Loan — lnmain.cpp: update_loan_screen()</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {['─', '□', '×'].map(c => <button key={c} className="win-ctrl">{c}</button>)}
        </div>
      </div>
      <div className="win-content">
        <WinGroup title="Load Record">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#c9d1d9', minWidth: 80 }}>Loan ID:</span>
            <input value={loanId} onChange={e => setLoanId(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
              placeholder="LN-2024-001" style={{ flex: 1, background: '#0d1117', border: '1px solid #58a6ff', color: '#e6edf3', padding: '3px 8px', fontSize: 11, fontFamily: 'monospace', borderRadius: 2, outline: 'none' }} />
            <button className="win-btn win-btn-primary" onClick={load}>F5 — Load</button>
          </div>
        </WinGroup>

        {loan && (
          <WinGroup title="Editable Fields (BR-008: 4 fields locked after origination)" style={{ marginTop: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
              {[
                ['Loan ID', loan.id, true],
                ['Borrower', loan.borrower, true],
                ['Amount', fmt$(loan.amount), true],
                ['Rate', `${loan.rate}%`, true],
              ].map(([k, v]) => (
                <div key={k} style={{ opacity: 0.55 }}>
                  <WinField label={`🔒 ${k}`} value={v} mono />
                </div>
              ))}
            </div>
            <div style={{ fontSize: 9, color: 'var(--orange)', marginBottom: 10 }}>
              ↑ BR-008: Loan ID, Borrower, Amount, Rate are immutable after origination
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: '#c9d1d9', minWidth: 120 }}>Loan Officer:</span>
              <input value={officer} onChange={e => setOfficer(e.target.value)}
                style={{ flex: 1, background: '#0d1117', border: '1px solid #58a6ff', color: '#e6edf3', padding: '3px 8px', fontSize: 11, borderRadius: 2, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: '#c9d1d9', minWidth: 120 }}>Status:</span>
              <select value={status} onChange={e => setStatus(e.target.value)}
                style={{ flex: 1, background: '#0d1117', border: '1px solid #58a6ff', color: '#e6edf3', padding: '3px 6px', fontSize: 11, borderRadius: 2 }}>
                {['Active', 'Under Review', 'Delinquent', 'Closed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {!saved ? (
              <button className="win-btn win-btn-primary" onClick={() => setSaved(true)}>F10 — Save Changes</button>
            ) : (
              <div style={{ padding: 8, background: '#0d1117', border: '1px solid var(--green)', borderRadius: 4, fontSize: 11, color: 'var(--green)' }}>
                ✓ LOAN_MASTER updated. Audit record written (BR-009).
              </div>
            )}
          </WinGroup>
        )}
      </div>
    </div>
  );
}

export default function AppScreens({ onToast }) {
  const [active, setActive] = useState('menu');

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {SCREENS.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`pill ${active === s.id ? 'pill-blue' : ''}`}
            style={{ fontSize: 11, background: active === s.id ? '' : 'var(--surface2)', border: '1px solid var(--border)' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {active === 'menu' && <MainMenuScreen onSelect={setActive} />}
      {active === 'search' && <SearchScreen onSelect={setActive} />}
      {active === 'create' && <CreateScreen onToast={onToast} />}
      {active === 'update' && <UpdateScreen />}
    </div>
  );
}
