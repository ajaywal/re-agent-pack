#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# TrackAll Loan Maintenance demo shortcut — NOT used by the scaffold-generator
# agent on new projects. The scaffold-generator agent generates files directly
# from the Blueprint using create_file / insert_edit_into_file for any project.
#
# Use this script only to regenerate the TrackAll forward-engineering/ reference
# scaffold quickly (e.g. after a reset or to demo the pipeline output).
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="forward-engineering"

mkdir -p \
  "$ROOT/Domain/Entities" \
  "$ROOT/Domain/ValueObjects" \
  "$ROOT/Domain/Repositories" \
  "$ROOT/Domain/Ports" \
  "$ROOT/Domain/Events" \
  "$ROOT/Application/Commands" \
  "$ROOT/Application/Queries" \
  "$ROOT/Application/DTOs" \
  "$ROOT/Infrastructure/Persistence" \
  "$ROOT/Infrastructure/Repositories" \
  "$ROOT/Infrastructure/ExternalServices" \
  "$ROOT/Presentation/Controllers" \
  "$ROOT/AngularUI/src/app/core" \
  "$ROOT/AngularUI/src/app/features/loan-search" \
  "$ROOT/AngularUI/src/app/features/loan-add" \
  "$ROOT/AngularUI/src/app/features/loan-modify" \
  "$ROOT/Database/scripts" \
  "$ROOT/Tests/xunit"

# ─────────────────────────────────────────────────────────────────────────────
# DOMAIN — Entities
# ─────────────────────────────────────────────────────────────────────────────

cat > "$ROOT/Domain/Entities/Loan.cs" <<'EOF'
using System;
using System.Collections.Generic;
using System.Text.Json;
using TrackAllLoanMaintenanceLegacy.Domain.ValueObjects;

namespace TrackAllLoanMaintenanceLegacy.Domain.Entities;

