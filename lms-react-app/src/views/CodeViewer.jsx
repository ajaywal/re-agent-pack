import { useState } from 'react';

const CPP_SOURCE = `// lnmain.cpp — Assurant LMS Win32/MFC Frontend (~900 lines)
// HP NonStop C++ application — Pathway IPC client

#include "stdafx.h"
#include "LoanApp.h"
#include "pathway_ipc.h"
#include "validation.h"
#include "dialogs.h"

// ─── Constants ────────────────────────────────────────────────────────────────
#define PATHWAY_SERVER  "QLOTCALC_SRV"
#define IPC_TIMEOUT_MS  5000
#define MAX_LOAN_AMOUNT 5000000.00
#define MIN_LOAN_AMOUNT 1.00

// ─── Main Application Entry ───────────────────────────────────────────────────
int WINAPI WinMain(HINSTANCE hInst, HINSTANCE, LPSTR lpCmd, int nShow) {
    CLoanApp app;
    return app.Run(hInst, lpCmd, nShow);
}

// ─── Main Menu Handler ────────────────────────────────────────────────────────
void CLoanApp::ShowMainMenu() {
    CMainMenuDlg dlg(m_pMainWnd);
    int result = dlg.DoModal();
    switch (result) {
        case IDC_BTN_SEARCH: search_loan_screen(); break;
        case IDC_BTN_CREATE: create_loan_screen(); break;
        case IDC_BTN_UPDATE: update_loan_screen(); break;
        case IDCANCEL:       ExitApplication();    break;
    }
}

// ─── Create Loan Screen ───────────────────────────────────────────────────────
// Lines 280–380
void CLoanApp::create_loan_screen() {
    CCreateLoanDlg dlg(m_pMainWnd);
    if (dlg.DoModal() != IDOK) return;

    // BR-003: Client-side validation before IPC
    LOAN_INPUT input = dlg.GetInput();
    int rc = validate_loan_input_cpp(input);
    if (rc != 0) {
        CString msg = MapReturnCode(rc);
        MessageBox(NULL, msg, "Validation Error", MB_OK | MB_ICONWARNING);
        return;
    }

    // HP Pathway IPC call → QLOTCALC COBOL server
    QUOTE_RESULT quote;
    rc = PATHWAY_WRITEREAD(PATHWAY_SERVER, &input, sizeof(input),
                           &quote, sizeof(quote), IPC_TIMEOUT_MS);
    if (rc != 0) {
        MessageBox(NULL, "Pathway IPC error — server unavailable", "IPC Error", MB_OK | MB_ICONERROR);
        return;
    }

    // BR-007: Explicit confirmation dialog required
    CConfirmDialog confirm(m_pMainWnd, &quote);
    if (confirm.DoModal() != IDOK) return;

    // Write to LOAN_MASTER KSDS
    rc = WriteLoanMaster(input, quote);
    if (rc == 0) {
        MessageBox(NULL, "Loan created successfully.", "Success", MB_OK | MB_ICONINFORMATION);
        ShowMainMenu();
    }
}

// ─── Search Loan Screen ───────────────────────────────────────────────────────
void CLoanApp::search_loan_screen() {
    CSearchDlg dlg(m_pMainWnd);
    if (dlg.DoModal() != IDOK) return;

    CString loanId = dlg.GetLoanId();
    LOAN_RECORD record;
    int rc = ReadLoanMaster(loanId, &record);
    if (rc == 4) {
        MessageBox(NULL, "RC=04 — Record not found.", "Not Found", MB_OK | MB_ICONWARNING);
        return;
    }
    CDetailDlg detail(m_pMainWnd, &record);
    detail.DoModal();
}

// ─── Update Loan Screen ───────────────────────────────────────────────────────
// BR-008: 4 immutable fields enforced here
void CLoanApp::update_loan_screen() {
    CUpdateDlg dlg(m_pMainWnd);
    if (dlg.DoModal() != IDOK) return;

    LOAN_UPDATE upd = dlg.GetUpdate();
    // Enforce BR-008: reject attempt to change locked fields
    if (upd.loan_id_changed || upd.borrower_changed ||
        upd.amount_changed  || upd.rate_changed) {
        MessageBox(NULL, "BR-008: These fields are immutable after origination.",
                   "Locked Field", MB_OK | MB_ICONERROR);
        return;
    }
    int rc = UpdateLoanMaster(upd);
    if (rc == 0)
        MessageBox(NULL, "Record updated. Audit written.", "OK", MB_OK | MB_ICONINFORMATION);
}`;

