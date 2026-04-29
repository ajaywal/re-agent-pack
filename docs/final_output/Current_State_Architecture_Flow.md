# Current State Architecture Flow

## 1. Current State — System Context

```mermaid
%% Current State — VC++ MFC thick client (dialog-based, 182+ dialogs in full system) | HP NonStop / Tandem — HP NonStop COBOL programs, HP SQL/MP tables, TAL Gateway (derived from code analysis)
flowchart TB
  User[Operations User]

  subgraph Dialogs[Loan Maintenance Dialogs]
    LoanSearch[Loan Search Dialog]
    LoanAdd[Add Loan Dialog]
    LoanModify[Modify Loan Dialog]
  end

  subgraph LegacyServices[Legacy Logic and Adapters]
    Rules[CLoanRules]
    TME[CTMELibAdapter]
    Quote[CRataBaseServiceAdapter]
    EDI[CEDINotificationWriter]
    KY[CKentuckyISOAdapter]
  end

  subgraph LegacyBackend[Tandem Programs and SQL/MP Tables]
    P900[TKA900]
    P901[TKA901]
    P902[TKA902]
    P920[TKA920]
    AIP[AIP930]
    LoanTable[LSS_LOAN_T]
    CycleTable[LSS_CYCLE_STEP_T]
    RouteTable[LSS001T]
  end

  User --> LoanSearch
  User --> LoanAdd
  User --> LoanModify

  LoanSearch --> Rules
  LoanAdd --> Rules
  LoanModify --> Rules

  LoanSearch --> TME
  LoanAdd --> TME
  LoanModify --> TME

  LoanSearch --> Quote
  Quote --> KY
  LoanSearch --> EDI

  TME --> P900
  TME --> P901
  TME --> P902
  TME --> P920
  TME --> AIP
  TME --> RouteTable

  P900 --> LoanTable
  P900 --> CycleTable
  P901 --> LoanTable
  P902 --> LoanTable
```

## 2. Business Process Flows

### 2.1 Search Loans (as-is)
```mermaid
flowchart TD
  Actor[Operations User] --> Screen[Loan Search]
  Screen --> Action[Click Search]
  Action --> Validate{Criteria valid?}
  Validate -->|R-L-001,R-L-002 fail| Msg1[Show validation message]
  Validate -->|Pass| Service[Loan query path]
  Service --> External[TKA900 / LSS_LOAN_T / LSS_CYCLE_STEP_T]
```

### 2.2 Process Search Result with Quote (as-is)
```mermaid
flowchart TD
  Actor[Operations User] --> Screen[Loan Search Results]
  Screen --> Action[Double-click or process selected result]
  Action --> Validate{Quote required and eligible?}
  Validate -->|R-L-005 false| NoQuote[Skip quote path]
  Validate -->|R-L-003,R-L-004 pass| QuoteService[CRataBaseServiceAdapter]
  QuoteService --> External[RataBase and AIP930 (KY branch)]
```

### 2.3 Dispatch 14E Notification (as-is)
```mermaid
flowchart TD
  Actor[Operations User] --> Screen[Loan Search Result Processing]
  Screen --> Action[Trigger placement notification]
  Action --> Validate{14E eligible?}
  Validate -->|R-L-006,R-L-007,R-L-008 fail| Suppress[Suppress 14E and return reason]
  Validate -->|Pass| Notify[CEDINotificationWriter dispatch]
  Notify --> External[TKA920 14E notification route]
```

### 2.4 Add Loan (as-is)
```mermaid
flowchart TD
  Actor[Operations User] --> Screen[Add Loan]
  Screen --> Action[Click Add Loan]
  Action --> Validate{Add validations pass?}
  Validate -->|R-L-002,R-L-009,R-L-010,R-L-011,R-L-012,R-L-013 fail| Msg2[Show validation message]
  Validate -->|Pass| Service[Add loan command]
  Service --> External[TKA901 insert LSS_LOAN_T]
```

