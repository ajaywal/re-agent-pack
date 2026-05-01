import { useState } from 'react';

const FR = [
  { id: 'FR-001', pri: 'Must Have', cat: 'Search', desc: 'System shall allow loan retrieval by loan number (exactly 10 numeric digits, R-L-002) or borrower name. At least one criterion required (R-L-001). Response must include all 16 LSS_LOAN_T fields plus QUOTE_REQD and CYCLE_TYPE from LSS_CYCLE_STEP_T.' },
  { id: 'FR-002', pri: 'Must Have', cat: 'Add Loan', desc: 'System shall create a new loan record in LSS_LOAN_T via TKA901 COBOL program. Enforces 7 validations: R-AL-001 (duplicate loan number), R-AL-002 (borrower name not blank), R-AL-003 (property address not blank), R-AL-004 (valid property type), R-AL-005 (UPB > 0), R-AL-006 (valid coverage type), R-AL-007 (effective date not past). New loans default to STATUS=ACTIVE.' },
  { id: 'FR-003', pri: 'Must Have', cat: 'Modify Loan', desc: 'System shall allow update of mutable loan fields via TKA902 COBOL program. Must enforce: R-ML-001 (LOAN_NUM is immutable), R-ML-002 (valid status transitions: ACTIVE→DELINQUENT only; DELINQUENT→CLOSED only; CLOSED is terminal), R-ML-003 (UPB cannot increase), R-ML-004 (property address cannot be blanked once set).' },
  { id: 'FR-004', pri: 'Must Have', cat: 'RataBase Quote', desc: 'System shall integrate with RataBase premium quote service. Rules enforced: R-L-003 (property state must be in 23 approved carrier states), R-L-004 (Kentucky state requires AIP930 ISO pre-call via KY_ISO_QUERY mnemonic before TKARB000), R-L-005 (QUOTE_REQD=Y on LSS_CYCLE_STEP_T triggers quote; QUOTE_REQD=N skips). Rates: 0.45% annual (standard), 0.62% annual (FL/TX/SC/NC coastal).' },
  { id: 'FR-005', pri: 'Must Have', cat: '14E EDI', desc: 'System shall dispatch 14E EDI notifications via TKA920. Three eligibility gates: R-L-006 (EDI_FLAG=Y required on loan record), R-L-007 (INSTANT_ISSUE cycle type suppresses 14E), R-L-008 (form ID must be LT-F100/200/300/400). Format selection: FCI_CODE prefix BK- → fixed-width v2.3; SSP- → delimited v4.' },
  { id: 'FR-006', pri: 'Must Have', cat: 'TME Routing', desc: 'System shall load LSS001T mnemonic routing table at startup via CTMELibAdapter. All inter-system calls dispatched via fgatetcp TCP socket to HP NonStop Tandem node. 7 routes: LOAN_SEARCH→TKA900, ADD_LOAN→TKA901, MODIFY_LOAN→TKA902, QUOTE_REQUEST→TKARB000, 14E_NOTIFY→TKA920, KY_ISO_QUERY→AIP930, CYCLE_QUERY→TKA910.' },
  { id: 'FR-007', pri: 'Should Have', cat: 'Status Mgmt', desc: 'System shall enforce loan lifecycle: ACTIVE (new loans), DELINQUENT (missed payments), CLOSED (terminated). UI must present only valid transitions per R-ML-002. Closed loans are read-only in the modify dialog.' },
  { id: 'FR-008', pri: 'Should Have', cat: 'Portfolio View', desc: 'System shall display loan portfolio summary: count by status, EDI-eligible loans (EDI_FLAG=Y), loans requiring RataBase quote (QUOTE_REQD=Y), and recent activity. Data sourced from LSS_LOAN_T and LSS_CYCLE_STEP_T.' },
];