const COBOL_SOURCE = `      * qlotcalc.cbl — HP Tandem COBOL QLOTCALC Server (~550 lines)
      * Handles loan quote calculations via Pathway IPC

       IDENTIFICATION DIVISION.
       PROGRAM-ID. QLOTCALC.
       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.

      * ─── Working Storage ────────────────────────────────────────────
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-LOAN-INPUT.
          05 WS-LOAN-AMOUNT    PIC 9(9)V99 COMP-3.
          05 WS-TERM-MONTHS    PIC 9(3)    COMP.
          05 WS-CREDIT-SCORE   PIC 9(3).
          05 WS-LOAN-TYPE      PIC X(40).
       01 WS-QUOTE-RESULT.
          05 WS-RATE-TIER      PIC X(2).
          05 WS-INTEREST-RATE  PIC 9(2)V99 COMP-3.
          05 WS-MONTHLY-PMT    PIC 9(9)V99 COMP-3.
          05 WS-INS-PREMIUM    PIC 9(8)V99 COMP-3.
          05 WS-TOTAL-COST     PIC 9(11)V99 COMP-3.
          05 WS-RETURN-CODE    PIC 9(2).
          05 WS-ERROR-MESSAGE  PIC X(80).
       01 WS-CALC-WORK.
          05 WS-MONTHLY-RATE   PIC 9(2)V9(8) COMP-3.
          05 WS-FACTOR         PIC 9(4)V9(8) COMP-3.
          05 WS-POWER          PIC 9(4)V9(8) COMP-3.
          05 WS-BASE-PREMIUM   PIC 9(8)V99 COMP-3.
          05 WS-TIER-MULT      PIC 9V99 COMP-3.

      * ─── Main Procedure ──────────────────────────────────────────────
       PROCEDURE DIVISION.
       §1000-MAIN.
           PERFORM §2000-VALIDATE-INPUT
           IF WS-RETURN-CODE NOT = 0
               PERFORM §9000-WRITE-AUDIT-LOG
               STOP RUN
           END-IF
           PERFORM §3000-DETERMINE-CREDIT-TIER
           PERFORM §4000-FETCH-BASE-RATE
           PERFORM §5000-FETCH-BASE-PREMIUM
           PERFORM §6000-CALC-MONTHLY-PAYMENT
           PERFORM §7000-CALC-INSURANCE-PREMIUM
           PERFORM §8000-CALCULATE-TOTALS
           PERFORM §9000-WRITE-AUDIT-LOG
           STOP RUN.

      * ─── §2000 Validate Input ─────────────────────────────────────────
       §2000-VALIDATE-INPUT.
           IF WS-LOAN-AMOUNT < 1 OR WS-LOAN-AMOUNT > 5000000
               MOVE 11 TO WS-RETURN-CODE
               MOVE "Amount must be $1-$5,000,000" TO WS-ERROR-MESSAGE
               PERFORM §9000-WRITE-AUDIT-LOG
               STOP RUN
           END-IF
           IF WS-TERM-MONTHS < 12 OR WS-TERM-MONTHS > 360
               MOVE 12 TO WS-RETURN-CODE
               MOVE "Term must be 12-360 months" TO WS-ERROR-MESSAGE
               PERFORM §9000-WRITE-AUDIT-LOG
               STOP RUN
           END-IF
           IF WS-CREDIT-SCORE < 300 OR WS-CREDIT-SCORE > 850
               MOVE 13 TO WS-RETURN-CODE
               MOVE "Credit score must be 300-850" TO WS-ERROR-MESSAGE
               PERFORM §9000-WRITE-AUDIT-LOG
               STOP RUN
           END-IF
           MOVE 0 TO WS-RETURN-CODE.

      * ─── §3000 Credit Tier Classification (BR-001) ───────────────────
       §3000-DETERMINE-CREDIT-TIER.
           EVALUATE TRUE
               WHEN WS-CREDIT-SCORE >= 750
                   MOVE "PR" TO WS-RATE-TIER
               WHEN WS-CREDIT-SCORE >= 680
                   MOVE "ST" TO WS-RATE-TIER
               WHEN WS-CREDIT-SCORE >= 620
                   MOVE "SP" TO WS-RATE-TIER
               WHEN OTHER
                   MOVE "DS" TO WS-RATE-TIER
           END-EVALUATE.

      * ─── §6000 Monthly Payment Calculation (BR-006) ─────────────────
       §6000-CALC-MONTHLY-PAYMENT.
           DIVIDE WS-INTEREST-RATE BY 1200
               GIVING WS-MONTHLY-RATE ROUNDED
           MOVE 1 TO WS-POWER
           PERFORM WS-TERM-MONTHS TIMES
               MULTIPLY WS-POWER BY (1 + WS-MONTHLY-RATE)
                   GIVING WS-POWER ROUNDED
           END-PERFORM
           COMPUTE WS-MONTHLY-PMT ROUNDED =
               WS-LOAN-AMOUNT * WS-MONTHLY-RATE * WS-POWER
               / (WS-POWER - 1).
      * NOTE: BR-006 — decimal loop required, NO Math.Pow() equivalent.

      * ─── §9000 Audit Log (BR-009) ────────────────────────────────────
       §9000-WRITE-AUDIT-LOG.
           MOVE FUNCTION CURRENT-DATE TO WS-AUDIT-TIMESTAMP
           WRITE AUDIT-RECORD FROM WS-AUDIT-REC.
      * Every QLOTCALC invocation writes exactly one AUDIT_LOG record.`;

