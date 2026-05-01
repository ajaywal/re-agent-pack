import { useState, useRef } from 'react';
import { TCS } from '../data/testCases';

const SIM_RESULTS = {
  'TC-001': { pass: true,  actual: 'Tier=PRIME, Rate=5.50%, Payment=$946.39, Premium=$126.00, Total=$64,343.40, Status=Active. AUDIT_LOG record written.' },
  'TC-002': { pass: true,  actual: 'Tier=SUBPRIME (score 625 ≥ 620 < 680). Rate=8.25%, Premium=$63.00/mo. DS tier NOT applied. ✓' },
  'TC-003': { pass: true,  actual: 'C++ blocked first. QLOTCALC RC=11. LOAN_MASTER NOT written. AUDIT_LOG record written with RC=11. ✓' },
  'TC-004': { pass: true,  actual: 'QLOTCALC §2000 RC=12: "TERM MUST BE 12-360 MONTHS". §4000 not reached. Audit written. ✓' },
  'TC-005': { pass: true,  actual: 'Score 749→STANDARD, 750→PRIME ✓. Score 679→SUBPRIME, 680→STANDARD ✓. Score 619→DS, 620→SUBPRIME ✓. All boundaries correct.' },
  'TC-006': { pass: false, actual: 'FAIL: Borrower name search returned incorrect record for partial name "Kowal". Sequential scan offset by 1. RC=00 but wrong record returned.' },
  'TC-007': { pass: true,  actual: 'LOAN_MASTER REWRITE: borrower_name, loan_type, loan_amount, loan_id — all 4 fields locked. Status updated to Under Review. Audit written. ✓' },
  'TC-008': { pass: true,  actual: 'BR-008: Attempt to modify loan_amount blocked with error message. No KSDS write occurred. ✓' },
  'TC-009': { pass: true,  actual: 'Confirm dialog appeared with all 5 fields (tier, rate, payment, premium, total). Cancel selected → No loan created, no LOAN_MASTER write. ✓' },
  'TC-010': { pass: true,  actual: 'Decimal vs COMP-3 comparison across 1,000 scenarios: max deviation $0.003. All within ±$0.01 tolerance. Zero cases exceeded threshold. ✓' },
};

export default function TestExecution({ onToast }) {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const [runQueue, setRunQueue] = useState([]);
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
    const queue = TCS.map(t => t.id);
    setRunQueue(queue);

    for (const id of queue) {
      if (abortRef.current) break;
      setCurrent(id);
      await delay(600 + Math.random() * 400);
      setResults(prev => ({ ...prev, [id]: SIM_RESULTS[id] || { pass: true, actual: 'PASS — simulation complete.' } }));
    }
    setRunning(false);
    setCurrent(null);
    setRunQueue([]);
    onToast?.(`Test run complete: ${passed + 1}/${total - 1} passed`);
  }

  async function runSingle(id) {
    setCurrent(id);
    await delay(800);
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
                padding: '8px 12px', borderRadius: 6, border: `1px solid ${state === 'pass' ? 'var(--green)44' : state === 'fail' ? 'var(--red)44' : 'var(--border)'}`,
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
