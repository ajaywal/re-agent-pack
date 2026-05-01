import { useState } from 'react';

const CPP_SOURCE = `// LoanRules.cpp — CLoanRules business rule enforcement
// All 14 rules (R-L-001 to R-L-014) centralised in this class.
// Rule origins: UI input constraints, carrier eligibility config,
// Tandem LSS_LOAN_T/LSS_CYCLE_STEP_T column semantics.

#include "LoanRules.h"

CLoanRules::CLoanRules() {
    LoadApprovedCarrierStates();
    LoadLenderTargetForms();
}

void CLoanRules::LoadApprovedCarrierStates() {
    // 23 approved states for RataBase carrier coverage (R-L-003)
    const LPCTSTR codes[] = {
        _T("AL"),_T("AZ"),_T("CA"),_T("CO"),_T("FL"),_T("GA"),
        _T("IL"),_T("IN"),_T("KY"),_T("MD"),_T("MI"),_T("MN"),
        _T("MO"),_T("NC"),_T("NJ"),_T("NY"),_T("OH"),_T("PA"),
        _T("SC"),_T("TN"),_T("TX"),_T("VA"),_T("WI")
    };
    int n = sizeof(codes)/sizeof(codes[0]);
    for (int i = 0; i < n; i++) m_approvedCarrierStates.push_back(codes[i]);
}

void CLoanRules::LoadLenderTargetForms() {
    // Valid form IDs from lender_target table (R-L-008)
    m_lenderTargetForms.push_back(_T("LT-F100"));
    m_lenderTargetForms.push_back(_T("LT-F200"));
    m_lenderTargetForms.push_back(_T("LT-F300"));
    m_lenderTargetForms.push_back(_T("LT-F400"));
}

// R-L-001 / R-L-002 — search input validation
BOOL CLoanRules::ValidateLoanForSearch(
    const CString& strLoanNum,
    const CString& strBorrowerName,
    CString& strErrorMessage) {
    CString num(strLoanNum); num.Trim();
    CString name(strBorrowerName); name.Trim();

    // R-L-001: at least one criterion required
    if (num.IsEmpty() && name.IsEmpty()) {
        strErrorMessage = _T("At least one search criterion required.");
        return FALSE;
    }
    if (!num.IsEmpty()) {
        // R-L-002: exactly 10 numeric digits
        if (num.GetLength() != 10) {
            strErrorMessage = _T("Loan number must be exactly 10 digits.");
            return FALSE;
        }
        for (int i = 0; i < num.GetLength(); i++) {
            if (!_istdigit(num[i])) {
                strErrorMessage = _T("Loan number must contain digits only.");
                return FALSE;
            }
        }
    }
    return TRUE;
}

// R-L-003 — carrier state eligibility
BOOL CLoanRules::EnforceCarrierCoverage(
    const CString& strPropertyState,
    CString& strErrorMessage) const {
    CString state(strPropertyState); state.Trim();
    if (state.IsEmpty()) {
        strErrorMessage = _T("Property state is required for RataBase rating.");
        return FALSE;
    }
    if (!IsStateInApprovedCarrierList(state)) {
        strErrorMessage.Format(
            _T("State '%s' is not in the approved carrier list. ")
            _T("Contact underwriting for manual quote options."),
            state.GetString());
        return FALSE;
    }
    return TRUE;
}

// R-L-006 / R-L-007 / R-L-008 — 14E EDI eligibility
BOOL CLoanRules::EnforceEdiEligibility(
    const CLoan& loan,
    const CString& strFormId,
    CString& strErrorMessage) const {
    // R-L-006: EDI_FLAG must be 'Y'
    if (loan.m_strEdiFlag.CompareNoCase(_T("Y")) != 0) {
        strErrorMessage = _T("EDI_FLAG is not set to Y — notification skipped.");
        return FALSE;
    }
    // R-L-007: INSTANT_ISSUE cycle suppresses 14E
    if (loan.m_strCycleType.CompareNoCase(_T("INSTANT_ISSUE")) == 0) {
        strErrorMessage = _T("14E blocked: Instant Issue cycle.");
        return FALSE;
    }
    // R-L-008: form ID must be in lender_target
    if (!IsFormIdInLenderTarget(strFormId)) {
        strErrorMessage.Format(
            _T("Form ID '%s' not registered in lender_target."),
            strFormId.GetString());
        return FALSE;
    }
    return TRUE;
}

// R-L-005 — quote required flag
BOOL CLoanRules::RequiresQuote(const CLoan& loan) const {
    return loan.m_strQuoteReqd.CompareNoCase(_T("Y")) == 0;
}

// R-L-009 to R-L-013 — add loan validation
BOOL CLoanRules::ValidateLoanForAdd(
    const CLoan& loan, CString& strErrorMessage) {
    CString num(loan.m_strLoanNum); num.Trim();
    CString name(loan.m_strBorrowerName); name.Trim();
    // R-AL-001
    if (num.IsEmpty() || name.IsEmpty()) {
        strErrorMessage = _T("Loan number and borrower name are required.");
        return FALSE;
    }
    // R-AL-002
    if (num.GetLength() != 10) {
        strErrorMessage = _T("Loan number must be exactly 10 digits."); return FALSE;
    }
    // R-AL-003
    if (loan.m_nPropertyValue <= 0) {
        strErrorMessage = _T("Property value must be greater than zero."); return FALSE;
    }
    // R-AL-004
    CString addr(loan.m_strPropertyAddress); addr.Trim();
    if (addr.IsEmpty()) {
        strErrorMessage = _T("Property address is required."); return FALSE;
    }
    // R-AL-005
    if (loan.m_strLoanStatus.CompareNoCase(_T("ACTIVE")) != 0) {
        strErrorMessage = _T("New loans must have initial status ACTIVE."); return FALSE;
    }
    // R-AL-006
    if (loan.m_nUnpaidPrincipalBalance <= 0) {
        strErrorMessage = _T("Unpaid principal balance must be > 0."); return FALSE;
    }
    // R-AL-007
    if (!IsValidPropertyType(loan.m_strPropertyType)) {
        strErrorMessage = _T("Property type must be RESIDENTIAL or COMMERCIAL."); return FALSE;
    }
    return TRUE;
}

// R-L-014 (R-ML-001..004) — modify loan validation
BOOL CLoanRules::ValidateLoanForModify(
    const CLoan& orig,
    const CLoan& mod,
    CString& strErrorMessage) const {
    // R-ML-001: loan number immutable
    if (orig.m_strLoanNum.CompareNoCase(mod.m_strLoanNum) != 0) {
        strErrorMessage = _T("Loan number cannot be changed after creation."); return FALSE;
    }
    // R-ML-002: valid status transition only
    if (orig.m_strLoanStatus.CompareNoCase(mod.m_strLoanStatus) != 0) {
        if (!IsLoanStatusTransitionValid(
                orig.m_strLoanStatus, mod.m_strLoanStatus)) {
            strErrorMessage.Format(
                _T("Invalid transition: '%s' to '%s'. ")
                _T("Allowed: ACTIVE->DELINQUENT, DELINQUENT->CLOSED."),
                orig.m_strLoanStatus.GetString(),
                mod.m_strLoanStatus.GetString());
            return FALSE;
        }
    }
    // R-ML-003: UPB cannot increase
    if (mod.m_nUnpaidPrincipalBalance > orig.m_nUnpaidPrincipalBalance) {
        strErrorMessage = _T("UPB cannot increase. Contact origination."); return FALSE;
    }
    // R-ML-004: address cannot be cleared
    CString newAddr(mod.m_strPropertyAddress); newAddr.Trim();
    CString oldAddr(orig.m_strPropertyAddress); oldAddr.Trim();
    if (oldAddr.CompareNoCase(newAddr) != 0 && newAddr.IsEmpty()) {
        strErrorMessage = _T("Property address cannot be cleared."); return FALSE;
    }
    return TRUE;
}`;

