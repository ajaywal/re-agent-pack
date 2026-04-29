# Modernization Blueprint — TrackAllLoanMaintenanceLegacy

## Working App Generator

This blueprint is designed so that pasting it into any AI (Claude, ChatGPT, Copilot) with the prompt
"Generate a working Loan Maintenance app from this blueprint" produces a runnable application in the Modernisation Target stack from RE_AGENTS_CONFIG.md, with unit tests. Every spec is code-scaffold level — not just field lists, but actual source files, controller stubs, schema DDL, and test class skeletons.

**To generate the full working app in one shot:**
Paste this entire document into Claude or GPT-4o and say:
> "Generate a working Loan Maintenance application using Angular 17 + .NET Core 8 Web API + Azure SQL.
> Use the TypeScript interfaces, C# stubs, SQL DDL, and unit test skeletons in this document as your
> starting point. Wire the Angular service to the .NET API. Use the SQL scripts to create the database
> schema. Return working, compilable code for all scaffolds.
>
> Mandatory: follow the strict DDD folder structure defined in Part 2.5 exactly.
> Do NOT use a flat Services/ folder — all business logic must be distributed across Domain/,
> Application/, Infrastructure/, and Presentation/ as specified. The dependency arrow always
> points inward: Domain has zero framework references, Application depends only on Domain,
> Infrastructure depends on Domain and Application, Presentation depends only on Application.
> DbContext belongs exclusively in Infrastructure/ — never in services, command handlers, or controllers."

**To generate one piece at a time:**
1. Copy a UI spec -> paste into AI -> "Generate this Angular 17 component with Reactive Forms"
2. Copy a Service spec -> paste into AI -> "Generate this .NET Core 8 controller and service with DI"
3. Copy a Schema spec -> paste into AI -> "Generate EF Core 8 entity, DbContext config, and migration SQL"
4. Copy a Unit Test spec -> paste into AI -> "Generate xUnit test class with these test stubs filled in"

**Target stack:** Frontend: Angular web UI; APIs: .NET Core REST APIs; Database: Azure SQL

**Glossary of code identifiers:** see docs/glossary.md for plain-English definitions of legacy column names, system identifiers, and external integration terms.

## Part 0 — Build the First Vertical Slice

Use this walkthrough to prove the target stack end-to-end with the simplest approved rule before expanding to the rest of the Blueprint.

**Goal**: Starting from a single rule card in the FRD, build a runnable UI -> API -> DB slice that enforces that rule.

1. **Pick the seed rule** — use R-L-001 (Search Requires At Least One Criterion) on Loan Search. It is high-confidence, code-grounded, and has a direct user-facing validation branch.
2. **Build UI-001** — generate LoanSearchComponent with Reactive Forms and required validation enforcing at least one of loan number or borrower name.
3. **Build SVC-001** — generate LoanQueryController + LoanQueryService with search endpoint and validation branch for R-L-001/R-L-002.
4. **Build DB-001** — generate Loan entity mapping and initial migration with core loan identity and searchable columns.
5. **Write the acceptance test** — create one end-to-end test: invalid empty criteria returns 400 with rule-linked message, valid criteria returns result list. Name pattern example: given_empty_search_criteria_when_search_then_400_R-L-001.
6. **Wire and run locally** — Angular UI -> .NET API -> Azure SQL. Commit this vertical slice as the template for the remaining specifications.

**Why a vertical slice first**: one complete slice validates architecture, contracts, and validation behavior before scaling to all remaining rules.

## Part 1 — UI Component Specifications

### UI-001: LoanSearchComponent
**Angular Component:** loan-search.component.ts
**Route:** /loans/search
**Legacy Source:** LoanSearchDlg.cpp, IDD_LOAN_SEARCH

#### TypeScript Interface Scaffold
```typescript
export interface LoanSearchCriteria {
  loanNum?: string;          // R-L-001,R-L-002: at least one criterion; 10-digit numeric if provided
  borrowerName?: string;     // R-L-001: alternate required criterion
  propertyAddress?: string;  // [inferred] optional search criterion from UI binding
}

export interface LoanSearchResult {
  loanNum: string;           // R-L-002
  borrowerName: string;
  propertyAddress: string;
  propertyState: string;     // R-L-003,R-L-004
  quoteReqd: string;         // R-L-005
  ediFlag: string;           // R-L-006
  cycleType: string;         // R-L-007
  lenderFormId?: string;     // R-L-008
}
```

#### Reactive Form Scaffold
```typescript
this.searchForm = this.fb.group({
  loanNum: ['', [Validators.pattern(/^\d{10}$/)]], // R-L-002
  borrowerName: [''],                               // R-L-001
  propertyAddress: ['']                             // [inferred]
}, {
  validators: [atLeastOneFieldValidator(['loanNum', 'borrowerName'])] // R-L-001
});
```