const NFR = [
  { id: 'NFR-001', cat: 'Performance', desc: 'fgatetcp socket call timeout: 5s per TME mnemonic. TKA900 LOAN_SEARCH shall return result within 3s under normal load. UI must remain responsive during async Tandem call. TCP connection pool maintained by CTMELibAdapter.' },
  { id: 'NFR-002', cat: 'Migration Fidelity', desc: 'Angular 17 + .NET 8 implementation shall produce byte-equivalent output to legacy VC++/COBOL stack for all 14 business rules. Validation suite: TC-001..TC-016. RataBase premium values must match within ±$0.01 per monthly calculation.' },
  { id: 'NFR-003', cat: 'Data Integrity', desc: 'LOAN_NUM CHAR(10) primary key semantics preserved in Azure SQL NVARCHAR(10). No implicit padding or trimming. All status transitions enforced at API layer, not only at UI layer. TME STATUS-CODEs (9001–9204) mapped 1:1 to .NET exceptions.' },
  { id: 'NFR-004', cat: 'EDI Format', desc: '14E EDI output must be format-exact. BK-prefix FCI_CODE: fixed-width v2.3 with field positions as specified in EDI_FORMAT_SPEC.md. SSP-prefix: pipe-delimited v4. Wrong format causes lender processing failure. Zero tolerance for format deviation.' },
  { id: 'NFR-005', cat: 'Routing', desc: 'LSS001T routing table content must be preserved exactly in Azure App Configuration. All 7 mnemonics must resolve identically in the .NET 8 implementation. Startup load pattern replicated: load-on-init, no lazy loading.' },
  { id: 'NFR-006', cat: 'Security', desc: 'All .NET 8 API endpoints require JWT authentication. TME routing credentials not exposed in Angular SPA. RataBase API key stored in Azure Key Vault, injected via IRataBaseServiceAdapter. TLS 1.3 required for all external service calls.' },
];

const DM = [
  { entity: 'LoanMaster', legacy: 'LSS_LOAN_T (HP NonStop SQL/MP)', target: 'Azure SQL dbo.LoanMaster', pk: 'LOAN_NUM NVARCHAR(10)', fields: 16, notes: 'PK: LOAN_NUM CHAR(10) — trailing-space semantics must be preserved. STATUS: ACTIVE/DELINQUENT/CLOSED. EDI_FLAG, QUOTE_REQD migrated from cycle table join.' },
  { entity: 'CycleStep', legacy: 'LSS_CYCLE_STEP_T (HP NonStop SQL/MP)', target: 'Azure SQL dbo.CycleStep', pk: 'CLIENT_ID + CYCLE_TYPE', fields: 6, notes: 'Provides QUOTE_REQD (Y/N) and CYCLE_TYPE (STANDARD/INSTANT_ISSUE/etc.) per client. Drives R-L-005 and R-L-007 decision gates.' },
  { entity: 'RoutingTable', legacy: 'LSS001T (HP NonStop SQL/MP)', target: 'Azure App Configuration', pk: 'MNEMONIC CHAR(12)', fields: 3, notes: '7 rows: mnemonic, target_program, timeout_sec. Loaded once at application startup. Zero-downtime updates via App Configuration sentinel key.' },
  { entity: 'RataBaseCache', legacy: 'In-memory (CTMELibAdapter)', target: 'Azure Redis Cache', pk: 'state_code + coverage_type', fields: 4, notes: 'Carrier eligibility and rate data cached for 24h. R-L-003 eligibility check hits cache first, falls back to TKARB000 on miss.' },
  { entity: 'AuditLog', legacy: 'Not present in legacy', target: 'Azure Table Storage', pk: 'PartitionKey=YYYYMMDD, RowKey=HHmmss_loanNum', fields: 10, notes: 'New requirement for migration. Captures all TKA900/901/902/920 call events, rule decisions, STATUS-CODE outcomes. Append-only.' },
];