const FILES = [
  { id: 'cpp', label: 'lnmain.cpp', tag: 'tag-warn', lang: 'C++ Win32/MFC', lines: '~900', src: CPP_SOURCE },
  { id: 'cobol', label: 'qlotcalc.cbl', tag: 'tag-success', lang: 'HP Tandem COBOL', lines: '~550', src: COBOL_SOURCE },
];

export default function CodeViewer() {
  const [activeFile, setActiveFile] = useState('cpp');
  const [search, setSearch] = useState('');

  const file = FILES.find(f => f.id === activeFile);
  const lines = file.src.split('\n');

  const filtered = search
    ? lines.map((l, i) => ({ line: l, num: i + 1, match: l.toLowerCase().includes(search.toLowerCase()) }))
    : lines.map((l, i) => ({ line: l, num: i + 1, match: false }));

  const hasSearch = search.length > 0;
  const matchCount = filtered.filter(l => l.match).length;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILES.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFile(f.id)}
              className={`pill ${activeFile === f.id ? 'pill-blue' : ''}`}
              style={{ fontSize: 11, background: activeFile === f.id ? '' : 'var(--surface2)', border: '1px solid var(--border)' }}
            >
              <span className={`tag ${f.tag}`} style={{ fontSize: 9, marginRight: 5 }}>{f.lang}</span>
              {f.label} <span style={{ color: 'var(--muted)', marginLeft: 4 }}>({f.lines} lines)</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search source..."
          style={{
            background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)',
            borderRadius: 5, padding: '4px 10px', fontSize: 11, width: 200,
          }}
        />
        {hasSearch && (
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>{matchCount} match{matchCount !== 1 ? 'es' : ''}</span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: '#0d1117', borderRadius: 6, border: '1px solid var(--border)', padding: 0 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: 'monospace', fontSize: 11 }}>
          <tbody>
            {filtered.map(({ line, num, match }) => (
              <tr
                key={num}
                style={{ background: match && hasSearch ? '#1f3a1f' : 'transparent' }}
              >
                <td style={{
                  width: 48, textAlign: 'right', padding: '1px 10px 1px 0',
                  color: '#484f58', userSelect: 'none', borderRight: '1px solid #21262d',
                  verticalAlign: 'top', lineHeight: '20px',
                }}>{num}</td>
                <td style={{ padding: '1px 12px', color: '#e6edf3', whiteSpace: 'pre', lineHeight: '20px' }}>
                  {hasSearch && match
                    ? highlightMatch(line, search)
                    : colorize(line, activeFile)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function highlightMatch(line, search) {
  const idx = line.toLowerCase().indexOf(search.toLowerCase());
  if (idx === -1) return line;
  return (
    <>
      {line.slice(0, idx)}
      <mark style={{ background: '#e3b34155', color: '#e3b341' }}>{line.slice(idx, idx + search.length)}</mark>
      {line.slice(idx + search.length)}
    </>
  );
}

function colorize(line, lang) {
  const trimmed = line.trim();
  if (lang === 'cobol') {
    if (trimmed.startsWith('*')) return <span style={{ color: '#8b949e' }}>{line}</span>;
    if (/^\s*(IDENTIFICATION|DATA|WORKING-STORAGE|PROCEDURE|PROGRAM-ID|ENVIRONMENT|CONFIGURATION)\b/.test(line))
      return <span style={{ color: '#ff7b72' }}>{line}</span>;
    if (/^\s*(PERFORM|MOVE|COMPUTE|MULTIPLY|DIVIDE|EVALUATE|WHEN|END-EVALUATE|END-IF|IF|STOP RUN|WRITE)\b/.test(line))
      return <span style={{ color: '#79c0ff' }}>{line}</span>;
    if (/^\s*§\d+/.test(trimmed))
      return <span style={{ color: '#e3b341' }}>{line}</span>;
    if (/PIC\s+/.test(line))
      return <span style={{ color: '#a5d6ff' }}>{line}</span>;
  } else {
    if (trimmed.startsWith('//'))
      return <span style={{ color: '#8b949e' }}>{line}</span>;
    if (/\b(void|int|if|else|return|switch|case|break|#include|#define)\b/.test(line))
      return <span style={{ color: '#ff7b72' }}>{line}</span>;
    if (/\bPATHWAY_WRITEREAD\b/.test(line))
      return <span style={{ color: '#d2a8ff' }}>{line}</span>;
    if (/\b(MessageBox|DoModal|GetInput)\b/.test(line))
      return <span style={{ color: '#79c0ff' }}>{line}</span>;
  }
  return <span>{line}</span>;
}