#### Fields
| Field | Type | Control | Validation Rules | Binding |
|---|---|---|---|---|
| loanNum | string | input | R-L-001, R-L-002 | searchForm.controls.loanNum |
| borrowerName | string | input | R-L-001 | searchForm.controls.borrowerName |
| propertyAddress | string | input | [inferred] optional | searchForm.controls.propertyAddress |
| quoteStatus | string | status banner | R-L-005 | quoteStatus$ |

#### Actions
| Action | Trigger | API Call | Method | Business Rules |
|---|---|---|---|---|
| Search loans | Search button | /api/loans/search | GET | R-L-001, R-L-002 |
| Process selected result | Row action | /api/loans/{loanNumber}/process-result | POST | R-L-003,R-L-004,R-L-005,R-L-006,R-L-007,R-L-008 |

#### Acceptance Criteria
- [ ] Search blocks when both loan number and borrower are blank (R-L-001).
- [ ] Loan number format errors show when value is not 10 digits (R-L-002).
- [ ] Quote path shows no-quote status when quoteReqd is not Y (R-L-005).
- [ ] 14E path returns suppression reasons for ineligible loans (R-L-006,R-L-007,R-L-008).

### UI-002: AddLoanComponent
**Angular Component:** add-loan.component.ts
**Route:** /loans/add
**Legacy Source:** LoanAddDlg.cpp, IDD_LOAN_ADD

#### TypeScript Interface Scaffold
```typescript
export interface CreateLoanRequest {
  loanNum: string;            // R-L-002,R-L-009
  borrowerName: string;       // R-L-009
  propertyAddress: string;    // R-L-011
  propertyState?: string;
  propertyType: string;       // R-L-013
  loanStatus: string;         // R-L-012
  propertyValue: number;      // R-L-010
  unpaidPrincipalBalance: number; // R-L-012
  // System-assigned fields — not on the Add screen in the legacy app.
  // Legacy source: populated by TKA900 from LSS_CYCLE_STEP_T after loan creation.
  // [Gap] How these are set in the modern system is an open architecture decision:
  //   (a) add as optional inputs on the Add screen,
  //   (b) derive from a cycle-step lookup at creation time, or
  //   (c) set by a subsequent business process.
  // Until resolved, include them as optional so loans can be processed after they are set.
  quoteReqd?: string;         // R-L-005 — gates quote path; 'Y' or 'N'
  ediFlag?: string;           // R-L-006 — gates EDI dispatch path; 'Y' or 'N'
  cycleType?: string;         // R-L-007 — 'INSTANT_ISSUE' suppresses 14E
  lenderFormId?: string;      // R-L-008 — required for 14E dispatch
}
```

#### Reactive Form Scaffold
```typescript
this.addForm = this.fb.group({
  loanNum: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]], // R-L-002,R-L-009
  borrowerName: ['', [Validators.required]],                              // R-L-009
  propertyAddress: ['', [Validators.required]],                           // R-L-011
  propertyType: ['', [Validators.required]],                              // R-L-013
  loanStatus: ['ACTIVE', [Validators.required]],                          // R-L-012
  propertyValue: [0, [Validators.min(0.01)]],                             // R-L-010
  unpaidPrincipalBalance: [0, [Validators.min(0.01)]]                     // R-L-012
});
```

#### Fields
| Field | Type | Control | Validation Rules | Binding |
|---|---|---|---|---|
| loanNum | string | input | R-L-002,R-L-009 | addForm.controls.loanNum |
| borrowerName | string | input | R-L-009 | addForm.controls.borrowerName |
| propertyAddress | string | input | R-L-011 | addForm.controls.propertyAddress |
| propertyType | string | input/select | R-L-013 | addForm.controls.propertyType |
| loanStatus | string | input/select | R-L-012 | addForm.controls.loanStatus |
| propertyValue | number | numeric input | R-L-010 | addForm.controls.propertyValue |
| unpaidPrincipalBalance | number | numeric input | R-L-012 | addForm.controls.unpaidPrincipalBalance |

#### Actions
| Action | Trigger | API Call | Method | Business Rules |
|---|---|---|---|---|
| Create loan | Add Loan button | /api/loans | POST | R-L-002,R-L-009,R-L-010,R-L-011,R-L-012,R-L-013 |

#### Acceptance Criteria
- [ ] Missing identity fields block creation (R-L-009).
- [ ] Non-positive property value is rejected (R-L-010).
- [ ] Blank property address is rejected (R-L-011).
- [ ] Non-ACTIVE status or non-positive UPB is rejected (R-L-012).
- [ ] Invalid property type is rejected (R-L-013).