public class Loan
{
    // States approved for RataBase premium quoting (R-L-005).
    private static readonly IReadOnlySet<string> _ratingApprovedStates =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "AR","AZ","CA","CO","FL","GA","IL","IN","KS","KY",
            "LA","MD","MI","MN","MO","MS","NC","NJ","NM","NV",
            "NY","OH","OK","OR","PA","SC","TN","TX","UT","VA","WA"
        };

    private Loan() { } // EF Core hydration only

    // ── Identity ──────────────────────────────────────────────────────────────
    public LoanNumber LoanNum   { get; private set; }
    public string     ClientId  { get; private set; } = string.Empty;

    // ── Borrower ──────────────────────────────────────────────────────────────
    public string BorrowerName  { get; private set; } = string.Empty;
    public string BorrowerPhone { get; private set; } = string.Empty;

    // ── Property ──────────────────────────────────────────────────────────────
    public string        PropertyAddress { get; private set; } = string.Empty;
    public string        PropertyCity    { get; private set; } = string.Empty;
    public string        PropertyZip     { get; private set; } = string.Empty;
    public StateCode     PropertyState   { get; private set; }
    public string        PropertyType    { get; private set; } = string.Empty;
    public PropertyValue PropertyValue   { get; private set; }

    // ── Loan data ─────────────────────────────────────────────────────────────
    public string LoanStatus   { get; private set; } = "ACTIVE";
    public long   Upb          { get; private set; }
    public string CoverageType { get; private set; } = string.Empty;
    public string FciCode      { get; private set; } = string.Empty;

    // ── Integration flags (from CycleStep lookup) ────────────────────────────
    public string EdiFlag   { get; private set; } = "N";
    public string CycleType { get; private set; } = string.Empty;
    public string QuoteReqd { get; private set; } = "N";

    // ── Factory ───────────────────────────────────────────────────────────────

    /// <summary>Creates and validates a new Loan (R-L-013..R-L-019).</summary>
    public static Loan Create(
        string loanNum, string borrowerName, string propertyAddress,
        string propertyState, string propertyType, int propertyValue,
        long upb, string coverageType, string fciCode,
        string clientId = "", string borrowerPhone = "",
        string propertyCity = "", string propertyZip = "",
        string loanStatus = "ACTIVE")
    {
        var loan = new Loan
        {
            LoanNum         = new LoanNumber(loanNum),
            BorrowerName    = borrowerName,
            PropertyAddress = propertyAddress,
            PropertyState   = new StateCode(propertyState),
            PropertyType    = propertyType,
            PropertyValue   = new PropertyValue(propertyValue),
            Upb             = upb,
            CoverageType    = coverageType,
            FciCode         = fciCode,
            ClientId        = clientId,
            BorrowerPhone   = borrowerPhone,
            PropertyCity    = propertyCity,
            PropertyZip     = propertyZip,
            LoanStatus      = loanStatus,
        };
        loan.ValidateAdd();
        return loan;
    }

    /// <summary>Applies cycle-step data from ICycleStepRepository.</summary>
    public void ApplyCycleStep(string quoteReqd, string cycleType)
    {
        QuoteReqd = quoteReqd;
        CycleType = cycleType;
    }

    /// <summary>Applies a validated modification to the entity.</summary>
    public void ApplyModification(
        string borrowerName, string propertyAddress,
        string loanStatus, long upb, int propertyValue,
        string mortgageeClause = "")
    {
        var proposed = new Loan
        {
            LoanNum         = LoanNum,
            BorrowerName    = borrowerName,
            PropertyAddress = propertyAddress,
            LoanStatus      = loanStatus,
            Upb             = upb,
            PropertyValue   = new PropertyValue(propertyValue),
            PropertyType    = PropertyType,
            PropertyState   = PropertyState,
            CoverageType    = CoverageType,
            FciCode         = FciCode,
            EdiFlag         = EdiFlag,
            CycleType       = CycleType,
            QuoteReqd       = QuoteReqd,
        };
        proposed.ValidateModifyAgainstCurrent(this);
        BorrowerName    = borrowerName;
        PropertyAddress = propertyAddress;
        LoanStatus      = loanStatus;
        Upb             = upb;
        PropertyValue   = new PropertyValue(propertyValue);
    }

    // ── Domain behaviour ──────────────────────────────────────────────────────

    /// <summary>R-L-001, R-L-003: at least one search criterion required.</summary>
    public void ValidateSearchCriteria()
    {
        if (string.IsNullOrWhiteSpace(LoanNum.Value) &&
            string.IsNullOrWhiteSpace(BorrowerName) &&
            string.IsNullOrWhiteSpace(PropertyAddress))
            throw new InvalidOperationException(
                "R-L-001: At least one search criterion is required — loan number, borrower name, or property address.");
    }

    /// <summary>R-L-004: true when a premium quote must be obtained.</summary>
    public bool RequireQuote() =>
        string.Equals(QuoteReqd, "Y", StringComparison.OrdinalIgnoreCase) &&
        !string.Equals(CycleType, "INSTANT_ISSUE", StringComparison.OrdinalIgnoreCase);

    /// <summary>R-L-005, R-L-007: validates loan is eligible for RataBase rating.</summary>
    public void ValidateRatingEligibility()
    {
        if (!_ratingApprovedStates.Contains(PropertyState.Value))
            throw new InvalidOperationException(
                $"R-L-005: State '{PropertyState.Value}' is not approved for RataBase premium quoting.");
        if (PropertyValue.Value <= 0)
            throw new InvalidOperationException(
                "R-L-007: Property value must be greater than zero to obtain a quote.");
    }

    /// <summary>R-L-008, R-L-009: validates loan is eligible for EDI placement notification.</summary>
    public void ValidateEdiEligibility()
    {
        if (!string.Equals(EdiFlag, "Y", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException(
                "R-L-008: Loan must have EDI enrolment flag 'Y' to receive a placement notification.");
        if (string.Equals(CycleType, "INSTANT_ISSUE", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException(
                "R-L-009: Instant Issue cycle loans do not generate placement notifications.");
    }

    /// <summary>R-L-011: derives EDI notification format from FCI servicer code.</summary>
    public string SelectEdiFormat()
    {
        if (FciCode.StartsWith("BK",  StringComparison.OrdinalIgnoreCase)) return "BKv2.3";
        if (FciCode.StartsWith("SSP", StringComparison.OrdinalIgnoreCase)) return "SSPv4";
        return "GENERIC";
    }

    /// <summary>R-L-012: builds JSON audit payload for every EDI dispatch.</summary>
    public string BuildAuditPayload() =>
        JsonSerializer.Serialize(new
        {
            LoanNum       = LoanNum.Value,
            BorrowerName,
            LoanStatus,
            Upb,
            PropertyValue = PropertyValue.Value,
            PropertyState = PropertyState.Value,
            CycleType,
            EdiFlag,
            AuditedAtUtc  = DateTime.UtcNow,
        });

    /// <summary>R-L-013..R-L-019: validates the loan state is fit for insertion.</summary>
    public void ValidateAdd()
    {
        if (string.IsNullOrWhiteSpace(LoanNum.Value) || string.IsNullOrWhiteSpace(BorrowerName))
            throw new InvalidOperationException(
                "R-L-013: Loan number and borrower name are both required to add a loan.");
        if (string.IsNullOrWhiteSpace(PropertyAddress))
            throw new InvalidOperationException(
                "R-L-016: Property address is required when adding a loan.");
        if (!string.Equals(LoanStatus, "ACTIVE", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException(
                "R-L-017: New loans must be created with status ACTIVE.");
        if (Upb <= 0)
            throw new InvalidOperationException(
                "R-L-018: Unpaid principal balance must be greater than zero.");
        if (!string.Equals(PropertyType, "RESIDENTIAL", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(PropertyType, "COMMERCIAL",  StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException(
                "R-L-019: Property type must be RESIDENTIAL or COMMERCIAL.");
    }

    /// <summary>R-L-021..R-L-024: validates a proposed modification against current persisted state.</summary>
    public void ValidateModifyAgainstCurrent(Loan current)
    {
        if (!string.Equals(LoanNum.Value, current.LoanNum.Value, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("R-L-021: Loan number cannot be changed after creation.");

        if (!string.Equals(LoanStatus, current.LoanStatus, StringComparison.OrdinalIgnoreCase))
        {
            bool valid =
                (string.Equals(current.LoanStatus, "ACTIVE",     StringComparison.OrdinalIgnoreCase) &&
                 string.Equals(LoanStatus,          "DELINQUENT", StringComparison.OrdinalIgnoreCase)) ||
                (string.Equals(current.LoanStatus, "DELINQUENT", StringComparison.OrdinalIgnoreCase) &&
                 string.Equals(LoanStatus,          "CLOSED",     StringComparison.OrdinalIgnoreCase));
            if (!valid)
                throw new InvalidOperationException(
                    $"R-L-022: Status transition '{current.LoanStatus}' → '{LoanStatus}' is not permitted. " +
                    "Allowed: ACTIVE → DELINQUENT, DELINQUENT → CLOSED.");
        }

        if (Upb > current.Upb)
            throw new InvalidOperationException(
                "R-L-023: Outstanding loan balance cannot be increased on modification.");

        if (!string.IsNullOrWhiteSpace(current.PropertyAddress) &&
             string.IsNullOrWhiteSpace(PropertyAddress))
            throw new InvalidOperationException(
                "R-L-024: Property address cannot be cleared on modification.");
    }
}
EOF

# ─────────────────────────────────────────────────────────────────────────────
# DOMAIN — Value Objects
# ─────────────────────────────────────────────────────────────────────────────

cat > "$ROOT/Domain/ValueObjects/LoanNumber.cs" <<'EOF'
using System;

namespace TrackAllLoanMaintenanceLegacy.Domain.ValueObjects;

public readonly record struct LoanNumber
{
    public string Value { get; }

    public LoanNumber(string value)
    {
        Value = value ?? string.Empty;
        if (Value.Length != 10 || !long.TryParse(Value, out _))
            throw new ArgumentException("R-L-014: Loan number must be exactly 10 numeric digits.");
    }

    public override string ToString() => Value;
}
EOF

cat > "$ROOT/Domain/ValueObjects/PropertyValue.cs" <<'EOF'
using System;

namespace TrackAllLoanMaintenanceLegacy.Domain.ValueObjects;

public readonly record struct PropertyValue
{
    public int Value { get; }

    public PropertyValue(int value)
    {
        if (value <= 0)
            throw new ArgumentException("R-L-015: Property value must be greater than zero.");
        Value = value;
    }

    public override string ToString() => Value.ToString();
}
EOF

cat > "$ROOT/Domain/ValueObjects/StateCode.cs" <<'EOF'
using System;
using System.Text.RegularExpressions;

namespace TrackAllLoanMaintenanceLegacy.Domain.ValueObjects;

public readonly record struct StateCode
{
    private static readonly Regex Pattern = new("^[A-Z]{2}$", RegexOptions.Compiled);
    public string Value { get; }

    public StateCode(string value)
    {
        Value = (value ?? string.Empty).Trim().ToUpperInvariant();
        if (!Pattern.IsMatch(Value))
            throw new ArgumentException("State code must be two uppercase letters.");
    }

    public override string ToString() => Value;
}
EOF

cat > "$ROOT/Domain/ValueObjects/CycleStepInfo.cs" <<'EOF'
namespace TrackAllLoanMaintenanceLegacy.Domain.ValueObjects;

// Result of ICycleStepRepository.GetByClientIdAsync — replaces the raw tuple.
public sealed record CycleStepInfo(string QuoteReqd, string CycleType);
EOF

# ─────────────────────────────────────────────────────────────────────────────
# DOMAIN — Repositories
# ─────────────────────────────────────────────────────────────────────────────

cat > "$ROOT/Domain/Repositories/ILoanRepository.cs" <<'EOF'
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Domain.Entities;

namespace TrackAllLoanMaintenanceLegacy.Domain.Repositories;

public interface ILoanRepository
{
    Task<IReadOnlyList<Loan>> SearchAsync(string? loanNum, string? borrowerName, string? propertyAddress, CancellationToken ct = default);
    Task<Loan?> GetByLoanNumAsync(string loanNum, CancellationToken ct = default);
    Task AddAsync(Loan loan, CancellationToken ct = default);
    Task UpdateAsync(Loan loan, CancellationToken ct = default);
}
EOF

cat > "$ROOT/Domain/Repositories/ICycleStepRepository.cs" <<'EOF'
using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Domain.ValueObjects;

namespace TrackAllLoanMaintenanceLegacy.Domain.Repositories;

public interface ICycleStepRepository
{
    Task<CycleStepInfo?> GetByClientIdAsync(string clientId, CancellationToken ct = default);
}
EOF

# ─────────────────────────────────────────────────────────────────────────────
# DOMAIN — Ports (dependency inversion — interfaces owned by Domain)
# ─────────────────────────────────────────────────────────────────────────────

cat > "$ROOT/Domain/Ports/IRataBaseAdapter.cs" <<'EOF'
using System.Threading;
using System.Threading.Tasks;

namespace TrackAllLoanMaintenanceLegacy.Domain.Ports;

// R-L-004, R-L-005, R-L-007
// Domain-defined contract for the external RataBase premium-quoting service.
// Infrastructure implements this; Application depends on this abstraction.
public interface IRataBaseAdapter
{
    Task<decimal> GetQuoteAsync(
        string loanNum, string stateCode, string coverageType,
        int propertyValue, string? kyIsoContext,
        CancellationToken ct = default);
}
EOF

cat > "$ROOT/Domain/Ports/IISOAdvisoryAdapter.cs" <<'EOF'
using System.Threading;
using System.Threading.Tasks;

namespace TrackAllLoanMaintenanceLegacy.Domain.Ports;

// R-L-006
// Domain-defined contract for the Kentucky ISO advisory pre-call (AIP930).
// Must be invoked before RataBase when PropertyState == "KY".
public interface IISOAdvisoryAdapter
{
    Task<string> GetKentuckyIsoContextAsync(string loanNum, CancellationToken ct = default);
}
EOF

cat > "$ROOT/Domain/Ports/IEDIAdapter.cs" <<'EOF'
using System.Threading;
using System.Threading.Tasks;

namespace TrackAllLoanMaintenanceLegacy.Domain.Ports;

// R-L-008, R-L-009, R-L-010, R-L-011, R-L-012
// Domain-defined contract for the 14E EDI placement notification (TKA920).
public interface IEDIAdapter
{
    Task<string> Dispatch14EAsync(
        string loanNum, string formId, string fciCode,
        string cycleType, string ediFormat, string auditPayload,
        CancellationToken ct = default);
}
EOF

# ─────────────────────────────────────────────────────────────────────────────
# DOMAIN — Events
# ─────────────────────────────────────────────────────────────────────────────

cat > "$ROOT/Domain/Events/LoanProcessedEvent.cs" <<'EOF'
using System;

namespace TrackAllLoanMaintenanceLegacy.Domain.Events;

public sealed record LoanProcessedEvent(
    string LoanNum,
    bool QuoteRequested,
    DateTime OccurredUtc
);
EOF

cat > "$ROOT/Domain/Events/EDIDispatchedEvent.cs" <<'EOF'
using System;

namespace TrackAllLoanMaintenanceLegacy.Domain.Events;

public sealed record EDIDispatchedEvent(
    string LoanNum,
    string Format,
    string DispatchStatus,
    DateTime OccurredUtc
);
EOF

# ─────────────────────────────────────────────────────────────────────────────
# APPLICATION — DTOs
# ─────────────────────────────────────────────────────────────────────────────

cat > "$ROOT/Application/DTOs/LoanSearchCriteriaDto.cs" <<'EOF'
namespace TrackAllLoanMaintenanceLegacy.Application.DTOs;

public sealed class LoanSearchCriteriaDto
{
    public string? LoanNumber       { get; init; }
    public string? BorrowerName     { get; init; }
    public string? PropertyAddress  { get; init; }
}

public sealed class LoanSearchResultDto
{
    public string LoanNum        { get; init; } = string.Empty;
    public string BorrowerName   { get; init; } = string.Empty;
    public string PropertyState  { get; init; } = string.Empty;
    public string CoverageType   { get; init; } = string.Empty;
    public string QuoteReqd      { get; init; } = string.Empty;
    public string CycleType      { get; init; } = string.Empty;
    public string EdiFlag        { get; init; } = string.Empty;
    public string PropertyAddress { get; init; } = string.Empty;
    public string PropertyType   { get; init; } = string.Empty;
    public string LoanStatus     { get; init; } = string.Empty;
    public long   Upb            { get; init; }
    public int    PropertyValue  { get; init; }
    public string FciCode        { get; init; } = string.Empty;
}
EOF

cat > "$ROOT/Application/DTOs/LoanProcessResultDto.cs" <<'EOF'
using System;

namespace TrackAllLoanMaintenanceLegacy.Application.DTOs;

public sealed class LoanProcessResultDto
{
    public string   LoanNum        { get; init; } = string.Empty;
    public decimal? QuoteAmount    { get; init; }
    public string?  EdiDispatchId  { get; init; }
    public DateTime ProcessedAtUtc { get; init; }
}
EOF

cat > "$ROOT/Application/DTOs/AddLoanRequestDto.cs" <<'EOF'
namespace TrackAllLoanMaintenanceLegacy.Application.DTOs;

public sealed class AddLoanRequestDto
{
    public string  LoanNum         { get; init; } = string.Empty;
    public string  BorrowerName    { get; init; } = string.Empty;
    public string  PropertyAddress { get; init; } = string.Empty;
    public string? PropertyState   { get; init; }
    public string? CoverageType    { get; init; }
    public string  PropertyType    { get; init; } = "RESIDENTIAL";
    public int     PropertyValue   { get; init; }
    public long    Upb             { get; init; }
    public string  LoanStatus      { get; init; } = "ACTIVE";
    public string? ClientId        { get; init; }
    public string? FciCode         { get; init; }
    public string? EdiFlag         { get; init; }
}
EOF

cat > "$ROOT/Application/DTOs/ModifyLoanRequestDto.cs" <<'EOF'
namespace TrackAllLoanMaintenanceLegacy.Application.DTOs;

public sealed class ModifyLoanRequestDto
{
    public string  BorrowerName     { get; init; } = string.Empty;
    public string  PropertyAddress  { get; init; } = string.Empty;
    public string  LoanStatus       { get; init; } = string.Empty;
    public long    Upb              { get; init; }
    public int     PropertyValue    { get; init; }
    public string? MortgageeClause  { get; init; }
}
EOF

# ─────────────────────────────────────────────────────────────────────────────
# APPLICATION — Queries
# ─────────────────────────────────────────────────────────────────────────────

cat > "$ROOT/Application/Queries/SearchLoansQuery.cs" <<'EOF'
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Application.DTOs;
using TrackAllLoanMaintenanceLegacy.Domain.Repositories;

namespace TrackAllLoanMaintenanceLegacy.Application.Queries;

public sealed record SearchLoansQuery(string? LoanNumber, string? BorrowerName, string? PropertyAddress);

public sealed class SearchLoansQueryHandler
{
    private readonly ILoanRepository _loans;

    public SearchLoansQueryHandler(ILoanRepository loans) => _loans = loans;

    public async Task<IReadOnlyList<LoanSearchResultDto>> HandleAsync(
        SearchLoansQuery query, CancellationToken ct = default)
    {
        var results = await _loans.SearchAsync(query.LoanNumber, query.BorrowerName, query.PropertyAddress, ct);

        var dtos = new List<LoanSearchResultDto>();
        foreach (var l in results)
            dtos.Add(new LoanSearchResultDto
            {
                LoanNum         = l.LoanNum.Value,
                BorrowerName    = l.BorrowerName,
                PropertyState   = l.PropertyState.Value,
                CoverageType    = l.CoverageType,
                QuoteReqd       = l.QuoteReqd,
                CycleType       = l.CycleType,
                EdiFlag         = l.EdiFlag,
                PropertyAddress = l.PropertyAddress,
                PropertyType    = l.PropertyType,
                LoanStatus      = l.LoanStatus,
                Upb             = l.Upb,
                PropertyValue   = l.PropertyValue.Value,
                FciCode         = l.FciCode,
            });
        return dtos;
    }
}
EOF

# ─────────────────────────────────────────────────────────────────────────────
# APPLICATION — Commands
# ─────────────────────────────────────────────────────────────────────────────

cat > "$ROOT/Application/Commands/ProcessLoanCommand.cs" <<'EOF'
using System;
using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Application.DTOs;
using TrackAllLoanMaintenanceLegacy.Domain.Ports;
using TrackAllLoanMaintenanceLegacy.Domain.Repositories;

namespace TrackAllLoanMaintenanceLegacy.Application.Commands;

public sealed record ProcessLoanCommand(string LoanNum);

public sealed class ProcessLoanCommandHandler
{
    private readonly ILoanRepository      _loans;
    private readonly ICycleStepRepository _cycleSteps;
    private readonly IRataBaseAdapter     _rataBase;
    private readonly IISOAdvisoryAdapter  _isoAdvisory;
    private readonly IEDIAdapter          _edi;

    public ProcessLoanCommandHandler(
        ILoanRepository loans, ICycleStepRepository cycleSteps,
        IRataBaseAdapter rataBase, IISOAdvisoryAdapter isoAdvisory, IEDIAdapter edi)
    {
        _loans = loans; _cycleSteps = cycleSteps;
        _rataBase = rataBase; _isoAdvisory = isoAdvisory; _edi = edi;
    }

    public async Task<LoanProcessResultDto> HandleAsync(
        ProcessLoanCommand command, CancellationToken ct = default)
    {
        // R-L-025: loan must exist (mnemonic registered at gateway layer)
        var loan = await _loans.GetByLoanNumAsync(command.LoanNum, ct)
            ?? throw new InvalidOperationException($"Loan '{command.LoanNum}' not found.");

        var cycleStep = await _cycleSteps.GetByClientIdAsync(loan.ClientId, ct);
        if (cycleStep is not null)
            loan.ApplyCycleStep(cycleStep.QuoteReqd, cycleStep.CycleType);

        // R-L-004, R-L-005, R-L-006, R-L-007 — quote path
        decimal? quoteAmount = null;
        if (loan.RequireQuote())
        {
            loan.ValidateRatingEligibility();
            string? kyContext = null;
            if (string.Equals(loan.PropertyState.Value, "KY", StringComparison.OrdinalIgnoreCase))
                kyContext = await _isoAdvisory.GetKentuckyIsoContextAsync(loan.LoanNum.Value, ct);
            quoteAmount = await _rataBase.GetQuoteAsync(
                loan.LoanNum.Value, loan.PropertyState.Value, loan.CoverageType,
                loan.PropertyValue.Value, kyContext, ct);
        }

        // R-L-008, R-L-009, R-L-010, R-L-011, R-L-012 — EDI path
        string? dispatchId = null;
        try
        {
            loan.ValidateEdiEligibility();
            string ediFormat    = loan.SelectEdiFormat();
            string auditPayload = loan.BuildAuditPayload();
            dispatchId = await _edi.Dispatch14EAsync(
                loan.LoanNum.Value, loan.FciCode, loan.FciCode,
                loan.CycleType, ediFormat, auditPayload, ct);
        }
        catch (InvalidOperationException) { /* not EDI-eligible — not an error */ }

        return new LoanProcessResultDto
        {
            LoanNum        = loan.LoanNum.Value,
            QuoteAmount    = quoteAmount,
            EdiDispatchId  = dispatchId,
            ProcessedAtUtc = DateTime.UtcNow,
        };
    }
}
EOF

cat > "$ROOT/Application/Commands/AddLoanCommand.cs" <<'EOF'
using System;
using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Application.DTOs;
using TrackAllLoanMaintenanceLegacy.Domain.Entities;
using TrackAllLoanMaintenanceLegacy.Domain.Repositories;

namespace TrackAllLoanMaintenanceLegacy.Application.Commands;

public sealed record AddLoanCommand(AddLoanRequestDto Request);

public sealed class AddLoanCommandHandler
{
    private readonly ILoanRepository _loans;

    public AddLoanCommandHandler(ILoanRepository loans) => _loans = loans;

    public async Task<string> HandleAsync(AddLoanCommand command, CancellationToken ct = default)
    {
        // R-L-020: duplicate check
        var existing = await _loans.GetByLoanNumAsync(command.Request.LoanNum, ct);
        if (existing is not null)
            throw new InvalidOperationException(
                $"R-L-020: Loan '{command.Request.LoanNum}' already exists.");

        // Loan.Create validates R-L-013..R-L-019 via VO constructors + ValidateAdd()
        var loan = Loan.Create(
            loanNum:         command.Request.LoanNum,
            borrowerName:    command.Request.BorrowerName,
            propertyAddress: command.Request.PropertyAddress,
            propertyState:   command.Request.PropertyState ?? string.Empty,
            propertyType:    command.Request.PropertyType,
            propertyValue:   command.Request.PropertyValue,
            upb:             command.Request.Upb,
            coverageType:    command.Request.CoverageType ?? string.Empty,
            fciCode:         command.Request.FciCode ?? string.Empty,
            clientId:        command.Request.ClientId ?? string.Empty);

        await _loans.AddAsync(loan, ct);
        return loan.LoanNum.Value;
    }
}
EOF

cat > "$ROOT/Application/Commands/ModifyLoanCommand.cs" <<'EOF'
using System;
using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Application.DTOs;
using TrackAllLoanMaintenanceLegacy.Domain.Repositories;

namespace TrackAllLoanMaintenanceLegacy.Application.Commands;

public sealed record ModifyLoanCommand(string LoanNum, ModifyLoanRequestDto Request);

public sealed class ModifyLoanCommandHandler
{
    private readonly ILoanRepository _loans;

    public ModifyLoanCommandHandler(ILoanRepository loans) => _loans = loans;

    public async Task HandleAsync(ModifyLoanCommand command, CancellationToken ct = default)
    {
        var loan = await _loans.GetByLoanNumAsync(command.LoanNum, ct)
            ?? throw new InvalidOperationException($"Loan '{command.LoanNum}' not found.");

        // ApplyModification validates R-L-021..R-L-024
        loan.ApplyModification(
            borrowerName:    command.Request.BorrowerName,
            propertyAddress: command.Request.PropertyAddress,
            loanStatus:      command.Request.LoanStatus,
            upb:             command.Request.Upb,
            propertyValue:   command.Request.PropertyValue);

        await _loans.UpdateAsync(loan, ct);
    }
}
EOF

# ─────────────────────────────────────────────────────────────────────────────
# INFRASTRUCTURE — Persistence
# ─────────────────────────────────────────────────────────────────────────────

cat > "$ROOT/Infrastructure/Persistence/LoanDbContext.cs" <<'EOF'
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using TrackAllLoanMaintenanceLegacy.Domain.Entities;
using TrackAllLoanMaintenanceLegacy.Domain.ValueObjects;

namespace TrackAllLoanMaintenanceLegacy.Infrastructure.Persistence;

public class LoanDbContext : DbContext
{
    public LoanDbContext(DbContextOptions<LoanDbContext> options) : base(options) { }

    public DbSet<Loan> Loans => Set<Loan>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Loan>(entity =>
        {
            entity.ToTable("Loan", "dbo");
            entity.HasKey(l => l.LoanNum);

            entity.Property(l => l.LoanNum)
                .HasConversion(v => v.Value, v => new LoanNumber(v))
                .HasColumnName("LoanNum").HasMaxLength(10).IsFixedLength().IsRequired();

            entity.Property(l => l.PropertyValue)
                .HasConversion(v => v.Value, v => new PropertyValue(v))
                .HasColumnName("PropertyValue").IsRequired();

            entity.Property(l => l.PropertyState)
                .HasConversion(v => v.Value, v => new StateCode(v))
                .HasColumnName("PropertyState").HasMaxLength(2).IsFixedLength().IsRequired();

            entity.Property(l => l.ClientId)       .HasMaxLength(8);
            entity.Property(l => l.BorrowerName)   .HasMaxLength(100).IsRequired();
            entity.Property(l => l.BorrowerPhone)  .HasMaxLength(20);
            entity.Property(l => l.PropertyAddress).HasMaxLength(200).IsRequired();
            entity.Property(l => l.PropertyCity)   .HasMaxLength(100);
            entity.Property(l => l.PropertyZip)    .HasMaxLength(10);
            entity.Property(l => l.PropertyType)   .HasMaxLength(20).IsRequired();
            entity.Property(l => l.LoanStatus)     .HasMaxLength(20).IsRequired();
            entity.Property(l => l.CoverageType)   .HasMaxLength(50);
            entity.Property(l => l.FciCode)        .HasMaxLength(20);
            entity.Property(l => l.EdiFlag)        .HasMaxLength(1).HasDefaultValue("N");
            entity.Property(l => l.CycleType)      .HasMaxLength(30);
            entity.Property(l => l.QuoteReqd)      .HasMaxLength(1).HasDefaultValue("N");
            entity.Property(l => l.Upb)            .IsRequired();
        });
    }
}
EOF

cat > "$ROOT/Infrastructure/Persistence/LoanDbSeeder.cs" <<'EOF'
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TrackAllLoanMaintenanceLegacy.Domain.Entities;

namespace TrackAllLoanMaintenanceLegacy.Infrastructure.Persistence;

public static class LoanDbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var db = services.GetRequiredService<LoanDbContext>();
        await db.Database.EnsureCreatedAsync();

        if (await db.Loans.AnyAsync()) return;

        var loan1 = Loan.Create("1234567890", "John Smith",   "123 Main St, Louisville",
            propertyState: "KY", propertyType: "RESIDENTIAL", propertyValue: 250000,
            upb: 180000L, coverageType: "Hazard", fciCode: "BK140", clientId: "ASSRNT01");
        loan1.ApplyCycleStep("Y", "STANDARD");

        var loan2 = Loan.Create("0987654321", "Jane Doe",     "456 Oak Ave, Houston",
            propertyState: "TX", propertyType: "RESIDENTIAL", propertyValue: 320000,
            upb: 240000L, coverageType: "Hazard", fciCode: "SSP220", clientId: "ASSRNT01");
        loan2.ApplyCycleStep("N", "STANDARD");

        db.Loans.AddRange(loan1, loan2);
        await db.SaveChangesAsync();
    }
}
EOF

# ─────────────────────────────────────────────────────────────────────────────
# INFRASTRUCTURE — Repositories
# ─────────────────────────────────────────────────────────────────────────────

cat > "$ROOT/Infrastructure/Repositories/LoanRepository.cs" <<'EOF'
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TrackAllLoanMaintenanceLegacy.Domain.Entities;
using TrackAllLoanMaintenanceLegacy.Domain.Repositories;
using TrackAllLoanMaintenanceLegacy.Infrastructure.Persistence;

namespace TrackAllLoanMaintenanceLegacy.Infrastructure.Repositories;

public sealed class LoanRepository : ILoanRepository
{
    private readonly LoanDbContext _db;

    public LoanRepository(LoanDbContext db) => _db = db;

    public async Task<IReadOnlyList<Loan>> SearchAsync(
        string? loanNum, string? borrowerName, string? propertyAddress,
        CancellationToken ct = default)
    {
        var query = _db.Loans.AsQueryable();
        if (!string.IsNullOrWhiteSpace(loanNum))
            query = query.Where(l => EF.Property<string>(l, "LoanNum") == loanNum);
        if (!string.IsNullOrWhiteSpace(borrowerName))
            query = query.Where(l => l.BorrowerName.Contains(borrowerName));
        if (!string.IsNullOrWhiteSpace(propertyAddress))
            query = query.Where(l => l.PropertyAddress.Contains(propertyAddress));
        return await query.ToListAsync(ct);
    }

    public async Task<Loan?> GetByLoanNumAsync(string loanNum, CancellationToken ct = default)
        => await _db.Loans.FirstOrDefaultAsync(
            l => EF.Property<string>(l, "LoanNum") == loanNum, ct);

    public async Task AddAsync(Loan loan, CancellationToken ct = default)
    {
        _db.Loans.Add(loan);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Loan loan, CancellationToken ct = default)
    {
        _db.Loans.Update(loan);
        await _db.SaveChangesAsync(ct);
    }
}
EOF

cat > "$ROOT/Infrastructure/Repositories/CycleStepRepository.cs" <<'EOF'
using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Domain.Repositories;
using TrackAllLoanMaintenanceLegacy.Domain.ValueObjects;
using TrackAllLoanMaintenanceLegacy.Infrastructure.Persistence;

namespace TrackAllLoanMaintenanceLegacy.Infrastructure.Repositories;

public sealed class CycleStepRepository : ICycleStepRepository
{
    private readonly LoanDbContext _db;

    public CycleStepRepository(LoanDbContext db) => _db = db;

    public Task<CycleStepInfo?> GetByClientIdAsync(string clientId, CancellationToken ct = default)
    {
        // Stub: implement with CycleStep table lookup when schema is migrated.
        // For now, return a default QuoteReqd=Y, CycleType=STANDARD for known clients.
        CycleStepInfo? result = clientId == "ASSRNT01"
            ? new CycleStepInfo("Y", "STANDARD")
            : null;
        return System.Threading.Tasks.Task.FromResult(result);
    }
}
EOF

# ─────────────────────────────────────────────────────────────────────────────
# INFRASTRUCTURE — External Services (implement Domain.Ports)
# ─────────────────────────────────────────────────────────────────────────────

cat > "$ROOT/Infrastructure/ExternalServices/RataBaseAdapter.cs" <<'EOF'
using System;
using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Domain.Ports;

namespace TrackAllLoanMaintenanceLegacy.Infrastructure.ExternalServices;

// Implements Domain.Ports.IRataBaseAdapter — stub pending HTTP implementation.
public sealed class RataBaseAdapter : IRataBaseAdapter
{
    public Task<decimal> GetQuoteAsync(
        string loanNum, string stateCode, string coverageType,
        int propertyValue, string? kyIsoContext,
        CancellationToken ct = default)
        => throw new NotImplementedException("Wire to RataBase HTTP endpoint.");
}
EOF

cat > "$ROOT/Infrastructure/ExternalServices/ISOAdvisoryAdapter.cs" <<'EOF'
using System;
using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Domain.Ports;

namespace TrackAllLoanMaintenanceLegacy.Infrastructure.ExternalServices;

// Implements Domain.Ports.IISOAdvisoryAdapter — stub pending HTTP implementation.
public sealed class ISOAdvisoryAdapter : IISOAdvisoryAdapter
{
    public Task<string> GetKentuckyIsoContextAsync(string loanNum, CancellationToken ct = default)
        => throw new NotImplementedException("Wire to AIP930 Tandem endpoint.");
}
EOF

cat > "$ROOT/Infrastructure/ExternalServices/EDIAdapter.cs" <<'EOF'
using System;
using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Domain.Ports;

namespace TrackAllLoanMaintenanceLegacy.Infrastructure.ExternalServices;

// Implements Domain.Ports.IEDIAdapter — stub pending HTTP implementation.
public sealed class EDIAdapter : IEDIAdapter
{
    public Task<string> Dispatch14EAsync(
        string loanNum, string formId, string fciCode,
        string cycleType, string ediFormat, string auditPayload,
        CancellationToken ct = default)
        => throw new NotImplementedException("Wire to TKA920 EDI endpoint.");
}
EOF

# ─────────────────────────────────────────────────────────────────────────────
# PRESENTATION — Controllers (thin; no business logic)
# ─────────────────────────────────────────────────────────────────────────────

cat > "$ROOT/Presentation/Controllers/LoanSearchController.cs" <<'EOF'
using Microsoft.AspNetCore.Mvc;
using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Application.DTOs;
using TrackAllLoanMaintenanceLegacy.Application.Queries;

namespace TrackAllLoanMaintenanceLegacy.Presentation.Controllers;

[ApiController]
[Route("api/loans")]
public sealed class LoanSearchController : ControllerBase
{
    private readonly SearchLoansQueryHandler _handler;

    public LoanSearchController(SearchLoansQueryHandler handler) => _handler = handler;

    [HttpPost("search")]
    public async Task<ActionResult<object>> Search(
        [FromBody] LoanSearchCriteriaDto criteria, CancellationToken ct)
    {
        try
        {
            var result = await _handler.HandleAsync(
                new SearchLoansQuery(criteria.LoanNumber, criteria.BorrowerName, criteria.PropertyAddress), ct);
            return Ok(result);
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
EOF

cat > "$ROOT/Presentation/Controllers/LoanCommandController.cs" <<'EOF'
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Application.Commands;
using TrackAllLoanMaintenanceLegacy.Application.DTOs;

namespace TrackAllLoanMaintenanceLegacy.Presentation.Controllers;

[ApiController]
[Route("api/loans")]
public sealed class LoanCommandController : ControllerBase
{
    private readonly AddLoanCommandHandler    _add;
    private readonly ModifyLoanCommandHandler _modify;

    public LoanCommandController(AddLoanCommandHandler add, ModifyLoanCommandHandler modify)
    {
        _add = add; _modify = modify;
    }

    // POST /api/loans — Add Loan (R-L-013..R-L-020)
    [HttpPost]
    public async Task<ActionResult<object>> Add(
        [FromBody] AddLoanRequestDto request, CancellationToken ct)
    {
        try
        {
            var loanNum = await _add.HandleAsync(new AddLoanCommand(request), ct);
            return Created($"/api/loans/{loanNum}", new { loanNum, message = "Loan added successfully." });
        }
        catch (InvalidOperationException ex) when (ex.Message.StartsWith("R-L-020"))
        {
            return Conflict(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // PUT /api/loans/{loanNum} — Modify Loan (R-L-021..R-L-024)
    [HttpPut("{loanNum}")]
    public async Task<ActionResult<object>> Modify(
        string loanNum, [FromBody] ModifyLoanRequestDto request, CancellationToken ct)
    {
        try
        {
            await _modify.HandleAsync(new ModifyLoanCommand(loanNum, request), ct);
            return Ok(new { loanNum, message = "Loan updated successfully." });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
EOF

cat > "$ROOT/Presentation/Controllers/LoanProcessingController.cs" <<'EOF'
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading;
using System.Threading.Tasks;
using TrackAllLoanMaintenanceLegacy.Application.Commands;

namespace TrackAllLoanMaintenanceLegacy.Presentation.Controllers;

[ApiController]
[Route("api/loans")]
public sealed class LoanProcessingController : ControllerBase
{
    private readonly ProcessLoanCommandHandler _handler;

    public LoanProcessingController(ProcessLoanCommandHandler handler) => _handler = handler;

    // POST /api/loans/{loanNum}/process — Process Loan (R-L-004..R-L-012, R-L-025)
    [HttpPost("{loanNum}/process")]
    public async Task<ActionResult<object>> Process(string loanNum, CancellationToken ct)
    {
        try
        {
            var result = await _handler.HandleAsync(new ProcessLoanCommand(loanNum), ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
EOF

# ─────────────────────────────────────────────────────────────────────────────
# PRESENTATION — Program.cs (DI wiring, app entry point)
# ─────────────────────────────────────────────────────────────────────────────

cat > "$ROOT/Presentation/Program.cs" <<'EOF'
using Microsoft.EntityFrameworkCore;
using TrackAllLoanMaintenanceLegacy.Application.Commands;
using TrackAllLoanMaintenanceLegacy.Application.Queries;
using TrackAllLoanMaintenanceLegacy.Domain.Ports;
using TrackAllLoanMaintenanceLegacy.Domain.Repositories;
using TrackAllLoanMaintenanceLegacy.Infrastructure.ExternalServices;
using TrackAllLoanMaintenanceLegacy.Infrastructure.Persistence;
using TrackAllLoanMaintenanceLegacy.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Infrastructure — Database (SQLite for local dev; swap for Azure SQL in prod)
builder.Services.AddDbContext<LoanDbContext>(options =>
    options.UseSqlite("Data Source=loan_maintenance.db"));

// Application — Command and Query Handlers
builder.Services.AddScoped<SearchLoansQueryHandler>();
builder.Services.AddScoped<ProcessLoanCommandHandler>();
builder.Services.AddScoped<AddLoanCommandHandler>();
builder.Services.AddScoped<ModifyLoanCommandHandler>();

// Infrastructure — Repository implementations (ILoanRepository is in Domain)
builder.Services.AddScoped<ILoanRepository,      LoanRepository>();
builder.Services.AddScoped<ICycleStepRepository, CycleStepRepository>();

// Infrastructure — Port implementations (interfaces owned by Domain.Ports)
builder.Services.AddScoped<IRataBaseAdapter,    RataBaseAdapter>();
builder.Services.AddScoped<IISOAdvisoryAdapter, ISOAdvisoryAdapter>();
builder.Services.AddScoped<IEDIAdapter,         EDIAdapter>();

// CORS — allow Angular dev server
builder.Services.AddCors(opts => opts.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:4200").AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// Seed dev data
using (var scope = app.Services.CreateScope())
    await LoanDbSeeder.SeedAsync(scope.ServiceProvider);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthorization();
app.MapControllers();
app.Run();
EOF

# ─────────────────────────────────────────────────────────────────────────────
# ANGULAR UI
# ─────────────────────────────────────────────────────────────────────────────

cat > "$ROOT/AngularUI/src/app/core/loan-api.models.ts" <<'EOF'
export interface LoanSearchCriteria {
  loanNumber?: string;
  borrowerName?: string;
  propertyAddress?: string;
}

export interface LoanSearchResult {
  loanNum: string;
  borrowerName: string;
  propertyState: string;
  coverageType: string;
  quoteReqd: string;
  ediFlag: string;
  cycleType: string;
  propertyAddress: string;
  propertyType: string;
  loanStatus: string;
  upb: number;
  propertyValue: number;
  fciCode: string;
}

export interface AddLoanRequest {
  loanNum: string;
  borrowerName: string;
  propertyAddress: string;
  propertyState?: string;
  coverageType?: string;
  propertyType: 'RESIDENTIAL' | 'COMMERCIAL';
  propertyValue: number;
  upb: number;
  loanStatus: string;
  clientId?: string;
  fciCode?: string;
  ediFlag?: 'Y' | 'N';
}

export interface ModifyLoanRequest {
  borrowerName: string;
  propertyAddress: string;
  loanStatus: string;
  upb: number;
  propertyValue: number;
  mortgageeClause?: string;
}

export interface LoanProcessResult {
  loanNum: string;
  quoteAmount: number | null;
  ediDispatchId: string | null;
  processedAtUtc: string;
}

export interface ApiError {
  error: string;
}
EOF

cat > "$ROOT/AngularUI/src/app/core/loan-api.service.ts" <<'EOF'
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  LoanSearchCriteria, LoanSearchResult,
  AddLoanRequest, ModifyLoanRequest, LoanProcessResult
} from './loan-api.models';

@Injectable({ providedIn: 'root' })
export class LoanApiService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:5000/api/loans';

  search(criteria: LoanSearchCriteria): Observable<LoanSearchResult[]> {
    return this.http.post<LoanSearchResult[]>(`${this.base}/search`, criteria)
      .pipe(catchError(this.handleError));
  }

  getLoan(loanNum: string): Observable<LoanSearchResult> {
    return this.http.get<LoanSearchResult>(`${this.base}/${loanNum}`)
      .pipe(catchError(this.handleError));
  }

  addLoan(request: AddLoanRequest): Observable<{ loanNum: string; message: string }> {
    return this.http.post<{ loanNum: string; message: string }>(this.base, request)
      .pipe(catchError(this.handleError));
  }

  modifyLoan(loanNum: string, request: ModifyLoanRequest): Observable<{ loanNum: string; message: string }> {
    return this.http.put<{ loanNum: string; message: string }>(`${this.base}/${loanNum}`, request)
      .pipe(catchError(this.handleError));
  }

  process(loanNum: string): Observable<LoanProcessResult> {
    return this.http.post<LoanProcessResult>(`${this.base}/${loanNum}/process`, {})
      .pipe(catchError(this.handleError));
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    const message = err.error?.error ?? err.message ?? 'Unknown error';
    return throwError(() => new Error(message));
  }
}
EOF

cat > "$ROOT/AngularUI/src/app/features/loan-search/loan-search.component.ts" <<'EOF'
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoanApiService } from '../../core/loan-api.service';
import { LoanSearchResult, LoanProcessResult } from '../../core/loan-api.models';

function requireAtLeastOne(group: AbstractControl): ValidationErrors | null {
  const { loanNumber, borrowerName, propertyAddress } = group.value;
  return loanNumber || borrowerName || propertyAddress ? null : { requireAtLeastOne: true };
}

@Component({
  selector: 'app-loan-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './loan-search.component.html',
})
export class LoanSearchComponent {
  private readonly api = inject(LoanApiService);
  private readonly fb  = inject(FormBuilder);

  searchForm = this.fb.group(
    {
      loanNumber:      ['', [Validators.pattern(/^\d{10}$/)]], // R-L-002
      borrowerName:    [''],
      propertyAddress: [''],
    },
    { validators: requireAtLeastOne } // R-L-001
  );

  results: LoanSearchResult[] = [];
  selectedLoan: LoanSearchResult | null = null;
  processResult: LoanProcessResult | null = null;
  error = '';
  loading = false;

  onSearch(): void {
    if (this.searchForm.invalid) return;
    this.loading = true;
    this.error = '';
    this.api.search(this.searchForm.value as any).subscribe({
      next: r  => { this.results = r; this.loading = false; },
      error: e => { this.error = e.message; this.loading = false; },
    });
  }

  onProcess(loan: LoanSearchResult): void {
    this.loading = true;
    this.api.process(loan.loanNum).subscribe({
      next: r  => { this.processResult = r; this.loading = false; },
      error: e => { this.error = e.message; this.loading = false; },
    });
  }
}
EOF

cat > "$ROOT/AngularUI/src/app/features/loan-add/loan-add.component.ts" <<'EOF'
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoanApiService } from '../../core/loan-api.service';

@Component({
  selector: 'app-loan-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './loan-add.component.html',
})
export class LoanAddComponent {
  private readonly api    = inject(LoanApiService);
  private readonly fb     = inject(FormBuilder);
  private readonly router = inject(Router);

  form = this.fb.group({
    loanNum:         ['', [Validators.required, Validators.pattern(/^\d{10}$/)]], // R-L-014
    borrowerName:    ['', Validators.required],                                    // R-L-013
    propertyAddress: ['', Validators.required],                                    // R-L-016
    propertyState:   ['KY'],
    coverageType:    ['Hazard'],
    propertyType:    ['RESIDENTIAL', Validators.pattern(/^(RESIDENTIAL|COMMERCIAL)$/)], // R-L-019
    propertyValue:   [1, Validators.min(1)],                                       // R-L-015
    upb:             [1, Validators.min(1)],                                       // R-L-018
    loanStatus:      ['ACTIVE'],                                                   // R-L-017
    clientId:        ['ASSRNT01'],
    fciCode:         ['BK140'],
    ediFlag:         ['Y'],
  });

  error   = '';
  success = '';

  onSubmit(): void {
    if (this.form.invalid) return;
    this.api.addLoan(this.form.value as any).subscribe({
      next: r  => this.router.navigate(['/loans', r.loanNum, 'edit']),
      error: e => { this.error = e.message; },
    });
  }
}
EOF

cat > "$ROOT/AngularUI/src/app/features/loan-modify/loan-modify.component.ts" <<'EOF'
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LoanApiService } from '../../core/loan-api.service';

@Component({
  selector: 'app-loan-modify',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './loan-modify.component.html',
})
export class LoanModifyComponent implements OnInit {
  private readonly api   = inject(LoanApiService);
  private readonly fb    = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  form = this.fb.group({
    loanNum:         [{ value: '', disabled: true }],      // R-L-021: immutable
    borrowerName:    ['', Validators.required],
    propertyAddress: ['', Validators.required],            // R-L-024
    loanStatus:      ['', Validators.required],            // R-L-022
    upb:             [0, Validators.min(0)],               // R-L-023
    propertyValue:   [0],
    mortgageeClause: [''],
  });

  error   = '';
  success = '';

  ngOnInit(): void {
    const loanNum = this.route.snapshot.paramMap.get('loanNum')!;
    this.api.getLoan(loanNum).subscribe({
      next: loan => this.form.patchValue(loan as any),
      error: e   => { this.error = e.message; },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const loanNum = this.form.getRawValue().loanNum as string;
    this.api.modifyLoan(loanNum, this.form.value as any).subscribe({
      next: r  => { this.success = r.message; },
      error: e => { this.error = e.message; },
    });
  }
}
EOF

cat > "$ROOT/AngularUI/src/app/app.routes.ts" <<'EOF'
import { Routes } from '@angular/router';
import { LoanSearchComponent }  from './features/loan-search/loan-search.component';
import { LoanAddComponent }     from './features/loan-add/loan-add.component';
import { LoanModifyComponent }  from './features/loan-modify/loan-modify.component';

export const routes: Routes = [
  { path: '',                        redirectTo: 'loans/search', pathMatch: 'full' },
  { path: 'loans/search',            component: LoanSearchComponent },
  { path: 'loans/add',               component: LoanAddComponent },
  { path: 'loans/:loanNum/edit',     component: LoanModifyComponent },
  { path: '**',                      redirectTo: 'loans/search' },
];
EOF

cat > "$ROOT/AngularUI/src/app/app.config.ts" <<'EOF'
import { ApplicationConfig } from '@angular/core';
import { provideRouter }     from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes }            from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
  ],
};
EOF

# ─────────────────────────────────────────────────────────────────────────────
# DATABASE — SQL DDL scripts
# ─────────────────────────────────────────────────────────────────────────────

cat > "$ROOT/Database/scripts/001_create_dbo_Loan.sql" <<'EOF'
CREATE TABLE dbo.Loan (
    LoanNum         CHAR(10)       NOT NULL PRIMARY KEY,            -- R-L-014
    ClientId        CHAR(8)        NOT NULL,
    BorrowerName    NVARCHAR(100)  NOT NULL,                        -- R-L-013
    PropertyState   CHAR(2)        NOT NULL,
    CoverageType    NVARCHAR(50)   NULL,
    PropertyAddress NVARCHAR(200)  NOT NULL,                        -- R-L-016
    PropertyCity    NVARCHAR(100)  NULL,
    PropertyZip     NVARCHAR(10)   NULL,
    PropertyType    NVARCHAR(20)   NOT NULL,                        -- R-L-019
    PropertyValue   INT            NOT NULL CHECK (PropertyValue > 0), -- R-L-015
    LoanStatus      NVARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',       -- R-L-017
    Upb             BIGINT         NOT NULL CHECK (Upb > 0),        -- R-L-018
    EdiFlag         CHAR(1)        NULL     DEFAULT 'N',
    FciCode         NVARCHAR(20)   NULL,
    QuoteReqd       CHAR(1)        NULL     DEFAULT 'N',
    CycleType       NVARCHAR(30)   NULL,
    MortgageeClause NVARCHAR(255)  NULL,
    BorrowerPhone   NVARCHAR(20)   NULL,
    CreatedAt       DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2      NULL
);
EOF

cat > "$ROOT/Database/scripts/002_create_dbo_CycleStep.sql" <<'EOF'
CREATE TABLE dbo.CycleStep (
    ClientId  CHAR(8)      NOT NULL PRIMARY KEY,
    QuoteReqd CHAR(1)      NOT NULL,
    CycleType NVARCHAR(40) NOT NULL
);
EOF

cat > "$ROOT/Database/scripts/003_create_dbo_TmeRoutingTable.sql" <<'EOF'
CREATE TABLE dbo.TmeRoutingTable (
    Mnemonic    NVARCHAR(40)  NOT NULL PRIMARY KEY,  -- R-L-025
    ProgramName NVARCHAR(40)  NOT NULL,
    Description NVARCHAR(200) NULL
);
-- Seed routing entries
INSERT INTO dbo.TmeRoutingTable VALUES ('LOAN_SEARCH',  'TKA900', 'Loan Search');
INSERT INTO dbo.TmeRoutingTable VALUES ('ADD_LOAN',     'TKA901', 'Loan Add');
INSERT INTO dbo.TmeRoutingTable VALUES ('MODIFY_LOAN',  'TKA902', 'Loan Modify');
INSERT INTO dbo.TmeRoutingTable VALUES ('QUOTE_REQUEST','TKARB000','Premium Quote');
INSERT INTO dbo.TmeRoutingTable VALUES ('14E_NOTIFY',   'TKA920', 'EDI 14E Dispatch');
INSERT INTO dbo.TmeRoutingTable VALUES ('KY_ISO_QUERY', 'AIP930', 'Kentucky ISO Advisory');
EOF

cat > "$ROOT/Database/scripts/004_create_dbo_LoanAuditLog.sql" <<'EOF'
CREATE TABLE dbo.LoanAuditLog (
    AuditId      BIGINT        IDENTITY(1,1) NOT NULL PRIMARY KEY,
    EntityType   NVARCHAR(40)  NOT NULL,
    EntityId     NVARCHAR(40)  NOT NULL,
    Action       NVARCHAR(30)  NOT NULL,
    ActorId      NVARCHAR(60)  NULL,
    TimestampUtc DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    BeforeJson   NVARCHAR(MAX) NULL,
    AfterJson    NVARCHAR(MAX) NULL,
    RuleId       NVARCHAR(20)  NULL                               -- R-L-012
);
EOF

# ─────────────────────────────────────────────────────────────────────────────
# TESTS — xUnit stubs (one per Active rule)
# ─────────────────────────────────────────────────────────────────────────────

cat > "$ROOT/Tests/xunit/LoanRuleTests.cs" <<'EOF'
using System;
using System.Threading.Tasks;
using Xunit;

namespace TrackAllLoanMaintenanceLegacy.Tests.Xunit;

// Feed each stub to AI: "Fill in this xUnit test for .NET 8 and make it pass"

// ── Priority Rules — test these first; include inferred or ambiguous evidence ──

public class LoanRuleTests
{
    [Fact] public Task given_empty_search_criteria_when_search_then_reject_R_L_001() => throw new NotImplementedException();
    [Fact] public Task given_invalid_loan_number_when_search_then_reject_R_L_002() => throw new NotImplementedException();
    [Fact] public Task given_property_address_only_when_search_then_accept_R_L_003() => throw new NotImplementedException();
    [Fact] public Task given_quote_required_when_process_then_request_quote_R_L_004() => throw new NotImplementedException();
    [Fact] public Task given_unapproved_state_when_rate_then_reject_R_L_005() => throw new NotImplementedException();
    [Fact] public Task given_kentucky_state_when_rate_then_require_iso_R_L_006() => throw new NotImplementedException();
    [Fact] public Task given_nonpositive_value_when_rate_then_reject_R_L_007() => throw new NotImplementedException();
    [Fact] public Task given_edi_flag_not_y_when_dispatch_then_suppress_R_L_008() => throw new NotImplementedException();
    [Fact] public Task given_instant_issue_when_dispatch_then_suppress_R_L_009() => throw new NotImplementedException();
    [Fact] public Task given_unregistered_form_when_dispatch_then_suppress_R_L_010() => throw new NotImplementedException();
    [Fact] public Task given_bk_prefix_when_dispatch_then_use_bk_format_R_L_011() => throw new NotImplementedException();
    [Fact] public Task given_dispatch_when_notify_then_include_audit_payload_R_L_012() => throw new NotImplementedException();
    [Fact] public Task given_missing_identity_fields_when_add_then_reject_R_L_013() => throw new NotImplementedException();
    [Fact] public Task given_invalid_add_loan_number_when_add_then_reject_R_L_014() => throw new NotImplementedException();
    [Fact] public Task given_nonpositive_property_value_when_add_then_reject_R_L_015() => throw new NotImplementedException();
    [Fact] public Task given_missing_property_address_when_add_then_reject_R_L_016() => throw new NotImplementedException();
    [Fact] public Task given_nonactive_initial_status_when_add_then_reject_R_L_017() => throw new NotImplementedException();
    [Fact] public Task given_nonpositive_upb_when_add_then_reject_R_L_018() => throw new NotImplementedException();
    [Fact] public Task given_invalid_property_type_when_add_then_reject_R_L_019() => throw new NotImplementedException();
    [Fact] public Task given_duplicate_loan_number_when_add_then_conflict_R_L_020() => throw new NotImplementedException();
    [Fact] public Task given_changed_loan_number_when_modify_then_reject_R_L_021() => throw new NotImplementedException();
    [Fact] public Task given_invalid_status_transition_when_modify_then_reject_R_L_022() => throw new NotImplementedException();
    [Fact] public Task given_upb_increase_when_modify_then_reject_R_L_023() => throw new NotImplementedException();
    [Fact] public Task given_cleared_address_when_modify_then_reject_R_L_024() => throw new NotImplementedException();
    [Fact] public Task given_unregistered_mnemonic_when_dispatch_then_reject_R_L_025() => throw new NotImplementedException();
}
EOF

echo ""
echo "Scaffold complete."
echo "Domain:         12 files (Entities:1, ValueObjects:4, Repositories:2, Ports:3, Events:2)"
echo "Application:     9 files (Commands:3, Queries:1, DTOs:4)"
echo "Infrastructure:  7 files (Persistence:2, Repositories:2, ExternalServices:3)"
echo "Presentation:    4 files (Controllers:3, Program.cs:1)"
echo "AngularUI:       7 files (core:2, features:3, app:2)"
echo "Database:        4 SQL scripts"
echo "Tests:           1 file (25 stubs)"
echo "Total:          44 files"
echo ""
echo "DDD dependency rule enforced:"
echo "  Domain → nothing   Application → Domain   Infrastructure → Domain+Application   Presentation → Application"
