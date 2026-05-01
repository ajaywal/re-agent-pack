import { useState, useRef } from 'react';
import { TCS } from '../data/testCases';

const SIM_RESULTS = {
  'TC-001': { pass: true,  actual: 'TKA900 STATUS-CODE 0000. Loan 0000100001 returned: Anderson/Robert, KY, STANDARD, EDI_FLAG=Y, QUOTE_REQD=Y. All 16 fields populated. ✓' },
  'TC-002': { pass: true,  actual: 'R-L-001 enforced at CLoanRules::ValidateLoanForSearch() before fgatetcp dispatch. Error: "At least one search criterion required." TKA900 not called. ✓' },
  'TC-003': { pass: true,  actual: 'R-L-002: "123456789" (9 digits) rejected. ValidateLoanForSearch() returns FALSE. TME LOAN_SEARCH not dispatched. ✓' },
  'TC-004': { pass: true,  actual: 'R-L-003: WV not in 23 approved carrier states. RataBaseServiceAdapter::CheckCarrierEligibility() returns false. QUOTE_REQUEST not dispatched. ✓' },
  'TC-005': { pass: true,  actual: 'R-L-004: KY state detected. KY_ISO_QUERY → AIP930 STATUS-CODE 0000. Then QUOTE_REQUEST → TKARB000. Correct sequence verified. ✓' },
  'TC-006': { pass: true,  actual: 'R-L-005: QUOTE_REQD=Y on LSS_CYCLE_STEP_T. TKARB000 quote dispatched. FL coastal rate 0.62% applied: $150,000 × 0.0062 = $930.00/yr, $77.50/mo. ✓' },
  'TC-007': { pass: true,  actual: 'R-L-006: EDI_FLAG=N on loan 0000400004 (Thompson/TX). CEDINotificationWriter::CheckEdiFlag() blocks 14E dispatch. TKA920 not called. ✓' },
  'TC-008': { pass: true,  actual: 'R-L-007: CYCLE_TYPE=INSTANT_ISSUE on loan 0000300003 (Williams/FL). CEDINotificationWriter::CheckCycleType() suppresses 14E. No TKA920 call regardless of EDI_FLAG. ✓' },
  'TC-009': { pass: false, actual: 'FAIL: R-L-008 form validation defect. LT-F999 (invalid form ID) bypassed .NET validation and reached TKA920. Expected rejection; TKA920 returned STATUS-CODE 9301 (invalid form). Rule must be enforced at API layer before EDI dispatch.' },
  'TC-010': { pass: true,  actual: 'R-AL-001: Duplicate loan 0000100001 rejected at TKA901 with STATUS-CODE 9101. LSS_LOAN_T INSERT not executed. ✓' },
  'TC-011': { pass: true,  actual: 'R-AL-002..007 all pass. TKA901 STATUS-CODE 0000. New loan inserted into LSS_LOAN_T with STATUS=ACTIVE default. ✓' },
  'TC-012': { pass: true,  actual: 'R-ML-001: Attempt to modify LOAN_NUM blocked at ValidateLoanForModify(). Field rendered read-only in CLoanModifyDlg. TKA902 not called. ✓' },
  'TC-013': { pass: true,  actual: 'R-ML-002: ACTIVE→DELINQUENT transition accepted. TKA902 STATUS-CODE 0000. LSS_LOAN_T.STATUS updated to DELINQUENT. ✓' },
  'TC-014': { pass: true,  actual: 'R-ML-002: DELINQUENT→ACTIVE blocked. TKA902 STATUS-CODE 9202: "Invalid status transition". LSS_LOAN_T record unchanged. ✓' },
  'TC-015': { pass: true,  actual: 'R-ML-003: UPB increase from $150,000 to $160,000 blocked. TKA902 STATUS-CODE 9203: "UPB cannot increase". No LOAN_MASTER write. ✓' },
  'TC-016': { pass: true,  actual: 'R-ML-004: Attempt to blank PROPERTY_ADDR blocked. TKA902 STATUS-CODE 9204: "Address cannot be cleared". Existing address preserved. ✓' },
};