### UI-003: ModifyLoanComponent
**Angular Component:** modify-loan.component.ts
**Route:** /loans/:loanNumber/modify
**Legacy Source:** LoanModifyDlg.cpp, IDD_LOAN_MODIFY

#### TypeScript Interface Scaffold
```typescript
export interface UpdateLoanRequest {
  loanNum: string;                 // R-L-014 immutable key
  borrowerName?: string;
  propertyAddress: string;         // R-L-014 non-blank
  loanStatus: string;              // R-L-014 transition guard
  unpaidPrincipalBalance: number;  // R-L-014 non-increasing
  propertyValue?: number;
}
```

#### Reactive Form Scaffold
```typescript
this.modifyForm = this.fb.group({
  loanNum: [{ value: '', disabled: true }],                // R-L-014
  borrowerName: [''],
  propertyAddress: ['', [Validators.required]],            // R-L-014
  loanStatus: ['', [Validators.required]],                 // R-L-014
  unpaidPrincipalBalance: [0, [Validators.min(0)]],        // R-L-014 (with server compare)
  propertyValue: [0]
});
```

#### Fields
| Field | Type | Control | Validation Rules | Binding |
|---|---|---|---|---|
| loanNum | string | read-only text | R-L-014 | modifyForm.controls.loanNum |
| propertyAddress | string | input | R-L-014 | modifyForm.controls.propertyAddress |
| loanStatus | string | input/select | R-L-014 | modifyForm.controls.loanStatus |
| unpaidPrincipalBalance | number | numeric input | R-L-014 | modifyForm.controls.unpaidPrincipalBalance |

#### Actions
| Action | Trigger | API Call | Method | Business Rules |
|---|---|---|---|---|
| Save changes | Save Changes button | /api/loans/{loanNumber} | PUT | R-L-014 |

#### Acceptance Criteria
- [ ] Immutable key remains unchanged through save action (R-L-014).
- [ ] Invalid status transitions are rejected (R-L-014).
- [ ] UPB increase is rejected (R-L-014).
- [ ] Clearing property address is rejected (R-L-014, unresolved server parity A-001).

## Part 2 — API Service Specifications

### SVC-001: LoanQueryService
**.NET Controller:** LoanQueryController.cs
**Service Class:** LoanQueryService.cs
**Legacy Source:** LoanSearchDlg.cpp, LoanRules.cpp, TKA900.cbl

#### C# Controller Stub
```csharp
using Microsoft.AspNetCore.Mvc;

namespace TrackAllLoanMaintenanceLegacy.Presentation.Controllers;

[ApiController]
[Route("api/loans")]
public class LoanQueryController : ControllerBase
{
    private readonly ILoanQueryService _service;

    public LoanQueryController(ILoanQueryService service)
    {
        _service = service;
    }

    [HttpGet("search")]
    public async Task<ActionResult<IReadOnlyList<LoanSearchResultDto>>> SearchLoans([FromQuery] LoanSearchCriteriaDto request)
    {
        // R-L-001: At least one criterion required
        // R-L-002: Loan number must be 10 digits when provided
        throw new NotImplementedException();
    }
}
```

#### Endpoints
| Method | Route | Request | Response | Rules Enforced |
|---|---|---|---|---|
| GET | /api/loans/search | LoanSearchCriteriaDto | IReadOnlyList<LoanSearchResultDto> | R-L-001,R-L-002 |

#### Dependencies
- Loan read repository for Azure SQL projections.
- Validation module for search guardrails.

#### Error Responses
| HTTP Status | Condition | Rule ID | User-facing message |
|---|---|---|---|
| 400 Bad Request | Empty search criteria | R-L-001 | Enter at least one search value before searching. |
| 400 Bad Request | Invalid loan number format | R-L-002 | Loan number must be exactly 10 digits. |
| 404 Not Found | No matching loans | [inferred] | No loans matched the supplied criteria. |
| 500 Internal Server Error | Unexpected processing failure | [inferred] | Search could not be completed at this time. |

### SVC-002: LoanCommandService
**.NET Controller:** LoanCommandController.cs
**Service Class:** LoanCommandService.cs
**Legacy Source:** LoanAddDlg.cpp, LoanModifyDlg.cpp, LoanRules.cpp, TKA901.cbl, TKA902.cbl

