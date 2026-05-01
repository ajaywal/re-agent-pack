// Module dependency matrix for TrackAll Loan Servicing System
const MODULES = [
  { id: 'main',     label: 'TrackAllClientManagerLegacy.cpp', type: 'cpp',     fanIn: 0, fanOut: 5, desc: 'MFC WinApp entry. Wires up CLoanRules, CTMELibAdapter, CRataBaseServiceAdapter, CEDINotificationWriter, CLoanSearchDlg.' },
  { id: 'loanrules',label: 'LoanRules.cpp',                   type: 'cpp',     fanIn: 4, fanOut: 0, desc: 'All 14 business rules (R-L-001 to R-L-014). Pure domain logic — no I/O.' },
  { id: 'searchdlg',label: 'LoanSearchDlg.cpp',               type: 'cpp',     fanIn: 1, fanOut: 4, desc: 'Search dialog. Calls ValidateLoanForSearch, SendMessage(LOAN_SEARCH), ProcessLoanResult.' },
  { id: 'adddlg',   label: 'LoanAddDlg.cpp',                  type: 'cpp',     fanIn: 1, fanOut: 2, desc: 'Add Loan dialog. Calls ValidateLoanForAdd, SendMessage(ADD_LOAN).' },
  { id: 'moddlg',   label: 'LoanModifyDlg.cpp',               type: 'cpp',     fanIn: 1, fanOut: 2, desc: 'Modify Loan dialog. Calls ValidateLoanForModify, SendMessage(MODIFY_LOAN).' },
  { id: 'tme',      label: 'TMELibAdapter.cpp',               type: 'tme',     fanIn: 3, fanOut: 3, desc: 'TME mnemonic routing layer. Loads LSS001T at startup. Dispatches to TKA900/901/902/920 via fgatetcp.' },
  { id: 'ratabase', label: 'RataBaseServiceAdapter.cpp',       type: 'ext',     fanIn: 1, fanOut: 2, desc: 'R-L-003/004: Checks carrier eligibility. KY ISO pre-call to AIP930. Dispatches QUOTE_REQUEST to TKARB000.' },
  { id: 'edi',      label: 'EDINotificationWriter.cpp',        type: 'ext',     fanIn: 1, fanOut: 2, desc: 'R-L-006/007/008: Enforces three 14E eligibility gates. Selects BK vs SSP format. Dispatches 14E_NOTIFY.' },
  { id: 'tka900',   label: 'TKA900.cbl (Tandem)',              type: 'cobol',   fanIn: 1, fanOut: 2, desc: 'LOAN_SEARCH server. Queries LSS_LOAN_T and LSS_CYCLE_STEP_T. Returns loan record + cycle flags.' },
  { id: 'tka901',   label: 'TKA901.cbl (Tandem)',              type: 'cobol',   fanIn: 1, fanOut: 1, desc: 'ADD_LOAN server. Validates R-AL-001..007. INSERTs into LSS_LOAN_T.' },
  { id: 'tka902',   label: 'TKA902.cbl (Tandem)',              type: 'cobol',   fanIn: 1, fanOut: 1, desc: 'MODIFY_LOAN server. Fetches current record, validates R-ML-001..004, UPDATEs LSS_LOAN_T.' },
  { id: 'lss_loan', label: 'LSS_LOAN_T',                       type: 'db',      fanIn: 4, fanOut: 0, desc: 'HP NonStop SQL/MP. Primary loan table. PK: LOAN_NUM CHAR(10). 16 fields. R/C/U by TKA900/901/902/920.' },
  { id: 'lss_cycle',label: 'LSS_CYCLE_STEP_T',                 type: 'db',      fanIn: 1, fanOut: 0, desc: 'HP NonStop SQL/MP. Client cycle config. Provides QUOTE_REQD and CYCLE_TYPE to TKA900.' },
  { id: 'lss001t',  label: 'LSS001T',                          type: 'db',      fanIn: 1, fanOut: 0, desc: 'TME routing table. Maps 7 mnemonics to Tandem programs. Loaded at startup by CTMELibAdapter.' },
];

const DEPS = [
  ['main',     'loanrules'], ['main', 'tme'], ['main', 'ratabase'], ['main', 'edi'], ['main', 'searchdlg'],
  ['searchdlg','loanrules'], ['searchdlg', 'tme'], ['searchdlg', 'ratabase'], ['searchdlg', 'edi'],
  ['adddlg',   'loanrules'], ['adddlg',    'tme'],
  ['moddlg',   'loanrules'], ['moddlg',    'tme'],
  ['tme',      'tka900'],    ['tme',    'tka901'],  ['tme',    'tka902'],
  ['ratabase', 'tme'],       ['ratabase', 'loanrules'],
  ['edi',      'tme'],       ['edi',      'loanrules'],
  ['tka900',   'lss_loan'],  ['tka900',   'lss_cycle'],
  ['tka901',   'lss_loan'],
  ['tka902',   'lss_loan'],
  ['tme',      'lss001t'],
];

