# Modern Stack Architecture Flow

## 1.2 Target State — System Context

```mermaid
%% Target State — Frontend: Angular web UI | APIs: .NET Core REST APIs | Database: Azure SQL
flowchart TB
  User[Operations User]
  UI[Angular Loan Maintenance UI]
  API[.NET Core API Layer]

  subgraph Services[Candidate Services]
    QuerySvc[Loan Query Service]
    CommandSvc[Loan Command Service]
    QuoteSvc[Quote Orchestration Service]
    EDISvc[EDI Notification Service]
  end

  DB[Azure SQL]
  RatingExt[RataBase Rating Service]
  IsoExt[Kentucky ISO Advisory Service]
  EDIExt[14E Notification Endpoint]

  User --> UI
  UI --> API
  API --> QuerySvc
  API --> CommandSvc
  API --> QuoteSvc
  API --> EDISvc

  QuerySvc --> DB
  CommandSvc --> DB
  QuoteSvc --> DB

  QuoteSvc --> RatingExt
  QuoteSvc --> IsoExt
  EDISvc --> EDIExt
```

## 4. Service Boundary Map

```mermaid
flowchart LR
  subgraph CoreLoan[Loan Core Domain]
    Query[Loan Query Service]
    Command[Loan Command Service]
    Rules[Loan Validation Domain Module]
  end

  subgraph Orchestration[Integration-Oriented Services]
    Quote[Quote Orchestration Service]
    EDI[EDI Notification Service]
  end

  subgraph SharedInfra[Shared Infrastructure]
    Routing[Tandem Routing Gateway Adapter]
    Rating[Rating Gateway Adapter]
    KY[Kentucky ISO Adapter]
  end

  Query --> Rules
  Command --> Rules
  Quote --> Rules
  EDI --> Rules

  Query --> Routing
  Command --> Routing
  Quote --> Rating
  Quote --> KY
  EDI --> Routing
```

## 5. Integration Map

| Integration Point | Protocol | Direction | Legacy System | Modern Target | Evidence |
|---|---|---|---|---|---|
| LOAN_SEARCH route | TME over TLS TCP (fgatetcp) | Outbound | TKA900 | .NET Core Loan Query Service -> Azure SQL read model | LoanSearchDlg path + service_decomposition mapping |
| ADD_LOAN route | TME over TLS TCP (fgatetcp) | Outbound | TKA901 | .NET Core Loan Command Service create endpoint | LoanAddDlg path + service_decomposition mapping |
| MODIFY_LOAN route | TME over TLS TCP (fgatetcp) | Outbound | TKA902 | .NET Core Loan Command Service update endpoint | LoanModifyDlg path + service_decomposition mapping |
| KY_ISO_QUERY route | TME over TLS TCP (fgatetcp) | Outbound | AIP930 | Quote Orchestration Service integration adapter | RataBaseServiceAdapter KY branch |
| 14E_NOTIFY route | TME over TLS TCP (fgatetcp) | Outbound | TKA920 | EDI Notification Service integration adapter | EDINotificationWriter dispatch path |
| External rating call | External service | Outbound | RataBase rating engine | Quote Orchestration Service external client | RataBaseServiceAdapter::GetQuote |

## 6. Architecture Decision Prompts

### 6.1 Coupling analysis prompts
- The analysis suggests query and command paths are naturally separable because legacy programs split read (TKA900) from write (TKA901/TKA902).
- The analysis suggests quote and EDI orchestration should remain distinct bounded services due to different external dependencies and failure semantics.
- The analysis suggests a shared validation module should be internally reused to avoid divergence between query, command, and orchestration entry points.

### 6.2 Pattern fitness
| Pattern | When it fits | Evidence from this analysis |
|---|---|---|
| modular monolith | When deployment simplicity is preferred but bounded modules are maintained | Services are cohesive but interrelated around one loan-maintenance domain |
| microservices | When independent scaling/deployment of quote/EDI and loan CRUD is required | Distinct external dependencies and rule clusters for quote and EDI paths |
| strangler fig | When replacing legacy routes incrementally by action | Explicit action routing exists per mnemonic and can be replaced endpoint by endpoint |
| CQRS | When query and command behavior differ materially | TKA900 read path and TKA901/TKA902 write paths are already separated |
| event-driven | When notification and quote side-effects should be decoupled | 14E dispatch and quote result processing are event-like side-effect operations |

### 6.3 Framing
The analysis suggests service boundaries and migration order candidates, but does not prescribe a single mandatory architecture pattern.

## 7. Legacy → Modern Mapping

```mermaid
flowchart LR
  subgraph Legacy
    L1[Loan Search Dialog]
    L2[Add Loan Dialog]
    L3[Modify Loan Dialog]
    L4[CLoanRules]
    L5[CTMELibAdapter]
    L6[CRataBaseServiceAdapter]
    L7[CEDINotificationWriter]
    L8[TKA900]
    L9[TKA901]
    L10[TKA902]
    L11[TKA920]
    L12[AIP930]
    L13[LSS_LOAN_T]
    L14[LSS_CYCLE_STEP_T]
  end

  subgraph Modern
    M1[Angular Loan Search UI]
    M2[Angular Add Loan UI]
    M3[Angular Modify Loan UI]
    M4[Domain Validation Module]
    M5[Loan Query Service]
    M6[Loan Command Service]
    M7[Quote Orchestration Service]
    M8[EDI Notification Service]
    M9[Azure SQL Loan Store]
    M10[External Integration Adapters]
  end

  L1 -.->|R-L-001,R-L-005| M1
  L2 -.->|R-L-009..R-L-013| M2
  L3 -.->|R-L-014| M3
  L4 -.->|R-L-001..R-L-014| M4
  L5 -.->|Routing paths| M10
  L6 -.->|R-L-003,R-L-004| M7
  L7 -.->|R-L-006..R-L-008| M8
  L8 -.->|Search model| M5
  L9 -.->|Create command| M6
  L10 -.->|Update command| M6
  L11 -.->|14E dispatch| M8
  L12 -.->|KY pre-call| M10
  L13 -.->|Loan data| M9
  L14 -.->|Cycle-step context| M9
```