#### C# Controller Stub
```csharp
using Microsoft.AspNetCore.Mvc;

namespace TrackAllLoanMaintenanceLegacy.Presentation.Controllers;

[ApiController]
[Route("api/loans")]
public class LoanCommandController : ControllerBase
{
    private readonly ILoanCommandService _service;

    public LoanCommandController(ILoanCommandService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<ActionResult<LoanDto>> CreateLoan([FromBody] CreateLoanRequestDto request)
    {
        // R-L-009,R-L-010,R-L-011,R-L-012,R-L-013 and shared R-L-002
        throw new NotImplementedException();
    }

    [HttpPut("{loanNumber}")]
    public async Task<ActionResult<LoanDto>> UpdateLoan(string loanNumber, [FromBody] UpdateLoanRequestDto request)
    {
        // R-L-014
        throw new NotImplementedException();
    }
}
```

#### Endpoints
| Method | Route | Request | Response | Rules Enforced |
|---|---|---|---|---|
| POST | /api/loans | CreateLoanRequestDto | LoanDto | R-L-002,R-L-009,R-L-010,R-L-011,R-L-012,R-L-013 |
| PUT | /api/loans/{loanNumber} | UpdateLoanRequestDto | LoanDto | R-L-014 |

#### Dependencies
- Loan repository (read/write).
- Validation domain module.
- Audit repository for state-changing operations.

#### Error Responses
| HTTP Status | Condition | Rule ID | User-facing message |
|---|---|---|---|
| 400 Bad Request | Missing required identity fields | R-L-009 | Loan number and borrower name are required. |
| 400 Bad Request | Property value <= 0 | R-L-010 | Property value must be greater than zero. |
| 400 Bad Request | Blank property address | R-L-011 | Property address is required. |
| 400 Bad Request | Invalid initial status or UPB | R-L-012 | New loans must be ACTIVE with positive UPB. |
| 400 Bad Request | Invalid property type | R-L-013 | Property type must be RESIDENTIAL or COMMERCIAL. |
| 400 Bad Request | Modify transition or key constraints violated | R-L-014 | Update violates loan modification rules. |
| 404 Not Found | Loan not found for update | [inferred] | Loan not found. |
| 409 Conflict | Duplicate loan key on create | [inferred] | Loan already exists. |
| 500 Internal Server Error | Unexpected command failure | [inferred] | Loan command failed due to an internal error. |

### SVC-003: QuoteOrchestrationService
**.NET Controller:** QuoteController.cs
**Service Class:** QuoteOrchestrationService.cs
**Legacy Source:** LoanSearchDlg.cpp, LoanRules.cpp, RataBaseServiceAdapter.cpp

#### C# Controller Stub
```csharp
using Microsoft.AspNetCore.Mvc;

namespace TrackAllLoanMaintenanceLegacy.Presentation.Controllers;

[ApiController]
[Route("api/quotes")]
public class QuoteController : ControllerBase
{
    private readonly IQuoteOrchestrationService _service;

    public QuoteController(IQuoteOrchestrationService service)
    {
        _service = service;
    }

    [HttpPost("loan/{loanNumber}")]
    public async Task<ActionResult<QuoteResultDto>> GetLoanQuote(string loanNumber)
    {
        // R-L-003: approved property state required
        // R-L-004: KY requires ISO pre-call
        // R-L-005: quote path only when quoteReqd == Y
        throw new NotImplementedException();
    }
}
```

#### Endpoints
| Method | Route | Request | Response | Rules Enforced |
|---|---|---|---|---|
| POST | /api/quotes/loan/{loanNumber} | loanNumber path param | QuoteResultDto | R-L-003,R-L-004,R-L-005 |

#### Dependencies
- Loan query repository for property/cycle context.
- Rating adapter client.
- Kentucky ISO adapter client.

#### Error Responses
| HTTP Status | Condition | Rule ID | User-facing message |
|---|---|---|---|
| 400 Bad Request | Property state not approved for quote | R-L-003 | Quote is not available for this property state. |
| 400 Bad Request | Quote not required by cycle flag | R-L-005 | Quote is not required for this loan cycle step. |
| 504 Gateway Timeout | KY ISO pre-call timed out | R-L-004 | Kentucky ISO lookup timed out. Try again. |
| 500 Internal Server Error | Unexpected rating orchestration error | [inferred] | Quote request failed unexpectedly. |

### SVC-004: EdiNotificationService
**.NET Controller:** EdiNotificationController.cs
**Service Class:** EdiNotificationService.cs
**Legacy Source:** LoanSearchDlg.cpp, LoanRules.cpp, EDINotificationWriter.cpp, TMELibAdapter.cpp

