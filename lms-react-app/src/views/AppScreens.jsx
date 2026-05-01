import { useState } from 'react';
import { LOANS } from '../data/loans';
import { fmt$ } from '../utils/calc';

const winBg = { background: 'linear-gradient(180deg,#1e2a3a 0%,#1c2b40 100%)', border: '1px solid #3a5070', borderRadius: 4, padding: 16, fontFamily: '"Segoe UI", Arial, sans-serif' };
const winTitle = { background: 'linear-gradient(90deg,#2a4a7a,#1a3050)', color: '#c8d8f0', fontSize: 12, fontWeight: 700, padding: '5px 10px', marginBottom: 12, borderBottom: '1px solid #3a5070', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const fieldRow = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 };
const lbl = { color: '#b0c4d8', fontSize: 11, width: 130, textAlign: 'right', flexShrink: 0 };
const inp = { background: '#0d1e2e', border: '1px solid #2a4060', borderRadius: 2, color: '#c8d8f0', padding: '3px 6px', fontSize: 11, flex: 1, fontFamily: 'inherit' };
const inpRO = { ...inp, color: '#5af', background: '#071525', cursor: 'default' };
const winBtn = (col = '#2a5a9a') => ({ background: `linear-gradient(180deg,${col}dd,${col}88)`, color: '#e8f0ff', border: '1px solid #5af6', borderRadius: 3, padding: '4px 14px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' });
const errBox = { fontSize: 10, color: '#f85', background: '#1f0000', border: '1px solid #f854', borderRadius: 3, padding: '4px 8px', marginTop: 6 };
const okBox  = { fontSize: 10, color: '#5f5', background: '#001f00', border: '1px solid #5f54', borderRadius: 3, padding: '4px 8px', marginTop: 6 };