export default function TestExecution({ onToast }) {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState(null);
  const abortRef = useRef(false);

  const passed = Object.values(results).filter(r => r?.pass).length;
  const failed = Object.values(results).filter(r => r !== null && !r?.pass).length;
  const total = TCS.length;
  const ran = Object.keys(results).length;
  const progress = ran / total * 100;

  async function runAll() {
    abortRef.current = false;
    setResults({});
    setRunning(true);

    for (const tc of TCS) {
      if (abortRef.current) break;
      setCurrent(tc.id);
      await delay(500 + Math.random() * 400);
      setResults(prev => ({ ...prev, [tc.id]: SIM_RESULTS[tc.id] || { pass: true, actual: 'PASS — simulation complete.' } }));
    }
    setRunning(false);
    setCurrent(null);
    const finalPassed = TCS.filter(t => (SIM_RESULTS[t.id] || { pass: true }).pass).length;
    onToast?.(`Test run complete: ${finalPassed}/${total} passed`);
  }

  async function runSingle(id) {
    setCurrent(id);
    await delay(700);
    setResults(prev => ({ ...prev, [id]: SIM_RESULTS[id] || { pass: true, actual: 'PASS' } }));
    setCurrent(null);
  }

  function reset() {
    abortRef.current = true;
    setResults({});
    setRunning(false);
    setCurrent(null);
  }

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              {[
                ['Ran', ran, 'var(--text)'],
                ['Passed', passed, 'var(--green)'],
                ['Failed', failed, 'var(--red)'],
                ['Remaining', total - ran, 'var(--muted)'],
              ].map(([lbl, val, color]) => (
                <div key={lbl} style={{ textAlign: 'center', minWidth: 60 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)' }}>{lbl}</div>
                </div>
              ))}
            </div>
            <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: failed > 0 ? 'var(--red)' : 'var(--green)', borderRadius: 3, transition: 'width .3s' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={runAll}
              disabled={running}
              style={{ background: running ? 'var(--surface2)' : 'var(--green)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: running ? 'default' : 'pointer', opacity: running ? 0.6 : 1 }}
            >
              {running ? `Running ${current || '...'}` : '▶ Run All Tests'}
            </button>
            <button onClick={reset} style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>
              Reset
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {TCS.map(tc => {
          const result = results[tc.id];
          const isRunning = current === tc.id;
          const state = isRunning ? 'running' : result === undefined ? 'idle' : result.pass ? 'pass' : 'fail';

          return (
            <div
              key={tc.id}
              style={{
                padding: '8px 12px', borderRadius: 6,
                border: `1px solid ${state === 'pass' ? 'var(--green)44' : state === 'fail' ? 'var(--red)44' : 'var(--border)'}`,
                background: state === 'pass' ? '#0d1f0d' : state === 'fail' ? '#1f0000' : state === 'running' ? '#1f3a5f22' : 'var(--surface)',
                transition: 'all .2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, textAlign: 'center', fontSize: 12 }}>
                  {state === 'running' && <span style={{ color: 'var(--blue)' }}>⟳</span>}
                  {state === 'pass' && <span style={{ color: 'var(--green)' }}>✓</span>}
                  {state === 'fail' && <span style={{ color: 'var(--red)' }}>✗</span>}
                  {state === 'idle' && <span style={{ color: 'var(--muted)' }}>○</span>}
                </div>
                <span className="mono" style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 11, minWidth: 50 }}>{tc.id}</span>
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#21262d', color: 'var(--muted)' }}>{tc.cat}</span>
                <span style={{ fontSize: 11, flex: 1 }}>{tc.name}</span>
                {state === 'idle' && !running && (
                  <button
                    onClick={() => runSingle(tc.id)}
                    style={{ fontSize: 9, padding: '2px 8px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', color: 'var(--muted)' }}
                  >
                    Run
                  </button>
                )}
              </div>
              {result && (
                <div style={{ marginTop: 6, marginLeft: 24, fontSize: 10, color: result.pass ? 'var(--green)' : 'var(--red)', lineHeight: 1.5 }}>
                  {result.actual}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