#### C# Controller Stub
```csharp
using Microsoft.AspNetCore.Mvc;

namespace TrackAllLoanMaintenanceLegacy.Presentation.Controllers;

[ApiController]
[Route("api/edi/notifications")]
public class EdiNotificationController : ControllerBase
{
    private readonly IEdiNotificationService _service;

    public EdiNotificationController(IEdiNotificationService service)
    {
        _service = service;
    }

    [HttpPost("14e")]
    public async Task<ActionResult<EdiDispatchResultDto>> Dispatch14E([FromBody] Dispatch14ERequestDto request)
    {
        // R-L-006,R-L-007,R-L-008
        throw new NotImplementedException();
    }
}
```

#### Endpoints
| Method | Route | Request | Response | Rules Enforced |
|---|---|---|---|---|
| POST | /api/edi/notifications/14e | Dispatch14ERequestDto | EdiDispatchResultDto | R-L-006,R-L-007,R-L-008 |

#### Dependencies
- Loan read repository.
- EDI format selector and dispatch adapter.
- Audit writer dependency.

#### Error Responses
| HTTP Status | Condition | Rule ID | User-facing message |
|---|---|---|---|
| 400 Bad Request | Loan not enrolled for EDI | R-L-006 | 14E notification is not allowed because EDI enrollment is not active. |
| 400 Bad Request | Instant Issue cycle suppresses 14E | R-L-007 | 14E notification is suppressed for Instant Issue cycle. |
| 400 Bad Request | Form ID not in registered list | R-L-008 | 14E notification is not allowed for this lender form ID. |
| 504 Gateway Timeout | External dispatch path timed out | [inferred] | Notification dispatch timed out. |
| 500 Internal Server Error | Unexpected EDI processing failure | [inferred] | Notification dispatch failed unexpectedly. |

## Part 2.5 — Domain Layer (Strict DDD)

> Generated from rule register. All behaviour methods, Value Objects, and Repository interfaces are derived from extracted rules.

### DDD Layer Map
| Blueprint Section | DDD Layer |
|---|---|
| Part 1 — UI Specifications | Presentation (Angular) |
| Part 2 — Controllers | Presentation (.NET Core) |
| Part 2 — Service logic | Application (Commands / Queries) |
| Part 2.5 — Domain Entities, Value Objects, Repos, Events | Domain |
| Part 2.5 — EF Core DbContext + Repository implementations | Infrastructure |
| Part 3 — SQL DDL | Infrastructure (persistence) |
| Part 4 — xUnit Test Stubs | Tests |

### Mandatory Folder Structure
```text
TrackAllLoanMaintenanceLegacy/
├── Domain/
│   ├── Entities/
│   ├── ValueObjects/
│   ├── Ports/
│   ├── Repositories/
│   └── Events/
├── Application/
│   ├── Commands/
│   ├── Queries/
│   └── DTOs/
├── Infrastructure/
│   ├── Persistence/
│   ├── Repositories/
│   └── ExternalServices/
└── Presentation/
    └── Controllers/
```

### DDD-001: Loan Aggregate Root
- Entity: LoanAggregate
- Behavior methods:
  - ValidateSearchCriteria() -> R-L-001,R-L-002
  - ValidateCreate() -> R-L-009..R-L-013
  - ValidateModifyTransition() -> R-L-014
  - RequiresQuote() -> R-L-005
  - ValidateQuoteEligibility() -> R-L-003,R-L-004
  - ValidateEdiEligibility() -> R-L-006..R-L-008

Example:
```csharp
// R-L-005: Quote is required only when QUOTE_REQD is Y.
public bool RequiresQuote() => QuoteReqd == "Y";
```

### DDD-002: Value Objects
- LoanNumber (R-L-002)
- PropertyType (R-L-013)
- LoanStatus (R-L-012,R-L-014)
- PositiveMoney (R-L-010,R-L-012,R-L-014)
- LenderFormId (R-L-008)

Each as sealed record with constructor guard and ArgumentException carrying rule ID.

### DDD-003: Repository Interfaces
- ILoanRepository
  - Task<IReadOnlyList<LoanAggregate>> SearchAsync(LoanSearchCriteria criteria, CancellationToken ct)
  - Task<LoanAggregate?> GetByLoanNumberAsync(string loanNumber, CancellationToken ct)
  - Task AddAsync(LoanAggregate loan, CancellationToken ct)
  - Task UpdateAsync(LoanAggregate loan, CancellationToken ct)
- ILoanAuditRepository
  - Task WriteAsync(LoanAuditEntry entry, CancellationToken ct)

### DDD-004: Domain Events
- LoanCreatedEvent (R-L-009..R-L-013)
- LoanModifiedEvent (R-L-014)
- QuoteRequestedEvent (R-L-005)
- QuoteRetrievedEvent (R-L-003,R-L-004)
- Edi14EDispatchRequestedEvent (R-L-006..R-L-008)
- Edi14EDispatchSuppressedEvent (R-L-006..R-L-008)