function LoanSearchScreen() {
  const [loanNum, setLoanNum] = useState('');
  const [name, setName] = useState('');
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState(null);

  function onSearch() {
    setMsg(null); setResult(null);
    if (!loanNum.trim() && !name.trim()) { setMsg({ text: 'R-L-001: At least one search criterion required.', err: true }); return; }
    if (loanNum.trim() && (loanNum.length !== 10 || !/^\d{10}$/.test(loanNum.trim()))) { setMsg({ text: 'R-L-002: Loan number must be exactly 10 numeric digits.', err: true }); return; }
    const loan = LOANS.find(l => (loanNum.trim() && l.loanNum === loanNum.trim()) || (name.trim() && l.borrowerName.toLowerCase().includes(name.trim().toLowerCase())));
    if (!loan) { setMsg({ text: 'STATUS-CODE 9002: No matching loan record found in LSS_LOAN_T.', err: true }); return; }
    setResult(loan);
    setMsg({ text: 'LOAN_SEARCH → TKA900: STATUS-CODE 0000', err: false });
  }

  return (
    <div style={{ ...winBg, maxWidth: 520 }}>
      <div style={winTitle}><span>CLoanSearchDlg — Loan Search</span><span style={{ fontSize: 9, color: '#7a9ab8' }}>LoanSearchDlg.cpp</span></div>
      <div style={fieldRow}><span style={lbl}>Loan Number:</span><input value={loanNum} onChange={e => setLoanNum(e.target.value)} style={inp} placeholder="0000100001" maxLength={10} /></div>
      <div style={fieldRow}><span style={lbl}>Borrower Name:</span><input value={name} onChange={e => setName(e.target.value)} style={inp} placeholder="(partial match)" /></div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
        <button onClick={onSearch} style={winBtn('#1a5a3a')}>Search</button>
        <button onClick={() => { setLoanNum(''); setName(''); setResult(null); setMsg(null); }} style={winBtn('#2a3a4a')}>Clear</button>
      </div>
      {msg && <div style={msg.err ? errBox : okBox}>{msg.text}</div>}
      {result && (
        <div style={{ marginTop: 10, background: '#0a1825', border: '1px solid #2a4060', borderRadius: 3, padding: 10 }}>
          <div style={{ fontSize: 9, color: '#7a9ab8', marginBottom: 6 }}>LSS_LOAN_T — TKA900 4000-QUERY-CYCLE-STEP joined</div>
          {[['LOAN_NUM', result.loanNum], ['BORROWER_NAME', result.borrowerName], ['PROPERTY_STATE', result.state], ['COVERAGE_TYPE', result.coverageType], ['PROPERTY_VALUE', fmt$(result.propertyValue)], ['UPB', fmt$(result.upb)], ['FCI_CODE', result.fciCode], ['EDI_FLAG', result.ediFlag], ['LOAN_STATUS', result.loanStatus], ['QUOTE_REQD', result.quoteReqd], ['CYCLE_TYPE', result.cycleType]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 8, fontSize: 10, marginBottom: 2 }}>
              <span style={{ color: '#7a9ab8', width: 110, flexShrink: 0 }}>{k}:</span>
              <span style={{ color: '#c8d8f0', fontFamily: 'monospace' }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddLoanScreen() {
  const [f, setF] = useState({ loanNum: '0000300003', borrowerName: 'Williams, James', state: 'FL', coverageType: 'Hazard', propertyValue: '320000', upb: '295000', propertyAddress: '742 Evergreen Terrace', propertyType: 'RESIDENTIAL', loanStatus: 'ACTIVE', fciCode: 'BK-0099' });
  const [msg, setMsg] = useState(null);
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));

  function onAdd() {
    setMsg(null);
    if (!f.loanNum.trim() || !f.borrowerName.trim()) { setMsg({ text: 'R-L-009 (R-AL-001): Loan number and borrower name are required.', err: true }); return; }
    if (f.loanNum.length !== 10 || !/^\d{10}$/.test(f.loanNum)) { setMsg({ text: 'R-L-009 (R-AL-002): Loan number must be exactly 10 numeric digits.', err: true }); return; }
    if (!f.propertyValue || parseInt(f.propertyValue) <= 0) { setMsg({ text: 'R-L-010 (R-AL-003): Property value must be greater than zero.', err: true }); return; }
    if (!f.propertyAddress.trim()) { setMsg({ text: 'R-L-011 (R-AL-004): Property address is required.', err: true }); return; }
    if (f.loanStatus !== 'ACTIVE') { setMsg({ text: 'R-L-012 (R-AL-005): New loans must have initial status ACTIVE.', err: true }); return; }
    if (!['RESIDENTIAL', 'COMMERCIAL'].includes(f.propertyType)) { setMsg({ text: 'R-L-013 (R-AL-007): Property type must be RESIDENTIAL or COMMERCIAL.', err: true }); return; }
    setMsg({ text: 'ADD_LOAN → TKA901: STATUS-CODE 0000 — TKA901 3000-INSERT-LOAN complete.', err: false });
  }

  const row = (label, key, opts = {}) => (
    <div style={fieldRow} key={key}>
      <span style={lbl}>{label}:</span>
      {opts.sel ? (
        <select value={f[key]} onChange={e => s(key, e.target.value)} style={inp}>{opts.opts.map(o => <option key={o}>{o}</option>)}</select>
      ) : (
        <input value={f[key]} onChange={e => s(key, e.target.value)} style={inp} maxLength={opts.max} />
      )}
    </div>
  );

  return (
    <div style={{ ...winBg, maxWidth: 560 }}>
      <div style={winTitle}><span>CLoanAddDlg — Add New Loan</span><span style={{ fontSize: 9, color: '#7a9ab8' }}>LoanAddDlg.cpp — R-AL-001..007</span></div>
      {row('Loan Number', 'loanNum', { max: 10 })}
      {row('Borrower Name', 'borrowerName')}
      {row('Property Address', 'propertyAddress')}
      {row('Property State', 'state', { max: 2 })}
      {row('Coverage Type', 'coverageType')}
      {row('Property Value', 'propertyValue')}
      {row('Unpaid Prin. Bal.', 'upb')}
      {row('FCI Code', 'fciCode')}
      {row('Property Type', 'propertyType', { sel: true, opts: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'] })}
      {row('Loan Status', 'loanStatus', { sel: true, opts: ['ACTIVE', 'DELINQUENT', 'CLOSED'] })}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
        <button onClick={onAdd} style={winBtn('#1a5a3a')}>Add Loan</button>
        <button onClick={() => setMsg(null)} style={winBtn('#2a3a4a')}>Cancel</button>
      </div>
      {msg && <div style={msg.err ? errBox : okBox}>{msg.text}</div>}
    </div>
  );
}

function ModifyLoanScreen() {
  const [sel, setSel] = useState(LOANS[0]);
  const [status, setStatus] = useState(LOANS[0].loanStatus);
  const [upb, setUpb] = useState(String(LOANS[0].upb));
  const [addr, setAddr] = useState(LOANS[0].propertyAddress);
  const [msg, setMsg] = useState(null);

  function onSelect(l) { setSel(l); setStatus(l.loanStatus); setUpb(String(l.upb)); setAddr(l.propertyAddress); setMsg(null); }

  function onModify() {
    setMsg(null);
    const tr = { ACTIVE: ['DELINQUENT'], DELINQUENT: ['CLOSED'], CLOSED: [] };
    if (status !== sel.loanStatus && !tr[sel.loanStatus].includes(status)) { setMsg({ text: `R-L-014 (R-ML-002): '${sel.loanStatus}' → '${status}' not permitted.`, err: true }); return; }
    if (parseInt(upb) > sel.upb) { setMsg({ text: `R-L-014 (R-ML-003): UPB cannot increase from ${fmt$(sel.upb)}.`, err: true }); return; }
    if (!addr.trim()) { setMsg({ text: 'R-L-014 (R-ML-004): Property address cannot be cleared.', err: true }); return; }
    setMsg({ text: `MODIFY_LOAN → TKA902: STATUS-CODE 0000 — ${sel.borrowerName} updated.`, err: false });
  }

  return (
    <div style={{ ...winBg, maxWidth: 560 }}>
      <div style={winTitle}><span>CLoanModifyDlg — Modify Loan</span><span style={{ fontSize: 9, color: '#7a9ab8' }}>LoanModifyDlg.cpp — R-ML-001..004</span></div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: '#7a9ab8', marginBottom: 4 }}>Select loan:</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {LOANS.map(l => <button key={l.loanNum} onClick={() => onSelect(l)} style={{ ...winBtn(sel.loanNum === l.loanNum ? '#1a4a7a' : '#1a2a3a'), fontSize: 9, padding: '2px 6px' }}>{l.loanNum}</button>)}
        </div>
      </div>
      <div style={fieldRow}><span style={lbl}>Loan Number:</span><input value={sel.loanNum} readOnly style={inpRO} /></div>
      <div style={{ fontSize: 9, color: '#7a9ab8', marginLeft: 138, marginTop: -6, marginBottom: 8 }}>R-ML-001: immutable after creation</div>
      <div style={fieldRow}><span style={lbl}>Borrower Name:</span><input value={sel.borrowerName} readOnly style={inpRO} /></div>
      <div style={fieldRow}><span style={lbl}>Loan Status:</span>
        <select value={status} onChange={e => setStatus(e.target.value)} style={inp}>
          {['ACTIVE', 'DELINQUENT', 'CLOSED'].map(x => <option key={x}>{x}</option>)}
        </select>
      </div>
      <div style={{ fontSize: 9, color: '#7a9ab8', marginLeft: 138, marginTop: -6, marginBottom: 8 }}>R-ML-002: ACTIVE→DELINQUENT or DELINQUENT→CLOSED only</div>
      <div style={fieldRow}><span style={lbl}>UPB:</span><input value={upb} onChange={e => setUpb(e.target.value)} style={inp} /></div>
      <div style={{ fontSize: 9, color: '#7a9ab8', marginLeft: 138, marginTop: -6, marginBottom: 8 }}>R-ML-003: cannot increase from {fmt$(sel.upb)}</div>
      <div style={fieldRow}><span style={lbl}>Property Address:</span><input value={addr} onChange={e => setAddr(e.target.value)} style={inp} /></div>
      <div style={{ fontSize: 9, color: '#7a9ab8', marginLeft: 138, marginTop: -6, marginBottom: 8 }}>R-ML-004: cannot be cleared to blank</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
        <button onClick={onModify} style={winBtn('#1a5a3a')}>Modify Loan</button>
        <button onClick={() => setMsg(null)} style={winBtn('#2a3a4a')}>Cancel</button>
      </div>
      {msg && <div style={msg.err ? errBox : okBox}>{msg.text}</div>}
    </div>
  );
}

export default function AppScreens() {
  const [screen, setScreen] = useState('search');
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[['search', 'CLoanSearchDlg'], ['add', 'CLoanAddDlg'], ['modify', 'CLoanModifyDlg']].map(([id, l]) => (
          <button key={id} onClick={() => setScreen(id)} className={`pill ${screen === id ? 'pill-blue' : ''}`}
            style={{ fontSize: 11, background: screen === id ? '' : 'var(--surface2)', border: '1px solid var(--border)' }}>{l}</button>
        ))}
        <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 8, alignSelf: 'center' }}>VC++ Win32/MFC replica — TrackAllClientManagerLegacy.cpp</span>
      </div>
      {screen === 'search' && <LoanSearchScreen />}
      {screen === 'add' && <AddLoanScreen />}
      {screen === 'modify' && <ModifyLoanScreen />}
    </div>
  );
}
