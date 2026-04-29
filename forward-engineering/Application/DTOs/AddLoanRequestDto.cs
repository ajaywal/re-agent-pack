namespace TrackAllLoanMaintenanceLegacy.Application.DTOs;

public sealed class AddLoanRequestDto
{
    public string LoanNum { get; init; } = string.Empty;
    public string BorrowerName { get; init; } = string.Empty;
    public string PropertyAddress { get; init; } = string.Empty;
    public string? PropertyState { get; init; }
    public string PropertyType { get; init; } = string.Empty;
    public string LoanStatus { get; init; } = string.Empty;
    public decimal PropertyValue { get; init; }
    public decimal UnpaidPrincipalBalance { get; init; }
    public string? QuoteReqd { get; init; }
    public string? EdiFlag { get; init; }
    public string? CycleType { get; init; }
    public string? LenderFormId { get; init; }
}