### DDD-005: Application Layer — Commands and Queries
- Queries:
  - SearchLoansQuery / SearchLoansQueryHandler
  - GetLoanByIdQuery / GetLoanByIdQueryHandler
- Commands:
  - CreateLoanCommand / CreateLoanCommandHandler
  - UpdateLoanCommand / UpdateLoanCommandHandler
  - ProcessLoanResultCommand / ProcessLoanResultCommandHandler
  - Dispatch14ENotificationCommand / Dispatch14ENotificationCommandHandler

**ProcessLoanResultCommandHandler — orchestration pattern:**

R-L-005 (QuoteReqd) and R-L-006 (EdiFlag) are **state/routing** rules — they gate whether a path runs at all, not just validate inside it. Both must generate conditional guards, not unconditional calls:

```csharp
// Quote path — state/routing: only enter if QuoteReqd = Y (R-L-005)
if (entity.RequiresQuote())
{
    entity.ValidateQuoteEligibility();         // R-L-003,R-L-004
    if (entity.PropertyState == "KY")
        await _kentuckyIso.GetInfoAsync(...);   // R-L-004
    quote = await _rataBase.GetQuoteAsync(...); // R-L-003
}

// EDI path — state/routing: only enter if EdiFlag = Y (R-L-006)
if (string.Equals(entity.EdiFlag, "Y", StringComparison.OrdinalIgnoreCase))
{
    entity.ValidateEdiEligibility();           // R-L-006,R-L-007,R-L-008
    dispatch = await _edi.Dispatch14EAsync(...);
}
```

Do **not** call `ValidateEdiEligibility()` unconditionally — loans with `EdiFlag = N` must silently skip the EDI path, not throw.

### DDD-006: Infrastructure — EF Core
1. TrackAllLoanDbContext with DbSet<LoanEntity> and DbSet<LoanAuditEntity>.
2. LoanRepository : ILoanRepository and LoanAuditRepository : ILoanAuditRepository stubs with NotImplementedException bodies.

## Part 3 — Database Schema Specifications

### DB-001: Loan
**Azure SQL:** dbo.Loan
**EF Core Entity:** LoanEntity.cs
**Legacy Source:** field_dictionary.md, LSS_SCHEMA.sql

#### SQL DDL
```sql
CREATE TABLE dbo.Loan (
    LoanId INT IDENTITY(1,1) PRIMARY KEY,
    LoanNum CHAR(10) NOT NULL,               -- R-L-002
    BorrowerName NVARCHAR(100) NOT NULL,     -- R-L-009
    PropertyAddress NVARCHAR(255) NOT NULL,  -- R-L-011
    PropertyState CHAR(2) NULL,              -- R-L-003,R-L-004
    PropertyType NVARCHAR(20) NOT NULL,      -- R-L-013
    LoanStatus NVARCHAR(20) NOT NULL,        -- R-L-012,R-L-014
    PropertyValue DECIMAL(18,2) NOT NULL,    -- R-L-010
    UnpaidPrincipalBalance DECIMAL(18,2) NOT NULL, -- R-L-012,R-L-014
    QuoteReqd CHAR(1) NULL,                  -- R-L-005
    EdiFlag CHAR(1) NULL,                    -- R-L-006
    CycleType NVARCHAR(30) NULL,             -- R-L-007
    LenderFormId NVARCHAR(20) NULL,          -- R-L-008
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL
);
```

#### Columns
| Column | .NET Type | SQL Type | Nullable | Constraint | Legacy Column | Validation Rule |
|---|---|---|---|---|---|---|
| LoanNum | string | CHAR(10) | No | Unique, length=10 | LOAN_NUM | R-L-002 |
| BorrowerName | string | NVARCHAR(100) | No | Required | BORROWER_NAME | R-L-009 |
| PropertyAddress | string | NVARCHAR(255) | No | Required | PROPERTY_ADDRESS | R-L-011 |
| PropertyType | string | NVARCHAR(20) | No | Enum | PROPERTY_TYPE | R-L-013 |
| LoanStatus | string | NVARCHAR(20) | No | Must initialize ACTIVE | LOAN_STATUS | R-L-012 |
| PropertyValue | decimal | DECIMAL(18,2) | No | > 0 | PROPERTY_VALUE | R-L-010 |
| UnpaidPrincipalBalance | decimal | DECIMAL(18,2) | No | > 0 on create, no increase on modify | UPB | R-L-012,R-L-014 |