const AC = [
  { id: 'AC-001', req: 'FR-001', desc: 'Given search with both loan number and name fields empty, when submitted, then R-L-001 error returned before any fgatetcp call is made. TKA900 not invoked.' },
  { id: 'AC-002', req: 'FR-001', desc: 'Given loan number of 9 digits (e.g. "123456789"), when submitted, then R-L-002 error returned. Given 10 numeric digits, then LOAN_SEARCH dispatched to TKA900 via TME.' },
  { id: 'AC-003', req: 'FR-004', desc: 'Given KY state loan with QUOTE_REQD=Y, when RataBase quote requested, then KY_ISO_QUERY mnemonic call to AIP930 occurs BEFORE TKARB000 QUOTE_REQUEST. Both STATUS-CODEs must be 0000.' },
  { id: 'AC-004', req: 'FR-005', desc: 'Given loan with EDI_FLAG=N, when 14E notification triggered, then R-L-006 gate blocks dispatch. TKA920 not called. UI shows "EDI not enabled for this loan".' },
  { id: 'AC-005', req: 'FR-005', desc: 'Given loan with CYCLE_TYPE=INSTANT_ISSUE, when 14E notification triggered, then R-L-007 suppression fires. No 14E dispatch regardless of EDI_FLAG value.' },
  { id: 'AC-006', req: 'FR-003', desc: 'Given loan in DELINQUENT status, when modify attempted with target status=ACTIVE, then R-ML-002 validation error returned. LSS_LOAN_T record unchanged. TKA902 receives STATUS-CODE 9202 in response.' },
  { id: 'AC-007', req: 'FR-003', desc: 'Given modify request that increases UPB (e.g. current=$150,000, new=$160,000), then R-ML-003 blocks the update. LSS_LOAN_T not written. Status-code 9203 returned from TKA902.' },
  { id: 'AC-008', req: 'FR-006', desc: 'Given application startup, when CTMELibAdapter::LoadRoutingTable() completes, then all 7 LSS001T rows are cached and all mnemonic lookups resolve without SQL/MP query at runtime.' },
];

const PRI_COLOR = { 'Must Have': 'var(--red)', 'Should Have': 'var(--orange)', 'Nice to Have': 'var(--blue)' };

export default function ReqDocument() {
  const [section, setSection] = useState('FR');

  const sections = [
    { id: 'FR', label: 'Functional Requirements' },
    { id: 'NFR', label: 'Non-Functional Requirements' },
    { id: 'DM', label: 'Data Model' },
    { id: 'AC', label: 'Acceptance Criteria' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`pill ${section === s.id ? 'pill-blue' : ''}`}
            style={{ fontSize: 11, background: section === s.id ? '' : 'var(--surface2)', border: '1px solid var(--border)' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'FR' && (
        <div className="card">
          <div className="card-title">Functional Requirements — {FR.length} requirements</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FR.map(r => (
              <div key={r.id} className="rds-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className="mono" style={{ color: 'var(--blue)', fontWeight: 700 }}>{r.id}</span>
                  <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: `${PRI_COLOR[r.pri]}22`, color: PRI_COLOR[r.pri] }}>{r.pri}</span>
                  <span className="tag tag-blue" style={{ fontSize: 9 }}>{r.cat}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'NFR' && (
        <div className="card">
          <div className="card-title">Non-Functional Requirements — {NFR.length} requirements</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {NFR.map(r => (
              <div key={r.id} className="rds-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className="mono" style={{ color: 'var(--purple)', fontWeight: 700 }}>{r.id}</span>
                  <span className="tag tag-purple" style={{ fontSize: 9 }}>{r.cat}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'DM' && (
        <div className="card">
          <div className="card-title">Data Model — HP NonStop SQL/MP → Azure Migration Mapping</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ fontSize: 11 }}>
              <thead>
                <tr><th>Entity</th><th>Legacy (NonStop SQL/MP)</th><th>Target (Azure)</th><th>PK</th><th style={{ textAlign: 'center' }}>Fields</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {DM.map(d => (
                  <tr key={d.entity}>
                    <td style={{ fontWeight: 700, color: 'var(--blue)', fontFamily: 'monospace' }}>{d.entity}</td>
                    <td className="mono" style={{ fontSize: 9, color: 'var(--orange)' }}>{d.legacy}</td>
                    <td className="mono" style={{ fontSize: 9, color: 'var(--green)' }}>{d.target}</td>
                    <td className="mono" style={{ fontSize: 9 }}>{d.pk}</td>
                    <td style={{ textAlign: 'center' }}>{d.fields}</td>
                    <td style={{ fontSize: 10, color: 'var(--muted)' }}>{d.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === 'AC' && (
        <div className="card">
          <div className="card-title">Acceptance Criteria — {AC.length} criteria</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {AC.map(a => (
              <div key={a.id} className="rds-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className="mono" style={{ color: 'var(--green)', fontWeight: 700 }}>{a.id}</span>
                  <span className="tag tag-blue" style={{ fontSize: 9 }}>{a.req}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, fontFamily: 'monospace' }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