const COBOL_SOURCE = `      *-----------------------------------------------------------------
      * TKA900 — LOAN_SEARCH Server Program
      *
      * Invoked by TAL Gateway when TME mnemonic LOAN_SEARCH received
      * from VC++ client via fgatetcp. LSS001T routes LOAN_SEARCH->TKA900.
      *
      * Input:  WS-LOAN-NUM (10 chars) / WS-BORROWER-NAME (40 chars)
      * Output: LSS_LOAN_T fields + QUOTE_REQD/CYCLE_TYPE from
      *         LSS_CYCLE_STEP_T joined on CLIENT_ID.
      *-----------------------------------------------------------------
       IDENTIFICATION DIVISION.
       PROGRAM-ID. TKA900.
       ENVIRONMENT DIVISION.
       DATA DIVISION.
       WORKING-STORAGE SECTION.

       01  WS-REQUEST-BLOCK.
           05  WS-LOAN-NUM         PIC X(10).
           05  WS-BORROWER-NAME    PIC X(40).

       01  WS-RESPONSE-BLOCK.
           05  WS-RESP-LOAN-NUM        PIC X(10).
           05  WS-RESP-CLIENT-ID       PIC X(8).
           05  WS-RESP-BORROWER-NAME   PIC X(40).
           05  WS-RESP-PROPERTY-STATE  PIC X(2).
           05  WS-RESP-COVERAGE-TYPE   PIC X(10).
           05  WS-RESP-PROPERTY-VALUE  PIC 9(10).
           05  WS-RESP-FCI-CODE        PIC X(6).
           05  WS-RESP-EDI-FLAG        PIC X(1).
           05  WS-RESP-QUOTE-REQD      PIC X(1).
           05  WS-RESP-CYCLE-TYPE      PIC X(20).

       01  WS-STATUS-CODE          PIC X(4)  VALUE '0000'.
       01  WS-STATUS-MESSAGE       PIC X(80) VALUE SPACES.
       01  WS-SQLCODE              PIC S9(9) COMP.

       PROCEDURE DIVISION.

       0000-MAIN.
           PERFORM 1000-RECEIVE-REQUEST
           PERFORM 2000-VALIDATE-INPUT
           IF WS-STATUS-CODE = '0000'
               PERFORM 3000-QUERY-LOAN
           END-IF
           IF WS-STATUS-CODE = '0000'
               PERFORM 4000-QUERY-CYCLE-STEP
           END-IF
           PERFORM 9000-SEND-RESPONSE
           STOP RUN.

      *--- R-L-001: at least one criterion required ---
       2000-VALIDATE-INPUT.
           IF WS-LOAN-NUM = SPACES AND WS-BORROWER-NAME = SPACES
               MOVE '9001' TO WS-STATUS-CODE
               MOVE 'At least one search criterion required'
                   TO WS-STATUS-MESSAGE
           END-IF.

      *--- R-L-002: CHAR(10) equality match ---
       3000-QUERY-LOAN.
           EXEC SQL
               SELECT LOAN_NUM, CLIENT_ID, BORROWER_NAME,
                      PROPERTY_STATE, COVERAGE_TYPE,
                      PROPERTY_VALUE, FCI_CODE, EDI_FLAG
               INTO   :WS-RESP-LOAN-NUM, :WS-RESP-CLIENT-ID,
                      :WS-RESP-BORROWER-NAME, :WS-RESP-PROPERTY-STATE,
                      :WS-RESP-COVERAGE-TYPE, :WS-RESP-PROPERTY-VALUE,
                      :WS-RESP-FCI-CODE, :WS-RESP-EDI-FLAG
               FROM   LSS_LOAN_T
               WHERE  (LOAN_NUM = :WS-LOAN-NUM
                          OR :WS-LOAN-NUM = SPACES)
               AND    (BORROWER_NAME LIKE :WS-BORROWER-NAME
                          OR :WS-BORROWER-NAME = SPACES)
               FETCH FIRST 1 ROWS ONLY
           END-EXEC
           MOVE SQLCODE TO WS-SQLCODE
           IF WS-SQLCODE = 100
               MOVE '9002' TO WS-STATUS-CODE
               MOVE 'No matching loan record found' TO WS-STATUS-MESSAGE
           END-IF.

      *--- R-L-005 / R-L-007: QUOTE_REQD + CYCLE_TYPE ---
       4000-QUERY-CYCLE-STEP.
           EXEC SQL
               SELECT QUOTE_REQD, CYCLE_TYPE
               INTO   :WS-RESP-QUOTE-REQD, :WS-RESP-CYCLE-TYPE
               FROM   LSS_CYCLE_STEP_T
               WHERE  CLIENT_ID = :WS-RESP-CLIENT-ID
               FETCH FIRST 1 ROWS ONLY
           END-EXEC.

       9000-SEND-RESPONSE.
           CONTINUE.`;