#### Indexes
- UX_Loan_LoanNum unique index on LoanNum.
- IX_Loan_Search on (LoanNum, BorrowerName, PropertyAddress) for search operations.

#### Migration Notes
- Legacy CHAR fields may map to NVARCHAR in target with trim normalization.
- Address-clear server parity for modify remains open (A-001).

## Part 3.1 — Audit Schema

### DB-AUDIT: LoanAudit
**Target Schema:** dbo.LoanAudit
**Legacy Source:** EDINotificationWriter.cpp::BuildLoanAuditMessages

#### Columns
| Column | Type | Nullable | Purpose |
|---|---|---|---|
| AuditId | BIGINT IDENTITY PRIMARY KEY | No | Surrogate key |
| EntityType | NVARCHAR(50) | No | Entity category, e.g., Loan |
| EntityId | NVARCHAR(50) | No | Loan identifier |
| Action | NVARCHAR(30) | No | Create/Update/Dispatch/Suppress |
| ActorId | NVARCHAR(100) | Yes | User or service identity |
| TimestampUtc | DATETIME2 | No | Event time |
| BeforeJson | NVARCHAR(MAX) | Yes | Pre-state snapshot |
| AfterJson | NVARCHAR(MAX) | Yes | Post-state snapshot |
| RuleId | NVARCHAR(20) | Yes | Triggering rule |

#### Retention
[Artifact gap — content for this section could not be derived from current artifacts. Re-run the relevant pipeline step to populate.]

#### Audit Triggers
- R-L-005 quote path decision.
- R-L-006,R-L-007,R-L-008 14E dispatch or suppression outcome.
- R-L-014 update governance enforcement outcome.

## Part 4 — Unit Test Scaffolds

// ── Priority Rules — test these first; rules include inferred or ambiguous evidence ──

// R-L-008: Only pre-registered lender form IDs are allowed for 14E dispatch.
// Feed this stub to AI: "Fill in this xUnit test for .NET Core 8 and make it pass"
public class EdiNotification_UnregisteredFormId_Tests
{
    [Fact]
    public async Task given_unregistered_form_id_when_dispatch_14e_then_blocked_R-L-008()
    {
        // Arrange
        // Act
        // Assert
        throw new NotImplementedException();
    }
}

// R-L-014: Existing loans can be modified only through approved status progression, non-increasing balance, and non-blank address while keeping loan number unchanged.
// Feed this stub to AI: "Fill in this xUnit test for .NET Core 8 and make it pass"
public class LoanModify_GovernedUpdate_Tests
{
    [Fact]
    public async Task given_invalid_modify_transition_when_update_then_rejected_R-L-014()
    {
        // Arrange
        // Act
        // Assert
        throw new NotImplementedException();
    }
}

// ── Standard Rules — code-grounded; review priority is lower but coverage is mandatory ──

// R-L-001: Users must enter at least one search value before running a loan search.
// Feed this stub to AI: "Fill in this xUnit test for .NET Core 8 and make it pass"
public class LoanSearch_AtLeastOneCriterion_Tests
{
    [Fact]
    public async Task given_empty_search_criteria_when_search_then_rejected_R-L-001()
    {
        throw new NotImplementedException();
    }
}

// R-L-002: When loan number is provided, it must be exactly 10 numeric digits.
// Feed this stub to AI: "Fill in this xUnit test for .NET Core 8 and make it pass"
public class Loan_IdentifierFormat_Tests
{
    [Fact]
    public async Task given_invalid_loan_number_when_submit_then_validation_error_R-L-002()
    {
        throw new NotImplementedException();
    }
}

// R-L-003: A quote can only be requested for properties in approved states.
// Feed this stub to AI: "Fill in this xUnit test for .NET Core 8 and make it pass"
public class Quote_ApprovedStateEligibility_Tests
{
    [Fact]
    public async Task given_unapproved_state_when_quote_then_blocked_R-L-003()
    {
        throw new NotImplementedException();
    }
}

// R-L-004: Kentucky loans require an ISO advisory lookup before quote generation.
// Feed this stub to AI: "Fill in this xUnit test for .NET Core 8 and make it pass"
public class Quote_KentuckyIsoPrecall_Tests
{
    [Fact]
    public async Task given_kentucky_loan_when_quote_then_iso_precall_required_R-L-004()
    {
        throw new NotImplementedException();
    }
}

// R-L-005: Quote generation is required only when quote-required flag indicates yes.
// Feed this stub to AI: "Fill in this xUnit test for .NET Core 8 and make it pass"
public class Quote_RequiredFlag_Tests
{
    [Fact]
    public async Task given_quote_flag_not_y_when_process_result_then_quote_skipped_R-L-005()
    {
        throw new NotImplementedException();
    }
}

