using System;
using TrackAllLoanMaintenanceLegacy.Domain.ValueObjects;

namespace TrackAllLoanMaintenanceLegacy.Domain.Entities;

public sealed class LoanAggregate
{
    private LoanAggregate() { }

    public int Id { get; private set; }
    public LoanNumber LoanNum { get; private set; }
    public string BorrowerName { get; private set; } = string.Empty;
    public string PropertyAddress { get; private set; } = string.Empty;
    public string? PropertyState { get; private set; }
    public PropertyType PropertyType { get; private set; }
    public LoanStatus LoanStatus { get; private set; }
    public PositiveMoney PropertyValue { get; private set; }
    public PositiveMoney UnpaidPrincipalBalance { get; private set; }
    public string? QuoteReqd { get; private set; }
    public string? EdiFlag { get; private set; }
    public string? CycleType { get; private set; }
    public LenderFormId? LenderFormId { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? UpdatedAtUtc { get; private set; }

    public static LoanAggregate Create(
        string loanNum,
        string borrowerName,
        string propertyAddress,
        string propertyType,
        string loanStatus,
        decimal propertyValue,
        decimal unpaidPrincipalBalance,
        string? propertyState = null,
        string? quoteReqd = null,
        string? ediFlag = null,
        string? cycleType = null,
        string? lenderFormId = null)
    {
        var loan = new LoanAggregate
        {
            LoanNum = new LoanNumber(loanNum),
            BorrowerName = borrowerName?.Trim() ?? string.Empty,
            PropertyAddress = propertyAddress?.Trim() ?? string.Empty,
            PropertyState = propertyState?.Trim(),
            PropertyType = new PropertyType(propertyType),
            LoanStatus = new LoanStatus(loanStatus),
            PropertyValue = new PositiveMoney(propertyValue, "R-L-010"),
            UnpaidPrincipalBalance = new PositiveMoney(unpaidPrincipalBalance, "R-L-012"),
            QuoteReqd = quoteReqd,
            EdiFlag = ediFlag,
            CycleType = cycleType,
            LenderFormId = lenderFormId is null ? null : new LenderFormId(lenderFormId),
            CreatedAtUtc = DateTime.UtcNow
        };

        // R-L-009..R-L-013
        loan.ValidateCreate();
        return loan;
    }

    // R-L-001, R-L-002
    public static void ValidateSearchCriteria(string? loanNum, string? borrowerName)
    {
        if (string.IsNullOrWhiteSpace(loanNum) && string.IsNullOrWhiteSpace(borrowerName))
            throw new InvalidOperationException("R-L-001: At least one search criterion is required.");

        if (!string.IsNullOrWhiteSpace(loanNum))
            _ = new LoanNumber(loanNum);
    }

    // R-L-009..R-L-013
    public void ValidateCreate()
    {
        if (string.IsNullOrWhiteSpace(BorrowerName))
            throw new InvalidOperationException("R-L-009: Borrower name is required.");

        if (string.IsNullOrWhiteSpace(PropertyAddress))
            throw new InvalidOperationException("R-L-011: Property address is required.");

        if (!LoanStatus.IsActive())
            throw new InvalidOperationException("R-L-012: New loans must start in ACTIVE status.");
    }

    // R-L-014
    public void ValidateModifyTransition(string proposedStatus, decimal proposedUpb, string proposedAddress)
    {
        var nextStatus = new LoanStatus(proposedStatus);
        if (!LoanStatus.CanTransitionTo(nextStatus))
            throw new InvalidOperationException("R-L-014: Invalid loan status transition.");

        if (proposedUpb > UnpaidPrincipalBalance.Value)
            throw new InvalidOperationException("R-L-014: UPB increase is not permitted.");

        if (string.IsNullOrWhiteSpace(proposedAddress))
            throw new InvalidOperationException("R-L-014: Property address cannot be blank.");
    }

    // R-L-005
    public bool RequiresQuote() => string.Equals(QuoteReqd, "Y", StringComparison.OrdinalIgnoreCase);

    // R-L-003, R-L-004
    public void ValidateQuoteEligibility()
    {
        if (string.IsNullOrWhiteSpace(PropertyState))
            throw new InvalidOperationException("R-L-003: Property state is required for quote eligibility.");

        var state = PropertyState.Trim().ToUpperInvariant();
        if (state.Length != 2)
            throw new InvalidOperationException("R-L-003: Property state must be a 2-letter code.");
    }

    // R-L-006..R-L-008
    public void ValidateEdiEligibility()
    {
        if (!string.Equals(EdiFlag, "Y", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("R-L-006: Loan is not enrolled for EDI.");

        if (string.Equals(CycleType, "INSTANT_ISSUE", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("R-L-007: Instant Issue cycle suppresses 14E dispatch.");

        if (LenderFormId is null)
            throw new InvalidOperationException("R-L-008: Lender form ID is required for 14E dispatch.");
    }

    public void ApplyModification(string propertyAddress, string loanStatus, decimal unpaidPrincipalBalance, string? borrowerName, decimal? propertyValue)
    {
        ValidateModifyTransition(loanStatus, unpaidPrincipalBalance, propertyAddress);

        PropertyAddress = propertyAddress.Trim();
        LoanStatus = new LoanStatus(loanStatus);
        UnpaidPrincipalBalance = new PositiveMoney(unpaidPrincipalBalance, "R-L-014");
        BorrowerName = borrowerName?.Trim() ?? BorrowerName;

        if (propertyValue.HasValue)
            PropertyValue = new PositiveMoney(propertyValue.Value, "R-L-014");

        UpdatedAtUtc = DateTime.UtcNow;
    }
}
