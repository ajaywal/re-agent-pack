const FR = [
  { id: 'FR-001', pri: 'Must Have', cat: 'Create', desc: 'System shall allow authorized users to create new insurance loans via a multi-step form. Required fields: borrower name, policy number, loan type, amount ($1–$5M), term (12–360 mo), credit score (300–850), state code.' },
  { id: 'FR-002', pri: 'Must Have', cat: 'Calculation', desc: 'System shall invoke the rate/premium calculation engine for every new loan. Engine shall produce: credit tier, interest rate, monthly payment, insurance premium, total cost. Results must match QLOTCALC output within $0.01 per monthly payment.' },
  { id: 'FR-003', pri: 'Must Have', cat: 'Confirmation', desc: 'System shall present a confirmation dialog displaying all 5 quote values (rate tier, rate, payment, premium, total) before creating the loan. Loan creation shall only proceed upon explicit user confirmation (BR-007).' },
  { id: 'FR-004', pri: 'Must Have', cat: 'Search', desc: 'System shall support loan retrieval by: (a) exact loan ID, (b) policy number (alternate key), (c) borrower name (partial match). Results must display all 15 LOAN_MASTER fields.' },
  { id: 'FR-005', pri: 'Must Have', cat: 'Update', desc: 'System shall allow update of: status, loan officer, collateral description, state code. System shall REJECT any attempt to modify loan_id, borrower_name, loan_type, or loan_amount after origination (BR-008).' },
  { id: 'FR-006', pri: 'Must Have', cat: 'Audit', desc: 'Every rate calculation invocation — including those that fail validation — shall produce exactly one audit record. Record shall capture: all inputs, all outputs, return code, timestamp, session ID (BR-009).' },
  { id: 'FR-007', pri: 'Must Have', cat: 'Access Control', desc: 'System shall enforce role-based access: PM has full access; BA: create/search/update/reports; DBA: data/schema views; DEV: code/architecture views. Login required before any operation.' },
  { id: 'FR-008', pri: 'Should Have', cat: 'Reporting', desc: 'System shall provide portfolio summary: total loan value, count by status, delinquency rate. Data sourced from LOAN_MASTER. Refresh on navigation.' },
];

const NFR = [
  { id: 'NFR-001', cat: 'Precision', desc: 'All monetary calculations shall use decimal arithmetic (C# decimal). IEEE 754 floating point is PROHIBITED for any financial calculation. MidpointRounding.AwayFromZero required. (BR-006, IA-003)' },
  { id: 'NFR-002', cat: 'Performance', desc: 'Rate calculation (FR-002) shall complete within 2 seconds. Loan search by ID shall complete within 1 second. Audit write shall not block the main loan creation flow.' },
  { id: 'NFR-003', cat: 'Availability', desc: 'Calculation engine shall be available 99.5% uptime. Planned downtime window: Sundays 2–4 AM EST only. Graceful degradation: queue requests if service temporarily unavailable.' },
  { id: 'NFR-004', cat: 'Compliance', desc: 'Audit log shall be append-only. No UPDATE or DELETE operations permitted on audit records. Retention: minimum 7 years per regulatory requirement. Equivalent of QLOTCALC BR-009.' },
  { id: 'NFR-005', cat: 'Security', desc: 'All API endpoints require JWT authentication. Sensitive fields (credit score, loan amount) masked in logs. API key stored in sessionStorage only (never localStorage or cookies). TLS 1.3 required.' },
  { id: 'NFR-006', cat: 'Migration Fidelity', desc: 'System shall produce byte-equivalent financial results to QLOTCALC for all 9 business rules. Validation suite: 1,000+ historical quote scenarios. Tolerance: ±$0.01 per monthly payment.' },
];

const DM = [
  { entity: 'LoanMaster', legacy: 'LOAN_MASTER KSDS ($DATA.LOANDB)', target: 'Azure SQL dbo.LoanMaster', pk: 'loan_id NVARCHAR(12)', fields: 15, notes: 'Primary key: loan_id. Alternate key: policy_id. Status: Active/Under Review/Delinquent/Closed.' },
  { entity: 'RateTable', legacy: 'RATE_TABLE KSDS ($DATA.RATEDB)', target: 'Azure SQL dbo.RateTable', pk: 'loan_type + credit_tier + effective_date', fields: 6, notes: '20 active records (5 types × 4 tiers). Versioned by effective_date to support rate changes.' },
  { entity: 'StateSurcharge', legacy: 'STATE_SURCHARGE KSDS ($DATA.RATEDB)', target: 'Azure SQL dbo.StateSurcharge', pk: 'state_code + effective_date', fields: 5, notes: 'Rate adjustment (can be negative), premium surcharge, minimum premium per state.' },
  { entity: 'AuditLog', legacy: 'AUDIT_LOG sequential KSDS ($LOG.QLOTAUDT)', target: 'Azure Table Storage', pk: 'PartitionKey=YYYYMMDD, RowKey=HHmmss_sessionId', fields: 12, notes: 'Append-only. No UPDATE/DELETE. PartitionKey enables efficient date-range queries.' },
  { entity: 'LoanSeq', legacy: 'LOAN_SEQ KSDS ($DATA.LOANDB)', target: 'Azure SQL CREATE SEQUENCE', pk: 'N/A — auto-increment', fields: 1, notes: 'Atomic sequence. Format: LN-YYYY-NNN. Prevents duplicate IDs under concurrent load.' },
];

const AC = [
  { id: 'AC-001', req: 'FR-003', desc: 'Given a valid loan request, when user clicks Get Quote, then CConfirmDialog appears with tier, rate, payment, premium, and total cost visible.' },
  { id: 'AC-002', req: 'FR-002', desc: 'Given score=780, amount=50000, term=60, type=Home, when quote runs, then tier=PRIME, rate=5.50%, payment=$946.39, premium=$126.00/mo.' },
  { id: 'AC-003', req: 'FR-006', desc: 'Given any QLOTCALC invocation (success or failure), when it completes, then exactly one audit record exists in AUDIT_LOG with matching inputs and return code.' },
  { id: 'AC-004', req: 'FR-005', desc: 'Given an existing loan, when user attempts to modify loan_id, borrower_name, loan_type, or loan_amount, then system returns error "BR-008: immutable field" and no DB write occurs.' },
  { id: 'AC-005', req: 'NFR-001', desc: 'Given 1,000 historical quote scenarios, when run through .NET 8 engine and QLOTCALC, then all monthly payment values match within ±$0.01.' },
  { id: 'AC-006', req: 'NFR-004', desc: 'Given an audit record exists in AUDIT_LOG, when any UPDATE or DELETE is attempted, then operation is rejected with policy error.' },
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
          <div className="card-title">Data Model — Legacy KSDS → Azure Migration Mapping</div>
          <table className="data-table" style={{ fontSize: 11 }}>
            <thead>
              <tr><th>Entity</th><th>Legacy KSDS</th><th>Target</th><th>PK</th><th style={{ textAlign: 'center' }}>Fields</th><th>Notes</th></tr>
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