const TKA901 = `      *-----------------------------------------------------------------
      * TKA901 — ADD_LOAN Server Program
      * Validates R-AL-001..007 and INSERTs into LSS_LOAN_T.
      *-----------------------------------------------------------------
       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-RECEIVE-REQUEST
           PERFORM 2000-VALIDATE-ADD
           IF WS-STATUS-CODE = '0000'
               PERFORM 3000-INSERT-LOAN
           END-IF
           PERFORM 9000-SEND-RESPONSE
           STOP RUN.

       2000-VALIDATE-ADD.
           IF WS-ADD-LOAN-NUM = SPACES
               MOVE '9101' TO WS-STATUS-CODE       *R-AL-001
               MOVE 'Loan number required' TO WS-MSG
               STOP RUN
           END-IF
           IF WS-ADD-BORROWER-NAME = SPACES
               MOVE '9102' TO WS-STATUS-CODE       *R-AL-001
               STOP RUN
           END-IF
           IF WS-ADD-PROPERTY-VALUE = ZERO
               MOVE '9103' TO WS-STATUS-CODE       *R-AL-003
               STOP RUN
           END-IF
           IF WS-ADD-PROPERTY-ADDR = SPACES
               MOVE '9104' TO WS-STATUS-CODE       *R-AL-004
               STOP RUN
           END-IF
           IF WS-ADD-LOAN-STATUS NOT = 'ACTIVE'
               MOVE '9105' TO WS-STATUS-CODE       *R-AL-005
               STOP RUN
           END-IF
           IF WS-ADD-UPB = ZERO
               MOVE '9106' TO WS-STATUS-CODE       *R-AL-006
               STOP RUN
           END-IF
           IF WS-ADD-PROPERTY-TYPE NOT = 'RESIDENTIAL'
           AND WS-ADD-PROPERTY-TYPE NOT = 'COMMERCIAL'
               MOVE '9107' TO WS-STATUS-CODE       *R-AL-007
               STOP RUN
           END-IF.

       3000-INSERT-LOAN.
           EXEC SQL
               INSERT INTO LSS_LOAN_T (
                   LOAN_NUM, CLIENT_ID, BORROWER_NAME,
                   PROPERTY_STATE, COVERAGE_TYPE,
                   PROPERTY_VALUE, FCI_CODE, EDI_FLAG,
                   LOAN_STATUS, UPB, PROPERTY_ADDRESS,
                   PROPERTY_TYPE)
               VALUES (
                   :WS-ADD-LOAN-NUM, :WS-ADD-CLIENT-ID,
                   :WS-ADD-BORROWER-NAME, :WS-ADD-STATE,
                   :WS-ADD-COVERAGE-TYPE, :WS-ADD-PROPERTY-VALUE,
                   :WS-ADD-FCI-CODE, :WS-ADD-EDI-FLAG,
                   'ACTIVE', :WS-ADD-UPB, :WS-ADD-PROPERTY-ADDR,
                   :WS-ADD-PROPERTY-TYPE)
           END-EXEC.`;

