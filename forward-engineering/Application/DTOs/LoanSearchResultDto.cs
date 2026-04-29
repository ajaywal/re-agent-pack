namespace TrackAllLoanMaintenanceLegacy.Application.DTOs;

public sealed class LoanSearchResultDto
{
    public string LoanNum { get; init; } = string.Empty;
    public string BorrowerName { get; init; } = string.Empty;
    public string PropertyAddress { get; init; } = string.Empty;
    public string PropertyState { get; init; } = string.Empty;
    public string PropertyType { get; init; } = string.Empty;
    public string LoanStatus { get; init; } = string.Empty;
    public decimal PropertyValue { get; init; }
    public decimal UnpaidPrincipalBalance { get; init; }
    public string QuoteReqd { get; init; } = string.Empty;
    public string EdiFlag { get; init; } = string.Empty;
    public string CycleType { get; init; } = string.Empty;
    public string? LenderFormId { get; init; }
}
