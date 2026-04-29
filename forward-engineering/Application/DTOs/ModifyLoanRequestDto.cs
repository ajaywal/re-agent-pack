namespace TrackAllLoanMaintenanceLegacy.Application.DTOs;

public sealed class ModifyLoanRequestDto
{
    public string LoanNum { get; init; } = string.Empty;
    public string? BorrowerName { get; init; }
    public string PropertyAddress { get; init; } = string.Empty;
    public string LoanStatus { get; init; } = string.Empty;
    public decimal UnpaidPrincipalBalance { get; init; }
    public decimal? PropertyValue { get; init; }
}
