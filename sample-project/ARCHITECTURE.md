# TrackAll Loan Maintenance — Sample Project Architecture

> This is a representative sample project, not the full production system.
> It is provided as a working illustration of the legacy VC++/MFC + HP NonStop architecture
> that the RE Agent Pack pipeline is designed to reverse-engineer.

---

## Purpose

This sample demonstrates the legacy technology stack for the **Loan Maintenance** subdomain
of the TrackAll system. It implements the Loan Search screen with production-representative
business rules, backed by in-memory data that simulates the HP NonStop / Tandem SQL/MP backend.

Leadership can open, build, and run this project in **Visual Studio 2022** to see the
legacy UI tier in action before modernisation begins.

---

## How to Run

1. Open `vs-project/TrackAllClientManagerLegacy.vcxproj` in Visual Studio 2022
2. Select **Debug | x64** (or Debug | Win32)
3. Press **F5** — the Loan Search dialog opens

---

## The Dialog

| Dialog | Class | Purpose |
|---|---|---|
| **Loan Search** | `CLoanSearchDlg` | Search loans by number or borrower name; triggers RataBase quote + 14E EDI dispatch for qualifying loans |

---

## Class Map

### UI Layer

| Class | File | Role |
|---|---|---|
| `CTrackAllClientManagerLegacyApp` | `TrackAllClientManagerLegacy.cpp/.h` | CWinApp entry point; instantiates Loan Maintenance objects |
| `CLoanSearchDlg` | `LoanSearchDlg.cpp/.h` | Loan search dialog — grid + quote status display |

### Business Rules Layer

| Class | File | Role |
|---|---|---|
| `CLoanRules` | `LoanRules.cpp/.h` | Loan validation: search input, state eligibility for RataBase carrier coverage, EDI eligibility, Instant Issue suppression, form-ID registration |

### Gateway / Adapter Layer

| Class | File | Role |
|---|---|---|
| `CTMELibAdapter` | `TMELibAdapter.cpp/.h` | Low-level TME library wrapper — dispatches `LOAN_SEARCH` (TKA900), `14E_NOTIFY` (TKA920), and KY ISO advisory (AIP930) via the LSS001T routing table |
| `CRataBaseServiceAdapter` | `RataBaseServiceAdapter.cpp/.h` | RataBase premium rating engine integration; gates loans on carrier-eligible states and Kentucky ISO pre-call |
| `CEDINotificationWriter` | `EDINotificationWriter.cpp/.h` | 14E outbound EDI notification writer — routes through `CTMELibAdapter::SendMessage("14E_NOTIFY")` to TKA920 |

### Domain Models

| Struct/Class | File | Fields |
|---|---|---|
| `CLoan` | `Loan.h` | LoanNumber, BorrowerName, ClientId, PropertyState, CoverageType, EdiFlag, CycleType, QuoteReqd, PropertyValue |

---

## Demo Seed Loans (in `CLoanSearchDlg::ExecuteLoanSearch`)

| Loan Number | Borrower | State | Product | Quote Required | Outcome |
|---|---|---|---|---|---|
| LN-2024-001 | James Anderson | KY | STANDARD | Yes | Triggers RataBase + KY ISO pre-call + 14E EDI dispatch |
| LN-2024-002 | Maria Hernandez | TX | INSTANT_ISSUE | No | No quote; 14E suppressed by Instant Issue rule |

---

## External Integrations

| Integration | Path |
|---|---|
| **Tandem TKA900** (`LOAN_SEARCH`) | `LoanSearchDlg.cpp` → `CTMELibAdapter::SendMessage("LOAN_SEARCH")` |
| **Tandem TKA920** (`14E_NOTIFY`) | `LoanSearchDlg.cpp` → `CEDINotificationWriter::Write14ERecord` → `CTMELibAdapter::SendMessage("14E_NOTIFY")` |
| **Tandem AIP930** (KY ISO advisory) | `LoanSearchDlg.cpp` → `CRataBaseServiceAdapter::GetQuote` (Kentucky pre-call branch) |
| **LSS001T routing table** | mnemonic dispatch inside the TME framework |
| **RataBase Rating Service** | `CRataBaseServiceAdapter::GetQuote` |
| **Servicer EDI (14E)** | `CEDINotificationWriter::Write14ERecord` |

---

## Business Rules Implemented

All rules are extracted and catalogued by the RE Agent Pack pipeline. Key examples:

| Rule | Location | Description |
|---|---|---|
| Search criteria required | `LoanSearchDlg.cpp` | Empty search rejected — mirrors TKA900 `2000-VALIDATE-INPUT` |
| Loan-number length / format | `LoanRules.cpp` | 10-character alphanumeric; longer values rejected by TKA900 SQL |
| Property state required for rating | `LoanRules.cpp` | Empty state blocked before RataBase call |
| Carrier-eligible states | `LoanRules.cpp` | RataBase has no rates outside the approved carrier state list |
| EDI enrolment | `LoanRules.cpp` | EDI_FLAG must be 'Y'; flag returned by TKA900 from LSS_LOAN_T |
| Instant Issue suppression | `LoanRules.cpp` | INSTANT_ISSUE cycle blocks 14E to avoid duplicate notification |
| Form-ID lender_target check | `LoanRules.cpp` | 14E rejected if form ID is not registered |
| Quote-required gate | `LoanRules.cpp` | QUOTE_REQD=Y triggers RataBase before result display |
| 14E audit trail | `LoanRules.cpp` | Every 14E dispatch records an audit message |

---

## Technology Stack

| Layer | Technology |
|---|---|
| UI | MFC (Microsoft Foundation Classes), CDialog, CListCtrl |
| Language | Visual C++ 17, Unicode |
| Build | Visual Studio 2022, v143 toolset, Dynamic MFC |
| Backend simulation | In-memory C++ (represents HP NonStop / Tandem SQL/MP) |
| Messaging | Simulated TME (Tandem Message Exchange) routing — mnemonic via LSS001T |
| Rating engine | Simulated RataBase premium rating service |
| EDI | Simulated 14E outbound EDI writer |

---

## What the Agents Extract From This Code

When you run the RE Agent Pack pipeline against `sample-project/src/`, the agents produce:

- **Screen inventory** — Loan Search dialog, all controls, field semantics
- **Field dictionary** — every field with data type, validation, and business meaning
- **Business rules** — ~14 rule cards extracted from `LoanRules.cpp` + `LoanSearchDlg.cpp`
- **Dependency map** — Action → handler → adapter → Tandem program / external service → candidate API
- **Service decomposition** — Loan Search Service + Loan Processing Service candidates
- **Traceability matrix** — every rule linked to source file + function + evidence

The modernisation team uses these artifacts to build the Angular + .NET Core + Azure SQL replacement.
