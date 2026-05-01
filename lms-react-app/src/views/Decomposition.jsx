const DECOMP = {
  label: 'Assurant LMS System', type: 'system',
  children: [
    {
      label: 'C++ Win32/MFC Frontend', type: 'cpp', file: 'lnmain.cpp (~900 lines)',
      children: [
        { label: 'CLoanApp (main)', type: 'func', file: 'WinMain(), ShowMainMenu()' },
        { label: 'CCreateLoanDlg', type: 'func', file: 'create_loan_screen() — lines 280–380' },
        { label: 'CSearchDlg', type: 'func', file: 'search_loan_screen()' },
        { label: 'CUpdateDlg', type: 'func', file: 'update_loan_screen() — BR-008 enforcement' },
        { label: 'CConfirmDialog', type: 'func', file: 'BR-007: explicit confirmation required' },
        { label: 'validate_loan_input_cpp()', type: 'func', file: 'validation.cpp — mirrors §2000' },
        {
          label: 'db_connector.cpp', type: 'db', file: 'KSDS / Pathway access layer',
          children: [
            { label: 'execute_loan_search()', type: 'func', file: 'ID/policy/name access modes' },
            { label: 'generate_loan_id()', type: 'func', file: 'LOAN_SEQ atomic increment' },
            { label: 'insert_loan_record()', type: 'func', file: 'LOAN_MASTER KSDS write' },
            { label: 'update_loan_record()', type: 'func', file: 'LOAN_MASTER KSDS rewrite' },
          ],
        },
      ],
    },
    {
      label: 'HP Pathway IPC Layer', type: 'pathway', file: 'tandem_pathway.h',
      children: [
        { label: 'PATHWAY_WRITEREAD(SEARCH)', type: 'pathway', file: '30s timeout — search/retrieve' },
        { label: 'PATHWAY_WRITEREAD(QUOTE)', type: 'pathway', file: '5s timeout — QLOTCALC invocation' },
        { label: 'PATHWAY_WRITEREAD(INSERT)', type: 'pathway', file: 'LOAN_MASTER write with lock' },
        { label: 'PATHWAY_WRITEREAD(UPDATE)', type: 'pathway', file: 'LOAN_MASTER rewrite with lock' },
      ],
    },
    {
      label: 'HP Tandem COBOL Backend', type: 'cobol', file: 'qlotcalc.cbl (~550 lines)',
      children: [
        { label: '§1000-MAIN', type: 'cobol', file: 'Orchestrates §2000-§9000 sequence' },
        { label: '§2000-VALIDATE-INPUT', type: 'cobol', file: 'RC=11/12/13 on bounds failure' },
        { label: '§3000-DETERMINE-CREDIT-TIER', type: 'cobol', file: 'BR-001: EVALUATE score → PR/ST/SP/DS' },
        { label: '§4000-FETCH-BASE-RATE', type: 'cobol', file: 'RATE_TABLE KSDS read (composite key)' },
        { label: '§5000-APPLY-STATE-ADJUSTMENT', type: 'cobol', file: 'STATE_SURCHARGE KSDS read' },
        { label: '§6000-CALCULATE-MONTHLY-PAYMENT', type: 'cobol', file: 'BR-006: amortization decimal loop' },
        { label: '§7000-CALCULATE-INSURANCE-PREMIUM', type: 'cobol', file: 'BR-002: type base × tier multiplier' },
        { label: '§8000-CALCULATE-TOTALS', type: 'cobol', file: 'COMP-3 total cost accumulation' },
        { label: '§9000-WRITE-AUDIT-LOG', type: 'cobol', file: 'BR-009: always writes, even on failure' },
      ],
    },
    {
      label: 'KSDS File System (5 files)', type: 'db', file: 'HP NonStop NSK',
      children: [
        { label: 'LOAN_MASTER', type: 'db', file: '$DATA.LOANDB — 15 fields, R/W/U' },
        { label: 'RATE_TABLE', type: 'db', file: '$DATA.RATEDB — 20 records (5×4), R only' },
        { label: 'STATE_SURCHARGE', type: 'db', file: '$DATA.RATEDB — up to 50 states, R only' },
        { label: 'AUDIT_LOG', type: 'db', file: '$LOG.QLOTAUDT — append only, BR-009' },
        { label: 'LOAN_SEQ', type: 'db', file: '$DATA.LOANDB — atomic ID generator' },
      ],
    },
    {
      label: '.NET 8 / Azure Migration Target', type: 'dotnet', file: 'Target architecture',
      children: [
        { label: 'ASP.NET 8 API / Blazor', type: 'dotnet', file: 'Replaces Win32/MFC UI' },
        { label: 'QuoteService (C# decimal)', type: 'dotnet', file: 'Replaces QLOTCALC COBOL' },
        { label: 'Azure Service Bus / gRPC', type: 'dotnet', file: 'Replaces Pathway IPC' },
        { label: 'Azure SQL (4 tables)', type: 'dotnet', file: 'Replaces LOAN_MASTER, RATE_TABLE, STATE_SURCHARGE, LOAN_SEQ' },
        { label: 'Azure Table Storage', type: 'dotnet', file: 'Replaces AUDIT_LOG (append-only)' },
      ],
    },
  ],
};