### 2.5 Modify Loan (as-is)
```mermaid
flowchart TD
  Actor[Operations User] --> Screen[Modify Loan]
  Screen --> Action[Click Save Changes]
  Action --> Validate{Modify validations pass?}
  Validate -->|R-L-014 fail| Msg3[Show validation message]
  Validate -->|Pass| Service[Modify loan command]
  Service --> External[TKA902 update LSS_LOAN_T]
```

## 3. Technical Dependency Flows

### 3.1 Save/Add flow
```mermaid
sequenceDiagram
  participant UI as LoanAddDlg
  participant Handler as OnBnClickedAdd
  participant Service as CLoanRules.ValidateLoanForAdd
  participant Repository as TKA901
  participant Gateway as CTMELibAdapter

  UI->>Handler: add action
  Handler->>Service: validate payload (R-L-002,R-L-009..R-L-013)
  Service-->>Handler: pass/fail
  Handler->>Gateway: SendMessage(ADD_LOAN)
  Gateway->>Repository: route to TKA901
  Repository-->>Gateway: insert status
  Gateway-->>UI: response
```

### 3.2 Search flow
```mermaid
sequenceDiagram
  participant UI as LoanSearchDlg
  participant Handler as OnBnClickedSearch
  participant Service as CLoanRules.ValidateLoanForSearch
  participant Repository as TKA900
  participant Gateway as CTMELibAdapter

  UI->>Handler: search action
  Handler->>Service: validate criteria (R-L-001,R-L-002)
  Service-->>Handler: pass/fail
  Handler->>Gateway: SendMessage(LOAN_SEARCH)
  Gateway->>Repository: route to TKA900
  Repository-->>Gateway: loan + cycle data
  Gateway-->>UI: results
```

### 3.3 Process/notification flow
```mermaid
sequenceDiagram
  participant UI as LoanSearchDlg
  participant Handler as ProcessLoanResult
  participant Service as Quote and EDI Rules
  participant Repository as Legacy Data Context
  participant Gateway as CTMELibAdapter

  UI->>Handler: process selected loan
  Handler->>Service: quote gate check (R-L-005)
  Service->>Gateway: optional quote-related call (R-L-003,R-L-004)
  Handler->>Service: 14E eligibility (R-L-006,R-L-007,R-L-008)
  Service->>Gateway: SendMessage(14E_NOTIFY)
  Gateway->>Repository: route to TKA920
  Repository-->>Gateway: dispatch status
  Gateway-->>UI: process result
```

## 5. Integration Map

| Integration Point | Protocol | Direction | Legacy System | Evidence |
|---|---|---|---|---|
| LOAN_SEARCH mnemonic route | TME over TLS TCP (fgatetcp) | Outbound request/response | TKA900 + SQL/MP tables | LoanSearchDlg::ExecuteLoanSearch; TMELibAdapter::SendMessage |
| ADD_LOAN mnemonic route | TME over TLS TCP (fgatetcp) | Outbound request/response | TKA901 + LSS_LOAN_T | LoanAddDlg::OnBnClickedAdd; TMELibAdapter::SendMessage |
| MODIFY_LOAN mnemonic route | TME over TLS TCP (fgatetcp) | Outbound request/response | TKA902 + LSS_LOAN_T | LoanModifyDlg::OnBnClickedModify; TMELibAdapter::SendMessage |
| KY_ISO_QUERY route | TME over TLS TCP (fgatetcp) | Outbound request/response | AIP930 | RataBaseServiceAdapter::GetQuote; TMELibAdapter routing map |
| 14E_NOTIFY route | TME over TLS TCP (fgatetcp) | Outbound request/response | TKA920 | EDINotificationWriter::Write14ERecord; TMELibAdapter::SendMessage |
| RataBase rating call | External service call | Outbound request/response | RataBase rating engine | RataBaseServiceAdapter::GetQuote |
