const DECOMP = {
  label: 'TrackAll Loan Servicing System', type: 'system',
  children: [
    {
      label: 'VC++ Win32/MFC Frontend', type: 'cpp', file: 'TrackAllClientManagerLegacy.cpp',
      children: [
        { label: 'CTrackAllClientManagerLegacyApp::InitInstance()', type: 'func', file: 'Wires CLoanRules, CTMELibAdapter, CRataBaseServiceAdapter, CEDINotificationWriter, CLoanSearchDlg' },
        {
          label: 'CLoanSearchDlg', type: 'func', file: 'LoanSearchDlg.cpp',
          children: [
            { label: 'ValidateLoanForSearch()', type: 'func', file: 'R-L-001: ≥1 criterion; R-L-002: 10-digit loan num' },
            { label: 'SendMessage(LOAN_SEARCH)', type: 'func', file: 'Dispatches via CTMELibAdapter → TKA900' },
            { label: 'ProcessLoanResult()', type: 'func', file: 'Populates dialog fields from TKA900 response' },
          ],
        },
        {
          label: 'CLoanAddDlg', type: 'func', file: 'LoanAddDlg.cpp',
          children: [
            { label: 'ValidateLoanForAdd()', type: 'func', file: 'R-AL-001..007: 7 add-loan validations' },
            { label: 'SendMessage(ADD_LOAN)', type: 'func', file: 'Dispatches via CTMELibAdapter → TKA901' },
          ],
        },
        {
          label: 'CLoanModifyDlg', type: 'func', file: 'LoanModifyDlg.cpp',
          children: [
            { label: 'ValidateLoanForModify()', type: 'func', file: 'R-ML-001..004: immutability, status, UPB, address' },
            { label: 'SendMessage(MODIFY_LOAN)', type: 'func', file: 'Dispatches via CTMELibAdapter → TKA902' },
          ],
        },
        { label: 'CLoanRules', type: 'func', file: 'LoanRules.cpp — 14 business rules R-L-001..R-L-014. Pure domain logic, no I/O.' },
      ],
    },
    {
      label: 'TME IPC Layer', type: 'tme', file: 'TMELibAdapter.cpp',
      children: [
        { label: 'CTMELibAdapter::LoadRoutingTable()', type: 'tme', file: 'Reads LSS001T at startup — caches 7 mnemonic→program mappings' },
        { label: 'fgatetcp TCP socket', type: 'tme', file: 'HP NonStop Tandem node. 5s timeout per call.' },
        { label: 'LOAN_SEARCH → TKA900', type: 'tme', file: 'Search/retrieve; returns loan record + cycle flags' },
        { label: 'ADD_LOAN → TKA901', type: 'tme', file: 'INSERT LSS_LOAN_T; validates R-AL-001..007' },
        { label: 'MODIFY_LOAN → TKA902', type: 'tme', file: 'UPDATE LSS_LOAN_T; validates R-ML-001..004' },
        { label: 'QUOTE_REQUEST → TKARB000', type: 'tme', file: 'Via RataBaseServiceAdapter; triggers R-L-003..005' },
        { label: '14E_NOTIFY → TKA920', type: 'tme', file: 'Via EDINotificationWriter; triggers R-L-006..008' },
        { label: 'KY_ISO_QUERY → AIP930', type: 'tme', file: 'Kentucky ISO pre-call; R-L-004 only when state=KY' },
      ],
    },
    {
      label: 'External Service Adapters', type: 'ext', file: 'Adapter layer',
      children: [
        {
          label: 'RataBaseServiceAdapter.cpp', type: 'ext', file: 'R-L-003/004/005',
          children: [
            { label: 'CheckCarrierEligibility()', type: 'func', file: 'R-L-003: 23 approved states list' },
            { label: 'InvokeKyIsoPreCall()', type: 'func', file: 'R-L-004: KY → AIP930 via KY_ISO_QUERY mnemonic' },
            { label: 'RequestQuote()', type: 'func', file: 'R-L-005: QUOTE_REQD=Y → TKARB000 dispatch' },
          ],
        },
        {
          label: 'EDINotificationWriter.cpp', type: 'ext', file: 'R-L-006/007/008',
          children: [
            { label: 'CheckEdiFlag()', type: 'func', file: 'R-L-006: EDI_FLAG=Y required for 14E' },
            { label: 'CheckCycleType()', type: 'func', file: 'R-L-007: INSTANT_ISSUE suppresses 14E' },
            { label: 'SelectFormat()', type: 'func', file: 'R-L-008: BK- prefix → fixed-width v2.3; SSP- → delimited v4' },
          ],
        },
      ],
    },
    {
      label: 'Tandem COBOL Backend', type: 'cobol', file: 'HP NonStop Tandem node',
      children: [
        {
          label: 'TKA900.cbl — LOAN_SEARCH', type: 'cobol', file: '~420 lines',
          children: [
            { label: '2000-VALIDATE-INPUT', type: 'cobol', file: 'STATUS-CODE 9001 (no criteria), 9002 (bad loan num)' },
            { label: '3000-QUERY-LOAN', type: 'cobol', file: 'SELECT from LSS_LOAN_T WHERE LOAN_NUM = :WS-LOAN-NUM' },
            { label: '4000-FETCH-CYCLE', type: 'cobol', file: 'SELECT from LSS_CYCLE_STEP_T; returns QUOTE_REQD, CYCLE_TYPE' },
            { label: '5000-BUILD-RESPONSE', type: 'cobol', file: 'Populates 16-field response buffer' },
          ],
        },
        {
          label: 'TKA901.cbl — ADD_LOAN', type: 'cobol', file: '~280 lines',
          children: [
            { label: '2000-VALIDATE-INPUT', type: 'cobol', file: 'STATUS-CODE 9101..9107 for R-AL-001..007' },
            { label: '3000-INSERT-LOAN', type: 'cobol', file: 'INSERT INTO LSS_LOAN_T — STATUS=ACTIVE default' },
          ],
        },
        {
          label: 'TKA902.cbl — MODIFY_LOAN', type: 'cobol', file: '~310 lines',
          children: [
            { label: '2000-FETCH-CURRENT', type: 'cobol', file: 'SELECT current record for comparison' },
            { label: '3000-VALIDATE-CHANGES', type: 'cobol', file: 'STATUS-CODE 9201..9204 for R-ML-001..004' },
            { label: '4000-UPDATE-LOAN', type: 'cobol', file: 'UPDATE LSS_LOAN_T SET ... WHERE LOAN_NUM = :WS-LOAN-NUM' },
          ],
        },
        { label: 'TKA920.cbl — 14E_NOTIFY', type: 'cobol', file: 'Formats and dispatches 14E EDI notification' },
      ],
    },
    {
      label: 'HP NonStop SQL/MP Tables', type: 'db', file: 'NSK $DATA.LSSDB',
      children: [
        { label: 'LSS_LOAN_T', type: 'db', file: 'PK: LOAN_NUM CHAR(10). 16 fields. R/C/U by TKA900/901/902/920.' },
        { label: 'LSS_CYCLE_STEP_T', type: 'db', file: 'PK: CLIENT_ID + CYCLE_TYPE. Provides QUOTE_REQD and CYCLE_TYPE to TKA900.' },
        { label: 'LSS001T', type: 'db', file: 'TME routing table. 7 mnemonic→program rows. Cached at startup by CTMELibAdapter.' },
      ],
    },
    {
      label: 'Angular 17 / .NET 8 Migration Target', type: 'dotnet', file: 'Forward engineering target',
      children: [
        { label: 'Angular 17 SPA', type: 'dotnet', file: 'Replaces MFC Win32 dialogs (Search/Add/Modify)' },
        { label: '.NET 8 Web API + LoanService', type: 'dotnet', file: 'Replaces TMELibAdapter + adapters' },
        { label: 'Azure Service Bus', type: 'dotnet', file: 'Replaces fgatetcp TCP socket + TME routing' },
        { label: 'IRataBaseServiceAdapter (HttpClient)', type: 'dotnet', file: 'Replaces direct AIP930/TKARB000 fgatetcp calls' },
        { label: 'Azure SQL dbo.LoanMaster', type: 'dotnet', file: 'Replaces LSS_LOAN_T SQL/MP' },
        { label: 'Azure SQL dbo.CycleStep', type: 'dotnet', file: 'Replaces LSS_CYCLE_STEP_T' },
        { label: 'Azure App Configuration', type: 'dotnet', file: 'Replaces LSS001T routing table' },
      ],
    },
  ],
};

