import { useState } from 'react';
import { LOANS, STATUS_TRANSITIONS, PROPERTY_TYPES } from '../data/loans';
import { APPROVED_STATES, LENDER_TARGET_FORMS, calcPremium, validateLoanNum, validateCarrierState, fmt$ } from '../utils/calc';

export default function LoanManagement({ onToast }) {
  const [tab, setTab] = useState('search');
  const [searchNum, setSearchNum] = useState('');
  const [searchName, setSearchName] = useState('');
  const [foundLoan, setFoundLoan] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [quote, setQuote] = useState(null);
  const [ediResult, setEdiResult] = useState(null);
  const [formId, setFormId] = useState('LT-F100');

  const [addLoan, setAddLoan] = useState({
    loanNum: '0000600006', borrowerName: 'Davis, Patricia', state: 'GA',
    coverageType: 'Hazard', propertyValue: 215000, upb: 198000,
    propertyAddress: '55 Peachtree Plaza', propertyCity: 'Atlanta',
    propertyZip: '30301', propertyType: 'RESIDENTIAL', loanStatus: 'ACTIVE',
    fciCode: 'BK-0055', ediFlag: 'Y',
  });
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);

  const [modLoan, setModLoan] = useState(null);
  const [modStatus, setModStatus] = useState('');
  const [modUpb, setModUpb] = useState('');
  const [modAddr, setModAddr] = useState('');
  const [modError, setModError] = useState('');
  const [modSuccess, setModSuccess] = useState(false);

  function doSearch() {
    setSearchError(''); setFoundLoan(null); setQuote(null); setEdiResult(null);
    const num = searchNum.trim();
    const name = searchName.trim();
    if (!num && !name) { setSearchError('R-L-001: At least one search criterion required.'); return; }
    if (num) { const err = validateLoanNum(num); if (err) { setSearchError(err); return; } }
    const loan = LOANS.find(l => (num && l.loanNum === num) || (name && l.borrowerName.toLowerCase().includes(name.toLowerCase())));
    if (!loan) { setSearchError('STATUS-CODE 9002: No matching loan record found in LSS_LOAN_T.'); return; }
    setFoundLoan(loan);
    onToast?.(`LOAN_SEARCH → TKA900: ${loan.borrowerName} returned`);
  }

  function doQuote() {
    if (!foundLoan) return;
    const err = validateCarrierState(foundLoan.state);
    if (err) { setQuote({ error: err }); return; }
    if (foundLoan.quoteReqd === 'N') { setQuote({ suppressed: 'R-L-005: QUOTE_REQD=N — no quote required for this cycle configuration.' }); return; }
    const p = calcPremium(foundLoan.propertyValue, foundLoan.state);
    const kyNote = foundLoan.state === 'KY' ? ' R-L-004: KY ISO pre-call to AIP930 completed.' : '';
    setQuote({ ...p, kyNote });
    onToast?.(`QUOTE_REQUEST → TKARB000: ${fmt$(p.monthlyPremium)}/mo`);
  }

  function do14E() {
    if (!foundLoan) return;
    if (foundLoan.ediFlag !== 'Y') { setEdiResult({ blocked: 'R-L-006: EDI_FLAG is not set to Y — 14E notification skipped.' }); return; }
    if (foundLoan.cycleType === 'INSTANT_ISSUE') { setEdiResult({ suppressed: 'R-L-007: INSTANT_ISSUE cycle — 14E suppressed (not an error).' }); return; }
    if (!LENDER_TARGET_FORMS.includes(formId)) { setEdiResult({ blocked: `R-L-008: Form ID '${formId}' not registered in lender_target.` }); return; }
    const fmt = foundLoan.fciCode.startsWith('BK') ? 'fixed-width v2.3' : 'delimited v4';
    setEdiResult({ sent: true, format: fmt, formId });
    onToast?.(`14E_NOTIFY → TKA920: dispatched (${fmt})`);
  }

  function doAdd() {
    setAddError(''); setAddSuccess(false);
    const { loanNum, borrowerName, propertyValue, propertyAddress, loanStatus, upb, propertyType } = addLoan;
    if (!loanNum?.trim() || !borrowerName?.trim()) { setAddError('R-L-009 (R-AL-001): Loan number and borrower name are required.'); return; }
    if (loanNum.length !== 10 || !/^\d{10}$/.test(loanNum)) { setAddError('R-L-009 (R-AL-002): Loan number must be exactly 10 numeric digits.'); return; }
    if (!propertyValue || propertyValue <= 0) { setAddError('R-L-010 (R-AL-003): Property value must be greater than zero.'); return; }
    if (!propertyAddress?.trim()) { setAddError('R-L-011 (R-AL-004): Property address is required.'); return; }
    if (loanStatus !== 'ACTIVE') { setAddError('R-L-012 (R-AL-005): New loans must have initial status ACTIVE.'); return; }
    if (!upb || upb <= 0) { setAddError('R-L-012 (R-AL-006): Unpaid principal balance must be greater than zero.'); return; }
    if (!PROPERTY_TYPES.includes(propertyType)) { setAddError('R-L-013 (R-AL-007): Property type must be RESIDENTIAL or COMMERCIAL.'); return; }
    setAddSuccess(true);
    onToast?.(`ADD_LOAN → TKA901: ${borrowerName} added`);
  }

  function selectForModify(loan) {
    setModLoan(loan); setModStatus(loan.loanStatus); setModUpb(String(loan.upb));
    setModAddr(loan.propertyAddress); setModError(''); setModSuccess(false);
  }

  function doModify() {
    if (!modLoan) return;
    setModError(''); setModSuccess(false);
    const newUpb = parseInt(modUpb, 10);
    if (modStatus !== modLoan.loanStatus) {
      const allowed = STATUS_TRANSITIONS[modLoan.loanStatus] || [];
      if (!allowed.includes(modStatus)) {
        setModError(`R-L-014 (R-ML-002): '${modLoan.loanStatus}' → '${modStatus}' not permitted. Allowed: ACTIVE→DELINQUENT, DELINQUENT→CLOSED.`); return;
      }
    }
    if (newUpb > modLoan.upb) { setModError(`R-L-014 (R-ML-003): UPB cannot increase. Current: ${fmt$(modLoan.upb)}, Proposed: ${fmt$(newUpb)}.`); return; }
    if (!modAddr.trim()) { setModError('R-L-014 (R-ML-004): Property address cannot be cleared.'); return; }
    setModSuccess(true);
    onToast?.(`MODIFY_LOAN → TKA902: ${modLoan.borrowerName} updated`);
  }

  const tabStyle = t => ({ padding: '6px 14px', fontSize: 11, fontWeight: 600, borderRadius: 5, cursor: 'pointer', border: tab === t ? '1px solid var(--blue)' : '1px solid var(--border)', background: tab === t ? 'var(--blue)22' : 'var(--surface2)', color: tab === t ? 'var(--blue)' : 'var(--muted)' });
  const inp = { background: '#0d1f2d', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', padding: '4px 8px', fontSize: 11, width: '100%' };
  const lbl = { fontSize: 10, color: 'var(--muted)', marginBottom: 3, display: 'block' };
  const errBox = msg => <div style={{ marginTop: 8, fontSize: 10, color: 'var(--red)', background: '#1f000022', borderRadius: 4, padding: '6px 8px', border: '1px solid var(--red)44' }}>{msg}</div>;
  const okBox = msg => <div style={{ marginTop: 8, fontSize: 10, color: 'var(--green)', background: '#0d1f0d', borderRadius: 4, padding: '6px 8px', border: '1px solid var(--green)44' }}>{msg}</div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[['search', 'Loan Search (TKA900)'], ['add', 'Add Loan (TKA901)'], ['modify', 'Modify Loan (TKA902)']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>{l}</button>
        ))}
      </div>

      {/* SEARCH */}
      {tab === 'search' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card">
            <div className="card-title">Loan Search — LOAN_SEARCH → TKA900</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>LOAN_NUM (10 digits) — R-L-001/002</label>
                <input value={searchNum} onChange={e => setSearchNum(e.target.value)} style={inp} placeholder="0000100001" maxLength={10} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>BORROWER_NAME (partial match)</label>
                <input value={searchName} onChange={e => setSearchName(e.target.value)} style={inp} placeholder="Anderson" />
              </div>
            </div>
            <button onClick={doSearch} style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 5, padding: '6px 16px', fontSize: 11, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
              Search — LOAN_SEARCH → TKA900
            </button>
            {searchError && errBox(searchError)}
          </div>

          <div className="card">
            <div className="card-title">Seed Loans — click to populate</div>
            {LOANS.map(l => (
              <div key={l.loanNum} onClick={() => { setSearchNum(l.loanNum); setSearchName(''); setFoundLoan(null); setSearchError(''); setQuote(null); setEdiResult(null); }}
                style={{ display: 'flex', gap: 8, padding: '5px 8px', borderRadius: 4, cursor: 'pointer', marginBottom: 4, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 10, alignItems: 'center' }}>
                <span style={{ fontFamily: 'monospace', color: 'var(--blue)', minWidth: 82 }}>{l.loanNum}</span>
                <span style={{ flex: 1 }}>{l.borrowerName}</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--muted)', fontSize: 9 }}>{l.state}</span>
                <span style={{ color: l.ediFlag === 'Y' ? 'var(--green)' : 'var(--red)', fontFamily: 'monospace', fontSize: 9 }}>EDI:{l.ediFlag}</span>
                {l.cycleType === 'INSTANT_ISSUE' && <span style={{ fontSize: 8, color: 'var(--orange)', padding: '1px 4px', background: 'var(--orange)22', borderRadius: 2 }}>II</span>}
              </div>
            ))}
          </div>

          {foundLoan && (
            <div className="card" style={{ gridColumn: '1/-1' }}>
              <div className="card-title">LSS_LOAN_T Result — TKA900 STATUS-CODE 0000</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 12 }}>
                {[
                  ['LOAN_NUM', foundLoan.loanNum, 'var(--blue)'],
                  ['BORROWER_NAME', foundLoan.borrowerName, 'var(--text)'],
                  ['PROPERTY_STATE', foundLoan.state, APPROVED_STATES.has(foundLoan.state) ? 'var(--green)' : 'var(--red)'],
                  ['COVERAGE_TYPE', foundLoan.coverageType, 'var(--text)'],
                  ['PROPERTY_VALUE', fmt$(foundLoan.propertyValue), 'var(--text)'],
                  ['UPB', fmt$(foundLoan.upb), 'var(--orange)'],
                  ['FCI_CODE', foundLoan.fciCode, 'var(--orange)'],
                  ['EDI_FLAG', foundLoan.ediFlag, foundLoan.ediFlag === 'Y' ? 'var(--green)' : 'var(--red)'],
                  ['LOAN_STATUS', foundLoan.loanStatus, foundLoan.loanStatus === 'ACTIVE' ? 'var(--green)' : 'var(--orange)'],
                  ['PROPERTY_TYPE', foundLoan.propertyType, 'var(--muted)'],
                  ['QUOTE_REQD', foundLoan.quoteReqd, foundLoan.quoteReqd === 'Y' ? 'var(--blue)' : 'var(--muted)'],
                  ['CYCLE_TYPE', foundLoan.cycleType, foundLoan.cycleType === 'INSTANT_ISSUE' ? 'var(--orange)' : 'var(--muted)'],
                ].map(([k, v, c]) => (
                  <div key={k} style={{ background: 'var(--surface2)', borderRadius: 4, padding: '5px 8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 8, color: 'var(--muted)', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 11, fontFamily: 'monospace', color: c, fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={doQuote} style={{ background: 'var(--orange)22', color: 'var(--orange)', border: '1px solid var(--orange)44', borderRadius: 5, padding: '5px 12px', fontSize: 11, cursor: 'pointer' }}>
                  RataBase Quote (R-L-003/004/005)
                </button>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <label style={{ ...lbl, marginBottom: 0, whiteSpace: 'nowrap' }}>Form ID:</label>
                  <select value={formId} onChange={e => setFormId(e.target.value)} style={{ ...inp, width: 'auto' }}>
                    {[...LENDER_TARGET_FORMS, 'LT-F999'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <button onClick={do14E} style={{ background: 'var(--purple)22', color: 'var(--purple)', border: '1px solid var(--purple)44', borderRadius: 5, padding: '5px 12px', fontSize: 11, cursor: 'pointer' }}>
                  14E EDI (R-L-006/007/008)
                </button>
              </div>
              {quote && (
                <div style={{ marginTop: 8, fontSize: 10, borderRadius: 4, padding: '7px 10px', border: `1px solid ${quote.error ? 'var(--red)' : 'var(--orange)'}44`, background: quote.error ? '#1f000022' : '#3a2a0022' }}>
                  {quote.error && <span style={{ color: 'var(--red)' }}>{quote.error}</span>}
                  {quote.suppressed && <span style={{ color: 'var(--muted)' }}>{quote.suppressed}</span>}
                  {quote.annualPremium && <span style={{ color: 'var(--orange)' }}>TKARB000 → Annual {fmt$(quote.annualPremium)} | Monthly {fmt$(quote.monthlyPremium)} | Rate {(quote.rate * 100).toFixed(2)}%{quote.isCoastal ? ' (coastal)' : ''}{quote.kyNote}</span>}
                </div>
              )}
              {ediResult && (
                <div style={{ marginTop: 6, fontSize: 10, borderRadius: 4, padding: '7px 10px', border: `1px solid ${ediResult.sent ? 'var(--green)' : ediResult.suppressed ? 'var(--orange)' : 'var(--red)'}44`, background: ediResult.sent ? '#0d1f0d' : '#1f000022' }}>
                  {ediResult.blocked && <span style={{ color: 'var(--red)' }}>{ediResult.blocked}</span>}
                  {ediResult.suppressed && <span style={{ color: 'var(--orange)' }}>{ediResult.suppressed}</span>}
                  {ediResult.sent && <span style={{ color: 'var(--green)' }}>TKA920 dispatched. Form: {ediResult.formId} | Format: {ediResult.format}</span>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ADD LOAN */}
      {tab === 'add' && (
        <div className="card">
          <div className="card-title">Add Loan — ValidateLoanForAdd() R-AL-001..007 → ADD_LOAN → TKA901 → LSS_LOAN_T INSERT</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              ['LOAN_NUM (10 digits) — R-AL-001/002', 'loanNum'],
              ['BORROWER_NAME — R-AL-001', 'borrowerName'],
              ['PROPERTY_ADDRESS — R-AL-004', 'propertyAddress'],
            ].map(([label, key]) => (
              <div key={key} style={{ marginBottom: 8 }}>
                <label style={lbl}>{label}</label>
                <input value={addLoan[key]} onChange={e => setAddLoan(p => ({ ...p, [key]: e.target.value }))} style={inp} />
              </div>
            ))}
            {[
              ['PROPERTY_VALUE — R-AL-003', 'propertyValue'],
              ['UPB — R-AL-006', 'upb'],
            ].map(([label, key]) => (
              <div key={key} style={{ marginBottom: 8 }}>
                <label style={lbl}>{label}</label>
                <input value={addLoan[key]} onChange={e => setAddLoan(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))} style={inp} />
              </div>
            ))}
            <div style={{ marginBottom: 8 }}>
              <label style={lbl}>LOAN_STATUS — R-AL-005 (must be ACTIVE)</label>
              <select value={addLoan.loanStatus} onChange={e => setAddLoan(p => ({ ...p, loanStatus: e.target.value }))} style={inp}>
                {['ACTIVE', 'DELINQUENT', 'CLOSED'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={lbl}>PROPERTY_TYPE — R-AL-007</label>
              <select value={addLoan.propertyType} onChange={e => setAddLoan(p => ({ ...p, propertyType: e.target.value }))} style={inp}>
                {[...PROPERTY_TYPES, 'INDUSTRIAL'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={lbl}>PROPERTY_STATE (2-char)</label>
              <input value={addLoan.state} onChange={e => setAddLoan(p => ({ ...p, state: e.target.value.toUpperCase() }))} style={inp} maxLength={2} />
            </div>
          </div>
          <button onClick={doAdd} style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 5, padding: '7px 18px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            Add Loan — ADD_LOAN → TKA901
          </button>
          {addError && errBox(addError)}
          {addSuccess && okBox('ADD_LOAN → TKA901: STATUS-CODE 0000 — TKA901 3000-INSERT-LOAN complete. Loan added to LSS_LOAN_T.')}
        </div>
      )}

      {/* MODIFY LOAN */}
      {tab === 'modify' && (
        <div style={{ display: 'grid', gridTemplateColumns: modLoan ? '190px 1fr' : '1fr', gap: 12 }}>
          <div className="card">
            <div className="card-title">Select Loan</div>
            {LOANS.map(l => (
              <div key={l.loanNum} onClick={() => selectForModify(l)}
                style={{ padding: '6px 8px', borderRadius: 4, cursor: 'pointer', marginBottom: 4, background: modLoan?.loanNum === l.loanNum ? 'var(--blue)22' : 'var(--surface2)', border: `1px solid ${modLoan?.loanNum === l.loanNum ? 'var(--blue)' : 'var(--border)'}` }}>
                <div style={{ fontFamily: 'monospace', color: 'var(--blue)', fontWeight: 700, fontSize: 10 }}>{l.loanNum}</div>
                <div style={{ color: 'var(--muted)', fontSize: 9 }}>{l.borrowerName}</div>
                <div style={{ fontSize: 9, color: l.loanStatus === 'ACTIVE' ? 'var(--green)' : 'var(--orange)' }}>{l.loanStatus}</div>
              </div>
            ))}
          </div>

          {modLoan && (
            <div className="card">
              <div className="card-title">Modify Loan — ValidateLoanForModify() R-ML-001..004 → MODIFY_LOAN → TKA902</div>
              <div style={{ marginBottom: 8 }}>
                <label style={lbl}>LOAN_NUM — R-ML-001: immutable after creation</label>
                <input value={modLoan.loanNum} readOnly style={{ ...inp, color: 'var(--blue)', cursor: 'not-allowed', background: '#0a1a2f' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>LOAN_STATUS — R-ML-002 (current: {modLoan.loanStatus})</label>
                  <select value={modStatus} onChange={e => setModStatus(e.target.value)} style={inp}>
                    {['ACTIVE', 'DELINQUENT', 'CLOSED'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>UPB — R-ML-003 (cannot increase from {fmt$(modLoan.upb)})</label>
                  <input value={modUpb} onChange={e => setModUpb(e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>PROPERTY_ADDRESS — R-ML-004 (cannot clear)</label>
                  <input value={modAddr} onChange={e => setModAddr(e.target.value)} style={inp} />
                </div>
              </div>
              <button onClick={doModify} style={{ background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 5, padding: '7px 18px', fontSize: 11, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
                Modify — MODIFY_LOAN → TKA902
              </button>
              {modError && errBox(modError)}
              {modSuccess && okBox('MODIFY_LOAN → TKA902: STATUS-CODE 0000 — TKA902 4000-UPDATE-LOAN complete. LSS_LOAN_T updated.')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