const SOURCES = [
  { id: 'loanrules', label: 'LoanRules.cpp', type: 'C++',   src: CPP_SOURCE },
  { id: 'tka900',    label: 'TKA900.cbl',    type: 'COBOL', src: COBOL_SOURCE },
  { id: 'tka901',    label: 'TKA901.cbl',    type: 'COBOL', src: TKA901 },
];

function colorize(line, type) {
  if (type === 'C++') {
    if (/^\s*\/\//.test(line)) return 'var(--muted)';
    if (/\b(BOOL|void|int|return|if|else|for|const|TRUE|FALSE|class|static)\b/.test(line)) return '#ff79c6';
    if (/_T\(|CString|CLoan|LPCTSTR/.test(line)) return '#8be9fd';
    if (/strErrorMessage|strLoanNum|strBorrower|strState|strFormId/.test(line)) return '#f1fa8c';
  }
  if (type === 'COBOL') {
    if (/^\s+\*/.test(line)) return 'var(--muted)';
    if (/^\s+(PERFORM|IF|MOVE|STOP|END-IF|AND|OR)\b/.test(line)) return '#ff79c6';
    if (/EXEC SQL|END-EXEC/.test(line)) return '#50fa7b';
    if (/WS-STATUS-CODE|WS-SQLCODE/.test(line)) return '#f1fa8c';
    if (/LSS_LOAN_T|LSS_CYCLE_STEP_T/.test(line)) return '#8be9fd';
    if (/^\s+\d{4}-/.test(line)) return '#bd93f9';
  }
  return 'var(--text)';
}

export default function CodeViewer() {
  const [active, setActive] = useState('loanrules');
  const [search, setSearch] = useState('');
  const src = SOURCES.find(s => s.id === active);
  const lines = src.src.split('\n');

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
        {SOURCES.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)} className={`pill ${active === s.id ? 'pill-blue' : ''}`}
            style={{ fontSize: 11, background: active === s.id ? '' : 'var(--surface2)', border: '1px solid var(--border)' }}>
            {s.label}
            <span style={{ marginLeft: 6, fontSize: 9, padding: '1px 4px', borderRadius: 2, background: s.type === 'C++' ? 'var(--orange)22' : 'var(--green)22', color: s.type === 'C++' ? 'var(--orange)' : 'var(--green)' }}>{s.type}</span>
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', padding: '3px 8px', fontSize: 11, width: 160 }} />
        {search && <span style={{ fontSize: 10, color: 'var(--muted)' }}>{lines.filter(l => l.toLowerCase().includes(search.toLowerCase())).length} matches</span>}
      </div>
      <div className="card" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
        <pre style={{ margin: 0, fontSize: 10, lineHeight: 1.6 }}>
          {lines.map((line, i) => {
            const hi = search && line.toLowerCase().includes(search.toLowerCase());
            return (
              <div key={i} style={{ display: 'flex', background: hi ? '#e3b34122' : 'transparent' }}>
                <span style={{ color: 'var(--muted)', minWidth: 36, paddingRight: 8, userSelect: 'none', textAlign: 'right', fontSize: 9 }}>{i + 1}</span>
                <span style={{ color: colorize(line, src.type), whiteSpace: 'pre' }}>{line}</span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}