const TYPE_COLORS = {
  system:  { color: 'var(--text)',    bg: '#21262d', stroke: '#484f58' },
  cpp:     { color: 'var(--orange)',  bg: '#3a2a00', stroke: '#e3b341' },
  tme:     { color: 'var(--purple)',  bg: '#2d1f5e', stroke: '#a371f7' },
  ext:     { color: 'var(--blue)',    bg: '#1f3a5f', stroke: '#58a6ff' },
  cobol:   { color: 'var(--green)',   bg: '#1a2d1a', stroke: '#3fb950' },
  db:      { color: 'var(--muted)',   bg: '#21262d', stroke: '#484f5888' },
  func:    { color: 'var(--muted)',   bg: '#161b22', stroke: '#30363d' },
  dotnet:  { color: 'var(--blue)',    bg: '#1f3a5f', stroke: '#58a6ff88' },
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
          ['VC++ Modules', 5, 'var(--orange)'],
          ['COBOL Programs', 4, 'var(--green)'],
          ['SQL/MP Tables', 3, 'var(--muted)'],
          ['TME Routes', 7, 'var(--purple)'],
          ['Azure Targets', 7, 'var(--blue)'],
        ].map(([lbl, val, color]) => (
          <div key={lbl} className="kpi">
            <div className="kpi-lbl">{lbl}</div>
            <div className="kpi-val" style={{ color, fontSize: 20 }}>{val}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 260px)' }}>
        <div className="card-title">System Decomposition Hierarchy — TrackAll Loan Servicing System</div>
        <DecompNode node={DECOMP} depth={0} />
      </div>
    </div>
  );
}