const TYPE_COLORS = {
  system:  { color: 'var(--text)',    bg: '#21262d', stroke: '#484f58' },
  cpp:     { color: 'var(--orange)',  bg: '#3a2a00', stroke: '#e3b341' },
  cobol:   { color: 'var(--green)',   bg: '#1a2d1a', stroke: '#3fb950' },
  pathway: { color: 'var(--purple)',  bg: '#2d1f5e', stroke: '#a371f7' },
  db:      { color: 'var(--orange)',  bg: '#3a2a00', stroke: '#e3b34188' },
  func:    { color: 'var(--muted)',   bg: '#161b22', stroke: '#30363d' },
  dotnet:  { color: 'var(--blue)',    bg: '#1f3a5f', stroke: '#58a6ff' },
};

function DecompNode({ node, depth = 0 }) {
  const colors = TYPE_COLORS[node.type] || TYPE_COLORS.func;
  const hasChildren = node.children?.length > 0;

  return (
    <div style={{ marginLeft: depth * 22, marginBottom: 4 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px',
        background: colors.bg, border: `1px solid ${colors.stroke}`,
        borderRadius: 5,
      }}>
        {hasChildren && <span style={{ fontSize: 10, color: colors.color }}>▼</span>}
        {!hasChildren && <span style={{ width: 14 }} />}
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 11, fontWeight: depth < 2 ? 700 : 400, color: colors.color }}>{node.label}</span>
          {node.file && <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'monospace', marginLeft: 8 }}>{node.file}</span>}
        </div>
      </div>
      {hasChildren && (
        <div style={{ borderLeft: `1px dashed ${colors.stroke}66`, marginLeft: 14, paddingLeft: 4, marginTop: 4 }}>
          {node.children.map(c => <DecompNode key={c.label} node={c} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

export default function Decomposition() {
  const flatCount = n => 1 + (n.children?.reduce((s, c) => s + flatCount(c), 0) || 0);
  const total = flatCount(DECOMP);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 8, marginBottom: 12 }}>
        {[
          ['Total Nodes', total, 'var(--text)'],
          ['C++ Modules', DECOMP.children[0].children.length, 'var(--orange)'],
          ['COBOL Sections', DECOMP.children[2].children.length, 'var(--green)'],
          ['KSDS Files', DECOMP.children[3].children.length, 'var(--orange)'],
          ['IPC Endpoints', DECOMP.children[1].children.length, 'var(--purple)'],
        ].map(([lbl, val, color]) => (
          <div key={lbl} className="kpi">
            <div className="kpi-lbl">{lbl}</div>
            <div className="kpi-val" style={{ color, fontSize: 20 }}>{val}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 260px)' }}>
        <div className="card-title">System Decomposition Hierarchy</div>
        <DecompNode node={DECOMP} depth={0} />
      </div>
    </div>
  );
}