const TYPE_COLOR = {
  cpp:   { color: 'var(--orange)', bg: '#3a2a00', stroke: '#e3b341' },
  tme:   { color: 'var(--purple)', bg: '#2d1f5e', stroke: '#a371f7' },
  ext:   { color: 'var(--blue)',   bg: '#1f3a5f', stroke: '#58a6ff' },
  cobol: { color: 'var(--green)',  bg: '#1a2d1a', stroke: '#3fb950' },
  db:    { color: 'var(--muted)',  bg: '#21262d', stroke: '#484f58' },
};

function hasDep(a, b) { return DEPS.some(([x, y]) => x === a && y === b); }

export default function Dependency() {
  const [sel, setSel] = useState(null);
  const highlight = sel ? new Set([...DEPS.filter(([a]) => a === sel).map(([,b]) => b), ...DEPS.filter(([,b]) => b === sel).map(([a]) => a)]) : null;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 8, marginBottom: 12 }}>
        {Object.entries(TYPE_COLOR).map(([type, col]) => {
          const count = MODULES.filter(m => m.type === type).length;
          return (
            <div key={type} className="kpi">
              <div className="kpi-lbl">{type.toUpperCase()}</div>
              <div className="kpi-val" style={{ color: col.color, fontSize: 20 }}>{count}</div>
            </div>
          );
        })}
        <div className="kpi"><div className="kpi-lbl">Dependencies</div><div className="kpi-val" style={{ fontSize: 20 }}>{DEPS.length}</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 12 }}>
        <div className="card" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
          <div className="card-title">Modules</div>
          {MODULES.map(m => {
            const col = TYPE_COLOR[m.type] || TYPE_COLOR.cpp;
            const isHi = !sel || sel === m.id || highlight?.has(m.id);
            return (
              <div key={m.id} onClick={() => setSel(sel === m.id ? null : m.id)}
                style={{ padding: '6px 8px', borderRadius: 4, marginBottom: 4, cursor: 'pointer', background: sel === m.id ? col.bg : 'var(--surface2)', border: `1px solid ${sel === m.id ? col.stroke : 'var(--border)'}`, opacity: isHi ? 1 : 0.3 }}>
                <div style={{ fontSize: 10, color: col.color, fontFamily: 'monospace', fontWeight: 600 }}>{m.label}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 9, color: 'var(--muted)' }}>fan-in: {m.fanIn}</span>
                  <span style={{ fontSize: 9, color: 'var(--muted)' }}>fan-out: {m.fanOut}</span>
                </div>
                <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>{m.desc}</div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ overflowX: 'auto' }}>
          <div className="card-title">Dependency Matrix — {sel ? `highlighting ${sel}` : 'click a module to highlight'}</div>
          <table style={{ borderCollapse: 'collapse', fontSize: 9 }}>
            <thead>
              <tr>
                <th style={{ padding: '4px 8px', color: 'var(--muted)', fontWeight: 400, borderBottom: '1px solid var(--border)', minWidth: 140 }}>From \ To</th>
                {MODULES.map(m => (
                  <th key={m.id} style={{ padding: '4px 4px', minWidth: 28, textAlign: 'center', color: TYPE_COLOR[m.type]?.color || 'var(--muted)', fontWeight: 400 }}>
                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 8, height: 80 }}>{m.label.split('(')[0].trim()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map(from => (
                <tr key={from.id} style={{ borderBottom: '1px solid var(--border)22' }}>
                  <td style={{ padding: '3px 8px', color: TYPE_COLOR[from.type]?.color || 'var(--muted)', fontFamily: 'monospace', fontSize: 9, fontWeight: 600 }}>{from.label.split('(')[0].trim()}</td>
                  {MODULES.map(to => {
                    const has = hasDep(from.id, to.id);
                    const hi = sel && (sel === from.id || sel === to.id);
                    return (
                      <td key={to.id} style={{ textAlign: 'center', padding: '3px 2px', background: has ? (hi ? '#2d1f5e' : '#21262d') : 'transparent', border: '1px solid #21262d' }}>
                        {has && <span style={{ color: hi ? 'var(--purple)' : 'var(--muted)', fontSize: 12 }}>●</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