// R-L-006: 14E notifications can only be sent for loans marked as EDI-enrolled.
// Feed this stub to AI: "Fill in this xUnit test for .NET Core 8 and make it pass"
public class Edi_EnrollmentRequired_Tests
{
    [Fact]
    public async Task given_loan_not_edi_enrolled_when_dispatch_14e_then_suppressed_R-L-006()
    {
        throw new NotImplementedException();
    }
}

// R-L-007: Loans in Instant Issue cycle do not generate 14E output.
// Feed this stub to AI: "Fill in this xUnit test for .NET Core 8 and make it pass"
public class Edi_InstantIssueSuppression_Tests
{
    [Fact]
    public async Task given_instant_issue_cycle_when_dispatch_14e_then_suppressed_R-L-007()
    {
        throw new NotImplementedException();
    }
}

// R-L-009: A loan cannot be created unless loan number and borrower name are provided.
// Feed this stub to AI: "Fill in this xUnit test for .NET Core 8 and make it pass"
public class LoanCreate_CoreIdentityRequired_Tests
{
    [Fact]
    public async Task given_missing_loan_or_borrower_when_create_then_rejected_R-L-009()
    {
        throw new NotImplementedException();
    }
}

// R-L-010: New loans must have a property value greater than zero.
// Feed this stub to AI: "Fill in this xUnit test for .NET Core 8 and make it pass"
public class LoanCreate_PositivePropertyValue_Tests
{
    [Fact]
    public async Task given_non_positive_property_value_when_create_then_rejected_R-L-010()
    {
        throw new NotImplementedException();
    }
}

// R-L-011: Property address is mandatory when creating a loan.
// Feed this stub to AI: "Fill in this xUnit test for .NET Core 8 and make it pass"
public class LoanCreate_PropertyAddressRequired_Tests
{
    [Fact]
    public async Task given_blank_property_address_when_create_then_rejected_R-L-011()
    {
        throw new NotImplementedException();
    }
}

// R-L-012: New loans must start in Active status and include a positive unpaid principal balance.
// Feed this stub to AI: "Fill in this xUnit test for .NET Core 8 and make it pass"
public class LoanCreate_ActiveStatusAndPositiveUpb_Tests
{
    [Fact]
    public async Task given_invalid_initial_status_or_upb_when_create_then_rejected_R-L-012()
    {
        throw new NotImplementedException();
    }
}

// R-L-013: Property type must be Residential or Commercial when creating a loan.
// Feed this stub to AI: "Fill in this xUnit test for .NET Core 8 and make it pass"
public class LoanCreate_PropertyTypeEnum_Tests
{
    [Fact]
    public async Task given_invalid_property_type_when_create_then_rejected_R-L-013()
    {
        throw new NotImplementedException();
    }
}

## Part 5 — Legacy-to-Modern Mapping Summary

| Legacy File | Legacy Class/Function | Modern Component | Modern Layer | Rules Applied |
|---|---|---|---|---|
| sample-project/src/LoanSearchDlg.cpp | OnBnClickedSearch | LoanSearchComponent + LoanQueryController | Presentation | R-L-001,R-L-002 |
| sample-project/src/LoanSearchDlg.cpp | ProcessLoanResult | QuoteController + EdiNotificationController | Application/Presentation | R-L-003,R-L-004,R-L-005,R-L-006,R-L-007,R-L-008 |
| sample-project/src/LoanAddDlg.cpp | OnBnClickedAdd | AddLoanComponent + LoanCommandController.Create | Presentation/Application | R-L-009,R-L-010,R-L-011,R-L-012,R-L-013 |
| sample-project/src/LoanModifyDlg.cpp | OnBnClickedModify | ModifyLoanComponent + LoanCommandController.Update | Presentation/Application | R-L-014 |
| sample-project/src/LoanRules.cpp | Validation and eligibility methods | Domain entities + ValueObjects + validators | Domain/Application | R-L-001..R-L-014 |
| sample-project/src/TMELibAdapter.cpp | SendMessage / routing | ExternalServices adapters | Infrastructure | R-L-004,R-L-006,R-L-007,R-L-008 |
| sample-project/tandem/TKA900.cbl | Search and cycle-step query | Query handlers + read repository | Application/Infrastructure | R-L-001,R-L-005 |
| sample-project/tandem/TKA901.cbl | Add validation and insert | Create command handler + repository | Application/Infrastructure | R-L-002,R-L-009,R-L-010,R-L-011,R-L-012,R-L-013 |
| sample-project/tandem/TKA902.cbl | Modify validation and update | Update command handler + repository | Application/Infrastructure | R-L-014 |
